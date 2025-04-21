/**
 * Simple Crawler Demo Test
 * 
 * This test demonstrates how to use the Puppeteer Web Crawler with mock responses.
 * It shows examples of different extraction methods and how to handle the results.
 */

import { describe, it, expect, vi } from 'vitest';
import { Crawler } from '../../crawler';
import { 
  createMockHtmlResponse, 
  createMockTextResponse, 
  createMockSelectorResponse,
  createMockJsResponse,
  createMockCustomJsResponse,
  createMockErrorResponse
} from '../fixtures/mock-responses';

// Create a mock browser that returns our mock responses
const createMockBrowser = () => {
  return {
    newPage: vi.fn().mockResolvedValue({
      setDefaultTimeout: vi.fn(),
      setUserAgent: vi.fn(),
      setViewport: vi.fn(),
      setRequestInterception: vi.fn(),
      on: vi.fn(),
      goto: vi.fn(),
      content: vi.fn().mockResolvedValue('<html><body><h1>Test Page</h1></body></html>'),
      evaluate: vi.fn(),
      isClosed: vi.fn().mockReturnValue(false),
      close: vi.fn()
    }),
    close: vi.fn()
  };
};

describe('Crawler Demo with Mock Responses', () => {
  it('should demonstrate HTML extraction', async () => {
    // Create a mock crawler that returns our predefined responses
    const crawler = new Crawler(createMockBrowser() as any);
    
    // Mock the createResponse method to return our mock response
    crawler['createResponse'] = vi.fn().mockImplementation(() => {
      return createMockHtmlResponse('https://example.com', {
        useFixture: 'test',
        includeMetadata: true
      });
    });
    
    // Extract HTML content
    const result = await crawler.extractHtml('https://example.com', { includeMetadata: true });
    
    // Verify the result
    expect(result.status).toBe(200);
    expect(result.url).toBe('https://example.com');
    expect(result.html).toBeDefined();
    expect(result.metadata).toBeDefined();
    
    console.log('HTML Extraction Demo:');
    console.log(`Status: ${result.status}`);
    console.log(`Title: ${result.metadata?.title}`);
    console.log(`HTML length: ${result.html?.length} characters`);
  });
  
  it('should demonstrate text extraction', async () => {
    // Create a mock crawler that returns our predefined responses
    const crawler = new Crawler(createMockBrowser() as any);
    
    // Mock the createResponse method to return our mock response
    crawler['createResponse'] = vi.fn().mockImplementation(() => {
      return createMockTextResponse('https://example.com');
    });
    
    // Extract text content
    const result = await crawler.extractText('https://example.com');
    
    // Verify the result
    expect(result.status).toBe(200);
    expect(result.url).toBe('https://example.com');
    expect(result.text).toBeDefined();
    
    console.log('Text Extraction Demo:');
    console.log(`Status: ${result.status}`);
    console.log(`Text: ${result.text}`);
  });
  
  it('should demonstrate selector extraction', async () => {
    // Create a mock crawler that returns our predefined responses
    const crawler = new Crawler(createMockBrowser() as any);
    
    // Mock the createResponse method to return our mock response
    crawler['createResponse'] = vi.fn().mockImplementation(() => {
      return createMockSelectorResponse('https://example.com', {
        fixture: 'test'
      });
    });
    
    // Extract elements by selector
    const result = await crawler.extractBySelector('https://example.com', ['h1', 'p']);
    
    // Verify the result
    expect(result.status).toBe(200);
    expect(result.url).toBe('https://example.com');
    expect(result.elements).toBeDefined();
    
    console.log('Selector Extraction Demo:');
    console.log(`Status: ${result.status}`);
    
    if (result.elements) {
      console.log(`Number of selector results: ${result.elements.length}`);
      
      // Display the results for each selector
      for (const element of result.elements) {
        console.log(`\nSelector: ${element.selector}`);
        console.log(`Found ${element.results.length} elements`);
        if (element.results.length > 0) {
          console.log(`First element text: ${element.results[0].text}`);
        }
      }
    }
  });
  
  it('should demonstrate JavaScript execution', async () => {
    // Create a mock crawler that returns our predefined responses
    const crawler = new Crawler(createMockBrowser() as any);
    
    // Mock the createResponse method to return our mock response
    crawler['createResponse'] = vi.fn().mockImplementation(() => {
      return createMockJsResponse('https://example.com', {
        fixture: 'complex'
      });
    });
    
    // Extract content after JavaScript execution
    const result = await crawler.extractAfterJsExecution('https://example.com');
    
    // Verify the result
    expect(result.status).toBe(200);
    expect(result.url).toBe('https://example.com');
    expect(result.html).toBeDefined();
    expect(result.text).toBeDefined();
    
    console.log('JavaScript Execution Demo:');
    console.log(`Status: ${result.status}`);
    console.log(`HTML after JS execution length: ${result.html?.length} characters`);
    console.log(`Text after JS execution: ${result.text?.substring(0, 100)}...`);
  });
  
  it('should demonstrate custom function execution', async () => {
    // Create a mock crawler that returns our predefined responses
    const crawler = new Crawler(createMockBrowser() as any);
    
    // Mock the createResponse method to return our mock response
    crawler['createResponse'] = vi.fn().mockImplementation(() => {
      return createMockCustomJsResponse('https://example.com', {
        fixture: 'complex'
      });
    });
    
    // Execute a custom function
    const result = await crawler.executeCustomFunction('https://example.com', `
      function() {
        // This function would normally extract data from the page
        // But for this test, we're using mock responses
        return { success: true };
      }
    `);
    
    // Verify the result
    expect(result.status).toBe(200);
    expect(result.url).toBe('https://example.com');
    expect(result.result).toBeDefined();
    
    console.log('Custom Function Execution Demo:');
    console.log(`Status: ${result.status}`);
    
    if (result.result) {
      console.log('Result:', JSON.stringify(result.result, null, 2));
    }
  });
  
  it('should demonstrate error handling', async () => {
    // Create a mock crawler that returns our predefined responses
    const crawler = new Crawler(createMockBrowser() as any);
    
    // Mock the createResponse method to return our mock error response
    crawler['createResponse'] = vi.fn().mockImplementation(() => {
      return createMockErrorResponse('https://invalid-url.example');
    });
    
    // Try to extract HTML content from an invalid URL
    const result = await crawler.extractHtml('https://invalid-url.example');
    
    // Verify the error result
    expect(result.status).toBe(500);
    expect(result.error).toBeDefined();
    
    console.log('Error Handling Demo:');
    console.log(`Status: ${result.status}`);
    console.log(`Error: ${result.error}`);
  });
});
