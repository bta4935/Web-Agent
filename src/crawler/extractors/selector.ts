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
  
  // Set default options
  const opts = {
    includeAttributes: options.includeAttributes ?? true,
    includePosition: options.includePosition ?? true,
    includeHtml: options.includeHtml ?? true,
    attributes: options.attributes ?? [],
    visibleOnly: options.visibleOnly ?? true
  };
  
  return await page.evaluate((selectors: string[], options: SelectorExtractionOptions) => {
    /**
     * Checks if an element is visible
     */
    function isVisible(element: Element): boolean {
      if (!element) return false;
      
      const style = window.getComputedStyle(element);
      if (style.display === 'none') return false;
      if (style.visibility !== 'visible') return false;
      if (parseFloat(style.opacity) < 0.1) return false;
      
      const rect = element.getBoundingClientRect();
      if (rect.width <= 1 || rect.height <= 1) return false;
      
      return true;
    }
    
    /**
     * Extracts attributes from an element
     */
    function extractAttributes(element: Element, attributeList: string[] = []): Array<{name: string, value: string}> {
      const attributes: Array<{name: string, value: string}> = [];
      
      // If specific attributes are requested, extract only those
      if (attributeList && attributeList.length > 0) {
        attributeList.forEach(attr => {
          const value = element.getAttribute(attr);
          if (value !== null) {
            attributes.push({ name: attr, value });
          }
        });
      } else {
        // Otherwise extract all attributes
        Array.from(element.attributes).forEach(attr => {
          attributes.push({ name: attr.name, value: attr.value });
        });
      }
      
      return attributes;
    }
    
    /**
     * Gets position and dimensions of an element
     */
    function getElementPosition(element: Element): {top: number, left: number, width: number, height: number} {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      };
    }
    
    // Process each selector
    return selectors.map(selector => {
      try {
        // Find all elements matching the selector
        const elements = Array.from(document.querySelectorAll(selector));
        
        // Filter elements if visibleOnly is true
        const filteredElements = options.visibleOnly
          ? elements.filter(el => isVisible(el))
          : elements;
        
        // Extract data from each element
        const results = filteredElements.map(element => {
          const result: any = {
            text: element.textContent?.trim() || ''
          };
          
          // Include HTML if requested
          if (options.includeHtml) {
            result.html = element.innerHTML;
          }
          
          // Include attributes if requested
          if (options.includeAttributes) {
            result.attributes = extractAttributes(element, options.attributes);
          }
          
          // Include position if requested
          if (options.includePosition) {
            const position = getElementPosition(element);
            result.top = position.top;
            result.left = position.left;
            result.width = position.width;
            result.height = position.height;
          }
          
          return result;
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
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }, selectorList, opts);
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
