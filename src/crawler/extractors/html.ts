/**
 * HTML content extractor for the Puppeteer Web Crawler
 */

import { ExtractionOptions } from '../types';

/**
 * Extracts HTML content from a page with optional modifications
 * 
 * @param page - Puppeteer Page instance
 * @param options - Options for HTML extraction
 * @returns The extracted HTML content
 */
export async function extractHtml(page: any, options: ExtractionOptions = {}): Promise<string> {
  // Get the full HTML content from the page
  let html = await page.content();
  
  // Apply modifications based on options
  if (options.removeScripts) {
    // Remove all script tags and their content
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  
  if (options.removeStyles) {
    // Remove all style tags and their content
    html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove inline styles
    html = html.replace(/\s+style\s*=\s*(['"]).*?\1/gi, '');
    
    // Remove link tags for stylesheets
    html = html.replace(/<link\s+[^>]*rel\s*=\s*(['"])stylesheet\1[^>]*>/gi, '');
  }
  
  return html;
}

/**
 * Extracts the document title from a page
 * 
 * @param page - Puppeteer Page instance
 * @returns The page title
 */
export async function extractTitle(page: any): Promise<string> {
  return await page.title();
}

/**
 * Extracts meta tags from a page
 * 
 * @param page - Puppeteer Page instance
 * @returns Object with meta tag information
 */
export async function extractMetaTags(page: any): Promise<Record<string, string>> {
  return await page.evaluate(() => {
    const metaTags: Record<string, string> = {};
    
    // Get all meta tags
    document.querySelectorAll('meta').forEach((meta) => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');
      
      if (name && content) {
        metaTags[name] = content;
      }
    });
    
    return metaTags;
  });
}

/**
 * Extracts the base URL from a page
 * 
 * @param page - Puppeteer Page instance
 * @returns The base URL if defined, or null
 */
export async function extractBaseUrl(page: any): Promise<string | null> {
  return await page.evaluate(() => {
    const baseElement = document.querySelector('base');
    return baseElement ? baseElement.getAttribute('href') : null;
  });
}

/**
 * Extracts canonical URL from a page
 * 
 * @param page - Puppeteer Page instance
 * @returns The canonical URL if defined, or null
 */
export async function extractCanonicalUrl(page: any): Promise<string | null> {
  return await page.evaluate(() => {
    const canonicalElement = document.querySelector('link[rel="canonical"]');
    return canonicalElement ? canonicalElement.getAttribute('href') : null;
  });
}
