/**
 * Tests for JavaScript extractor in the Puppeteer Web Crawler
 * Verifies that JavaScript-executed content extraction functions work correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the selector module
vi.mock('../../extractors/selector', () => ({
  extractBySelector: vi.fn().mockImplementation((page, selectors, options) => {
    // Default mock implementation returns successful results
    return Promise.resolve([
      {
        selector: typeof selectors === 'string' ? selectors : selectors[0],
        results: [
          {
            text: 'Dynamic Element 1',
            html: '<div>Dynamic Element 1</div>',
            attributes: [
              { name: 'id', value: 'dynamic-1' }
            ],
            top: 10,
            left: 20,
            width: 200,
            height: 30
          },
          {
            text: 'Dynamic Element 2',
            html: '<div>Dynamic Element 2</div>',
            attributes: [
              { name: 'id', value: 'dynamic-2' }
            ],
            top: 10,
            left: 60,
            width: 200,
            height: 30
          }
        ]
      }
    ]);
  })
}));

import { JsExtractionOptions, executeCustomJs, extractAfterJsExecution, extractElementsAfterJsExecution } from '../../extractors/js';
import { MockBrowser, createMockBrowser, createTestHtml } from '../utils/test-helpers';

describe('JavaScript Extractor', () => {
  let mockBrowser: MockBrowser;
  let mockPage: any;
  
  beforeEach(async () => {
    // Create a fresh mock browser and page for each test
    mockBrowser = createMockBrowser();
    mockPage = await mockBrowser.newPage();
    
    // Set up a test HTML page
    const testHtml = createTestHtml();
    await mockPage.setContent(testHtml);

    // Mock the waitForFunction method
    mockPage.waitForFunction = vi.fn().mockResolvedValue(undefined);
    
    // Set up the page to wait for selector
    mockPage.waitForSelector = vi.fn().mockResolvedValue(undefined);
    
    // Mock waitForNavigation method
    mockPage.waitForNavigation = vi.fn().mockResolvedValue(undefined);
    
    // Mock waitForNetworkIdle method
    mockPage.waitForNetworkIdle = vi.fn().mockResolvedValue(undefined);
    
    // Mock waitForTimeout method
    mockPage.waitForTimeout = vi.fn().mockResolvedValue(undefined);
    
    // Mock the page.content method
    mockPage.content = vi.fn().mockResolvedValue(testHtml);
  });
  
  afterEach(async () => {
    // Clean up after each test
    await mockPage.close();
    await mockBrowser.close();
  });
  
  /**
   * Tests for executeCustomJs function
   */
  describe('executeCustomJs', () => {
    it('should execute JavaScript and return the result', async () => {
      // Mock JavaScript execution result
      const mockResult = { data: 'Dynamic Content' };
      
      // Set up the page to return JavaScript execution result when evaluated
      mockPage.evaluate = vi.fn().mockResolvedValue(mockResult);
      
      // Call the executeCustomJs function with a script
      const result = await executeCustomJs(mockPage, 'return { data: "Dynamic Content" }');
      
      // Verify that JavaScript was executed correctly
      expect(result).toEqual(mockResult);
      expect(mockPage.evaluate).toHaveBeenCalled();
    });
    
    it('should execute custom script when provided', async () => {
      // Mock JavaScript execution result
      const mockResult = { customData: 'Custom Script Result' };
      
      // Set up the page to return JavaScript execution result when evaluated
      mockPage.evaluate = vi.fn().mockImplementation((script: string | Function) => {
        // Check if the script is a custom script
        if (typeof script === 'string' && script.includes('customData')) {
          return mockResult;
        } else {
          return { data: 'Default Script Result' };
        }
      });
      
      // Call the executeCustomJs function with custom script
      const customScript = `
        return {
          customData: 'Custom Script Result'
        };
      `;
      const result = await executeCustomJs(mockPage, customScript);
      
      // Verify that custom script was executed
      expect(result).toEqual(mockResult);
      expect(mockPage.evaluate).toHaveBeenCalled();
    });
    
    it('should handle function conversion to string', async () => {
      // Mock JavaScript execution result
      const mockResult = { functionResult: true };
      
      // Set up the page to return JavaScript execution result when evaluated
      mockPage.evaluate = vi.fn().mockImplementation((script: string | Function) => {
        // Check if the script is a function that was converted to string
        if (typeof script === 'string' && script.includes('return { functionResult: true }')) {
          return mockResult;
        } else {
          return { functionResult: false };
        }
      });
      
      // Call the executeCustomJs function with a function
      const scriptFn = function() {
        return { functionResult: true };
      };
      const result = await executeCustomJs(mockPage, scriptFn);
      
      // Verify that function was converted to string and executed
      expect(result).toEqual(mockResult);
      expect(mockPage.evaluate).toHaveBeenCalled();
    });
    
    it('should handle errors during JavaScript execution', async () => {
      // Make the evaluate method throw an error
      vi.spyOn(mockPage, 'evaluate').mockImplementation(() => {
        throw new Error('Failed to execute JavaScript');
      });
      
      try {
        // Call the executeCustomJs function
        await executeCustomJs(mockPage, 'return { data: "Dynamic Content" }');
        // If we get here, the test should fail
        expect(true).toBe(false); // This should not be reached
      } catch (error) {
        // Verify that the error was thrown
        expect(error).toBeDefined();
        expect((error as Error).message).toContain('Failed to execute JavaScript');
      }
    });
  });
  
  /**
   * Tests for extractAfterJsExecution function
   */
  describe('extractAfterJsExecution', () => {
    
    it('should extract content after JavaScript execution', async () => {
      // Get the actual HTML content that will be returned
      const testHtml = createTestHtml();
      const mockHtmlResult = testHtml;
      const mockTextResult = 'Dynamic Content';
      
      // Set up the page to return extraction results
      mockPage.evaluate = vi.fn().mockResolvedValue({
        html: mockHtmlResult,
        text: mockTextResult
      });
      
      // Call the extractAfterJsExecution function with default options
      const result = await extractAfterJsExecution(mockPage);
      
      // Verify that extraction was performed
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
      expect(mockPage.waitForNetworkIdle).toHaveBeenCalled();
    });
    
    it('should wait for selector when waitForSelector is provided', async () => {
      // Get the actual HTML content that will be returned
      const testHtml = createTestHtml();
      const mockHtmlResult = testHtml;
      const mockTextResult = 'Dynamic Content';
      
      // Set up the page to return extraction results
      mockPage.evaluate = vi.fn().mockResolvedValue({
        html: mockHtmlResult,
        text: mockTextResult
      });
      
      // Call the extractAfterJsExecution function with waitForSelector option
      const options: JsExtractionOptions = {
        waitForSelector: '#dynamic-content',
        selectorTimeout: 5000
      };
      const result = await extractAfterJsExecution(mockPage, options);
      
      // Verify that waitForSelector was called with the selector and timeout
      expect(mockPage.waitForSelector).toHaveBeenCalledWith('#dynamic-content', { timeout: 5000 });
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
    });
    
    it('should execute custom script when provided', async () => {
      // Get the actual HTML content that will be returned
      const testHtml = createTestHtml();
      const mockHtmlResult = testHtml;
      const mockTextResult = 'Custom Script Result';
      
      // Set up the page to return extraction results
      mockPage.evaluate = vi.fn().mockImplementation((...args: unknown[]) => {
        const script = args[0];
        // Check if custom script was provided
        if (typeof script === 'string' && script.includes('customScript')) {
          return Promise.resolve(true); // Custom script was executed
        } else if (typeof script === 'string') {
          return Promise.resolve({
            html: mockHtmlResult,
            text: mockTextResult
          });
        } else {
          return Promise.resolve({
            html: mockHtmlResult,
            text: mockTextResult
          });
        }
      });
      
      // Call the extractAfterJsExecution function with custom script
      const options: JsExtractionOptions = {
        customScript: 'console.log("Custom script executed");'
      };
      const result = await extractAfterJsExecution(mockPage, options);
      
      // Verify that custom script was executed
      // Verify that custom script was executed
      expect(mockPage.evaluate).toHaveBeenCalled();
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
    });
    
    it('should wait for additional time when waitTime is specified', async () => {
      // Get the actual HTML content that will be returned
      const testHtml = createTestHtml();
      const mockHtmlResult = testHtml;
      const mockTextResult = 'Dynamic Content';
      
      // Set up the page to return extraction results
      mockPage.evaluate = vi.fn().mockResolvedValue({
        html: mockHtmlResult,
        text: mockTextResult
      });
      
      // Call the extractAfterJsExecution function with waitTime option
      const options: JsExtractionOptions = {
        waitTime: 2000
      };
      const result = await extractAfterJsExecution(mockPage, options);
      
      // Verify that waitForTimeout was called with specified time
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(2000);
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
    });
    
    it('should handle errors during extraction', async () => {
      // Make the evaluate method throw an error
      vi.spyOn(mockPage, 'evaluate').mockImplementation(() => {
        throw new Error('Failed to extract content');
      });
      
      // Mock the extractHtml and extractText functions to throw errors
      const htmlModule = await import('../../extractors/html');
      const textModule = await import('../../extractors/text');
      
      vi.spyOn(htmlModule, 'extractHtml').mockImplementation(() => {
        throw new Error('Failed to extract content');
      });
      
      vi.spyOn(textModule, 'extractText').mockImplementation(() => {
        throw new Error('Failed to extract content');
      });
      
      // Call the extractAfterJsExecution function
      const result = await extractAfterJsExecution(mockPage);
      
      // Verify that error is returned in result
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Failed to extract content');
    });
  });
  
  /**
   * Tests for extractElementsAfterJsExecution function
   */
  describe('extractElementsAfterJsExecution', () => {
    it('should extract elements after JavaScript execution', async () => {
      // Mock HTML, text, and elements extraction results
      const mockHtmlResult = '<html><body><div id="dynamic">Dynamic Content</div></body></html>';
      const mockTextResult = 'Dynamic Content';
      const mockElementsResult = [
        {
          selector: '#dynamic',
          results: [
            {
              text: 'Dynamic Content',
              html: '<div id="dynamic">Dynamic Content</div>',
              attributes: [
                { name: 'id', value: 'dynamic' }
              ],
              top: 20,
              left: 20,
              width: 200,
              height: 30
            }
          ]
        }
      ];
      
      // Reset any previous mocks
      vi.resetAllMocks();
      
      // Set up the page to return extraction results
      mockPage.evaluate = vi.fn().mockResolvedValue({
        html: mockHtmlResult,
        text: mockTextResult
      });
      
      // Import the modules to mock them properly
      const htmlModule = await import('../../extractors/html');
      const textModule = await import('../../extractors/text');
      const selectorModule = await import('../../extractors/selector');
      
      // Mock the extractHtml and extractText functions
      vi.spyOn(htmlModule, 'extractHtml').mockResolvedValue(mockHtmlResult);
      vi.spyOn(textModule, 'extractText').mockResolvedValue(mockTextResult);
      vi.spyOn(selectorModule, 'extractBySelector').mockResolvedValue(mockElementsResult);
      
      // Call the extractElementsAfterJsExecution function
      const selectors = '#dynamic';
      const result = await extractElementsAfterJsExecution(mockPage, selectors);
      
      // Verify that elements were extracted
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('elements');
    });
    
    it('should handle errors during element extraction', async () => {
      // Reset all mocks
      vi.resetAllMocks();
      
      // Import the modules to mock them properly
      const htmlModule = await import('../../extractors/html');
      const textModule = await import('../../extractors/text');
      const selectorModule = await import('../../extractors/selector');
      
      // Mock the extractHtml and extractText functions to succeed
      vi.spyOn(htmlModule, 'extractHtml').mockResolvedValue('<html></html>');
      vi.spyOn(textModule, 'extractText').mockResolvedValue('Text content');
      
      // Mock the extractBySelector function to throw an error
      vi.spyOn(selectorModule, 'extractBySelector').mockImplementation(() => {
        throw new Error('Failed to extract elements');
      });
      
      // Call the extractElementsAfterJsExecution function
      const selectors = '#dynamic';
      const result = await extractElementsAfterJsExecution(mockPage, selectors);
      
      // Verify that error is returned in result
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Failed to extract elements');
    });
  });
});
