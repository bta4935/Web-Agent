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
    // Simpler implementation that directly extracts text content
    return await page.evaluate(() => {
      // Get all text from the body
      const bodyText = document.body.innerText || '';
      
      // Get all alt text from images
      const images = Array.from(document.querySelectorAll('img[alt]'));
      const imageAltText = images
        .map(img => `[Image: ${(img as HTMLImageElement).alt}]`)
        .join(' ');
      
      // Combine and clean up the text
      return (bodyText + ' ' + imageAltText).trim();
    });
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
