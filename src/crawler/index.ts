/**
 * Entry point for the Puppeteer Web Crawler
 * Provides routing logic for crawler endpoints
 */

import { Env } from './types';

/**
 * Cloudflare Worker execution context
 */
interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}
import {
  handleHtmlExtraction,
  handleTextExtraction,
  handleSelectorExtraction,
  handleJsExtraction,
  handleCustomJsExecution
} from './api';

/**
 * Route handler for crawler endpoints
 * 
 * @param request - HTTP request
 * @param env - Environment variables including BROWSER binding
 * @returns Response from the appropriate handler
 */
export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Handle legacy query parameter-based endpoints (/crawler?url=...&type=...)
    if (pathname === '/crawler') {
      const extractionType = url.searchParams.get('type');
      
      if (!extractionType) {
        return new Response(JSON.stringify({
          error: 'Missing type parameter',
          availableTypes: ['html', 'text', 'selector', 'js']
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Forward to the appropriate RESTful endpoint handler
      switch (extractionType) {
        case 'html':
          return await handleHtmlExtraction(request, env);
          
        case 'text':
          return await handleTextExtraction(request, env);
          
        case 'selector':
          return await handleSelectorExtraction(request, env);
          
        case 'js':
          return await handleJsExtraction(request, env);
          
        case 'execute':
          return await handleCustomJsExecution(request, env);
          
        default:
          return new Response(JSON.stringify({
            error: `Unknown extraction type: ${extractionType}`,
            availableTypes: ['html', 'text', 'selector', 'js', 'execute']
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
      }
    }
    
    // Handle RESTful endpoints (/crawler/html, /crawler/text, etc.)
    if (pathname.startsWith('/crawler/')) {
      // Extract the endpoint from the pathname
      const endpoint = pathname.replace('/crawler/', '');
      
      // Route to the appropriate handler based on the endpoint
      switch (endpoint) {
        case 'html':
          return await handleHtmlExtraction(request, env);
          
        case 'text':
          return await handleTextExtraction(request, env);
          
        case 'selector':
          return await handleSelectorExtraction(request, env);
          
        case 'js':
          return await handleJsExtraction(request, env);
          
        case 'execute':
          return await handleCustomJsExecution(request, env);
          
        default:
          return new Response(JSON.stringify({
            error: 'Unknown endpoint',
            availableEndpoints: [
              '/crawler/html',
              '/crawler/text',
              '/crawler/selector',
              '/crawler/js',
              '/crawler/execute'
            ],
            legacyEndpoint: '/crawler?url=...&type=[html|text|selector|js]'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
      }
    }
    
    // If the request is not for any crawler endpoint
    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('Error handling crawler request:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Cloudflare Worker fetch handler
 * 
 * This function is the entry point for the Cloudflare Worker.
 * It routes requests to either the crawler functionality or passes them
 * to the original functionality, ensuring no interference.
 * 
 * @param request - HTTP request
 * @param env - Environment variables including BROWSER binding
 * @param ctx - Execution context
 * @returns Response from the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // If the request is for the crawler API, handle it with our crawler logic
    if (url.pathname.startsWith('/crawler/')) {
      return handleRequest(request, env);
    }
    
    // Otherwise, this request is not for us, so we'll return a 404
    // In a real integration, you might want to pass this to the original handler
    return new Response('Not Found', { status: 404 });
  }
};

/**
 * Export all crawler components for external use
 */
export * from './types';
export * from './crawler';
export * from './extractors/html';
export * from './extractors/text';
export * from './extractors/selector';
export * from './extractors/js';
export * from './utils/browser';
