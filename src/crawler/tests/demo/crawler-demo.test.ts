/**
 * Crawler Demo Test
 * 
 * This test demonstrates how to use the Puppeteer Web Crawler programmatically.
 * It shows examples of different extraction methods and how to handle the results.
 */

import { describe, it, expect, vi } from 'vitest';
import { Crawler } from '../../crawler';
import { 
  createMockHtmlResponse, 
  createMockTextResponse, 
  createMockSelectorResponse, 
  createMockCustomJsResponse,
  createMockErrorResponse
} from '../fixtures/mock-responses';

// Create a mock crawler that returns predefined responses
class MockCrawler extends Crawler {
  constructor() {
    super({} as any);
  }

  async extractHtml(url: string, options?: any) {
    return createMockHtmlResponse(url, {
      status: 200,
      includeMetadata: options?.includeMetadata,
      useFixture: 'test'
    });
  }

  async extractText(url: string) {
    return createMockTextResponse(url, {
      status: 200,
      text: 'This is test page content'
    });
  }

  async extractBySelector(url: string, selectors: string[]) {
    return createMockSelectorResponse(url, {
      status: 200,
      fixture: 'test'
    });
  }

  async executeCustomFunction(url: string, script: string) {
    return createMockCustomJsResponse(url, {
      status: 200,
      result: {
        links: [{ text: 'Example Link', href: 'https://example.com/link' }],
        meta: { description: 'Test page description' }
      }
    });
  }
}

// Create an error-throwing crawler for error handling tests
class ErrorCrawler extends Crawler {
  constructor() {
    super({} as any);
  }

  async extractHtml(url: string) {
    return createMockErrorResponse(url, {
      status: 500,
      error: 'Failed to create page'
    });
  }
}

describe('Crawler Demo', () => {
  it('should demonstrate HTML extraction', async () => {
    // Initialize the mock crawler
    const crawler = new MockCrawler();
    
    // Extract HTML content
    const result = await crawler.extractHtml('https://example.com', { includeMetadata: true });
    
    // Verify the result
    expect(result.status).toBe(200);
    expect(result.url).toBe('https://example.com');
    expect(result.html).toBeDefined();
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.title).toBe('Test Page');
    
    console.log('HTML Extraction Demo:');
    console.log(`Status: ${result.status}`);
    console.log(`Title: ${result.metadata?.title}`);
    console.log(`HTML length: ${result.html?.length} characters`);
  });
  
  it('should demonstrate text extraction', async () => {
    // Initialize the mock crawler
    const crawler = new MockCrawler();
    
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
    // Initialize the mock crawler
    const crawler = new MockCrawler();
    
    // Extract elements by selector
    const result = await crawler.extractBySelector('https://example.com', ['h1', 'p']);
    
    // Verify the result
    expect(result.status).toBe(200);
    expect(result.url).toBe('https://example.com');
    expect(result.elements).toBeDefined();
    
    console.log('Selector Extraction Demo:');
    console.log(`Status: ${result.status}`);
    
    if (result.elements && Array.isArray(result.elements)) {
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
  
  it('should demonstrate custom function execution', async () => {
    // Initialize the mock crawler
    const crawler = new MockCrawler();
    
    // Execute a custom function
    const result = await crawler.executeCustomFunction('https://example.com', `
      function() {
        // Extract all links from the page
        const links = Array.from(document.querySelectorAll('a')).map(a => ({
          text: a.textContent,
          href: a.href
        }));
        
        // Extract meta information
        const meta = {};
        Array.from(document.querySelectorAll('meta')).forEach(m => {
          const name = m.getAttribute('name') || m.getAttribute('property');
          if (name) meta[name] = m.getAttribute('content');
        });
        
        return { links, meta };
      }
    `);
    
    // Verify the result
    expect(result.status).toBe(200);
    expect(result.url).toBe('https://example.com');
    expect(result.result).toBeDefined();
    
    console.log('Custom Function Execution Demo:');
    console.log(`Status: ${result.status}`);
    
    if (result.result) {
      console.log(`Found ${result.result.links?.length} links`);
      console.log('Meta information:', result.result.meta);
    }
  });
  
  it('should demonstrate error handling', async () => {
    // Initialize the error crawler
    const crawler = new ErrorCrawler();
    
    // Try to extract HTML content
    const result = await crawler.extractHtml('https://example.com');
    
    // Verify the error result
    expect(result.status).toBe(500);
    expect(result.error).toBeDefined();
    
    console.log('Error Handling Demo:');
    console.log(`Status: ${result.status}`);
    console.log(`Error: ${result.error}`);
  });
});
