Okay, let's refactor the `api.ts` file into smaller, more manageable modules. This improves organization and makes the code easier to maintain.

We'll break it down into these logical parts:

1.  **`errors.ts`**: Handles custom error types and the generic error handler.
2.  **`options.ts`**: Contains functions for validating the URL and parsing various options from query parameters.
3.  **`handlers.ts`**: Holds the specific logic for each extraction type endpoint (`handleHtmlExtraction`, `handleTextExtraction`, etc.).
4.  **`router.ts`**: Sets up the router (we'll use Hono here as an example, but you can adapt it for Itty Router or others) and defines the API routes, connecting them to the handlers.
5.  **`index.ts`**: The main Worker entry point, which will delegate requests to the router.

Here's the proposed file structure:

```
src/
├── crawler/
│   ├── index.ts         # Main Worker entry point (imports api/router.ts)
│   ├── api/
│   │   ├── router.ts      # Sets up the Hono router and routes
│   │   ├── handlers.ts    # All the handle... functions
│   │   ├── options.ts     # All the parse... functions + validateUrl
│   │   └── errors.ts      # ValidationError and handleApiError
│   ├── crawler.ts       # Existing Crawler class
│   └── types.ts         # Existing types file
└── index.ts             # (Potentially this is the main entry point if not crawler/index.ts)
```

**Important:** Make sure your `wrangler.toml` or `wrangler.jsonc` points to the correct main entry point (e.g., `src/crawler/index.ts` or `src/index.ts`).

---

**1. `src/crawler/api/errors.ts`**

```typescript
// src/crawler/api/errors.ts
import { Context } from 'hono';

/**
 * Request validation error
 */
export class ValidationError extends Error {
	status: number;

	constructor(message: string, status = 400) {
		super(message);
		this.name = 'ValidationError';
		this.status = status;
	}
}

/**
 * Handles errors in API requests
 * @param error - Error to handle
 * @param c - Hono context
 * @returns Response with error details
 */
export function handleApiError(error: unknown, c: Context): Response {
	console.error('API Error:', error);

	if (error instanceof ValidationError) {
		return c.json({ error: error.message }, error.status);
	}

	// Default to 500 for other errors
	return c.json({ error: 'Internal server error' }, 500);
}
```

---

**2. `src/crawler/api/options.ts`**

```typescript
// src/crawler/api/options.ts
import { ValidationError } from './errors';
import type {
	CrawlerOptions,
	ExtractionOptions,
	TextExtractionOptions,
	SelectorExtractionOptions,
	JsExtractionOptions
} from '../types'; // Adjust path if your types.ts is elsewhere

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
```

---

**3. `src/crawler/api/handlers.ts`**

```typescript
// src/crawler/api/handlers.ts
import { Context } from 'hono'; // Or your specific router context type
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
import type { Env } from '../types'; // Assuming Env type includes BROWSER binding

/**
 * API handler for HTML extraction
 */
export async function handleHtmlExtraction(c: Context<{ Bindings: Env }>) {
	try {
		const url = new URL(c.req.url);
		const targetUrl = validateUrl(url.searchParams.get('url'));
		const crawlerOptions = parseCrawlerOptions(url);
		const extractionOptions = parseExtractionOptions(url);

		const crawler = new Crawler(c.env.BROWSER, crawlerOptions);
		const result = await crawler.extractHtml(targetUrl, extractionOptions);

		return c.json(result);
	} catch (error) {
		return handleApiError(error, c);
	}
}

/**
 * API handler for text extraction
 */
export async function handleTextExtraction(c: Context<{ Bindings: Env }>) {
	try {
		const url = new URL(c.req.url);
		const targetUrl = validateUrl(url.searchParams.get('url'));
		const crawlerOptions = parseCrawlerOptions(url);
		const extractionOptions = parseTextExtractionOptions(url);

		const crawler = new Crawler(c.env.BROWSER, crawlerOptions);
		const result = await crawler.extractText(targetUrl, extractionOptions);

		return c.json(result);
	} catch (error) {
		return handleApiError(error, c);
	}
}

/**
 * API handler for selector-based extraction
 */
export async function handleSelectorExtraction(c: Context<{ Bindings: Env }>) {
	try {
		const url = new URL(c.req.url);
		const targetUrl = validateUrl(url.searchParams.get('url'));
		const selectors = parseSelectors(url, true); // Selectors are required here
		if (!selectors) {
			// This case should be handled by parseSelectors required=true, but belts and suspenders
			throw new ValidationError('Selectors parameter is required');
		}
		const crawlerOptions = parseCrawlerOptions(url);
		const extractionOptions = parseSelectorExtractionOptions(url);

		const crawler = new Crawler(c.env.BROWSER, crawlerOptions);
		const result = await crawler.extractBySelector(targetUrl, selectors, extractionOptions);

		return c.json(result);
	} catch (error) {
		return handleApiError(error, c);
	}
}

/**
 * API handler for JavaScript-executed extraction (HTML or Text)
 */
export async function handleJsExtraction(c: Context<{ Bindings: Env }>) {
	try {
		const url = new URL(c.req.url);
		const targetUrl = validateUrl(url.searchParams.get('url'));
		const outputType = url.searchParams.get('output') || 'html';
		if (outputType !== 'html' && outputType !== 'text') {
			throw new ValidationError("Invalid 'output' parameter. Must be 'html' or 'text'.");
		}

		const crawlerOptions = parseCrawlerOptions(url);
		const extractionOptions = parseJsExtractionOptions(url);

		// Parse custom script from request body if present (only for POST)
		if (c.req.method === 'POST') {
			try {
				if (c.req.raw.body) { // Check if body exists before parsing
					const body = await c.req.json() as { customScript?: string };
					if (body && typeof body.customScript === 'string') {
						extractionOptions.customScript = body.customScript;
					}
				}
			} catch (e) {
				// Ignore body parsing errors if body is empty or not JSON
				if (!(e instanceof SyntaxError)) {
					console.warn("Error parsing POST body for custom script:", e);
				}
			}
		}

		const selectors = parseSelectors(url); // Selectors are optional here

		// Create crawler
		const crawler = new Crawler(c.env.BROWSER, crawlerOptions);

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

		if (outputType === 'text') {
			if (Array.isArray(extractionResult)) {
 				responseData.text = extractionResult.map(el => el.results.map(r => r.text).join(' ')).join('\n\n'); // Example aggregation
 			} else if (extractionResult && typeof extractionResult.text !== 'undefined') {
				responseData.text = extractionResult.text;
			} else {
				responseData.text = '';
			}
		} else { // Default to 'html'
 			if (Array.isArray(extractionResult)) {
 				responseData.elements = extractionResult; // Keep original structure for selector extraction
 			} else if (extractionResult && typeof extractionResult.html !== 'undefined') {
				responseData.html = extractionResult.html;
			} else {
				responseData.html = '';
			}
		}

		return c.json(responseData);
	} catch (error) {
		return handleApiError(error, c);
	}
}


/**
 * API handler for custom JavaScript execution
 */
export async function handleCustomJsExecution(c: Context<{ Bindings: Env }>) {
	try {
		if (c.req.method !== 'POST') {
			throw new ValidationError('This endpoint requires POST method', 405);
		}

		const url = new URL(c.req.url);
		const targetUrl = validateUrl(url.searchParams.get('url'));
		const crawlerOptions = parseCrawlerOptions(url);

		let scriptFn: string;
		let args: any[] = [];

		try {
			if (!c.req.raw.body) {
				 throw new ValidationError('Request body is required for custom script execution');
			}
			const body = await c.req.json() as { script?: string; args?: any[] };
			if (!body || typeof body.script !== 'string') {
				throw new ValidationError('Script is required in request body');
			}
			scriptFn = body.script;
			if (Array.isArray(body.args)) {
				args = body.args;
			}
		} catch (e) {
			// Catch JSON parsing errors specifically
			if (e instanceof SyntaxError) {
				throw new ValidationError('Invalid JSON in request body');
			}
			throw new ValidationError('Invalid request body');
		}

		const crawler = new Crawler(c.env.BROWSER, crawlerOptions);
		const result = await crawler.executeCustomFunction(targetUrl, scriptFn, ...args);

		return c.json(result);
	} catch (error) {
		return handleApiError(error, c);
	}
}
```

---

**4. `src/crawler/api/router.ts`**

This file sets up the Hono router and maps URL paths to the handler functions.

```typescript
// src/crawler/api/router.ts
import { Hono } from 'hono';
import {
	handleHtmlExtraction,
	handleTextExtraction,
	handleSelectorExtraction,
	handleJsExtraction,
	handleCustomJsExecution
} from './handlers';
import { handleApiError } from './errors';
import type { Env } from '../types'; // Adjust path if needed

// Define the Hono app with specific types for Bindings
const apiRouter = new Hono<{ Bindings: Env }>();

// Define RESTful routes first
apiRouter.get('/crawler/html', handleHtmlExtraction);
apiRouter.get('/crawler/text', handleTextExtraction);
apiRouter.get('/crawler/selector', handleSelectorExtraction);
// Handle both GET and POST for JS extraction to allow script in body
apiRouter.on(['GET', 'POST'], '/crawler/js', handleJsExtraction);
apiRouter.post('/crawler/execute', handleCustomJsExecution);


// Optional: Handle legacy /crawler route
apiRouter.on(['GET', 'POST'], '/crawler', async (c) => {
    const url = new URL(c.req.url);
    const type = url.searchParams.get('type') || 'html'; // Default to html

    switch (type.toLowerCase()) {
        case 'html':
            return handleHtmlExtraction(c);
        case 'text':
            return handleTextExtraction(c);
        case 'selector':
            return handleSelectorExtraction(c);
        case 'js':
            return handleJsExtraction(c);
        case 'execute':
             if (c.req.method === 'POST') {
                return handleCustomJsExecution(c);
            } else {
                return c.json({ error: 'Execute type requires POST method for legacy endpoint' }, 405);
            }
        default:
            return c.json({ error: `Unsupported type: ${type}` }, 400);
    }
});

// Add a global error handler
apiRouter.onError(handleApiError);

// Fallback for any route not matched within this router
apiRouter.notFound((c) => c.json({ error: 'API route not found' }, 404));

export default apiRouter;

```

---

**5. `src/crawler/index.ts` (or `src/index.ts` - Main Worker Entry Point)**

Modify your main Worker entry point to use the new API router.

```typescript
// src/crawler/index.ts (or src/index.ts)
import apiRouter from './api/router'; // Adjust path if needed
import type { Env } from './types'; // Adjust path if needed

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// You could add top-level middleware here if needed

		// Delegate all requests starting with `/` to the apiRouter
		// If you want to mount it under a prefix like /api/v1, you'd use:
		// return app.route('/api/v1', apiRouter).fetch(request, env, ctx)
		// For now, we'll assume it handles root paths directly
		return apiRouter.fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;

// Important: If you have Durable Objects or other exports, keep them here!
// For example:
// export { MyDurableObject } from './durableObject';
```

---

**Summary of Changes:**

*   **Separation of Concerns:** Logic is now grouped into dedicated files (`errors.ts`, `options.ts`, `handlers.ts`, `router.ts`).
*   **Imports/Exports:** Each file exports the necessary functions/classes, and other files import what they need using relative paths.
*   **Router Setup:** The `router.ts` file is responsible for defining API endpoints and linking them to handler functions.
*   **Main Entry Point:** The main `index.ts` becomes simpler, primarily delegating requests to the API router.
*   **Type Safety:** Using `Context<{ Bindings: Env }>` in Hono ensures handlers have access to typed environment bindings.

This refactoring makes the codebase much cleaner and easier to navigate and extend in the future. Remember to adjust import paths based on your exact project structure.