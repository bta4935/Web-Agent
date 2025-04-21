/**
 * Main Crawler class for the Puppeteer Web Crawler
 * Integrates all extractors and provides a unified interface
 */

import { CrawlerOptions, CrawlerResponse, ExtractionOptions } from './types';
import { setupPage, closePage, extractPageMetadata } from './utils/browser';
import { extractHtml } from './extractors/html';
import { extractText, TextExtractionOptions } from './extractors/text';
import { extractBySelector, SelectorExtractionOptions } from './extractors/selector';
import { 
  extractAfterJsExecution, 
  extractElementsAfterJsExecution,
  JsExtractionOptions 
} from './extractors/js';

/**
 * Main Crawler class that provides methods for extracting content from web pages
 */
export class Crawler {
  private browser: any;
  private options: CrawlerOptions;
  
  /**
   * Creates a new Crawler instance
   * 
   * @param browser - Puppeteer Browser instance
   * @param options - Configuration options for the crawler
   */
  constructor(browser: any, options: CrawlerOptions = {}) {
    this.browser = browser;
    this.options = {
      timeout: options.timeout ?? 30000,
      waitUntil: options.waitUntil ?? 'networkidle0',
      userAgent: options.userAgent,
      viewport: options.viewport ?? { width: 1280, height: 800 },
      blockImages: options.blockImages ?? true,
      blockFonts: options.blockFonts ?? true,
      blockCSS: options.blockCSS ?? false
    };
  }
  
  /**
   * Creates a standardized response object
   * 
   * @param url - URL that was crawled
   * @param status - HTTP status code
   * @param data - Additional data to include in the response
   * @returns Standardized crawler response
   */
  private createResponse(
    url: string, 
    status: number, 
    data: Partial<CrawlerResponse> = {}
  ): CrawlerResponse {
    return {
      url,
      status,
      timestamp: Date.now(),
      ...data
    };
  }
  
  /**
   * Handles errors and creates an error response
   * 
   * @param url - URL that was being crawled
   * @param error - Error that occurred
   * @returns Error response
   */
  private handleError(url: string, error: unknown): CrawlerResponse {
    console.error(`Error crawling ${url}:`, error);
    return this.createResponse(url, 500, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  /**
   * Basic crawl method that navigates to a URL
   * 
   * @param url - URL to crawl
   * @returns Basic crawler response
   */
  async crawl(url: string): Promise<CrawlerResponse> {
    let page = null;
    
    try {
      // Set up the page with our options
      page = await setupPage(this.browser, this.options);
      
      // Navigate to the URL
      await page.goto(url, {
        waitUntil: this.options.waitUntil,
        timeout: this.options.timeout
      });
      
      // Return basic response
      return this.createResponse(url, 200);
    } catch (error) {
      return this.handleError(url, error);
    } finally {
      // Always close the page to free resources
      if (page) await closePage(page);
    }
  }
  
  /**
   * Extracts HTML content from a URL
   * 
   * @param url - URL to extract HTML from
   * @param options - Options for HTML extraction
   * @returns Crawler response with HTML content
   */
  async extractHtml(url: string, options: ExtractionOptions = {}): Promise<CrawlerResponse> {
    let page = null;
    
    try {
      // Set up the page with our options
      page = await setupPage(this.browser, this.options);
      
      // Navigate to the URL
      await page.goto(url, {
        waitUntil: this.options.waitUntil,
        timeout: this.options.timeout
      });
      
      // Extract HTML content
      const html = await extractHtml(page, options);
      
      // Create response data
      const responseData: Partial<CrawlerResponse> = { html };
      
      // Include metadata if requested
      if (options.includeMetadata) {
        const metadata = await extractPageMetadata(page);
        responseData.metadata = metadata;
      }
      
      return this.createResponse(url, 200, responseData);
    } catch (error) {
      return this.handleError(url, error);
    } finally {
      // Always close the page to free resources
      if (page) await closePage(page);
    }
  }
  
  /**
   * Extracts visible text content from a URL
   * 
   * @param url - URL to extract text from
   * @param options - Options for text extraction
   * @returns Crawler response with text content
   */
  async extractText(url: string, options: TextExtractionOptions = {}): Promise<CrawlerResponse> {
    let page = null;
    
    try {
      // Set up the page with our options
      page = await setupPage(this.browser, this.options);
      
      // Navigate to the URL
      await page.goto(url, {
        waitUntil: this.options.waitUntil,
        timeout: this.options.timeout
      });
      
      // Extract text content
      const text = await extractText(page, options);
      
      return this.createResponse(url, 200, { text });
    } catch (error) {
      return this.handleError(url, error);
    } finally {
      // Always close the page to free resources
      if (page) await closePage(page);
    }
  }
  
  /**
   * Extracts content from elements matching CSS selectors
   * 
   * @param url - URL to extract elements from
   * @param selectors - CSS selector or array of selectors
   * @param options - Options for selector extraction
   * @returns Crawler response with extracted elements
   */
  async extractBySelector(
    url: string, 
    selectors: string | string[],
    options: SelectorExtractionOptions = {}
  ): Promise<CrawlerResponse> {
    let page = null;
    
    try {
      // Set up the page with our options
      page = await setupPage(this.browser, this.options);
      
      // Navigate to the URL
      await page.goto(url, {
        waitUntil: this.options.waitUntil,
        timeout: this.options.timeout
      });
      
      // Extract elements matching selectors
      const elements = await extractBySelector(page, selectors, options);
      
      return this.createResponse(url, 200, { elements });
    } catch (error) {
      return this.handleError(url, error);
    } finally {
      // Always close the page to free resources
      if (page) await closePage(page);
    }
  }
  
  /**
   * Extracts content after JavaScript execution
   * 
   * @param url - URL to extract content from
   * @param options - Options for JavaScript execution
   * @returns Crawler response with content after JavaScript execution
   */
  async extractAfterJsExecution(
    url: string,
    options: JsExtractionOptions = {}
  ): Promise<CrawlerResponse> {
    let page = null;
    
    try {
      // Set up the page with our options
      page = await setupPage(this.browser, this.options);
      
      // Navigate to the URL with the specified wait strategy
      await page.goto(url, {
        waitUntil: options.waitUntil || this.options.waitUntil,
        timeout: this.options.timeout
      });
      
      // Extract content after JavaScript execution
      const jsResult = await extractAfterJsExecution(page, options);
      
      // Handle any errors from JS extraction
      if (jsResult.error) {
        return this.createResponse(url, 500, { error: jsResult.error });
      }
      
      return this.createResponse(url, 200, {
        html: jsResult.html,
        text: jsResult.text
      });
    } catch (error) {
      return this.handleError(url, error);
    } finally {
      // Always close the page to free resources
      if (page) await closePage(page);
    }
  }
  
  /**
   * Extracts elements after JavaScript execution
   * 
   * @param url - URL to extract elements from
   * @param selectors - CSS selector or array of selectors
   * @param options - Options for JavaScript execution
   * @returns Crawler response with elements after JavaScript execution
   */
  async extractElementsAfterJsExecution(
    url: string,
    selectors: string | string[],
    options: JsExtractionOptions = {}
  ): Promise<CrawlerResponse> {
    let page = null;
    
    try {
      // Set up the page with our options
      page = await setupPage(this.browser, this.options);
      
      // Navigate to the URL with the specified wait strategy
      await page.goto(url, {
        waitUntil: options.waitUntil || this.options.waitUntil,
        timeout: this.options.timeout
      });
      
      // Extract elements after JavaScript execution
      const jsResult = await extractElementsAfterJsExecution(page, selectors, options);
      
      // Handle any errors from JS extraction
      if (jsResult.error) {
        return this.createResponse(url, 500, { error: jsResult.error });
      }
      
      return this.createResponse(url, 200, {
        html: jsResult.html,
        text: jsResult.text,
        elements: jsResult.elements
      });
    } catch (error) {
      return this.handleError(url, error);
    } finally {
      // Always close the page to free resources
      if (page) await closePage(page);
    }
  }
  
  /**
   * Executes a custom function on a page and returns the result
   * 
   * @param url - URL to navigate to
   * @param scriptFn - Function to execute on the page
   * @param args - Arguments to pass to the function
   * @returns Crawler response with the result of the function
   */
  async executeCustomFunction<T>(
    url: string,
    scriptFn: Function | string,
    ...args: any[]
  ): Promise<CrawlerResponse & { result?: T }> {
    let page = null;
    
    try {
      // Set up the page with our options
      page = await setupPage(this.browser, this.options);
      
      // Navigate to the URL
      await page.goto(url, {
        waitUntil: this.options.waitUntil,
        timeout: this.options.timeout
      });
      
      // Execute the custom function
      const result = await page.evaluate(
        typeof scriptFn === 'function' ? scriptFn.toString() : scriptFn,
        ...args
      );
      
      return this.createResponse(url, 200, { result });
    } catch (error) {
      return this.handleError(url, error);
    } finally {
      // Always close the page to free resources
      if (page) await closePage(page);
    }
  }
}
