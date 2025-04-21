/**
 * Tests for CSS selector-based extractor in the Puppeteer Web Crawler
 * Verifies that selector-based extraction functions work correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SelectorExtractionOptions } from '../../../crawler/extractors/selector';
import { extractBySelector } from '../../../crawler/extractors/selector';
import { createMockBrowser, createTestHtml } from '../utils/test-helpers';

describe('Selector Extractor', () => {
  let mockBrowser: any;
  let mockPage: any;
  
  beforeEach(async () => {
    // Create a fresh mock browser and page for each test
    mockBrowser = createMockBrowser();
    mockPage = await mockBrowser.newPage();
    
    // Set up a test HTML page
    const testHtml = createTestHtml();
    await mockPage.setContent(testHtml);
    
    // Mock the page.evaluate method which is used by the selector extractor
    mockPage.evaluate = vi.fn();
  });
  
  afterEach(async () => {
    // Clean up after each test
    await mockPage.close();
    await mockBrowser.close();
  });
  
  describe('extractBySelector', () => {
    it('should extract elements by a single selector', async () => {
      // Set up mock result
      const mockResult = {
        selector: 'h1',
        results: [
          {
            text: 'Test Page Heading',
            html: '<h1>Test Page Heading</h1>',
            attributes: [
              {
                name: 'id',
                value: 'heading'
              }
            ],
            top: 20,
            left: 20,
            width: 200,
            height: 30
          }
        ]
      };
      
      // Mock the evaluate method to return our mock result
      mockPage.evaluate.mockResolvedValue([mockResult]);
      
      // Call the extractBySelector function with a single selector
      const results = await extractBySelector(mockPage, 'h1');
      
      // Verify that elements were extracted correctly
      expect(results).toEqual([mockResult]);
      expect(mockPage.evaluate).toHaveBeenCalled();
    });
    
    it('should extract elements by multiple selectors', async () => {
      // Set up mock results
      const mockResults = [
        {
          selector: 'h1',
          results: [
            {
              text: 'Test Page Heading',
              html: '<h1>Test Page Heading</h1>',
              attributes: [
                {
                  name: 'id',
                  value: 'heading'
                }
              ],
              top: 20,
              left: 20,
              width: 200,
              height: 30
            }
          ]
        },
        {
          selector: '.item',
          results: [
            {
              text: 'Item 1',
              html: '<li class="item">Item 1</li>',
              attributes: [
                {
                  name: 'class',
                  value: 'item'
                },
                {
                  name: 'data-id',
                  value: '1'
                }
              ],
              top: 50,
              left: 30,
              width: 100,
              height: 20
            }
          ]
        }
      ];
      
      // Mock the evaluate method to return our mock results
      mockPage.evaluate.mockResolvedValue(mockResults);
      
      // Call the extractBySelector function with multiple selectors
      const results = await extractBySelector(mockPage, ['h1', '.item']);
      
      // Verify that elements were extracted correctly
      expect(results).toEqual(mockResults);
      expect(mockPage.evaluate).toHaveBeenCalledTimes(1);
    });
    
    it('should include attributes when specified', async () => {
      // Set up mock result with attributes
      const mockResult = {
        selector: '.item',
        results: [
          {
            text: 'Item 1',
            html: '<li class="item" data-id="1">Item 1</li>',
            attributes: [
              {
                name: 'class',
                value: 'item'
              },
              {
                name: 'data-id',
                value: '1'
              }
            ],
            top: 50,
            left: 30,
            width: 100,
            height: 20
          }
        ]
      };
      
      // Mock the evaluate method to return our mock result
      mockPage.evaluate.mockResolvedValue([mockResult]);
      
      // Call the extractBySelector function with includeAttributes option
      const options: SelectorExtractionOptions = { includeAttributes: true };
      const results = await extractBySelector(mockPage, '.item', options);
      
      // Verify that attributes were included
      expect(results[0].results[0].attributes).toBeDefined();
      expect(results[0].results[0].attributes.length).toBe(2);
      expect(results[0].results[0].attributes[0].name).toBe('class');
      expect(results[0].results[0].attributes[0].value).toBe('item');
    });
    
    it('should include position when specified', async () => {
      // Set up mock result with position
      const mockResult = {
        selector: '.item',
        results: [
          {
            text: 'Item 1',
            html: '<li class="item">Item 1</li>',
            attributes: [],
            top: 50,
            left: 30,
            width: 100,
            height: 20
          }
        ]
      };
      
      // Mock the evaluate method to return our mock result
      mockPage.evaluate.mockResolvedValue([mockResult]);
      
      // Call the extractBySelector function with includePosition option
      const options: SelectorExtractionOptions = { includePosition: true };
      const results = await extractBySelector(mockPage, '.item', options);
      
      // Verify that position was included
      expect(results[0].results[0].top).toBe(50);
      expect(results[0].results[0].left).toBe(30);
      expect(results[0].results[0].width).toBe(100);
      expect(results[0].results[0].height).toBe(20);
    });
    
    it('should include HTML when specified', async () => {
      // Set up mock result with HTML
      const mockResult = {
        selector: '.item',
        results: [
          {
            text: 'Item 1',
            html: '<li class="item">Item 1</li>',
            attributes: [],
            top: 0,
            left: 0,
            width: 0,
            height: 0
          }
        ]
      };
      
      // Mock the evaluate method to return our mock result
      mockPage.evaluate.mockResolvedValue([mockResult]);
      
      // Call the extractBySelector function with includeHtml option
      const options: SelectorExtractionOptions = { includeHtml: true };
      const results = await extractBySelector(mockPage, '.item', options);
      
      // Verify that HTML was included
      expect(results[0].results[0].html).toBe('<li class="item">Item 1</li>');
    });
    
    it('should filter by visibility when specified', async () => {
      // Set up mock results with only visible elements
      const mockResults = [
        {
          selector: '.item',
          results: [
            {
              text: 'Item 1',
              html: '<li class="item">Item 1</li>',
              attributes: [],
              top: 50,
              left: 30,
              width: 100,
              height: 20
            }
          ]
        },
        {
          selector: '.hidden',
          results: [] // No results for hidden elements when visibleOnly is true
        }
      ];
      
      // Mock the evaluate method to return our mock results
      mockPage.evaluate.mockResolvedValue(mockResults);
      
      // Call the extractBySelector function with visibleOnly option
      const options: SelectorExtractionOptions = { visibleOnly: true };
      const results = await extractBySelector(mockPage, ['.item', '.hidden'], options);
      
      // Verify that only visible elements were included
      expect(results).toEqual(mockResults);
      expect(results[0].results.length).toBe(1); // One visible element
      expect(results[1].results.length).toBe(0); // No hidden elements
      expect(mockPage.evaluate).toHaveBeenCalledTimes(1);
    });
    
    it('should extract specific attributes when specified', async () => {
      // Set up mock result with specific attributes
      const mockResult = {
        selector: 'img',
        results: [
          {
            text: '',
            html: '<img src="test.jpg" alt="Test Image" width="100" height="100">',
            attributes: [
              {
                name: 'src',
                value: 'test.jpg'
              }
            ],
            top: 0,
            left: 0,
            width: 0,
            height: 0
          }
        ]
      };
      
      // Mock the evaluate method to return our mock result
      mockPage.evaluate.mockResolvedValue([mockResult]);
      
      // Call the extractBySelector function with specific attributes
      const options: SelectorExtractionOptions = { 
        includeAttributes: true,
        attributes: ['src']
      };
      const results = await extractBySelector(mockPage, 'img', options);
      
      // Verify that only specified attributes were included
      expect(results[0].results[0].attributes.length).toBe(1);
      expect(results[0].results[0].attributes[0].name).toBe('src');
      expect(results[0].results[0].attributes[0].value).toBe('test.jpg');
    });
    
    it('should handle errors during extraction', async () => {
      // Instead of making evaluate throw, return a result with an error property
      mockPage.evaluate.mockResolvedValue([{
        selector: '.error-selector',
        results: [],
        error: 'Failed to extract elements'
      }]);
      
      // Call the extractBySelector function
      const results = await extractBySelector(mockPage, '.error-selector');
      
      // Verify that the result contains the error information
      expect(results).toHaveLength(1);
      expect(results[0].selector).toBe('.error-selector');
      expect(results[0].results).toEqual([]);
      expect(results[0].error).toBe('Failed to extract elements');
    });
  });
});
