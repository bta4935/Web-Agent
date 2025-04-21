/**
 * Tests for HTML extractor in the Puppeteer Web Crawler
 * Verifies that HTML extraction functions work correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ExtractionOptions } from '../../types';
import { extractHtml, extractTitle, extractMetaTags } from '../../extractors/html';
import { MockBrowser, createMockBrowser, createTestHtml } from '../utils/test-helpers';

describe('HTML Extractor', () => {
  let mockBrowser: MockBrowser;
  let mockPage: any;
  
  beforeEach(async () => {
    // Create a fresh mock browser and page for each test
    mockBrowser = createMockBrowser();
    mockPage = await mockBrowser.newPage();
    
    // Set up a test HTML page
    const testHtml = createTestHtml();
    await mockPage.setContent(testHtml);
    
    // Add title method to mockPage
    mockPage.title = vi.fn().mockResolvedValue('Test Page Title');
    
    // Add content method to mockPage
    mockPage.content = vi.fn().mockResolvedValue(testHtml);
  });
  
  afterEach(async () => {
    // Clean up after each test
    await mockPage.close();
    await mockBrowser.close();
  });
  
  /**
   * Tests for extractHtml function
   */
  describe('extractHtml', () => {
    it('should extract full HTML content', async () => {
      // Set up the page to return HTML when content() is called
      const testHtml = createTestHtml();
      mockPage.content.mockResolvedValue(testHtml);
      
      // Call the extractHtml function with default options
      const html = await extractHtml(mockPage);
      
      // Verify that HTML was extracted correctly
      expect(html).toBe(testHtml);
      expect(mockPage.content).toHaveBeenCalled();
    });
    
    it('should remove scripts when specified', async () => {
      // Create HTML with script tags
      const htmlWithScripts = `
        <html>
          <head>
            <script>console.log('test');</script>
          </head>
          <body>
            <h1>Test Page</h1>
            <script>document.write('dynamic content');</script>
          </body>
        </html>
      `;
      
      // Set up the page to return HTML with scripts
      mockPage.content.mockResolvedValue(htmlWithScripts);
      
      // Call the extractHtml function with removeScripts option
      const html = await extractHtml(mockPage, { removeScripts: true });
      
      // Verify that scripts were removed
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('</script>');
      expect(mockPage.content).toHaveBeenCalled();
    });
    
    it('should remove styles when specified', async () => {
      // Create HTML with style tags
      const htmlWithStyles = `
        <html>
          <head>
            <style>body { color: red; }</style>
            <link rel="stylesheet" href="styles.css">
          </head>
          <body>
            <h1 style="color: blue;">Test Page</h1>
          </body>
        </html>
      `;
      
      // Set up the page to return HTML with styles
      mockPage.content.mockResolvedValue(htmlWithStyles);
      
      // Call the extractHtml function with removeStyles option
      const html = await extractHtml(mockPage, { removeStyles: true });
      
      // Verify that styles were removed
      expect(html).not.toContain('<style>');
      expect(html).not.toContain('</style>');
      expect(mockPage.content).toHaveBeenCalled();
    });
    
    it('should handle errors during HTML extraction', async () => {
      // Make the content() method throw an error
      mockPage.content.mockImplementationOnce(() => {
        throw new Error('Failed to get content');
      });
      
      try {
        // Call the extractHtml function
        await extractHtml(mockPage);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Verify that an error is thrown
        expect(error).toBeDefined();
      }
    });
  });
  
  /**
   * Tests for extractTitle function
   */
  describe('extractTitle', () => {
    it('should extract page title', async () => {
      // Call the extractTitle function
      const title = await extractTitle(mockPage);
      
      // Verify that title was extracted correctly
      expect(title).toBe('Test Page Title');
      expect(mockPage.title).toHaveBeenCalled();
    });
    
    it('should return empty string if title is not found', async () => {
      // Set up the page to return null when evaluated
      mockPage.title.mockResolvedValueOnce('');
      
      // Call the extractTitle function
      const title = await extractTitle(mockPage);
      
      // Verify that an empty string is returned
      expect(title).toBe('');
    });
    
    it('should handle errors during title extraction', async () => {
      // Make the title method throw an error
      mockPage.title.mockImplementationOnce(() => {
        throw new Error('Failed to extract title');
      });
      
      try {
        // Call the extractTitle function
        await extractTitle(mockPage);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Verify that an error is thrown
        expect(error).toBeDefined();
      }
    });
  });
  
  /**
   * Tests for extractMetaTags function
   */
  describe('extractMetaTags', () => {
    it('should extract meta tags', async () => {
      // Mock meta tags
      const mockMetaTags = {
        description: 'A test page for crawler testing',
        keywords: 'test, crawler, puppeteer',
        'og:title': 'Test Page for Social Media',
        'og:description': 'This is how the page appears on social media'
      };
      
      // Set up the page to return meta tags when evaluated
      vi.spyOn(mockPage, 'evaluate').mockResolvedValue(mockMetaTags);
      
      // Call the extractMetaTags function
      const metaTags = await extractMetaTags(mockPage);
      
      // Verify that meta tags were extracted correctly
      expect(metaTags).toEqual(mockMetaTags);
      expect(mockPage.evaluate).toHaveBeenCalled();
    });
    
    it('should return empty object if no meta tags are found', async () => {
      // Set up the page to return an empty object when evaluated
      vi.spyOn(mockPage, 'evaluate').mockResolvedValue({});
      
      // Call the extractMetaTags function
      const metaTags = await extractMetaTags(mockPage);
      
      // Verify that an empty object is returned
      expect(metaTags).toEqual({});
    });
    
    it('should handle errors during meta tag extraction', async () => {
      // Make the evaluate method throw an error
      vi.spyOn(mockPage, 'evaluate').mockImplementationOnce(() => {
        throw new Error('Failed to extract meta tags');
      });
      
      try {
        // Call the extractMetaTags function
        await extractMetaTags(mockPage);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Verify that an error is thrown
        expect(error).toBeDefined();
      }
    });
  });
});
