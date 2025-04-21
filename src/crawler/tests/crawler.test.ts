/**
 * Tests for the main Crawler class in the Puppeteer Web Crawler
 * Verifies that Crawler class methods work correctly for various extraction scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Crawler } from '../crawler';
import { CrawlerOptions, CrawlerResponse } from '../types';
import { MockBrowser, createMockBrowser, createTestHtml } from './utils/test-helpers';

// Mock the extractors modules
vi.mock('../extractors/html', () => ({
  extractHtml: vi.fn().mockResolvedValue('<html><body><h1>Test Page</h1></body></html>'),
  extractTitle: vi.fn().mockResolvedValue('Test Page'),
  extractMetaTags: vi.fn().mockResolvedValue([{ name: 'description', content: 'Test description' }])
}));

vi.mock('../extractors/text', () => ({
  extractText: vi.fn().mockResolvedValue('Test Page Content')
}));

vi.mock('../extractors/selector', () => ({
  extractBySelector: vi.fn().mockResolvedValue([
    {
      selector: 'h1',
      results: [
        {
          text: 'Test Page',
          html: '<h1>Test Page</h1>',
          attributes: [],
          top: 0,
          left: 0,
          width: 0,
          height: 0
        }
      ]
    }
  ])
}));

vi.mock('../extractors/js', () => ({
  extractAfterJsExecution: vi.fn().mockResolvedValue({
    html: '<html><body><h1>Dynamic Content</h1></body></html>',
    text: 'Dynamic Content'
  }),
  extractElementsAfterJsExecution: vi.fn().mockResolvedValue({
    html: '<html><body><h1>Dynamic Content</h1></body></html>',
    text: 'Dynamic Content',
    elements: [
      {
        selector: 'h1',
        results: [
          {
            text: 'Dynamic Content',
            html: '<h1>Dynamic Content</h1>',
            attributes: [],
            top: 0,
            left: 0,
            width: 0,
            height: 0
          }
        ]
      }
    ]
  })
}));

// Declare mockBrowser and mockPage at the top level for Vitest mock access
let mockBrowser: any;
let mockPage: any;

vi.mock('../utils/browser', () => {
  return {
    launchBrowser: vi.fn().mockImplementation(() => mockBrowser),
    setupPage: vi.fn().mockImplementation(async (browser: any) => browser.newPage()),
    closePage: vi.fn().mockResolvedValue(undefined),
    extractPageMetadata: vi.fn().mockResolvedValue({
      title: 'Test Page',
      description: 'Test description'
    })
  };
});

describe('Crawler Class', () => {
  let crawler: Crawler;
  
  beforeEach(async () => {
    // Create a fresh mock browser and page for each test
    mockBrowser = createMockBrowser();
    mockPage = await mockBrowser.newPage();
    
    // Set up a test HTML page
    const testHtml = createTestHtml();
    await mockPage.setContent(testHtml);
    
    // Mock browser methods
    mockPage.goto = vi.fn().mockResolvedValue({ status: () => 200 });
    mockPage.waitForSelector = vi.fn().mockResolvedValue(null);
    mockPage.waitForFunction = vi.fn().mockResolvedValue(null);
    mockPage.waitForNavigation = vi.fn().mockResolvedValue(null);
    mockPage.evaluate = vi.fn().mockImplementation((fn: Function, ...args: any[]) => {
      if (typeof fn === 'function') {
        return Promise.resolve({ data: 'Custom JS Result' });
      }
      return Promise.resolve(fn);
    });
    
    // Create a crawler instance with the mock browser
    crawler = new Crawler(mockBrowser);
  });
  
  afterEach(async () => {
    // Clean up after each test
    await mockPage.close();
    await mockBrowser.close();
  });
  
  /**
   * Tests for crawler initialization
   */
  describe('Initialization', () => {
    it('should initialize with default options', () => {
      expect(crawler).toBeDefined();
    });
    
    it('should initialize with custom options', () => {
      const options: CrawlerOptions = {
        timeout: 60000,
        waitUntil: 'networkidle0',
        userAgent: 'Custom User Agent',
        viewport: { width: 1280, height: 800 }
      };
      
      const customCrawler = new Crawler(mockBrowser, options);
      expect(customCrawler).toBeDefined();
    });
  });
  
  /**
   * Tests for extractHtml method
   */
  describe('extractHtml', () => {
    it('should extract HTML content from a URL', async () => {
      // Mock browser.newPage to return our mockPage
      vi.spyOn(mockBrowser, 'newPage').mockResolvedValue(mockPage);
      
      // Call the extractHtml method
      const result = await crawler.extractHtml('https://example.com');
      
      // Verify that the page was navigated to the URL
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', expect.anything());
      
      // Verify that HTML was extracted
      expect(result).toHaveProperty('url', 'https://example.com');
      expect(result).toHaveProperty('status', 200);
      expect(result).toHaveProperty('html');
    });
    
    it('should extract HTML with custom options', async () => {
      // Mock browser.newPage to return our mockPage
      vi.spyOn(mockBrowser, 'newPage').mockResolvedValue(mockPage);
      
      // Define custom options
      const options = {
        removeScripts: true,
        removeStyles: true,
        includeMetadata: true
      };
      
      // Call the extractHtml method with options
      const result = await crawler.extractHtml('https://example.com', options);
      
      // Verify that HTML was extracted with options
      expect(result).toHaveProperty('url', 'https://example.com');
      expect(result).toHaveProperty('status', 200);
      expect(result).toHaveProperty('html');
    });
    
    it('should handle errors during HTML extraction', async () => {
      // Mock browser.newPage to return our mockPage
      vi.spyOn(mockBrowser, 'newPage').mockResolvedValue(mockPage);
      
      // Make the page.goto method throw an error
      mockPage.goto = vi.fn().mockRejectedValue(new Error('Failed to navigate to URL'));
      
      // Call the extractHtml method
      const result = await crawler.extractHtml('https://example.com');
      
      // Verify that the error was handled
      expect(result).toHaveProperty('url', 'https://example.com');
      expect(result).toHaveProperty('status', 500);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Failed to navigate to URL');
    });
  });
  
  /**
   * Tests for extractText method
   */
  describe('extractText', () => {
    it('should extract text content from a URL', async () => {
      // Mock browser.newPage to return our mockPage
      vi.spyOn(mockBrowser, 'newPage').mockResolvedValue(mockPage);
      
      // Call the extractText method
      const result = await crawler.extractText('https://example.com');
      
      // Verify that the page was navigated to the URL
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', expect.anything());
      
      // Verify that text was extracted
      expect(result).toHaveProperty('url', 'https://example.com');
      expect(result).toHaveProperty('status', 200);
      expect(result).toHaveProperty('text');
    });
    
    it('should handle errors during text extraction', async () => {
      // Mock browser.newPage to return our mockPage
      vi.spyOn(mockBrowser, 'newPage').mockResolvedValue(mockPage);
      
      // Make the page.goto method throw an error
      mockPage.goto = vi.fn().mockRejectedValue(new Error('Failed to navigate to URL'));
      
      // Call the extractText method
      const result = await crawler.extractText('https://example.com');
      
      // Verify that the error was handled
      expect(result).toHaveProperty('url', 'https://example.com');
      expect(result).toHaveProperty('status', 500);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Failed to navigate to URL');
    });
  });
  
  /**
   * Tests for extractBySelector method
   */
  describe('extractBySelector', () => {
    it('should extract content by selector from a URL', async () => {
      // Mock browser.newPage to return our mockPage
      vi.spyOn(mockBrowser, 'newPage').mockResolvedValue(mockPage);
      
      // Call the extractBySelector method
      const result = await crawler.extractBySelector('https://example.com', 'h1');
      
      // Verify that the page was navigated to the URL
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', expect.anything());
      
      // Verify that content was extracted by selector
      expect(result).toHaveProperty('url', 'https://example.com');
      expect(result).toHaveProperty('status', 200);
      expect(result).toHaveProperty('elements');
    });
    
    it('should handle errors during selector extraction', async () => {
      // Mock browser.newPage to return our mockPage
      vi.spyOn(mockBrowser, 'newPage').mockResolvedValue(mockPage);
      
      // Make the page.goto method throw an error
      mockPage.goto = vi.fn().mockRejectedValue(new Error('Failed to navigate to URL'));
      
      // Call the extractBySelector method
      const result = await crawler.extractBySelector('https://example.com', 'h1');
      
      // Verify that the error was handled
      expect(result).toHaveProperty('url', 'https://example.com');
      expect(result).toHaveProperty('status', 500);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Failed to navigate to URL');
    });
  });
  
  /**
   * Tests for extractAfterJsExecution method
   */
  describe('extractAfterJsExecution', () => {
    it('should extract content after JavaScript execution', async () => {
      // Mock browser.newPage to return our mockPage
      vi.spyOn(mockBrowser, 'newPage').mockResolvedValue(mockPage);
      
      // Call the extractAfterJsExecution method
      const result = await crawler.extractAfterJsExecution('https://example.com');
      
      // Verify that the page was navigated to the URL
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', expect.anything());
      
      // Verify that content was extracted after JavaScript execution
      expect(result).toHaveProperty('url', 'https://example.com');
      expect(result).toHaveProperty('status', 200);
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
    });
    
    it('should handle errors during JavaScript execution', async () => {
      // Mock browser.newPage to return our mockPage
      vi.spyOn(mockBrowser, 'newPage').mockResolvedValue(mockPage);
      
      // Make the page.goto method throw an error
      mockPage.goto = vi.fn().mockRejectedValue(new Error('Failed to navigate to URL'));
      
      // Call the extractAfterJsExecution method
      const result = await crawler.extractAfterJsExecution('https://example.com');
      
      // Verify that the error was handled
      expect(result).toHaveProperty('url', 'https://example.com');
      expect(result).toHaveProperty('status', 500);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Failed to navigate to URL');
    });
  });
  
  /**
   * Tests for executeCustomFunction method
   */
  describe('executeCustomFunction', () => {
    it('should execute custom JavaScript on a page', async () => {
      // Mock browser.newPage to return our mockPage
      vi.spyOn(mockBrowser, 'newPage').mockResolvedValue(mockPage);
      
      // Call the executeCustomFunction method
      const result = await crawler.executeCustomFunction('https://example.com', 'return { data: "Custom JS Result" }');
      
      // Verify that the page was navigated to the URL
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', expect.anything());
      
      // Verify that custom JavaScript was executed
      expect(result).toHaveProperty('url', 'https://example.com');
      expect(result).toHaveProperty('status', 200);
      expect(result).toHaveProperty('result');
    });
    
    it('should handle errors during custom JavaScript execution', async () => {
      // Mock browser.newPage to return our mockPage
      vi.spyOn(mockBrowser, 'newPage').mockResolvedValue(mockPage);
      
      // Make the page.goto method throw an error
      mockPage.goto = vi.fn().mockRejectedValue(new Error('Failed to navigate to URL'));
      
      // Call the executeCustomFunction method
      const result = await crawler.executeCustomFunction('https://example.com', 'return { data: "Custom JS Result" }');
      
      // Verify that the error was handled
      expect(result).toHaveProperty('url', 'https://example.com');
      expect(result).toHaveProperty('status', 500);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Failed to navigate to URL');
    });
  });
});
