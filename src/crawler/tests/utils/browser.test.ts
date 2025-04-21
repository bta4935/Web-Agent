/**
 * Tests for browser utilities in the Puppeteer Web Crawler
 * Verifies that browser setup, page configuration, and resource management work correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { CrawlerOptions } from '../../types';
import { setupPage, closePage, extractPageMetadata } from '../../utils/browser';
import { MockBrowser, MockPage, createMockBrowser } from '../utils/test-helpers';

describe('Browser Utilities', () => {
  let mockBrowser: MockBrowser;
  
  beforeEach(() => {
    // Create a fresh mock browser for each test
    mockBrowser = createMockBrowser();
  });
  
  afterEach(() => {
    // Clean up after each test
    mockBrowser.close();
  });
  
  /**
   * Tests for setupPage function
   */
  describe('setupPage', () => {
    it('should create and configure a new page', async () => {
      // Create a mock page with spies on its methods
      const page = await mockBrowser.newPage();
      vi.spyOn(page, 'setDefaultTimeout');
      vi.spyOn(page, 'setRequestInterception');
      vi.spyOn(page, 'on');
      
      // Mock the browser's newPage method to return our spy page
      vi.spyOn(mockBrowser, 'newPage').mockResolvedValue(page);
      
      // Default options
      const options: CrawlerOptions = {};
      
      // Call the setupPage function
      const result = await setupPage(mockBrowser, options);
      
      // Verify that the page was configured correctly
      expect(result).toBe(page);
      expect(page.setDefaultTimeout).toHaveBeenCalled();
      expect(page.setRequestInterception).toHaveBeenCalledWith(true);
      expect(page.on).toHaveBeenCalledWith('request', expect.any(Function));
    });
    
    it('should configure page with custom options', async () => {
      // Create a mock page with spies on its methods
      const page = await mockBrowser.newPage();
      vi.spyOn(page, 'setDefaultTimeout');
      vi.spyOn(page, 'setUserAgent');
      vi.spyOn(page, 'setViewport');
      vi.spyOn(page, 'setRequestInterception');
      vi.spyOn(page, 'on');
      
      // Mock the browser's newPage method to return our spy page
      vi.spyOn(mockBrowser, 'newPage').mockResolvedValue(page);
      
      // Custom options
      const options: CrawlerOptions = {
        userAgent: 'Custom User Agent',
        viewport: { width: 1920, height: 1080 },
        blockImages: true,
        blockFonts: true,
        blockCSS: true
      };
      
      // Call the setupPage function
      const result = await setupPage(mockBrowser, options);
      
      // Verify that the page was configured with custom options
      expect(page.setUserAgent).toHaveBeenCalledWith(options.userAgent);
      expect(page.setViewport).toHaveBeenCalledWith(options.viewport);
    });
    
    it('should handle request interception correctly', async () => {
      // Create a mock page with request interception
      const page = await mockBrowser.newPage();
      vi.spyOn(page, 'setDefaultTimeout');
      vi.spyOn(page, 'setRequestInterception');
      
      // Mock the browser's newPage method to return our spy page
      vi.spyOn(mockBrowser, 'newPage').mockResolvedValue(page);
      
      // Create a request handler spy
      let requestHandler: Function | null = null;
      page.on = vi.fn().mockImplementation((event: string, handler: Function) => {
        if (event === 'request') {
          requestHandler = handler;
        }
      });
      
      // Set up request interception
      await setupPage(mockBrowser, {
        blockImages: true,
        blockFonts: true,
        blockCSS: true
      });
      
      // Verify that request interception was set up
      expect(page.setRequestInterception).toHaveBeenCalledWith(true);
      expect(page.on).toHaveBeenCalledWith('request', expect.any(Function));
      expect(requestHandler).not.toBeNull();
      
      // Create mock requests
      const imageRequest = { resourceType: () => 'image', continue: vi.fn(), abort: vi.fn() };
      const fontRequest = { resourceType: () => 'font', continue: vi.fn(), abort: vi.fn() };
      const cssRequest = { resourceType: () => 'stylesheet', continue: vi.fn(), abort: vi.fn() };
      const htmlRequest = { resourceType: () => 'document', continue: vi.fn(), abort: vi.fn() };
      
      // Call the request handler directly
      if (requestHandler) {
        (requestHandler as Function)(imageRequest);
        (requestHandler as Function)(fontRequest);
        (requestHandler as Function)(cssRequest);
        (requestHandler as Function)(htmlRequest);
      }
      
      // Verify that requests were handled correctly
      expect(imageRequest.abort).toHaveBeenCalled();
      expect(fontRequest.abort).toHaveBeenCalled();
      expect(cssRequest.abort).toHaveBeenCalled();
      expect(htmlRequest.continue).toHaveBeenCalled();
    });
  });
  
  /**
   * Tests for closePage function
   */
  describe('closePage', () => {
    it('should close the page safely', async () => {
      // Create a mock page
      const page = await mockBrowser.newPage();
      
      // Set up a spy on the close method
      const closeSpy = vi.spyOn(page, 'close');
      
      // Call the closePage function
      await closePage(page);
      
      // Verify that close was called
      expect(closeSpy).toHaveBeenCalled();
    });
    
    it('should handle null page gracefully', async () => {
      // Call the closePage function with null
      const result = await closePage(null);
      
      // Verify that the function returns without error
      expect(result).toBeUndefined();
    });
    
    it('should handle errors during page closing', async () => {
      // Create a mock page
      const page = await mockBrowser.newPage();
      
      // Make the close method throw an error
      vi.spyOn(page, 'close').mockImplementation(() => {
        throw new Error('Failed to close page');
      });
      
      // Call the closePage function
      await closePage(page);
      
      // Verify that the function doesn't throw (it should catch the error)
      // This test passes if no exception is thrown
    });
  });
  
  /**
   * Tests for extractPageMetadata function
   */
  describe('extractPageMetadata', () => {
    it('should extract page title and meta tags', async () => {
      // Create a mock page
      const page = await mockBrowser.newPage();
      
      // Set up the page to return metadata when evaluated
      vi.spyOn(page, 'evaluate').mockImplementation(() => {
        return Promise.resolve({
          title: 'Test Page',
          description: 'A test page for crawler testing',
          'og:title': 'Test Page for Social Media',
          'og:description': 'This is how the page appears on social media'
        });
      });
      
      // Call the extractPageMetadata function
      const metadata = await extractPageMetadata(page);
      
      // Verify that metadata was extracted correctly
      expect(metadata).toEqual({
        title: 'Test Page',
        description: 'A test page for crawler testing',
        'og:title': 'Test Page for Social Media',
        'og:description': 'This is how the page appears on social media'
      });
      
      // Verify that evaluate was called
      expect(page.evaluate).toHaveBeenCalled();
    });
    
    it('should handle missing metadata gracefully', async () => {
      // Create a mock page
      const page = await mockBrowser.newPage();
      
      // Set up the page to return minimal metadata when evaluated
      vi.spyOn(page, 'evaluate').mockImplementation(() => {
        return Promise.resolve({
          title: 'Test Page'
        });
      });
      
      // Call the extractPageMetadata function
      const metadata = await extractPageMetadata(page);
      
      // Verify that metadata was extracted correctly
      expect(metadata).toEqual({
        title: 'Test Page'
      });
    });
    
    it('should handle errors during metadata extraction', async () => {
      // Create a mock page
      const page = await mockBrowser.newPage();
      
      // Make the evaluate method throw an error
      vi.spyOn(page, 'evaluate').mockImplementation(() => {
        return Promise.reject(new Error('Failed to extract metadata'));
      });
      
      // Override the title method to return an empty string
      vi.spyOn(page, 'title').mockResolvedValue('');
      
      // Call the extractPageMetadata function
      const metadata = await extractPageMetadata(page);
      
      // Verify that an object with empty title is returned on error
      expect(metadata).toEqual({ title: '' });
    });
  });
});
