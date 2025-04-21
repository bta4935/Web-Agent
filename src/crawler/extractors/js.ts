/**
 * JavaScript-executed content extractor for the Puppeteer Web Crawler
 * Extracts content after JavaScript execution on the page
 */

import { extractHtml } from './html';
import { extractText } from './text';
import { extractBySelector } from './selector';
import { ElementExtractionResult } from '../types';

/**
 * Options for JavaScript execution and content extraction
 */
export interface JsExtractionOptions {
  /** Time to wait after initial page load in milliseconds */
  waitTime?: number;
  /** Wait strategy for page navigation */
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  /** Custom JavaScript to execute on the page */
  customScript?: string;
  /** Whether to wait for network idle before extraction */
  waitForNetworkIdle?: boolean;
  /** Time to wait for network idle in milliseconds */
  networkIdleTime?: number;
  /** CSS selector to wait for before extraction */
  waitForSelector?: string;
  /** Timeout for waiting for selector in milliseconds */
  selectorTimeout?: number;
  /** Whether to remove scripts from extracted HTML */
  removeScripts?: boolean;
  /** Whether to remove styles from extracted HTML */
  removeStyles?: boolean;
}

/**
 * Result of JavaScript-executed content extraction
 */
export interface JsExtractionResult {
  /** HTML content after JavaScript execution */
  html?: string;
  /** Text content after JavaScript execution */
  text?: string;
  /** Elements extracted by selectors after JavaScript execution */
  elements?: ElementExtractionResult[];
  /** Any error that occurred during extraction */
  error?: string;
}

/**
 * Extracts content from a page after JavaScript execution
 * 
 * @param page - Puppeteer Page instance
 * @param options - Options for JavaScript execution and extraction
 * @returns Extracted content after JavaScript execution
 */
export async function extractAfterJsExecution(
  page: any,
  options: JsExtractionOptions = {}
): Promise<JsExtractionResult> {
  try {
    // Set default options
    const opts = {
      waitTime: options.waitTime ?? 1000,
      waitUntil: options.waitUntil ?? 'networkidle0',
      customScript: options.customScript,
      waitForNetworkIdle: options.waitForNetworkIdle ?? true,
      networkIdleTime: options.networkIdleTime ?? 500,
      waitForSelector: options.waitForSelector,
      selectorTimeout: options.selectorTimeout ?? 5000,
      removeScripts: options.removeScripts ?? false,
      removeStyles: options.removeStyles ?? false
    };
    
    // Wait for network to be idle if requested
    if (opts.waitForNetworkIdle) {
      try {
        await page.waitForNetworkIdle({ idleTime: opts.networkIdleTime });
      } catch (error) {
        console.warn('Network did not become idle within timeout:', error);
      }
    }
    
    // Wait for specific selector if provided
    if (opts.waitForSelector) {
      try {
        await page.waitForSelector(opts.waitForSelector, { 
          timeout: opts.selectorTimeout 
        });
      } catch (error) {
        console.warn(`Selector "${opts.waitForSelector}" did not appear within timeout:`, error);
      }
    }
    
    // Execute custom JavaScript if provided
    if (opts.customScript) {
      await page.evaluate((script: string) => {
        try {
          // Create a function from the script string and execute it
          const scriptFn = new Function(script);
          return scriptFn();
        } catch (error) {
          console.error('Error executing custom script:', error);
        }
      }, opts.customScript);
    }
    
    // Wait additional time if specified
    if (opts.waitTime > 0) {
      await page.waitForTimeout(opts.waitTime);
    }
    
    // Extract content after JavaScript execution
    const result: JsExtractionResult = {};
    
    // Extract HTML
    result.html = await extractHtml(page, {
      removeScripts: opts.removeScripts,
      removeStyles: opts.removeStyles
    });
    
    // Extract text
    result.text = await extractText(page);
    
    return result;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error during JavaScript execution'
    };
  }
}

/**
 * Extracts content from specific elements after JavaScript execution
 * 
 * @param page - Puppeteer Page instance
 * @param selectors - CSS selectors to extract content from
 * @param options - Options for JavaScript execution and extraction
 * @returns Extracted elements after JavaScript execution
 */
export async function extractElementsAfterJsExecution(
  page: any,
  selectors: string | string[],
  options: JsExtractionOptions = {}
): Promise<JsExtractionResult> {
  try {
    // First wait for JavaScript execution
    const baseResult = await extractAfterJsExecution(page, options);
    
    // If there was an error, return it
    if (baseResult.error) {
      return baseResult;
    }
    
    // Extract elements using selectors
    const elements = await extractBySelector(page, selectors);
    
    return {
      ...baseResult,
      elements
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error during element extraction'
    };
  }
}

/**
 * Executes a custom JavaScript function on the page and returns the result
 * 
 * @param page - Puppeteer Page instance
 * @param scriptFn - JavaScript function to execute
 * @param args - Arguments to pass to the function
 * @returns Result of the JavaScript execution
 */
export async function executeCustomJs<T>(
  page: any,
  scriptFn: Function | string,
  ...args: any[]
): Promise<T> {
  // Convert function to string if it's not already
  const scriptStr = typeof scriptFn === 'function' 
    ? scriptFn.toString() 
    : scriptFn;
  
  return await page.evaluate(scriptStr, ...args);
}
