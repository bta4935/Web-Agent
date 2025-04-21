
// src/crawler/api/options.ts
import { ValidationError } from './errors';
import type {
  CrawlerOptions,
  ExtractionOptions
} from '../types';
import type { TextExtractionOptions } from '../extractors/text';
import type { SelectorExtractionOptions } from '../extractors/selector';
import type { JsExtractionOptions } from '../extractors/js';

/**
 * Validates that a URL is present and properly formatted
 * @param url - URL to validate
 * @returns The validated URL string
 * @throws ValidationError if URL is invalid
 */
export function validateUrl(url?: string | null): string {
	if (!url) {
		throw new ValidationError('URL query parameter is required');
	}
	try {
		// Check if URL is valid and return its string representation
		return new URL(url).toString();
	} catch (error) {
		throw new ValidationError(`Invalid URL: ${url}`);
	}
}

/**
 * Parses common crawler options from URL search parameters
 * @param url - The URL object of the incoming request
 * @returns Parsed common crawler options
 */
export function parseCrawlerOptions(url: URL): CrawlerOptions {
	const timeout = url.searchParams.get('timeout');
	const waitUntil = url.searchParams.get('waitUntil') as CrawlerOptions['waitUntil'] | null;
	const userAgent = url.searchParams.get('userAgent');
	const viewportWidth = url.searchParams.get('viewportWidth');
	const viewportHeight = url.searchParams.get('viewportHeight');
	const blockImages = url.searchParams.get('blockImages');
	const blockFonts = url.searchParams.get('blockFonts');
	const blockCSS = url.searchParams.get('blockCSS');

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
}

/**
 * Parses common extraction options from URL search parameters
 * @param url - The URL object of the incoming request
 * @returns Parsed common extraction options
 */
export function parseExtractionOptions(url: URL): ExtractionOptions {
	const removeScripts = url.searchParams.get('removeScripts');
	const removeStyles = url.searchParams.get('removeStyles');
	const includeMetadata = url.searchParams.get('includeMetadata');

	const options: ExtractionOptions = {};

	if (removeScripts !== null) options.removeScripts = removeScripts === 'true';
	if (removeStyles !== null) options.removeStyles = removeStyles === 'true';
	if (includeMetadata !== null) options.includeMetadata = includeMetadata === 'true';

	return options;
}

/**
 * Parses text extraction specific options from URL search parameters
 * @param url - The URL object of the incoming request
 * @returns Parsed text extraction options
 */
export function parseTextExtractionOptions(url: URL): TextExtractionOptions {
	const options = parseExtractionOptions(url) as TextExtractionOptions;
	const minTextLength = url.searchParams.get('minTextLength');
	const includeImageAlt = url.searchParams.get('includeImageAlt');
	const preserveWhitespace = url.searchParams.get('preserveWhitespace');

	if (minTextLength !== null) options.minTextLength = parseInt(minTextLength, 10);
	if (includeImageAlt !== null) options.includeImageAlt = includeImageAlt === 'true';
	if (preserveWhitespace !== null) options.preserveWhitespace = preserveWhitespace === 'true';

	return options;
}

/**
 * Parses selector extraction specific options from URL search parameters
 * @param url - The URL object of the incoming request
 * @returns Parsed selector extraction options
 */
export function parseSelectorExtractionOptions(url: URL): SelectorExtractionOptions {
	const options = parseExtractionOptions(url) as SelectorExtractionOptions;
	const includeAttributes = url.searchParams.get('includeAttributes');
	const includePosition = url.searchParams.get('includePosition');
	const includeHtml = url.searchParams.get('includeHtml');
	const visibleOnly = url.searchParams.get('visibleOnly');
	const attributes = url.searchParams.get('attributes');

	if (includeAttributes !== null) options.includeAttributes = includeAttributes === 'true';
	if (includePosition !== null) options.includePosition = includePosition === 'true';
	if (includeHtml !== null) options.includeHtml = includeHtml === 'true';
	if (visibleOnly !== null) options.visibleOnly = visibleOnly === 'true';

	if (attributes) {
		options.attributes = attributes.split(',').map(attr => attr.trim());
	}

	return options;
}

/**
 * Parses JavaScript extraction specific options from URL search parameters
 * @param url - The URL object of the incoming request
 * @returns Parsed JavaScript extraction options
 */
export function parseJsExtractionOptions(url: URL): JsExtractionOptions {
	const options = parseExtractionOptions(url) as JsExtractionOptions;
	const waitTime = url.searchParams.get('waitTime');
	const waitUntil = url.searchParams.get('waitUntil') as JsExtractionOptions['waitUntil'] | null;
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

	// Note: customScript must be passed in the request body for POST requests
	// We handle that logic within the specific handler (handleJsExtraction).

	return options;
}

/**
 * Parses selectors from the 'selectors' query parameter.
 * Supports both comma-separated strings and JSON arrays.
 * @param url - The URL object of the incoming request
 * @returns An array of selectors or undefined if not provided.
 * @throws ValidationError if selectors param is missing when required by context.
 */
export function parseSelectors(url: URL, required: boolean = false): string[] | undefined {
    const selectorsParam = url.searchParams.get('selectors');
    if (!selectorsParam) {
        if (required) {
             throw new ValidationError('Selectors parameter is required');
        }
        return undefined;
    }

    let selectors: string[];
    try {
        const parsed = JSON.parse(selectorsParam);
        if (!Array.isArray(parsed) || !parsed.every(s => typeof s === 'string')) {
            // If it parses but isn't an array of strings, treat as comma-separated
             throw new Error("Parsed JSON is not an array of strings");
        }
        selectors = parsed;
    } catch (e) {
        // If not valid JSON, treat as comma-separated list
        selectors = selectorsParam.split(',').map(s => s.trim());
    }

    if (required && selectors.length === 0) {
        throw new ValidationError('Selectors parameter cannot be empty');
    }

    return selectors.length > 0 ? selectors : undefined;
}