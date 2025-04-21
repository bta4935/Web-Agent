/**
 * API handlers for the Puppeteer Web Crawler
 * Provides HTTP endpoints for different extraction types
 */

import { Crawler } from './crawler';
import { CrawlerOptions, ExtractionOptions } from './types';
import { TextExtractionOptions } from './extractors/text';
import { SelectorExtractionOptions } from './extractors/selector';
import { JsExtractionOptions } from './extractors/js';

/**
 * Request validation error
 */
class ValidationError extends Error {
  status: number;
  
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ValidationError';
    this.status = status;
  }
}

/**
 * Validates that a URL is present and properly formatted
 * 
 * @param url - URL to validate
 * @returns The validated URL
 * @throws ValidationError if URL is invalid
 */
function validateUrl(url?: string): string {
  if (!url) {
    throw new ValidationError('URL is required');
  }
  
  try {
    // Check if URL is valid
    new URL(url);
    return url;
  } catch (error) {
    throw new ValidationError(`Invalid URL: ${url}`);
  }
}

/**
 * Parses crawler options from request
 * 
 * @param request - HTTP request
 * @returns Parsed crawler options
 */
function parseCrawlerOptions(request: Request): CrawlerOptions {
  try {
    const url = new URL(request.url);
    
    // Parse timeout
    const timeout = url.searchParams.get('timeout');
    
    // Parse wait until strategy
    const waitUntil = url.searchParams.get('waitUntil') as 
      'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2' | null;
    
    // Parse viewport dimensions
    const viewportWidth = url.searchParams.get('viewportWidth');
    const viewportHeight = url.searchParams.get('viewportHeight');
    
    // Parse resource blocking options
    const blockImages = url.searchParams.get('blockImages');
    const blockFonts = url.searchParams.get('blockFonts');
    const blockCSS = url.searchParams.get('blockCSS');
    
    // Parse user agent
    const userAgent = url.searchParams.get('userAgent');
    
    // Build options object
    const options: CrawlerOptions = {};
    
    if (timeout) options.timeout = parseInt(timeout, 10);
    if (waitUntil) options.waitUntil = waitUntil;
    if (userAgent) options.userAgent = userAgent;
    
    if (viewportWidth && viewportHeight) {
      options.viewport = {
        width: parseInt(viewportWidth, 10),
        height: parseInt(viewportHeight, 10)
      };
    }
    
    if (blockImages !== null) options.blockImages = blockImages === 'true';
    if (blockFonts !== null) options.blockFonts = blockFonts === 'true';
    if (blockCSS !== null) options.blockCSS = blockCSS === 'true';
    
    return options;
  } catch (error) {
    throw new ValidationError('Invalid crawler options');
  }
}

/**
 * Parses extraction options from request
 * 
 * @param request - HTTP request
 * @returns Parsed extraction options
 */
function parseExtractionOptions(request: Request): ExtractionOptions {
  try {
    const url = new URL(request.url);
    
    // Parse basic extraction options
    const removeScripts = url.searchParams.get('removeScripts');
    const removeStyles = url.searchParams.get('removeStyles');
    const includeMetadata = url.searchParams.get('includeMetadata');
    
    // Build options object
    const options: ExtractionOptions = {};
    
    if (removeScripts !== null) options.removeScripts = removeScripts === 'true';
    if (removeStyles !== null) options.removeStyles = removeStyles === 'true';
    if (includeMetadata !== null) options.includeMetadata = includeMetadata === 'true';
    
    return options;
  } catch (error) {
    throw new ValidationError('Invalid extraction options');
  }
}

/**
 * Parses text extraction options from request
 * 
 * @param request - HTTP request
 * @returns Parsed text extraction options
 */
function parseTextExtractionOptions(request: Request): TextExtractionOptions {
  try {
    const url = new URL(request.url);
    const options = parseExtractionOptions(request) as TextExtractionOptions;
    
    // Parse text-specific options
    const minTextLength = url.searchParams.get('minTextLength');
    const includeImageAlt = url.searchParams.get('includeImageAlt');
    const preserveWhitespace = url.searchParams.get('preserveWhitespace');
    
    if (minTextLength !== null) options.minTextLength = parseInt(minTextLength, 10);
    if (includeImageAlt !== null) options.includeImageAlt = includeImageAlt === 'true';
    if (preserveWhitespace !== null) options.preserveWhitespace = preserveWhitespace === 'true';
    
    return options;
  } catch (error) {
    throw new ValidationError('Invalid text extraction options');
  }
}

/**
 * Parses selector extraction options from request
 * 
 * @param request - HTTP request
 * @returns Parsed selector extraction options
 */
function parseSelectorExtractionOptions(request: Request): SelectorExtractionOptions {
  try {
    const url = new URL(request.url);
    const options = parseExtractionOptions(request) as SelectorExtractionOptions;
    
    // Parse selector-specific options
    const includeAttributes = url.searchParams.get('includeAttributes');
    const includePosition = url.searchParams.get('includePosition');
    const includeHtml = url.searchParams.get('includeHtml');
    const visibleOnly = url.searchParams.get('visibleOnly');
    
    // Parse attributes as comma-separated list
    const attributes = url.searchParams.get('attributes');
    
    if (includeAttributes !== null) options.includeAttributes = includeAttributes === 'true';
    if (includePosition !== null) options.includePosition = includePosition === 'true';
    if (includeHtml !== null) options.includeHtml = includeHtml === 'true';
    if (visibleOnly !== null) options.visibleOnly = visibleOnly === 'true';
    
    if (attributes) {
      options.attributes = attributes.split(',').map(attr => attr.trim());
    }
    
    return options;
  } catch (error) {
    throw new ValidationError('Invalid selector extraction options');
  }
}

/**
 * Parses JavaScript extraction options from request
 * 
 * @param request - HTTP request
 * @returns Parsed JavaScript extraction options
 */
function parseJsExtractionOptions(request: Request): JsExtractionOptions {
  try {
    const url = new URL(request.url);
    const options = parseExtractionOptions(request) as JsExtractionOptions;
    
    // Parse JS-specific options
    const waitTime = url.searchParams.get('waitTime');
    const waitUntil = url.searchParams.get('waitUntil') as 
      'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2' | null;
    const waitForNetworkIdle = url.searchParams.get('waitForNetworkIdle');
    const networkIdleTime = url.searchParams.get('networkIdleTime');
    const waitForSelector = url.searchParams.get('waitForSelector');
    const selectorTimeout = url.searchParams.get('selectorTimeout');
    
    if (waitTime !== null) options.waitTime = parseInt(waitTime, 10);
    if (waitUntil) options.waitUntil = waitUntil;
    if (waitForNetworkIdle !== null) options.waitForNetworkIdle = waitForNetworkIdle === 'true';
    if (networkIdleTime !== null) options.networkIdleTime = parseInt(networkIdleTime, 10);
    if (waitForSelector) options.waitForSelector = waitForSelector;
    if (selectorTimeout !== null) options.selectorTimeout = parseInt(selectorTimeout, 10);
    
    // Custom script must be passed in the request body
    
    return options;
  } catch (error) {
    throw new ValidationError('Invalid JavaScript extraction options');
  }
}

/**
 * Handles errors in API requests
 * 
 * @param error - Error to handle
 * @returns Response with error details
 */
function handleApiError(error: unknown): Response {
  console.error('API Error:', error);
  
  if (error instanceof ValidationError) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.status, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
  
  return new Response(
    JSON.stringify({ error: 'Internal server error' }),
    { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * API handler for HTML extraction
 * 
 * @param request - HTTP request
 * @param env - Environment variables
 * @returns Response with extracted HTML
 */
export async function handleHtmlExtraction(
  request: Request,
  env: { BROWSER: any }
): Promise<Response> {
  try {
    // Parse target URL from query parameters
    const url = new URL(request.url);
    const targetUrl = validateUrl(url.searchParams.get('url') || '');
    
    // Parse options
    const crawlerOptions = parseCrawlerOptions(request);
    const extractionOptions = parseExtractionOptions(request);
    
    // Create crawler and extract HTML
    const crawler = new Crawler(env.BROWSER, crawlerOptions);
    const result = await crawler.extractHtml(targetUrl, extractionOptions);
    
    // Return the result
    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * API handler for text extraction
 * 
 * @param request - HTTP request
 * @param env - Environment variables
 * @returns Response with extracted text
 */
export async function handleTextExtraction(
  request: Request,
  env: { BROWSER: any }
): Promise<Response> {
  try {
    // Parse target URL from query parameters
    const url = new URL(request.url);
    const targetUrl = validateUrl(url.searchParams.get('url') || '');
    
    // Parse options
    const crawlerOptions = parseCrawlerOptions(request);
    const extractionOptions = parseTextExtractionOptions(request);
    
    // Create crawler and extract text
    const crawler = new Crawler(env.BROWSER, crawlerOptions);
    const result = await crawler.extractText(targetUrl, extractionOptions);
    
    // Return the result
    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * API handler for selector-based extraction
 * 
 * @param request - HTTP request
 * @param env - Environment variables
 * @returns Response with extracted elements
 */
export async function handleSelectorExtraction(
  request: Request,
  env: { BROWSER: any }
): Promise<Response> {
  try {
    // Parse target URL from query parameters
    const url = new URL(request.url);
    const targetUrl = validateUrl(url.searchParams.get('url') || '');
    
    // Parse selectors (required)
    const selectorsParam = url.searchParams.get('selectors');
    if (!selectorsParam) {
      throw new ValidationError('Selectors parameter is required');
    }
    
    // Parse selectors as comma-separated list or JSON array
    let selectors: string | string[];
    try {
      selectors = JSON.parse(selectorsParam);
      if (!Array.isArray(selectors)) {
        selectors = selectorsParam;
      }
    } catch (e) {
      // If not valid JSON, treat as comma-separated list
      selectors = selectorsParam.split(',').map(s => s.trim());
    }
    
    // Parse options
    const crawlerOptions = parseCrawlerOptions(request);
    const extractionOptions = parseSelectorExtractionOptions(request);
    
    // Create crawler and extract elements
    const crawler = new Crawler(env.BROWSER, crawlerOptions);
    const result = await crawler.extractBySelector(targetUrl, selectors, extractionOptions);
    
    // Return the result
    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * API handler for JavaScript-executed extraction
 * 
 * @param request - HTTP request
 * @param env - Environment variables
 * @returns Response with content after JavaScript execution
 */
export async function handleJsExtraction(
  request: Request,
  env: { BROWSER: any }
): Promise<Response> {
  try {
    // Parse target URL from query parameters
    const url = new URL(request.url);
    const targetUrl = validateUrl(url.searchParams.get('url') || '');
    
    // Parse options
    const crawlerOptions = parseCrawlerOptions(request);
    const extractionOptions = parseJsExtractionOptions(request);
    
    // Parse custom script from request body if present
    if (request.method === 'POST') {
      try {
        const body = await request.json() as { customScript?: string };
        if (body && typeof body.customScript === 'string') {
          extractionOptions.customScript = body.customScript;
        }
      } catch (e) {
        // Ignore body parsing errors
      }
    }
    
    // Check if selectors are provided
    const selectorsParam = url.searchParams.get('selectors');
    let selectors: string | string[] | undefined;
    
    if (selectorsParam) {
      try {
        selectors = JSON.parse(selectorsParam);
        if (!Array.isArray(selectors)) {
          selectors = selectorsParam;
        }
      } catch (e) {
        // If not valid JSON, treat as comma-separated list
        selectors = selectorsParam.split(',').map(s => s.trim());
      }
    }
    
    // Create crawler
    const crawler = new Crawler(env.BROWSER, crawlerOptions);
    
    // Extract content with or without selectors
    const result = selectors
      ? await crawler.extractElementsAfterJsExecution(targetUrl, selectors, extractionOptions)
      : await crawler.extractAfterJsExecution(targetUrl, extractionOptions);
    
    // Return the result
    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * API handler for custom JavaScript execution
 * 
 * @param request - HTTP request
 * @param env - Environment variables
 * @returns Response with the result of the custom script
 */
export async function handleCustomJsExecution(
  request: Request,
  env: { BROWSER: any }
): Promise<Response> {
  try {
    // This endpoint requires POST method
    if (request.method !== 'POST') {
      throw new ValidationError('This endpoint requires POST method', 405);
    }
    
    // Parse target URL from query parameters
    const url = new URL(request.url);
    const targetUrl = validateUrl(url.searchParams.get('url') || '');
    
    // Parse options
    const crawlerOptions = parseCrawlerOptions(request);
    
    // Parse custom script from request body (required)
    let scriptFn: string;
    let args: any[] = [];
    
    try {
      const body = await request.json() as { script?: string; args?: any[] };
      if (!body || typeof body.script !== 'string') {
        throw new ValidationError('Script is required in request body');
      }
      
      scriptFn = body.script;
      
      // Parse arguments if provided
      if (Array.isArray(body.args)) {
        args = body.args;
      }
    } catch (e) {
      throw new ValidationError('Invalid request body');
    }
    
    // Create crawler and execute custom script
    const crawler = new Crawler(env.BROWSER, crawlerOptions);
    const result = await crawler.executeCustomFunction(targetUrl, scriptFn, ...args);
    
    // Return the result
    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
