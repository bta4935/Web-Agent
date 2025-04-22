import type { Ai } from '@cloudflare/workers-types';

/**
 * Type definitions for the Puppeteer Web Crawler
 */

/**
 * Browser binding type for Cloudflare Workers
 */
export interface Env {
  BROWSER: any; // Cloudflare Browser binding
  AI: Ai;       // Workers AI binding
}

/**
 * Configuration options for the crawler
 */
export interface CrawlerOptions {
  /** Timeout in milliseconds for page operations */
  timeout?: number;
  /** Strategy to determine when navigation is finished */
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  /** Custom user agent string */
  userAgent?: string;
  /** Browser viewport settings */
  viewport?: {
    width: number;
    height: number;
  };
  /** Whether to block image loading for faster crawling */
  blockImages?: boolean;
  /** Whether to block font loading for faster crawling */
  blockFonts?: boolean;
  /** Whether to block CSS for faster crawling */
  blockCSS?: boolean;
}

/**
 * Options for HTML content extraction
 */
export interface ExtractionOptions {
  /** Whether to include page metadata in the response */
  includeMetadata?: boolean;
  /** Whether to remove script tags from the HTML */
  removeScripts?: boolean;
  /** Whether to remove style tags from the HTML */
  removeStyles?: boolean;
}

/**
 * Response structure for crawler operations
 */
export interface CrawlerResponse {
  /** The URL that was crawled */
  url: string;
  /** HTTP status code */
  status: number;
  /** Full HTML content (if requested) */
  html?: string;
  /** Extracted text content (if requested) */
  text?: string;
  /** Elements extracted by CSS selectors (if requested) */
  elements?: ElementExtractionResult[] | Record<string, string[]>;
  /** Error message if the crawl failed */
  error?: string;
  /** Timestamp of when the crawl was performed */
  timestamp: number;
  /** Optional metadata about the page */
  metadata?: {
    /** Page title */
    title?: string;
    /** Meta description */
    description?: string;
    /** Other meta tags */
    [key: string]: string | undefined;
  };
  /** Generic result property for custom functions */
  result?: any;
  /** AI-formatted Markdown output (optional) */
  markdown?: string;
}

/**
 * Element extraction result for CSS selector-based extraction
 */
export interface ElementExtractionResult {
  /** The selector that was used */
  selector: string;
  /** Array of elements matching the selector */
  results: {
    /** Text content of the element */
    text: string;
    /** HTML content of the element */
    html: string;
    /** Element attributes */
    attributes: Array<{
      name: string;
      value: string;
    }>;
    /** Element position and dimensions */
    top: number;
    left: number;
    width: number;
    height: number;
  }[];
  /** Error message if extraction failed */
  error?: string;
}

/**
 * API request parameters for the crawler
 */
export interface CrawlerRequestParams {
  /** URL to crawl */
  url: string;
  /** Type of extraction to perform (now includes 'xml') */
  type: 'html' | 'text' | 'selector' | 'js' | 'execute' | 'xml';
  /** CSS selectors to extract (for selector extraction) */
  selectors?: string[];
  /** Wait time after JS execution (for js extraction) */
  waitTime?: number;
  /** Extraction options */
  extractionOptions?: ExtractionOptions;
  /** Crawler options */
  crawlerOptions?: CrawlerOptions;
}
