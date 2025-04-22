// src/crawler/api/router.ts

import {
	handleHtmlExtraction,
	handleTextExtraction,
	handleSelectorExtraction,
	handleJsExtraction,
	handleCustomJsExecution,
	handleSitemapRequest
} from './handlers'; // Assuming handlers.ts is in the same directory
import { handleApiError } from './errors'; // Assuming errors.ts is in the same directory
import type { Env } from '../types'; // Adjust path if needed

// --- Helper function at module level for allowed HTTP methods ---
function getAllowedMethodsForPath(pathname: string): string {
	switch (pathname) {
		case '/crawler/html':
		case '/crawler/text':
		case '/crawler/selector':
		case '/crawler/sitemap': // <-- ADDED Sitemap
			return 'GET';
		case '/crawler/js':
			return 'GET, POST';
		case '/crawler/execute':
			return 'POST';
		case '/crawler':
			return 'GET, POST'; // Legacy: type param determines allowed methods
		default:
			return 'GET, POST';
	}
}


// Define the main fetch handler for the API router
export async function handleApiRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const method = request.method;

	try {
		// Route based on pathname and method
		switch (url.pathname) {
			case '/crawler/html':
				if (method === 'GET') {
					return await handleHtmlExtraction(request, env);
				}
				break; // Important: break after handling

			case '/crawler/text':
				if (method === 'GET') {
					return await handleTextExtraction(request, env);
				}
				break;

			case '/crawler/selector':
				if (method === 'GET') {
					return await handleSelectorExtraction(request, env);
				}
				break;


			case '/crawler/js':
				// Allow GET for basic JS extraction, POST for custom script in body
				if (method === 'GET' || method === 'POST') {
					return await handleJsExtraction(request, env);
				}
				break;

			case '/crawler/execute':
				if (method === 'POST') {
					return await handleCustomJsExecution(request, env);
				}
				break;

			// Handle legacy /crawler route
			case '/crawler':
				const type = url.searchParams.get('type')?.toLowerCase() || 'html';
				switch (type) {
					case 'html':
						if (method === 'GET') return await handleHtmlExtraction(request, env);
						break;
					case 'text':
						if (method === 'GET') return await handleTextExtraction(request, env);
						break;
					case 'selector':
						if (method === 'GET') return await handleSelectorExtraction(request, env);
						break;
					// <-- ADDED Sitemap to legacy route -->
					case 'sitemap':
						if (method === 'GET') return await handleSitemapRequest(request, env);
						break;
					// <-- End ADDED Sitemap to legacy route -->
					case 'js':
						if (method === 'GET' || method === 'POST') return await handleJsExtraction(request, env);
						break;
					case 'execute':
						if (method === 'POST') return await handleCustomJsExecution(request, env);
						// If GET for execute, fall through to Method Not Allowed or specific error
						break; // Break here, otherwise it falls through to default
					default:
						// Handle unknown type for legacy route
						return new Response(JSON.stringify({ error: `Unsupported legacy type: ${type}` }), {
							status: 400,
							headers: { 'Content-Type': 'application/json' }
						});
				}
				// If method didn't match for the legacy type (e.g., GET for execute or sitemap)
				// Fall through to method not allowed, or handle specifically if needed.
				break; // Break for the outer /crawler case

			// Add more routes here if needed
		}

		// If no route matched or method was wrong for a matched route
		if (['GET', 'POST'].includes(method)) {
			// If it was a potentially valid method but no path matched
			return new Response(JSON.stringify({ error: 'API route not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' }
			});
		} else {
			// If the method itself is not allowed for any known route
			const allowedMethods = getAllowedMethodsForPath(url.pathname);
			return new Response(JSON.stringify({ error: `Method ${method} not allowed for path ${url.pathname}` }), {
				status: 405,
				headers: {
					'Content-Type': 'application/json',
					'Allow': allowedMethods
				}
			});
		}

	} catch (error) {
		// Catch any unhandled errors from routing or handlers
		return handleApiError(error);
	}
}