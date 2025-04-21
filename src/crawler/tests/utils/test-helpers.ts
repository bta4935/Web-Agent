/**
 * Test utilities for the Puppeteer Web Crawler
 * Provides mock objects and helper functions for testing
 */

import { CrawlerOptions, ElementExtractionResult } from '../../types';

/**
 * Mock Browser class for testing
 * Simulates a Puppeteer Browser instance
 */
export class MockBrowser {
  private pages: MockPage[] = [];
  
  /**
   * Creates a new page in the browser
   * @returns A new MockPage instance
   */
  async newPage(): Promise<MockPage> {
    const page = new MockPage(this);
    this.pages.push(page);
    return page;
  }
  
  /**
   * Closes the browser
   */
  async close(): Promise<void> {
    // Clean up any resources
    this.pages = [];
  }
  
  /**
   * Gets all pages in the browser
   * @returns Array of MockPage instances
   */
  getPages(): MockPage[] {
    return this.pages;
  }
}

/**
 * Mock Page class for testing
 * Simulates a Puppeteer Page instance
 */
export class MockPage {
  private browser: MockBrowser;
  private currentUrl: string = '';
  private pageContent: string = '';
  private requestInterception: boolean = false;
  private viewport: { width: number; height: number } = { width: 1280, height: 800 };
  private listeners: Record<string, Function[]> = {
    request: [],
    response: [],
    console: [],
    error: []
  };
  private cookies: any[] = [];
  private waitForSelectorCalls: string[] = [];
  private evaluateCalls: { fn: Function | string; args: any[] }[] = [];
  private defaultTimeout: number = 30000;
  private userAgent: string = '';
  
  /**
   * Creates a new MockPage
   * @param browser - The parent MockBrowser
   */
  constructor(browser: MockBrowser) {
    this.browser = browser;
  }
  
  /**
   * Navigates to a URL
   * @param url - The URL to navigate to
   * @param options - Navigation options
   * @returns Promise that resolves when navigation is complete
   */
  async goto(url: string, options: any = {}): Promise<any> {
    this.currentUrl = url;
    
    // Simulate navigation delay
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return { status: 200 };
  }
  
  /**
   * Sets the content of the page
   * @param html - HTML content to set
   */
  async setContent(html: string): Promise<void> {
    this.pageContent = html;
  }
  
  /**
   * Gets the content of the page
   * @returns HTML content of the page
   */
  async getContent(): Promise<string> {
    return this.pageContent;
  }
  
  /**
   * Sets request interception
   * @param value - Whether to enable request interception
   */
  async setRequestInterception(value: boolean): Promise<void> {
    this.requestInterception = value;
  }
  
  /**
   * Sets the viewport of the page
   * @param viewport - Viewport dimensions
   */
  async setViewport(viewport: { width: number; height: number }): Promise<void> {
    this.viewport = viewport;
  }
  
  /**
   * Sets the default timeout
   * @param timeout - Timeout in milliseconds
   */
  setDefaultTimeout(timeout: number): void {
    this.defaultTimeout = timeout;
  }
  
  /**
   * Sets the user agent
   * @param userAgent - User agent string
   */
  async setUserAgent(userAgent: string): Promise<void> {
    this.userAgent = userAgent;
  }
  
  /**
   * Gets the page title
   * @returns Page title
   */
  title(): Promise<string> {
    return Promise.resolve('Test Page');
  }
  
  /**
   * Adds an event listener
   * @param event - Event name
   * @param handler - Event handler
   */
  on(event: string, handler: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  }
  
  /**
   * Removes an event listener
   * @param event - Event name
   * @param handler - Event handler
   */
  off(event: string, handler: Function): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(h => h !== handler);
    }
  }
  
  /**
   * Triggers an event
   * @param event - Event name
   * @param args - Event arguments
   */
  triggerEvent(event: string, ...args: any[]): void {
    if (this.listeners[event]) {
      for (const handler of this.listeners[event]) {
        handler(...args);
      }
    }
  }
  
  /**
   * Waits for a selector to appear
   * @param selector - CSS selector
   * @param options - Wait options
   */
  async waitForSelector(selector: string, options: any = {}): Promise<any> {
    this.waitForSelectorCalls.push(selector);
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return { 
      // Mock element handle
      $eval: async (selector: string, fn: Function) => fn({ textContent: 'Mock Element' })
    };
  }
  
  /**
   * Waits for a specified amount of time
   * @param ms - Time to wait in milliseconds
   */
  async waitForTimeout(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, Math.min(ms, 10)));
  }
  
  /**
   * Waits for network to be idle
   * @param options - Wait options
   */
  async waitForNetworkIdle(options: any = {}): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  /**
   * Evaluates a function in the page context
   * @param fn - Function to evaluate
   * @param args - Arguments to pass to the function
   * @returns Result of the function
   */
  async evaluate(fn: Function | string, ...args: any[]): Promise<any> {
    this.evaluateCalls.push({ fn, args });
    
    // If fn is a string, convert it to a function
    if (typeof fn === 'string') {
      try {
        // This is just for testing - in real code we'd need to be more careful
        const evalFn = new Function('return ' + fn)();
        return evalFn(...args);
      } catch (e) {
        console.error('Error evaluating function string:', e);
        return null;
      }
    }
    
    // If fn is a function, call it with the args
    return fn(...args);
  }
  
  /**
   * Gets the URL of the page
   * @returns Current URL
   */
  getUrl(): string {
    return this.currentUrl;
  }
  
  /**
   * Gets all evaluate calls made on the page
   * @returns Array of evaluate calls
   */
  getEvaluateCalls(): { fn: Function | string; args: any[] }[] {
    return this.evaluateCalls;
  }
  
  /**
   * Gets all waitForSelector calls made on the page
   * @returns Array of selectors
   */
  getWaitForSelectorCalls(): string[] {
    return this.waitForSelectorCalls;
  }
  
  /**
   * Closes the page
   */
  async close(): Promise<void> {
    // Clean up any resources
  }
}

/**
 * Creates a mock browser for testing
 * @returns A new MockBrowser instance
 */
export function createMockBrowser(): MockBrowser {
  return new MockBrowser();
}

/**
 * Creates default crawler options for testing
 * @param overrides - Option overrides
 * @returns Crawler options
 */
export function createTestCrawlerOptions(overrides: Partial<CrawlerOptions> = {}): CrawlerOptions {
  return {
    timeout: 30000,
    waitUntil: 'networkidle0',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    blockImages: true,
    blockFonts: true,
    blockCSS: false,
    ...overrides
  };
}

/**
 * Creates a mock HTML page for testing
 * @returns HTML content
 */
export function createTestHtml(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Test Page</title>
        <meta name="description" content="A test page for crawler testing">
        <style>
          .hidden { display: none; }
          .visible { display: block; }
        </style>
        <script>
          function testFunction() {
            document.getElementById('dynamic').textContent = 'Dynamic Content';
          }
        </script>
      </head>
      <body>
        <h1>Test Page Heading</h1>
        <p class="visible">This is a visible paragraph.</p>
        <p class="hidden">This is a hidden paragraph.</p>
        <div id="container">
          <ul>
            <li class="item">Item 1</li>
            <li class="item">Item 2</li>
            <li class="item">Item 3</li>
          </ul>
        </div>
        <div id="dynamic">This will be changed by JavaScript</div>
        <img src="test.jpg" alt="Test Image">
      </body>
    </html>
  `;
}

/**
 * Creates a mock element extraction result for testing
 * @param overrides - Property overrides
 * @returns Element extraction result
 */
export function createMockElementResult(
  overrides: Partial<ElementExtractionResult> = {}
): ElementExtractionResult {
  return {
    selector: '.test-selector',
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
    ],
    ...overrides
  };
}

/**
 * Creates a mock HTTP request for testing
 * @param url - Request URL
 * @param method - HTTP method
 * @param headers - Request headers
 * @param params - URL parameters
 * @returns Mock request object
 */
export function createMockRequest(
  url: string,
  method: string = 'GET',
  headers: Record<string, string> = {},
  params: Record<string, string> = {}
): Request {
  // Build URL with parameters
  const urlObj = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    urlObj.searchParams.append(key, value);
  }
  
  // Create request init
  const init: RequestInit = {
    method,
    headers
  };
  
  // Create request
  return new Request(urlObj.toString(), init);
}

/**
 * Creates a mock environment object for testing
 * @returns Mock environment object
 */
export function createMockEnv(): { BROWSER: MockBrowser } {
  return {
    BROWSER: createMockBrowser()
  };
}

/**
 * Waits for a specified amount of time
 * @param ms - Time to wait in milliseconds
 * @returns Promise that resolves after the specified time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Asserts that two objects are deeply equal
 * @param actual - Actual value
 * @param expected - Expected value
 * @throws Error if objects are not equal
 */
export function assertDeepEqual(actual: any, expected: any): void {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  
  if (actualStr !== expectedStr) {
    throw new Error(`
      Objects are not equal:
      Actual: ${actualStr}
      Expected: ${expectedStr}
    `);
  }
}
