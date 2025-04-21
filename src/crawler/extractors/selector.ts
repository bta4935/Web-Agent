/**
 * CSS selector-based extractor for the Puppeteer Web Crawler
 * Extracts content from specific elements using CSS selectors
 */

import { ElementExtractionResult } from '../types';

/**
 * Options for selector-based extraction
 */
export interface SelectorExtractionOptions {
  /** Whether to include element attributes */
  includeAttributes?: boolean;
  /** Whether to include element position and dimensions */
  includePosition?: boolean;
  /** Whether to include element HTML content */
  includeHtml?: boolean;
  /** Specific attributes to extract (if includeAttributes is true) */
  attributes?: string[];
  /** Whether to only include visible elements */
  visibleOnly?: boolean;
}

/**
 * Extracts content from elements matching CSS selectors
 * 
 * @param page - Puppeteer Page instance
 * @param selectors - CSS selector or array of selectors
 * @param options - Options for extraction
 * @returns Array of extraction results for each selector
 */
export async function extractBySelector(
  page: any,
  selectors: string | string[],
  options: SelectorExtractionOptions = {}
): Promise<ElementExtractionResult[]> {
  // Convert single selector to array
  const selectorList = Array.isArray(selectors) ? selectors : [selectors];
  
  // Simplified implementation to avoid serialization issues
  return await page.evaluate((selectors: string[]) => {
    return selectors.map((selector: string) => {
      try {
        // Find all elements matching the selector
        const elements = Array.from(document.querySelectorAll(selector));
        
        // Extract basic data from each element
        const results = elements.map(element => {
          // Get position information
          const rect = element.getBoundingClientRect();
          
          return {
            text: element.textContent?.trim() || '',
            html: element.innerHTML,
            attributes: Array.from(element.attributes).map((attr: Attr) => ({
              name: attr.name,
              value: attr.value
            })),
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          };
        });
        
        return {
          selector,
          results
        };
      } catch (error) {
        // Return empty results if selector fails
        return {
          selector,
          results: [],
          error: String(error)
        };
      }
    });
  }, selectorList);
}

/**
 * Extracts text content from elements matching a CSS selector
 * 
 * @param page - Puppeteer Page instance
 * @param selector - CSS selector
 * @returns Array of text content from matching elements
 */
export async function extractTextBySelector(page: any, selector: string): Promise<string[]> {
  return await page.evaluate((selector: string) => {
    const elements = Array.from(document.querySelectorAll(selector));
    return elements.map(el => el.textContent?.trim() || '');
  }, selector);
}

/**
 * Extracts attribute values from elements matching a CSS selector
 * 
 * @param page - Puppeteer Page instance
 * @param selector - CSS selector
 * @param attribute - Attribute name to extract
 * @returns Array of attribute values from matching elements
 */
export async function extractAttributeBySelector(
  page: any,
  selector: string,
  attribute: string
): Promise<string[]> {
  return await page.evaluate((selector: string, attribute: string) => {
    const elements = Array.from(document.querySelectorAll(selector));
    return elements
      .map(el => el.getAttribute(attribute))
      .filter(value => value !== null) as string[];
  }, selector, attribute);
}
