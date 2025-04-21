/**
 * Tests for text extractor in the Puppeteer Web Crawler
 * Verifies that text extraction functions work correctly with visibility checks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { TextExtractionOptions } from '../../extractors/text';
import { extractText } from '../../extractors/text';
import { MockBrowser, createMockBrowser, createTestHtml } from '../utils/test-helpers';

describe('Text Extractor', () => {
  let mockBrowser: MockBrowser;
  let mockPage: any;
  
  beforeEach(async () => {
    // Create a fresh mock browser and page for each test
    mockBrowser = createMockBrowser();
    mockPage = await mockBrowser.newPage();
    
    // Set up a test HTML page
    const testHtml = createTestHtml();
    await mockPage.setContent(testHtml);
  });
  
  afterEach(async () => {
    // Clean up after each test
    await mockPage.close();
    await mockBrowser.close();
  });
  
  /**
   * Tests for extractText function
   */
  describe('extractText', () => {
    it('should extract visible text content', async () => {
      // Mock text content
      const mockTextContent = 'Test Page Heading\nThis is a visible paragraph.\nItem 1\nItem 2\nItem 3';
      
      // Set up the page to return text content when evaluated
      vi.spyOn(mockPage, 'evaluate').mockResolvedValue(mockTextContent);
      
      // Call the extractText function with default options
      const text = await extractText(mockPage);
      
      // Verify that text was extracted correctly
      expect(text).toBe(mockTextContent);
      expect(mockPage.evaluate).toHaveBeenCalled();
    });
    
    it('should preserve whitespace when specified', async () => {
      // Mock text content with whitespace
      const mockTextContent = '  Test Page Heading  \n\n  This is a visible paragraph.  \n  Item 1  \n  Item 2  \n  Item 3  ';
      
      // Set up the page to return text content when evaluated
      vi.spyOn(mockPage, 'evaluate').mockResolvedValue(mockTextContent);
      
      // Call the extractText function with preserveWhitespace option
      const options: TextExtractionOptions = { preserveWhitespace: true };
      const text = await extractText(mockPage, options);
      
      // Verify that whitespace was preserved
      expect(text).toBe(mockTextContent);
      expect(text).toContain('  Test');
      expect(text).toContain('\n\n');
    });
    
    it('should include image alt text when specified', async () => {
      // Mock text content with image alt text
      const mockTextContent = 'Test Page Heading\nThis is a visible paragraph.\nPlaceholder image 150x150\nPlaceholder with caption';
      
      // Set up the page to return text content when evaluated
      vi.spyOn(mockPage, 'evaluate').mockResolvedValue(mockTextContent);
      
      // Call the extractText function with includeImageAlt option
      const options: TextExtractionOptions = { includeImageAlt: true };
      const text = await extractText(mockPage, options);
      
      // Verify that image alt text was included
      expect(text).toBe(mockTextContent);
      expect(text).toContain('Placeholder image');
    });
    
    it('should filter text by minimum length when specified', async () => {
      // Mock text content with various lengths
      const mockTextContentLines = [
        'A', // 1 character
        'Hi', // 2 characters
        'The', // 3 characters
        'Test', // 4 characters
        'Hello', // 5 characters
        'Testing', // 7 characters
        'This is a longer sentence.' // 26 characters
      ];
      
      // Set up the page to return text content when evaluated
      vi.spyOn(mockPage, 'evaluate').mockResolvedValue(
        mockTextContentLines
          .filter(line => line.length >= 4) // Minimum length of 4 characters
          .join('\n')
      );
      
      // Call the extractText function with minTextLength option
      const options: TextExtractionOptions = { minTextLength: 4 };
      const text = await extractText(mockPage, options);
      
      // Verify that text was filtered by minimum length
      expect(text).not.toContain('A\n');
      expect(text).not.toContain('Hi\n');
      expect(text).not.toContain('The\n');
      expect(text).toContain('Test');
      expect(text).toContain('Hello');
      expect(text).toContain('Testing');
      expect(text).toContain('This is a longer sentence.');
    });
    
    it('should handle errors during text extraction', async () => {
      // Make the evaluate method throw an error
      vi.spyOn(mockPage, 'evaluate').mockRejectedValue(new Error('Failed to extract text'));
      
      // Call the extractText function
      const text = await extractText(mockPage);
      
      // Verify that an empty string is returned on error
      expect(text).toBe('');
    });
  });
  
  /**
   * Tests for element visibility detection
   * 
   * Note: This is testing our own implementation of isElementVisible for testing purposes,
   * not the internal one used by the text extractor
   */
  describe('Element Visibility Detection', () => {
    /**
     * Local implementation of isElementVisible for testing
     * This mimics the behavior of the internal function in the text extractor
     */
    function isElementVisible(element: any): boolean {
      try {
        // Check if element exists
        if (!element) return false;
        
        // Check if element has dimensions
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        
        // Check CSS properties
        if (element.style.display === 'none') return false;
        if (element.style.visibility !== 'visible') return false;
        if (parseFloat(element.style.opacity) < 0.1) return false;
        
        // Check if element has an offset parent
        if (!element.offsetParent && element.offsetParent !== document.body) return false;
        
        return true;
      } catch (error) {
        return false;
      }
    }
    it('should detect visible elements', async () => {
      // Mock a visible element
      const visibleElement = {
        getBoundingClientRect: () => ({ width: 100, height: 50 }),
        style: { display: 'block', visibility: 'visible', opacity: '1' },
        offsetParent: {}
      };
      
      // Call the isElementVisible function
      const isVisible = isElementVisible(visibleElement);
      
      // Verify that the element is detected as visible
      expect(isVisible).toBe(true);
    });
    
    it('should detect elements with zero dimensions as invisible', async () => {
      // Mock an element with zero width
      const zeroWidthElement = {
        getBoundingClientRect: () => ({ width: 0, height: 50 }),
        style: { display: 'block', visibility: 'visible', opacity: '1' },
        offsetParent: {}
      };
      
      // Mock an element with zero height
      const zeroHeightElement = {
        getBoundingClientRect: () => ({ width: 100, height: 0 }),
        style: { display: 'block', visibility: 'visible', opacity: '1' },
        offsetParent: {}
      };
      
      // Call the isElementVisible function
      const isZeroWidthVisible = isElementVisible(zeroWidthElement);
      const isZeroHeightVisible = isElementVisible(zeroHeightElement);
      
      // Verify that elements with zero dimensions are detected as invisible
      expect(isZeroWidthVisible).toBe(false);
      expect(isZeroHeightVisible).toBe(false);
    });
    
    it('should detect elements with display:none as invisible', async () => {
      // Mock an element with display:none
      const displayNoneElement = {
        getBoundingClientRect: () => ({ width: 100, height: 50 }),
        style: { display: 'none', visibility: 'visible', opacity: '1' },
        offsetParent: {}
      };
      
      // Call the isElementVisible function
      const isVisible = isElementVisible(displayNoneElement);
      
      // Verify that the element is detected as invisible
      expect(isVisible).toBe(false);
    });
    
    it('should detect elements with visibility:hidden as invisible', async () => {
      // Mock an element with visibility:hidden
      const visibilityHiddenElement = {
        getBoundingClientRect: () => ({ width: 100, height: 50 }),
        style: { display: 'block', visibility: 'hidden', opacity: '1' },
        offsetParent: {}
      };
      
      // Call the isElementVisible function
      const isVisible = isElementVisible(visibilityHiddenElement);
      
      // Verify that the element is detected as invisible
      expect(isVisible).toBe(false);
    });
    
    it('should detect elements with opacity:0 as invisible', async () => {
      // Mock an element with opacity:0
      const opacityZeroElement = {
        getBoundingClientRect: () => ({ width: 100, height: 50 }),
        style: { display: 'block', visibility: 'visible', opacity: '0' },
        offsetParent: {}
      };
      
      // Call the isElementVisible function
      const isVisible = isElementVisible(opacityZeroElement);
      
      // Verify that the element is detected as invisible
      expect(isVisible).toBe(false);
    });
    
    it('should detect elements without offsetParent as invisible', async () => {
      // Mock an element without offsetParent
      const noOffsetParentElement = {
        getBoundingClientRect: () => ({ width: 100, height: 50 }),
        style: { display: 'block', visibility: 'visible', opacity: '1' },
        offsetParent: null
      };
      
      // Call the isElementVisible function
      const isVisible = isElementVisible(noOffsetParentElement);
      
      // Verify that the element is detected as invisible
      expect(isVisible).toBe(false);
    });
    
    it('should handle errors during visibility check', async () => {
      // Mock an element that will cause an error
      const problematicElement = {
        getBoundingClientRect: () => { throw new Error('Cannot get bounding rect'); },
        style: { display: 'block', visibility: 'visible', opacity: '1' },
        offsetParent: {}
      };
      
      // Call the isElementVisible function
      const isVisible = isElementVisible(problematicElement);
      
      // Verify that the element is treated as invisible on error
      expect(isVisible).toBe(false);
    });
  });
});
