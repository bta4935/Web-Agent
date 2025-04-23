// src/crawler/api/handlers.ts
// REMOVED: import { Context } from 'hono'; // No longer using Hono context

import { Crawler } from '../crawler'; // Adjust path if needed
import { ValidationError, handleApiError } from './errors';
import {
	validateUrl,
	parseCrawlerOptions,
	parseExtractionOptions,
	parseTextExtractionOptions,
	parseSelectorExtractionOptions,
	parseJsExtractionOptions,
	parseSelectors
} from './options';
import { XMLParser, XMLValidator } from 'fast-xml-parser'; // <-- ADDED: Import XML Parser
import type { Env } from '../types'; // Adjust path if needed, ensure Env includes BROWSER


/**
 * API handler for HTML extraction
 */
// UPDATED: Changed signature from (c: Context...) to (request: Request, env: Env)
export async function handleHtmlExtraction(request: Request, env: Env): Promise<Response> {
	try {
		const url = new URL(request.url); // UPDATED: use request.url directly
		const targetUrl = validateUrl(url.searchParams.get('url'));
		const crawlerOptions = parseCrawlerOptions(url);
		const extractionOptions = parseExtractionOptions(url);

		const crawler = new Crawler(env.BROWSER, crawlerOptions); // UPDATED: use env.BROWSER
		const result = await crawler.extractHtml(targetUrl, extractionOptions);

		// UPDATED: Use standard Response
		return new Response(JSON.stringify(result), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		return handleApiError(error); // UPDATED: Removed 'c' argument
	}
}

/**
 * API handler for text extraction
 */
// UPDATED: Changed signature
export async function handleTextExtraction(request: Request, env: Env): Promise<Response> {
	try {
		const url = new URL(request.url); // UPDATED
		const targetUrl = validateUrl(url.searchParams.get('url'));
		const crawlerOptions = parseCrawlerOptions(url);
		const extractionOptions = parseExtractionOptions(url);

		const crawler = new Crawler(env.BROWSER, crawlerOptions); // UPDATED
		const result = await crawler.extractText(targetUrl, extractionOptions);

		// Return only the extraction result (no markdown)
		return new Response(JSON.stringify(result), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		return handleApiError(error); // UPDATED
	}
}

/**
 * API handler for selector-based extraction
 */
// UPDATED: Changed signature
export async function handleSelectorExtraction(request: Request, env: Env): Promise<Response> {
	try {
		const url = new URL(request.url); // UPDATED
		const targetUrl = validateUrl(url.searchParams.get('url'));
		const selectors = parseSelectors(url, true);
		if (!selectors) {
			throw new ValidationError('Selectors parameter is required');
		}
		const crawlerOptions = parseCrawlerOptions(url);
		const extractionOptions = parseSelectorExtractionOptions(url);

		const crawler = new Crawler(env.BROWSER, crawlerOptions); // UPDATED
		const result = await crawler.extractBySelector(targetUrl, selectors, extractionOptions);

		// UPDATED: Use standard Response
		return new Response(JSON.stringify(result), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		return handleApiError(error); // UPDATED
	}
}

/**
 * API handler for JavaScript-executed extraction (HTML or Text)
 */
// UPDATED: Changed signature
export async function handleJsExtraction(request: Request, env: Env): Promise<Response> {
	try {
		const url = new URL(request.url); // UPDATED
		const targetUrl = validateUrl(url.searchParams.get('url'));
		const outputType = url.searchParams.get('output') || 'html';
		if (outputType !== 'html' && outputType !== 'text') {
			throw new ValidationError("Invalid 'output' parameter. Must be 'html' or 'text'.");
		}

		const crawlerOptions = parseCrawlerOptions(url);
		const extractionOptions = parseJsExtractionOptions(url);

		// Parse custom script from request body if present (only for POST)
		// UPDATED: Use standard request object
		if (request.method === 'POST') {
			try {
				if (request.body) { // Check if body exists before parsing
					const body = await request.json<{ customScript?: string }>(); // Use standard request.json()
					if (body && typeof body.customScript === 'string') {
						extractionOptions.customScript = body.customScript;
					}
				}
			} catch (e) {
				if (e instanceof SyntaxError) {
					// JSON parsing failed for POST body (custom script)
					console.warn("Error parsing request body for custom script:", e);
					throw new ValidationError("Invalid JSON in request body for custom script");
				} else {
					// Re-throw other errors
					throw e;
				}
			}
		}

		const selectors = parseSelectors(url);

		// Create crawler
		const crawler = new Crawler(env.BROWSER, crawlerOptions); // UPDATED

		// Extract content
		const extractionResult = selectors
			? await crawler.extractElementsAfterJsExecution(targetUrl, selectors, extractionOptions)
			: await crawler.extractAfterJsExecution(targetUrl, extractionOptions);

		// Prepare response based on output type
		let responseData: any = {
			url: targetUrl,
			status: 200,
			timestamp: Date.now()
		};

		if (selectors) {
			responseData.elements = Array.isArray(extractionResult) ? extractionResult : [extractionResult];
			// If outputType is 'text', combine text from all elements
			if (outputType === 'text' && Array.isArray(extractionResult)) {
				const rawTextForMarkdown = extractionResult.map((el: any) =>
					Array.isArray(el.results) ? el.results.map((r: { text: string }) => r.text).join(' ') : ''
				).join('\n\n');
				responseData.text = rawTextForMarkdown;
			}
			if (outputType === 'html') {
				responseData.html = '';
			}
		} else if (extractionResult && typeof extractionResult === 'object' && !Array.isArray(extractionResult)) {
			if (outputType === 'html' && typeof extractionResult.html !== 'undefined') {
				responseData.html = extractionResult.html;
			}
			if (outputType === 'text' && typeof extractionResult.text !== 'undefined') {
				const rawTextForMarkdown = extractionResult.text;
				responseData.text = rawTextForMarkdown;
			}
		}

		// Return only the extraction result (no markdown)
		return new Response(JSON.stringify(responseData), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		return handleApiError(error); // UPDATED
	}
}

/**
 * API handler for custom JavaScript execution
 */
// UPDATED: Changed signature
export async function handleCustomJsExecution(request: Request, env: Env): Promise<Response> {
	try {
		// UPDATED: Check standard request method
		if (request.method !== 'POST') {
			throw new ValidationError('This endpoint requires POST method', 405);
		}

		const url = new URL(request.url); // UPDATED
		const targetUrl = validateUrl(url.searchParams.get('url'));
		const crawlerOptions = parseCrawlerOptions(url);

		let fnName: string;
		let args: any[] = [];

		try {
			if (!request.body) {
				throw new ValidationError('Request body is required for custom function execution');
			}
			const body = await request.json<{ fnName?: string; args?: any[] }>();
			if (!body || typeof body.fnName !== 'string') {
				throw new ValidationError('fnName is required in request body');
			}
			fnName = body.fnName;
			if (Array.isArray(body.args)) {
				args = body.args;
			}
		} catch (e) {
			// Catch JSON parsing errors specifically
			if (e instanceof SyntaxError) {
				throw new ValidationError('Invalid JSON in request body');
			}
			// Rethrow other potential errors during body parsing
			throw new ValidationError('Could not parse request body: ' + (e instanceof Error ? e.message : String(e)));
		}

		const crawler = new Crawler(env.BROWSER, crawlerOptions); // UPDATED
		const result = await crawler.executeCustomFunction(targetUrl, fnName, ...args);

		// UPDATED: Use standard Response
		return new Response(JSON.stringify(result), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		return handleApiError(error); // UPDATED
	}
}


/**
 * API handler for XML Sitemap URL extraction
 */
export async function handleSitemapRequest(request: Request, env: Env): Promise<Response> {
	try {
		const url = new URL(request.url);
		const sitemapUrl = validateUrl(url.searchParams.get('url')); // Re-use validation

		// 1. Fetch the sitemap
		let response: globalThis.Response;
		try {
			response = await fetch(sitemapUrl);
			if (!response.ok) {
				throw new Error(`Failed to fetch sitemap (${response.status}): ${await response.text()}`);
			}
		} catch (fetchError) {
			console.error("Sitemap fetch error:", fetchError);
			return handleApiError(new Error(`Could not fetch sitemap URL: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`, { cause: fetchError }));
		}

		const xmlText = await response.text();

		// 2. Parse the XML
		// Consider making parser options configurable if needed later
		const xmlParserOptions = {
			ignoreAttributes: true, // We only need the <loc> tag value
			parseTagValue: true,
			trimValues: true,
			isArray: (name: string, jpath: string) => jpath === 'urlset.url', // Ensure urlset.url is always an array
		};
		const parser = new XMLParser(xmlParserOptions);
		let jsonObj: any;
		try {
			jsonObj = parser.parse(xmlText);
		} catch (parseError) {
			console.error("Sitemap XML parsing error:", parseError);
			return handleApiError(new ValidationError(`Failed to parse sitemap XML: ${parseError instanceof Error ? parseError.message : String(parseError)}`, 400));
		}

		// 3. Extract URLs
		// Common structure is <urlset><url><loc>...</loc></url>...</urlset>
		// Handle potential variations or missing elements
		const urls: string[] = jsonObj?.urlset?.url?.map((entry: any) => entry?.loc).filter((loc: any): loc is string => typeof loc === 'string') || [];

		// 4. Return Response
		return new Response(JSON.stringify({ urls }), {
			headers: { 'Content-Type': 'application/json' }
		});

	} catch (error) {
		// Catch URL validation errors or other unexpected issues
		return handleApiError(error);
	}
}