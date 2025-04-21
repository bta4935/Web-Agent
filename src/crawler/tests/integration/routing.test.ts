/**
 * Integration tests for routing in the Puppeteer Web Crawler
 * Verifies that endpoint routing and request handling work correctly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleRequest } from '../../index';
import * as apiModule from '../../api';

// Mock the API handlers
vi.mock('../../api', () => ({
  handleHtmlExtraction: vi.fn().mockResolvedValue(new Response(JSON.stringify({ html: '<html></html>' }), { 
    headers: { 'Content-Type': 'application/json' } 
  })),
  
  handleTextExtraction: vi.fn().mockResolvedValue(new Response(JSON.stringify({ text: 'Test content' }), { 
    headers: { 'Content-Type': 'application/json' } 
  })),
  
  handleSelectorExtraction: vi.fn().mockResolvedValue(new Response(JSON.stringify([{ 
    selector: '.test', 
    results: [{ text: 'Test element', html: '<div>Test element</div>' }] 
  }]), { 
    headers: { 'Content-Type': 'application/json' } 
  })),
  
  handleJsExtraction: vi.fn().mockResolvedValue(new Response(JSON.stringify({ 
    html: '<html><body>Dynamic content</body></html>', 
    text: 'Dynamic content' 
  }), { 
    headers: { 'Content-Type': 'application/json' } 
  })),
  
  handleCustomJsExecution: vi.fn().mockResolvedValue(new Response(JSON.stringify({ 
    result: 'Custom script result' 
  }), { 
    headers: { 'Content-Type': 'application/json' } 
  }))
}));

describe('Router Integration Tests', () => {
  const mockEnv = { BROWSER: {} };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Route Handling', () => {
    it('should return 404 for non-crawler routes', async () => {
      const request = new Request('https://example.com/some/other/path');
      
      const response = await handleRequest(request, mockEnv);
      
      expect(response.status).toBe(404);
      expect(await response.text()).toBe('Not Found');
    });
    
    it('should return 404 with available endpoints for unknown crawler routes', async () => {
      const request = new Request('https://example.com/crawler/unknown');
      
      const response = await handleRequest(request, mockEnv);
      
      expect(response.status).toBe(404);
      
      const responseBody = await response.json() as { 
        error: string; 
        availableEndpoints: string[] 
      };
      expect(responseBody).toHaveProperty('error', 'Unknown endpoint');
      expect(responseBody).toHaveProperty('availableEndpoints');
      expect(responseBody.availableEndpoints).toContain('/crawler/html');
      expect(responseBody.availableEndpoints).toContain('/crawler/text');
      expect(responseBody.availableEndpoints).toContain('/crawler/selector');
      expect(responseBody.availableEndpoints).toContain('/crawler/js');
      expect(responseBody.availableEndpoints).toContain('/crawler/execute');
    });
  });
  
  describe('Endpoint Routing', () => {
    it('should route /crawler/html to handleHtmlExtraction', async () => {
      const request = new Request('https://example.com/crawler/html?url=https://test.com');
      
      await handleRequest(request, mockEnv);
      
      expect(apiModule.handleHtmlExtraction).toHaveBeenCalledWith(request, mockEnv);
    });
    
    it('should route /crawler/text to handleTextExtraction', async () => {
      const request = new Request('https://example.com/crawler/text?url=https://test.com');
      
      await handleRequest(request, mockEnv);
      
      expect(apiModule.handleTextExtraction).toHaveBeenCalledWith(request, mockEnv);
    });
    
    it('should route /crawler/selector to handleSelectorExtraction', async () => {
      const request = new Request('https://example.com/crawler/selector?url=https://test.com&selectors=.test');
      
      await handleRequest(request, mockEnv);
      
      expect(apiModule.handleSelectorExtraction).toHaveBeenCalledWith(request, mockEnv);
    });
    
    it('should route /crawler/js to handleJsExtraction', async () => {
      const request = new Request('https://example.com/crawler/js?url=https://test.com');
      
      await handleRequest(request, mockEnv);
      
      expect(apiModule.handleJsExtraction).toHaveBeenCalledWith(request, mockEnv);
    });
    
    it('should route /crawler/execute to handleCustomJsExecution', async () => {
      const requestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ script: 'return document.title;' })
      };
      
      const request = new Request('https://example.com/crawler/execute?url=https://test.com', requestInit);
      
      await handleRequest(request, mockEnv);
      
      expect(apiModule.handleCustomJsExecution).toHaveBeenCalledWith(request, mockEnv);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle errors thrown by handlers', async () => {
      // Mock handleHtmlExtraction to throw an error
      (apiModule.handleHtmlExtraction as any).mockRejectedValueOnce(new Error('Test error'));
      
      const request = new Request('https://example.com/crawler/html?url=https://test.com');
      
      const response = await handleRequest(request, mockEnv);
      
      expect(response.status).toBe(500);
      
      const responseBody = await response.json() as { error: string };
      expect(responseBody).toHaveProperty('error', 'Test error');
    });
    
    it('should handle non-Error objects thrown by handlers', async () => {
      // Mock handleTextExtraction to throw a non-Error object
      (apiModule.handleTextExtraction as any).mockRejectedValueOnce('String error');
      
      const request = new Request('https://example.com/crawler/text?url=https://test.com');
      
      const response = await handleRequest(request, mockEnv);
      
      expect(response.status).toBe(500);
      
      const responseBody = await response.json() as { error: string };
      expect(responseBody).toHaveProperty('error', 'Unknown error');
    });
  });
  
  describe('Worker Entry Point', () => {
    it('should test the default export fetch handler', async () => {
      // Import the default export
      const { default: worker } = await import('../../index');
      
      // Create a mock execution context
      const mockCtx = {
        waitUntil: vi.fn(),
        passThroughOnException: vi.fn()
      };
      
      // Test crawler route
      const crawlerRequest = new Request('https://example.com/crawler/html?url=https://test.com');
      const crawlerResponse = await worker.fetch(crawlerRequest, mockEnv, mockCtx);
      
      // Verify that the crawler route was handled
      expect(apiModule.handleHtmlExtraction).toHaveBeenCalled();
      
      // Test non-crawler route
      const otherRequest = new Request('https://example.com/other/path');
      const otherResponse = await worker.fetch(otherRequest, mockEnv, mockCtx);
      
      // Verify that non-crawler routes return 404
      expect(otherResponse.status).toBe(404);
      expect(await otherResponse.text()).toBe('Not Found');
    });
  });
});
