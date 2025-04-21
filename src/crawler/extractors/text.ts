/**
 * Text content extractor for the Puppeteer Web Crawler
 * Extracts only visible text from web pages
 */

/**
 * Options for text extraction
 */
export interface TextExtractionOptions {
  /** Whether to preserve whitespace */
  preserveWhitespace?: boolean;
  /** Whether to include alt text from images */
  includeImageAlt?: boolean;
  /** Minimum length of text to include */
  minTextLength?: number;
}

/**
 * Extracts visible text content from a page
 * 
 * @param page - Puppeteer Page instance
 * @param options - Options for text extraction
 * @returns The extracted visible text content
 */
export async function extractText(page: any, options: TextExtractionOptions = {}): Promise<string> {
  try {
    // Set default options
    const opts = {
      preserveWhitespace: options.preserveWhitespace ?? false,
      includeImageAlt: options.includeImageAlt ?? true,
      minTextLength: options.minTextLength ?? 1
    };

    return await page.evaluate((options: TextExtractionOptions) => {
    /**
     * Checks if an element is visible
     * 
     * @param element - DOM element to check
     * @returns Whether the element is visible
     */
    function isVisible(element: Element): boolean {
      if (!element) return false;
      
      // Check if element or any ancestor has display: none or visibility: hidden
      const style = window.getComputedStyle(element);
      if (style.display === 'none') return false;
      if (style.visibility !== 'visible') return false;
      if (parseFloat(style.opacity) < 0.1) return false;
      
      // Check if element has zero dimensions
      const rect = element.getBoundingClientRect();
      if (rect.width <= 1 || rect.height <= 1) return false;
      
      // Check if element is hidden by overflow
      if (style.overflow === 'hidden' && (rect.width === 0 || rect.height === 0)) {
        return false;
      }
      
      // Element is visible
      return true;
    }
    
    /**
     * Checks if a text node should be included
     * 
     * @param node - Text node to check
     * @returns Whether the node should be included
     */
    function shouldIncludeText(node: Text): boolean {
      if (!node.textContent) return false;
      
      // Skip if parent is not visible
      if (!node.parentElement || !isVisible(node.parentElement)) {
        return false;
      }
      
      // Skip if text is too short
      const trimmed = node.textContent.trim();
      if (trimmed.length < (options.minTextLength || 1)) {
        return false;
      }
      
      // Skip if parent is a script or style tag
      const parentTagName = node.parentElement.tagName.toLowerCase();
      if (parentTagName === 'script' || parentTagName === 'style' || 
          parentTagName === 'noscript' || parentTagName === 'template') {
        return false;
      }
      
      return true;
    }
    
    // Extract all visible text
    let extractedText = '';
    
    // Use TreeWalker to iterate through all text nodes
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          return shouldIncludeText(node as Text)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    // Collect text from all accepted nodes
    let node;
    while ((node = walker.nextNode())) {
      let text = node.textContent || '';
      
      // Handle whitespace based on options
      if (!options.preserveWhitespace) {
        text = text.trim();
        if (text) {
          extractedText += text + ' ';
        }
      } else {
        extractedText += text;
      }
    }
    
    // Include alt text from images if requested
    if (options.includeImageAlt) {
      const images = Array.from(document.querySelectorAll('img'));
      for (const img of images) {
        if (isVisible(img) && img.alt && img.alt.trim().length >= (options.minTextLength || 1)) {
          extractedText += '[Image: ' + img.alt.trim() + '] ';
        }
      }
    }
    
    return extractedText.trim();
  }, opts);
  } catch (error) {
    console.error('Error extracting text:', error);
    return '';
  }
}

/**
 * Extracts text content from specific elements
 * 
 * @param page - Puppeteer Page instance
 * @param selector - CSS selector for elements to extract text from
 * @returns Array of text content from matching elements
 */
export async function extractTextFromElements(page: any, selector: string): Promise<string[]> {
  return await page.evaluate((selector: string) => {
    const elements = Array.from(document.querySelectorAll(selector));
    return elements
      .filter(el => {
        // Check if element is visible
        const style = window.getComputedStyle(el);
        if (style.display === 'none') return false;
        if (style.visibility !== 'visible') return false;
        if (parseFloat(style.opacity) < 0.1) return false;
        
        const rect = el.getBoundingClientRect();
        if (rect.width <= 1 || rect.height <= 1) return false;
        
        return true;
      })
      .map(el => el.textContent?.trim() || '');
  }, selector);
}
