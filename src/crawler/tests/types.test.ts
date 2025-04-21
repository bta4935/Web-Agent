/**
 * Tests for type definitions in the Puppeteer Web Crawler
 * Verifies that interfaces are correctly defined and compatible
 */

import { describe, it, expect } from 'vitest';

import {
  Env,
  CrawlerOptions,
  ExtractionOptions,
  CrawlerResponse,
  ElementExtractionResult
} from '../types';
import { createTestCrawlerOptions, createMockElementResult } from './utils/test-helpers';
import { TextExtractionOptions } from '../extractors/text';
import { SelectorExtractionOptions } from '../extractors/selector';
import { JsExtractionOptions } from '../extractors/js';

/**
 * Type compatibility test suite
 * 
 * These tests verify that our type definitions are correctly structured
 * and that objects conforming to these types can be created and used.
 * 
 * Note: These are not runtime tests, but compile-time type checks.
 * If the TypeScript compiler accepts these tests, the types are valid.
 */
describe('Type Definitions', () => {
  /**
   * Test CrawlerOptions interface
   */
  describe('CrawlerOptions', () => {
    it('should allow creating valid crawler options', () => {
      // Test with minimal options
      const minimalOptions: CrawlerOptions = {};
      
      // Test with all options specified
      const fullOptions: CrawlerOptions = {
        timeout: 30000,
        waitUntil: 'networkidle0',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
        viewport: { width: 1280, height: 800 },
        blockImages: true,
        blockFonts: true,
        blockCSS: false
      };
      
      // Test helper function
      const testOptions = createTestCrawlerOptions({
        timeout: 60000,
        blockImages: false
      });
      
      // Type assertion (no runtime effect, just for type checking)
      expect(typeof minimalOptions).toBe('object');
      expect(typeof fullOptions).toBe('object');
      expect(typeof testOptions).toBe('object');
      
      // Verify option values
      expect(testOptions.timeout).toBe(60000);
      expect(testOptions.blockImages).toBe(false);
    });
    
    it('should enforce correct waitUntil values', () => {
      // Valid values
      const options1: CrawlerOptions = { waitUntil: 'load' };
      const options2: CrawlerOptions = { waitUntil: 'domcontentloaded' };
      const options3: CrawlerOptions = { waitUntil: 'networkidle0' };
      const options4: CrawlerOptions = { waitUntil: 'networkidle2' };
      
      // TypeScript would catch this at compile time if we tried:
      // const invalidOptions: CrawlerOptions = { waitUntil: 'invalid' };
      
      expect(options1.waitUntil).toBe('load');
      expect(options2.waitUntil).toBe('domcontentloaded');
      expect(options3.waitUntil).toBe('networkidle0');
      expect(options4.waitUntil).toBe('networkidle2');
    });
  });
  
  /**
   * Test ExtractionOptions interface
   */
  describe('ExtractionOptions', () => {
    it('should allow creating valid extraction options', () => {
      // Test with minimal options
      const minimalOptions: ExtractionOptions = {};
      
      // Test with all options specified
      const fullOptions: ExtractionOptions = {
        removeScripts: true,
        removeStyles: true,
        includeMetadata: true
      };
      
      expect(typeof minimalOptions).toBe('object');
      expect(typeof fullOptions).toBe('object');
    });
  });
  
  /**
   * Test TextExtractionOptions interface
   */
  describe('TextExtractionOptions', () => {
    it('should allow creating valid text extraction options', () => {
      // Test with minimal options
      const minimalOptions: TextExtractionOptions = {};
      
      // Test with all options specified
      const fullOptions: TextExtractionOptions = {
        preserveWhitespace: true,
        includeImageAlt: true,
        minTextLength: 10
      };
      
      // Note: TextExtractionOptions does not extend ExtractionOptions
      // These would be passed separately to extraction methods
      
      expect(typeof minimalOptions).toBe('object');
      expect(typeof fullOptions).toBe('object');
      expect(fullOptions.minTextLength).toBe(10);
    });
  });
  
  /**
   * Test SelectorExtractionOptions interface
   */
  describe('SelectorExtractionOptions', () => {
    it('should allow creating valid selector extraction options', () => {
      // Test with minimal options
      const minimalOptions: SelectorExtractionOptions = {};
      
      // Test with all options specified
      const fullOptions: SelectorExtractionOptions = {
        includeAttributes: true,
        includePosition: true,
        includeHtml: true,
        attributes: ['id', 'class', 'href'],
        visibleOnly: true
      };
      
      // Note: SelectorExtractionOptions does not extend ExtractionOptions
      // These would be passed separately to extraction methods
      
      expect(typeof minimalOptions).toBe('object');
      expect(typeof fullOptions).toBe('object');
      expect(Array.isArray(fullOptions.attributes)).toBe(true);
    });
  });
  
  /**
   * Test JsExtractionOptions interface
   */
  describe('JsExtractionOptions', () => {
    it('should allow creating valid JavaScript extraction options', () => {
      // Test with minimal options
      const minimalOptions: JsExtractionOptions = {};
      
      // Test with all options specified
      const fullOptions: JsExtractionOptions = {
        waitTime: 2000,
        waitUntil: 'networkidle0',
        customScript: 'document.querySelector("h1").textContent = "Modified";',
        waitForNetworkIdle: true,
        networkIdleTime: 500,
        waitForSelector: '#content',
        selectorTimeout: 5000,
        removeScripts: true,
        removeStyles: true
      };
      
      // Note: JsExtractionOptions does not include includeMetadata
      
      expect(typeof minimalOptions).toBe('object');
      expect(typeof fullOptions).toBe('object');
      expect(typeof fullOptions.customScript).toBe('string');
    });
  });
  
  /**
   * Test CrawlerResponse interface
   */
  describe('CrawlerResponse', () => {
    it('should allow creating valid crawler responses', () => {
      // Test minimal response
      const minimalResponse: CrawlerResponse = {
        url: 'https://example.com',
        status: 200,
        timestamp: Date.now()
      };
      
      // Test HTML response
      const htmlResponse: CrawlerResponse = {
        url: 'https://example.com',
        status: 200,
        timestamp: Date.now(),
        html: '<html><body><h1>Test</h1></body></html>'
      };
      
      // Test text response
      const textResponse: CrawlerResponse = {
        url: 'https://example.com',
        status: 200,
        timestamp: Date.now(),
        text: 'Test content'
      };
      
      // Test error response
      const errorResponse: CrawlerResponse = {
        url: 'https://example.com',
        status: 500,
        timestamp: Date.now(),
        error: 'Failed to load page'
      };
      
      expect(typeof minimalResponse).toBe('object');
      expect(typeof htmlResponse).toBe('object');
      expect(typeof textResponse).toBe('object');
      expect(typeof errorResponse).toBe('object');
    });
    
    it('should allow creating responses with element extraction results', () => {
      // Create mock element result
      const elementResult = createMockElementResult();
      
      // Test response with element results
      const response: CrawlerResponse = {
        url: 'https://example.com',
        status: 200,
        timestamp: Date.now(),
        elements: [elementResult]
      };
      
      expect(typeof response).toBe('object');
      expect(Array.isArray(response.elements)).toBe(true);
    });
    
    it('should allow creating responses with metadata', () => {
      // Test response with metadata
      const response: CrawlerResponse = {
        url: 'https://example.com',
        status: 200,
        timestamp: Date.now(),
        metadata: {
          title: 'Test Page',
          description: 'A test page',
          'og:image': 'https://example.com/image.jpg'
        }
      };
      
      expect(typeof response).toBe('object');
      expect(typeof response.metadata).toBe('object');
      expect(response.metadata?.title).toBe('Test Page');
    });
  });
  
  /**
   * Test ElementExtractionResult interface
   */
  describe('ElementExtractionResult', () => {
    it('should allow creating valid element extraction results', () => {
      // Test with mock element result
      const result = createMockElementResult();
      
      // Create a result manually
      const manualResult: ElementExtractionResult = {
        selector: '.test',
        results: [
          {
            text: 'Test Element',
            html: '<div>Test Element</div>',
            attributes: [
              { name: 'id', value: 'test-id' },
              { name: 'class', value: 'test-class' }
            ],
            top: 100,
            left: 100,
            width: 200,
            height: 50
          }
        ]
      };
      
      expect(typeof result).toBe('object');
      expect(typeof manualResult).toBe('object');
      expect(result.selector).toBe('.test-selector');
      expect(Array.isArray(result.results)).toBe(true);
    });
  });
  
  /**
   * Test Env interface
   */
  describe('Env', () => {
    it('should allow creating valid environment objects', () => {
      // Mock browser object
      const mockBrowser = {};
      
      // Create Env object
      const env: Env = {
        BROWSER: mockBrowser
      };
      
      expect(typeof env).toBe('object');
      expect(env.BROWSER).toBeDefined();
    });
  });
});
