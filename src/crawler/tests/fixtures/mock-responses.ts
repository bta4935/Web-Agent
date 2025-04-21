/**
 * Mock HTTP responses for testing API handlers
 * Provides standardized response objects for different scenarios
 */

import { CrawlerResponse, ElementExtractionResult } from '../../types';
import fs from 'fs';
import path from 'path';

// Load HTML fixtures
const TEST_PAGE_PATH = path.join(__dirname, 'test-page.html');
const COMPLEX_PAGE_PATH = path.join(__dirname, 'complex-page.html');

// Cache the HTML content to avoid repeated file reads
let testPageHtml: string | null = null;
let complexPageHtml: string | null = null;

/**
 * Gets the HTML content from the test-page.html fixture
 * @returns The HTML content as a string
 */
export function getTestPageHtml(): string {
  if (!testPageHtml) {
    try {
      testPageHtml = fs.readFileSync(TEST_PAGE_PATH, 'utf-8');
    } catch (error) {
      console.error('Error loading test-page.html:', error);
      testPageHtml = '<html><body><h1>Test Page (Fallback)</h1></body></html>';
    }
  }
  return testPageHtml;
}

/**
 * Gets the HTML content from the complex-page.html fixture
 * @returns The HTML content as a string
 */
export function getComplexPageHtml(): string {
  if (!complexPageHtml) {
    try {
      complexPageHtml = fs.readFileSync(COMPLEX_PAGE_PATH, 'utf-8');
    } catch (error) {
      console.error('Error loading complex-page.html:', error);
      complexPageHtml = '<html><body><h1>Complex Page (Fallback)</h1></body></html>';
    }
  }
  return complexPageHtml;
}

/**
 * Creates a mock HTML response
 * @param url - URL that was crawled
 * @param options - Response options
 * @returns Mock HTML response
 */
export function createMockHtmlResponse(
  url: string = 'https://example.com',
  options: {
    status?: number;
    html?: string;
    error?: string;
    includeMetadata?: boolean;
    useFixture?: 'test' | 'complex' | 'none';
  } = {}
): CrawlerResponse {
  let defaultHtml = '<html><body><h1>Test Page</h1></body></html>';
  const { status = 200, error, includeMetadata = false, useFixture = 'none' } = options;
  
  // Use HTML from fixture if specified
  if (useFixture === 'test') {
    defaultHtml = getTestPageHtml();
  } else if (useFixture === 'complex') {
    defaultHtml = getComplexPageHtml();
  }
  
  const html = options.html || defaultHtml;
  
  const response: CrawlerResponse = {
    url,
    status,
    timestamp: Date.now(),
    html
  };
  
  if (error) {
    response.error = error;
  }
  
  if (includeMetadata) {
    if (useFixture === 'complex') {
      response.metadata = {
        title: 'Complex Crawler Test Page',
        description: 'Complex test page for advanced crawler testing',
        'og:title': 'Complex Crawler Test Page',
        'og:description': 'A page with complex structures for testing advanced extraction',
        'og:image': 'https://example.com/image.jpg'
      };
    } else {
      response.metadata = {
        title: 'Test Page',
        description: 'A test page for crawler testing',
        'og:title': 'Test Page for Social Media',
        'og:description': 'This is how the page appears on social media'
      };
    }
  }
  
  return response;
}

/**
 * Creates a mock text response
 * @param url - URL that was crawled
 * @param options - Response options
 * @returns Mock text response
 */
export function createMockTextResponse(
  url: string = 'https://example.com',
  options: {
    status?: number;
    text?: string;
    error?: string;
  } = {}
): CrawlerResponse {
  const { status = 200, text = 'Test Page\n\nThis is test content.', error } = options;
  
  const response: CrawlerResponse = {
    url,
    status,
    timestamp: Date.now(),
    text
  };
  
  if (error) {
    response.error = error;
  }
  
  return response;
}

/**
 * Creates a mock selector response
 * @param url - URL that was crawled
 * @param options - Response options
 * @returns Mock selector response
 */
export function createMockSelectorResponse(
  url: string = 'https://example.com',
  options: {
    status?: number;
    elements?: ElementExtractionResult[];
    error?: string;
    fixture?: 'test' | 'complex';
  } = {}
): CrawlerResponse {
  const { status = 200, error, fixture = 'test' } = options;
  
  // Different default elements based on the fixture type
  const defaultElements: ElementExtractionResult[] = fixture === 'complex' ? [
    {
      selector: 'h1',
      results: [
        {
          text: 'Complex Crawler Test Page',
          html: '<h1>Complex Crawler Test Page</h1>',
          attributes: [],
          top: 10,
          left: 10,
          width: 300,
          height: 40
        }
      ]
    },
    {
      selector: 'article[data-importance="high"]',
      results: [
        {
          text: 'Featured Article This is a semantically structured article with high importance.',
          html: '<article class="card" data-importance="high" data-custom="featured-article">\n          <h3>Featured Article</h3>\n          <p>This is a semantically structured article with high importance.</p>\n          <!-- More content -->\n        </article>',
          attributes: [
            { name: 'class', value: 'card' },
            { name: 'data-importance', value: 'high' },
            { name: 'data-custom', value: 'featured-article' }
          ],
          top: 150,
          left: 20,
          width: 500,
          height: 300
        }
      ]
    },
    {
      selector: '#dynamic-content',
      results: [
        {
          text: 'This content was added by JavaScript',
          html: '<div id="dynamic-content">This content was added by JavaScript</div>',
          attributes: [
            { name: 'id', value: 'dynamic-content' }
          ],
          top: 400,
          left: 20,
          width: 300,
          height: 30
        }
      ]
    }
  ] : [
    {
      selector: 'h1',
      results: [
        {
          text: 'Heading 1',
          html: '<h1>Heading 1</h1>',
          attributes: [
            { name: 'id', value: 'heading1' },
            { name: 'class', value: 'main-heading' }
          ],
          top: 10,
          left: 10,
          width: 200,
          height: 30
        }
      ]
    },
    {
      selector: 'p',
      results: [
        {
          text: 'Paragraph 1',
          html: '<p>Paragraph 1</p>',
          attributes: [
            { name: 'id', value: 'para1' },
            { name: 'class', value: 'content' }
          ],
          top: 50,
          left: 10,
          width: 400,
          height: 60
        }
      ]
    }
  ];
  
  const response: CrawlerResponse = {
    url,
    status,
    timestamp: Date.now(),
    elements: options.elements || defaultElements
  };
  
  if (error) {
    response.error = error;
  }
  
  return response;
}

/**
 * Creates a mock JavaScript execution response
 * @param url - URL that was crawled
 * @param options - Response options
 * @returns Mock JavaScript execution response
 */
export function createMockJsResponse(
  url: string = 'https://example.com',
  options: {
    status?: number;
    html?: string;
    text?: string;
    elements?: ElementExtractionResult[];
    error?: string;
    fixture?: 'test' | 'complex';
  } = {}
): CrawlerResponse {
  const { 
    status = 200,
    fixture = 'test',
    error 
  } = options;
  
  // Default values based on fixture type
  let defaultHtml, defaultText;
  
  if (fixture === 'complex') {
    defaultHtml = getComplexPageHtml().replace('This will be replaced by JavaScript', 'This content was added by JavaScript');
    defaultText = 'Complex Crawler Test Page This page contains complex HTML structures and JavaScript interactions for testing advanced extraction capabilities. This content was added by JavaScript';
  } else {
    defaultHtml = '<html><body><h1>Dynamic Content</h1></body></html>';
    defaultText = 'Dynamic Content';
  }
  
  const html = options.html || defaultHtml;
  const text = options.text || defaultText;
  
  const elements = options.elements;
  
  const response: CrawlerResponse = {
    url,
    status,
    timestamp: Date.now(),
    html,
    text
  };
  
  if (elements) {
    response.elements = elements;
  }
  
  if (error) {
    response.error = error;
  }
  
  return response;
}

/**
 * Creates a mock custom JavaScript execution response
 * @param url - URL that was crawled
 * @param options - Response options
 * @returns Mock custom JavaScript execution response
 */
export function createMockCustomJsResponse(
  url: string = 'https://example.com',
  options: {
    status?: number;
    result?: any;
    error?: string;
    fixture?: 'test' | 'complex';
  } = {}
): CrawlerResponse & { result?: any } {
  const { status = 200, error, fixture = 'test' } = options;
  
  // Default result based on fixture type
  let defaultResult;
  
  if (fixture === 'complex') {
    defaultResult = {
      pageInfo: {
        title: 'Complex Crawler Test Page',
        url: url,
        metadata: {
          description: 'Complex test page for advanced crawler testing',
          keywords: 'testing, crawler, complex, extraction'
        }
      },
      visibleText: [
        'Complex Crawler Test Page',
        'This page contains complex HTML structures and JavaScript interactions for testing advanced extraction capabilities.',
        'Semantic HTML Structures',
        'Featured Article',
        'This is a semantically structured article with high importance.'
      ],
      customElements: {
        cards: [
          {
            title: 'Featured Article',
            content: 'This is a semantically structured article with high importance.',
            importance: 'high'
          },
          {
            title: 'Structured Content 1',
            content: 'This is a medium importance article in a grid layout.',
            importance: 'medium'
          }
        ],
        dataAttributes: [
          {
            element: 'article',
            value: 'featured-article',
            text: 'Featured Article This is a semantically structured article with high importance.'
          },
          {
            element: 'div',
            value: 'level-1',
            text: 'Level 1 content'
          }
        ]
      }
    };
  } else {
    defaultResult = { success: true, data: 'Custom result' };
  }
  
  const result = options.result || defaultResult;
  
  const response: CrawlerResponse & { result?: any } = {
    url,
    status,
    timestamp: Date.now(),
    result
  };
  
  if (error) {
    response.error = error;
  }
  
  return response;
}

/**
 * Creates a mock error response
 * @param url - URL that was crawled
 * @param options - Response options
 * @returns Mock error response
 */
export function createMockErrorResponse(
  url: string = 'https://example.com',
  options: {
    status?: number;
    error?: string;
  } = {}
): CrawlerResponse {
  const { status = 500, error = 'An error occurred during crawling' } = options;
  
  return {
    url,
    status,
    timestamp: Date.now(),
    error
  };
}
