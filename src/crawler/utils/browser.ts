/**
 * Browser utility functions for the Puppeteer Web Crawler
 * Using any types to avoid compilation issues with Puppeteer's private identifiers
 */

// Import Puppeteer properly for Cloudflare Workers
import puppeteer from '@cloudflare/puppeteer';
import { CrawlerOptions } from '../types';

/**
 * Sets up a new page with the specified options
 * 
 * @param browser - Puppeteer Browser instance
 * @param options - Configuration options for the page
 * @returns Configured Puppeteer Page instance
 */
export async function setupPage(browser: any, options: CrawlerOptions = {}): Promise<any> {
  // Create a new page
  const page = await browser.newPage();
  
  // Set default timeout (30 seconds if not specified)
  const timeout = options.timeout || 30000;
  page.setDefaultTimeout(timeout);
  
  // Set user agent if provided
  if (options.userAgent) {
    await page.setUserAgent(options.userAgent);
  }
  
  // Set viewport if provided, otherwise use a default desktop size
  if (options.viewport) {
    await page.setViewport(options.viewport);
  } else {
    await page.setViewport({ width: 1280, height: 800 });
  }
  
  // Configure request interception for resource optimization
  await page.setRequestInterception(true);
  
  // Handle requests based on resource type
  page.on('request', (request: any) => {
    const resourceType = request.resourceType();
    
    // Block resources based on configuration
    if (
      (options.blockImages && resourceType === 'image') ||
      (options.blockFonts && resourceType === 'font') ||
      (options.blockCSS && resourceType === 'stylesheet')
    ) {
      request.abort();
    } else {
      request.continue();
    }
  });
  
  return page;
}

/**
 * Safely closes a page, handling any errors
 * 
 * @param page - Puppeteer Page instance to close
 */
export async function closePage(page: any | null): Promise<void> {
  if (!page) return;
  
  try {
    // Check if page is still valid
    if (page.isClosed?.() !== true) {
      await page.close();
    }
  } catch (error) {
    console.error('Error closing page:', error);
    // We don't rethrow as this is a cleanup function
  }
}

/**
 * Extracts metadata from a page
 * 
 * @param page - Puppeteer Page instance
 * @returns Object containing page metadata
 */
export async function extractPageMetadata(page: any): Promise<Record<string, string>> {
  try {
    return await page.evaluate(() => {
      const metadata: Record<string, string> = {
        title: document.title || '',
      };
      
      // Extract meta tags
      const metaTags = document.querySelectorAll('meta');
      metaTags.forEach((meta) => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        
        if (name && content) {
          metadata[name] = content;
        }
      });
      
      return metadata;
    });
  } catch (error) {
    console.error('Error extracting metadata:', error);
    // Handle both cases where title is a function or a property
    let title = '';
    try {
      title = typeof page.title === 'function' ? await page.title() : page.title;
    } catch (e) {
      console.error('Error getting page title:', e);
    }
    return { title };
  }
}
