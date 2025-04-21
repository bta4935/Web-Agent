// src/crawler/api/index.ts

// Corrected import paths
import { handleApiRequest } from './api/router';
import type { Env } from './types';

// Keep the rest of your code the same
export default {
	/**
	 * The main fetch handler for the Worker.
	 * It receives incoming HTTP requests and delegates them to the API router.
	 * @param request - The incoming Request object.
	 * @param env - The environment bindings for the Worker (e.g., BROWSER).
	 * @param ctx - The execution context.
	 * @returns A Promise that resolves to the Response.
	 */
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// You could add top-level logic here if needed, for example:
		// - Handling specific paths differently (like '/health' or static assets if not using framework features)
		// - Adding global middleware (though the router handles API-specific logic now)

		// For this setup, we directly delegate all requests to the API request handler
		return handleApiRequest(request, env);
	},

	// If you have other handlers like 'scheduled', 'queue', etc., add them here.
	// Example:
	// async scheduled(controller, env, ctx) {
	//   // Handle scheduled event...
	// }

} satisfies ExportedHandler<Env>;

// Important: If you have Durable Objects or other named exports needed by bindings,
// ensure they are exported here as well.
// For example:
// export { MyDurableObject } from '../durableObject'; // Adjust path