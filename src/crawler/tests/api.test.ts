/**
 * Tests for API handlers in the Puppeteer Web Crawler
 * Verifies that API request handlers, validation, and parameter parsing work correctly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as apiModule from '../api/api';
import { Crawler } from '../crawler';

// Extract the exported functions from the API module
const { 
  handleHtmlExtraction,
  handleTextExtraction,
  handleSelectorExtraction,
  handleJsExtraction,
  handleCustomJsExecution
} = apiModule;

// Mock the crawler module
vi.mock('../crawler', () => ({
  Crawler: vi.fn().mockImplementation(() => ({
    extractHtml: vi.fn().mockResolvedValue({ html: '<html><body>Test</body></html>' }),
    extractText: vi.fn().mockResolvedValue({ text: 'Test content' }),
    extractBySelector: vi.fn().mockResolvedValue([{ 
      selector: '.test', 
      results: [{ text: 'Test element', html: '<div>Test element</div>' }] 
    }]),
    extractAfterJsExecution: vi.fn().mockResolvedValue({ 
      html: '<html><body>Dynamic content</body></html>', 
      text: 'Dynamic content' 
    }),
    extractElementsAfterJsExecution: vi.fn().mockResolvedValue({
      html: '<html><body>Dynamic elements</body></html>',
      text: 'Dynamic elements',
      elements: [{ 
        selector: '.dynamic', 
        results: [{ text: 'Dynamic element', html: '<div>Dynamic element</div>' }] 
      }]
    }),
    executeCustomFunction: vi.fn().mockResolvedValue({ result: 'Custom script result' }),
    close: vi.fn().mockResolvedValue(undefined)
  }))
}));



describe('API Handlers', () => {
  const mockEnv = { BROWSER: {} };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('handleHtmlExtraction', () => {
    it('should extract HTML from a URL', async () => {
      const request = new Request('https://api.example.com/extract/html?url=https://example.com');
      
      const response = await handleHtmlExtraction(request, mockEnv);
      
      expect(response.status).toBe(200);
      expect(Crawler).toHaveBeenCalled();
      
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('html');
    });
    
    it('should handle missing URL parameter', async () => {
      const request = new Request('https://api.example.com/extract/html');
      
      const response = await handleHtmlExtraction(request, mockEnv);
      
      expect(response.status).toBe(400);
      expect(Crawler).not.toHaveBeenCalled();
    });
  });
  
  describe('handleTextExtraction', () => {
    it('should extract text from a URL', async () => {
      const request = new Request('https://api.example.com/extract/text?url=https://example.com');
      
      const response = await handleTextExtraction(request, mockEnv);
      
      expect(response.status).toBe(200);
      expect(Crawler).toHaveBeenCalled();
      
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('text');
    });
  });
  
  describe('handleSelectorExtraction', () => {
    it('should extract elements using selectors', async () => {
      const request = new Request('https://api.example.com/extract/selector?url=https://example.com&selectors=.test,.header');
      
      const response = await handleSelectorExtraction(request, mockEnv);
      
      expect(response.status).toBe(200);
      expect(Crawler).toHaveBeenCalled();
      
      const responseBody = await response.json();
      expect(responseBody).toBeInstanceOf(Array);
    });
    
    it('should handle JSON array of selectors', async () => {
      const selectors = JSON.stringify(['.test', '.header']);
      const request = new Request(`https://api.example.com/extract/selector?url=https://example.com&selectors=${encodeURIComponent(selectors)}`);
      
      const response = await handleSelectorExtraction(request, mockEnv);
      
      expect(response.status).toBe(200);
    });
  });
  
  describe('handleJsExtraction', () => {
    it('should extract content after JavaScript execution', async () => {
      const request = new Request('https://api.example.com/extract/js?url=https://example.com');
      
      const response = await handleJsExtraction(request, mockEnv);
      
      expect(response.status).toBe(200);
      expect(Crawler).toHaveBeenCalled();
      
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('html');
      expect(responseBody).toHaveProperty('text');
    });
    
    it('should extract elements after JavaScript execution when selectors are provided', async () => {
      const request = new Request('https://api.example.com/extract/js?url=https://example.com&selectors=.dynamic');
      
      const response = await handleJsExtraction(request, mockEnv);
      
      expect(response.status).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('elements');
    });
    
    it('should handle custom script from POST body', async () => {
      const customScript = 'document.querySelector("body").innerHTML = "Modified content";';
      const requestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customScript })
      };
      
      const request = new Request('https://api.example.com/extract/js?url=https://example.com', requestInit);
      
      const response = await handleJsExtraction(request, mockEnv);
      
      expect(response.status).toBe(200);
    });
  });
  
  describe('handleCustomJsExecution', () => {
    it('should execute custom JavaScript function', async () => {
      const script = 'return document.title;';
      const requestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ script })
      };
      
      const request = new Request('https://api.example.com/execute?url=https://example.com', requestInit);
      
      const response = await handleCustomJsExecution(request, mockEnv);
      
      expect(response.status).toBe(200);
      expect(Crawler).toHaveBeenCalled();
      
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('result');
    });
    
    it('should reject non-POST requests', async () => {
      const request = new Request('https://api.example.com/execute?url=https://example.com');
      
      const response = await handleCustomJsExecution(request, mockEnv);
      
      expect(response.status).toBe(405);
      expect(Crawler).not.toHaveBeenCalled();
    });
    
    it('should require script in request body', async () => {
      const requestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      };
      
      const request = new Request('https://api.example.com/execute?url=https://example.com', requestInit);
      
      const response = await handleCustomJsExecution(request, mockEnv);
      
      expect(response.status).toBe(400);
      expect(Crawler).not.toHaveBeenCalled();
    });
    
    it('should handle script arguments', async () => {
      const script = 'return document.querySelector(selector).textContent;';
      const args = ['.content'];
      
      const requestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ script, args })
      };
      
      const request = new Request('https://api.example.com/execute?url=https://example.com', requestInit);
      
      const response = await handleCustomJsExecution(request, mockEnv);
      
      expect(response.status).toBe(200);
    });
  });
});
