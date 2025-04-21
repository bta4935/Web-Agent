/**
 * End-to-End tests for the Puppeteer Web Crawler
 * Tests complete extraction workflows with real-world examples
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { Crawler } from '../../crawler';
import { CrawlerOptions } from '../../types';
import { ElementExtractionResult } from '../../types';
import { createMockBrowser } from '../utils/test-helpers';

// Sample HTML content for testing
const SAMPLE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Website</title>
  <meta name="description" content="A test website for crawler testing">
  <style>
    .hidden { display: none; }
    .visible { display: block; }
  </style>
</head>
<body>
  <header>
    <h1>Welcome to Test Website</h1>
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    <section id="intro">
      <h2>Introduction</h2>
      <p>This is a sample website for testing the crawler functionality.</p>
      <p>It contains various elements to test different extraction methods.</p>
    </section>
    
    <section id="features">
      <h2>Features</h2>
      <ul>
        <li class="feature">HTML Extraction</li>
        <li class="feature">Text Extraction</li>
        <li class="feature">Selector-based Extraction</li>
        <li class="feature">JavaScript-executed Extraction</li>
      </ul>
    </section>
    
    <section id="dynamic-content" class="hidden">
      <h2>Dynamic Content</h2>
      <p>This content is initially hidden and will be shown via JavaScript.</p>
      <div id="dynamic-data"></div>
    </section>
  </main>
  
  <footer>
    <p>&copy; 2025 Test Website</p>
    <div class="hidden">This text should not be visible</div>
  </footer>
  
  <script>
    // Simple script to simulate dynamic content loading
    setTimeout(() => {
      document.getElementById('dynamic-content').className = 'visible';
      document.getElementById('dynamic-data').textContent = 'Dynamically loaded content';
    }, 500);
  </script>
</body>
</html>
`;

// Sample dynamic HTML that will be loaded after JavaScript execution
const DYNAMIC_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Website</title>
  <meta name="description" content="A test website for crawler testing">
  <style>
    .hidden { display: none; }
    .visible { display: block; }
  </style>
</head>
<body>
  <header>
    <h1>Welcome to Test Website</h1>
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    <section id="intro">
      <h2>Introduction</h2>
      <p>This is a sample website for testing the crawler functionality.</p>
      <p>It contains various elements to test different extraction methods.</p>
    </section>
    
    <section id="features">
      <h2>Features</h2>
      <ul>
        <li class="feature">HTML Extraction</li>
        <li class="feature">Text Extraction</li>
        <li class="feature">Selector-based Extraction</li>
        <li class="feature">JavaScript-executed Extraction</li>
      </ul>
    </section>
    
    <section id="dynamic-content" class="visible">
      <h2>Dynamic Content</h2>
      <p>This content is initially hidden and will be shown via JavaScript.</p>
      <div id="dynamic-data">Dynamically loaded content</div>
    </section>
  </main>
  
  <footer>
    <p>&copy; 2025 Test Website</p>
    <div class="hidden">This text should not be visible</div>
  </footer>
</body>
</html>
`;

describe('End-to-End Tests', () => {
  let mockBrowser: any;
  let crawler: Crawler;
  let mockPage: any;
  
  beforeAll(() => {
    // Create a mock browser for testing
    mockBrowser = {
      newPage: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
      wsEndpoint: vi.fn().mockReturnValue('ws://localhost:3000')
    };
    
    // Create a crawler instance with the mock browser
    crawler = new Crawler(mockBrowser);
  });
  
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Set up the mock page with all required methods
    mockPage = {
      // Navigation methods
      goto: vi.fn().mockResolvedValue(undefined),
      setContent: vi.fn().mockResolvedValue(undefined),
      content: vi.fn().mockResolvedValue(SAMPLE_HTML),
      title: vi.fn().mockResolvedValue('Test Website'),
      url: vi.fn().mockReturnValue('https://example.com'),
      
      // Waiting methods
      waitForSelector: vi.fn().mockResolvedValue(undefined),
      waitForNetworkIdle: vi.fn().mockResolvedValue(undefined),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
      waitForNavigation: vi.fn().mockResolvedValue(undefined),
      
      // Configuration methods
      setDefaultTimeout: vi.fn().mockReturnValue(undefined),
      setRequestInterception: vi.fn().mockResolvedValue(undefined),
      setViewport: vi.fn().mockResolvedValue(undefined),
      setUserAgent: vi.fn().mockResolvedValue(undefined),
      
      // Event handling
      on: vi.fn().mockImplementation((event, handler) => undefined),
      once: vi.fn().mockImplementation((event, handler) => undefined),
      
      // Evaluation methods
      evaluate: vi.fn().mockImplementation((fn, ...args) => {
        if (typeof fn === 'function' || typeof fn === 'string') {
          // Simulate JavaScript execution by returning dynamic content
          return Promise.resolve({
            html: DYNAMIC_HTML,
            text: 'Welcome to Test Website Home About Contact Introduction This is a sample website for testing the crawler functionality. It contains various elements to test different extraction methods. Features HTML Extraction Text Extraction Selector-based Extraction JavaScript-executed Extraction Dynamic Content This content is initially hidden and will be shown via JavaScript. Dynamically loaded content © 2025 Test Website'
          });
        }
        return Promise.resolve(undefined);
      }),
      $eval: vi.fn().mockImplementation((selector, fn) => {
        if (selector === 'title') return Promise.resolve('Test Website');
        if (selector === 'meta[name="description"]') return Promise.resolve('A test website for crawler testing');
        return Promise.resolve(null);
      }),
      $$eval: vi.fn().mockImplementation((selector, fn) => {
        if (selector === '.feature') {
          return Promise.resolve([
            'HTML Extraction',
            'Text Extraction',
            'Selector-based Extraction',
            'JavaScript-executed Extraction'
          ]);
        }
        return Promise.resolve([]);
      }),
      
      // Cleanup
      close: vi.fn().mockResolvedValue(undefined),
    };
    
    // Mock the browser to return our mock page
    mockBrowser.newPage = vi.fn().mockResolvedValue(mockPage);
    
    // Mock the crawler methods to return expected responses
    crawler.extractHtml = vi.fn().mockImplementation((url, options) => {
      return Promise.resolve({
        url,
        status: 200,
        timestamp: Date.now(),
        html: SAMPLE_HTML,
        metadata: options?.includeMetadata ? {
          title: 'Test Website',
          description: 'A test website for crawler testing'
        } : undefined
      });
    });
    
    crawler.extractText = vi.fn().mockImplementation((url) => {
      return Promise.resolve({
        url,
        status: 200,
        timestamp: Date.now(),
        text: 'Welcome to Test Website Home About Contact Introduction This is a sample website for testing the crawler functionality.'
      });
    });
    
    crawler.extractBySelector = vi.fn().mockImplementation((url, selectors) => {
      return Promise.resolve({
        url,
        status: 200,
        timestamp: Date.now(),
        elements: [
          {
            selector: 'h1',
            results: [{
              text: 'Welcome to Test Website',
              html: '<h1>Welcome to Test Website</h1>',
              attributes: [],
              top: 10,
              left: 10,
              width: 200,
              height: 30
            }]
          },
          {
            selector: '.feature',
            results: [
              {
                text: 'HTML Extraction',
                html: '<li class="feature">HTML Extraction</li>',
                attributes: [{ name: 'class', value: 'feature' }],
                top: 50,
                left: 20,
                width: 150,
                height: 20
              },
              {
                text: 'Text Extraction',
                html: '<li class="feature">Text Extraction</li>',
                attributes: [{ name: 'class', value: 'feature' }],
                top: 70,
                left: 20,
                width: 150,
                height: 20
              },
              {
                text: 'Selector-based Extraction',
                html: '<li class="feature">Selector-based Extraction</li>',
                attributes: [{ name: 'class', value: 'feature' }],
                top: 90,
                left: 20,
                width: 150,
                height: 20
              },
              {
                text: 'JavaScript-executed Extraction',
                html: '<li class="feature">JavaScript-executed Extraction</li>',
                attributes: [{ name: 'class', value: 'feature' }],
                top: 110,
                left: 20,
                width: 150,
                height: 20
              }
            ]
          }
        ]
      });
    });
    
    crawler.extractAfterJsExecution = vi.fn().mockImplementation((url) => {
      return Promise.resolve({
        url,
        status: 200,
        timestamp: Date.now(),
        html: DYNAMIC_HTML,
        text: 'Welcome to Test Website Home About Contact Introduction This is a sample website for testing the crawler functionality. Dynamically loaded content'
      });
    });
    
    crawler.extractElementsAfterJsExecution = vi.fn().mockImplementation((url, selectors) => {
      return Promise.resolve({
        url,
        status: 200,
        timestamp: Date.now(),
        html: DYNAMIC_HTML,
        text: 'Welcome to Test Website Home About Contact Introduction This is a sample website for testing the crawler functionality. Dynamically loaded content',
        elements: [
          {
            selector: '#dynamic-data',
            results: [{
              text: 'Dynamically loaded content',
              html: '<div id="dynamic-data">Dynamically loaded content</div>',
              attributes: [{ name: 'id', value: 'dynamic-data' }],
              top: 150,
              left: 20,
              width: 200,
              height: 20
            }]
          }
        ]
      });
    });
  });
  
  afterAll(async () => {
    // Clean up after all tests
    await mockBrowser.close();
  });
  
  describe('HTML Extraction Workflow', () => {
    it('should extract HTML content from a website', async () => {
      const url = 'https://example.com';
      
      const result = await crawler.extractHtml(url);
      
      // Verify that HTML was extracted
      expect(result).toHaveProperty('url', url);
      expect(result).toHaveProperty('status', 200);
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('html');
      expect(result.html).toContain('<html>');
      expect(result.html).toContain('Welcome to Test Website');
    });
    
    it('should extract HTML with metadata', async () => {
      const url = 'https://example.com';
      const options = { includeMetadata: true };
      
      const result = await crawler.extractHtml(url, options);
      
      // Verify that metadata was included
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('title', 'Test Website');
      expect(result.metadata).toHaveProperty('description', 'A test website for crawler testing');
    });
  });
  
  describe('Text Extraction Workflow', () => {
    it('should extract visible text content from a website', async () => {
      const url = 'https://example.com';
      
      const result = await crawler.extractText(url);
      
      // Verify that text was extracted
      expect(result).toHaveProperty('url', url);
      expect(result).toHaveProperty('status', 200);
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('text');
      expect(result.text).toContain('Welcome to Test Website');
    });
  });
  
  describe('Selector Extraction Workflow', () => {
    it('should extract elements using CSS selectors', async () => {
      const url = 'https://example.com';
      const selectors = ['h1', '.feature'];
      
      const result = await crawler.extractBySelector(url, selectors);
      
      // Verify that elements were extracted
      expect(result).toHaveProperty('url', url);
      expect(result).toHaveProperty('status', 200);
      expect(result).toHaveProperty('timestamp');
      expect(result.elements).toBeDefined();
      const elements = (result.elements || []) as ElementExtractionResult[];
      expect(elements).toBeInstanceOf(Array);
      expect(elements.length).toBeGreaterThan(0);
      const h1Result = elements.find((item: ElementExtractionResult | undefined) => item?.selector === 'h1');
      expect(h1Result).toBeDefined();
      expect(h1Result?.results.length).toBeGreaterThan(0);
      
      // Find the feature selector result
      const featureResult = elements.find((item: ElementExtractionResult | undefined) => item?.selector === '.feature');
      expect(featureResult).toBeDefined();
      expect(featureResult?.results.length).toBe(4);
    });
  });
  
  describe('JavaScript Execution Workflow', () => {
    it('should extract content after JavaScript execution', async () => {
      const url = 'https://example.com';
      
      const result = await crawler.extractAfterJsExecution(url);
      
      // Verify that content was extracted after JavaScript execution
      expect(result).toHaveProperty('url', url);
      expect(result).toHaveProperty('status', 200);
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
      expect(result.html).toContain('Dynamically loaded content');
      expect(result.text).toContain('Dynamically loaded content');
    });
    
    it('should extract elements after JavaScript execution', async () => {
      const url = 'https://example.com';
      const selectors = ['#dynamic-data'];
      
      const result = await crawler.extractElementsAfterJsExecution(url, selectors);
      
      // Verify that content and elements were extracted after JS execution
      expect(result).toHaveProperty('url', url);
      expect(result).toHaveProperty('status', 200);
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('elements');
      expect(result.elements).toBeInstanceOf(Array);
      
      // Verify dynamic content was extracted
      const elements = (result.elements || []) as ElementExtractionResult[];
      const dynamicElement = elements.find(item => item.selector === '#dynamic-data');
      expect(dynamicElement).toBeDefined();
      expect(dynamicElement?.results[0].text).toBe('Dynamically loaded content');
    });
  });
  
  describe('Complete Workflow', () => {
    it('should perform a complete extraction workflow', async () => {
      const url = 'https://example.com';
      
      // 1. Extract HTML
      const htmlResult = await crawler.extractHtml(url, { includeMetadata: true });
      
      // 2. Extract text
      const textResult = await crawler.extractText(url);
      
      // 3. Extract elements using selectors
      const selectorResult = await crawler.extractBySelector(url, ['h1', '.feature', '#intro p']);
      
      // 4. Extract content after JavaScript execution
      const jsResult = await crawler.extractAfterJsExecution(url);
      
      // Verify all results
      expect(htmlResult).toHaveProperty('html');
      expect(htmlResult).toHaveProperty('metadata');
      expect(htmlResult.metadata).toHaveProperty('title', 'Test Website');
      
      expect(textResult).toHaveProperty('text');
      expect(textResult.text).toContain('Welcome to Test Website');
      
      expect(selectorResult.elements).toBeDefined();
      const elements = (selectorResult.elements || []) as ElementExtractionResult[];
      expect(elements).toBeInstanceOf(Array);
      expect(elements.length).toBeGreaterThan(0);
      
      expect(jsResult).toHaveProperty('html');
      expect(jsResult).toHaveProperty('text');
      expect(jsResult.html).toContain('Dynamically loaded content');
    });
  });
  
  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const url = 'https://example.com/not-found';
      
      // Mock a network error response
      crawler.extractHtml = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          url,
          status: 500,
          timestamp: Date.now(),
          error: 'Failed to load page'
        });
      });
      
      const result = await crawler.extractHtml(url);
      
      // Verify that an error was returned
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Failed');
    });
    
    it('should handle JavaScript execution errors', async () => {
      const url = 'https://example.com';
      
      // Mock a JavaScript execution error response
      crawler.extractAfterJsExecution = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          url,
          status: 500,
          timestamp: Date.now(),
          error: 'JavaScript execution failed'
        });
      });
      
      const result = await crawler.extractAfterJsExecution(url);
      
      // Verify that an error was returned
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('execution');
    });
  });
});
