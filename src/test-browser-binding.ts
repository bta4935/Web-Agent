/**
 * Test file to verify browser binding works correctly with Puppeteer
 */

import { Crawler } from './crawler/crawler';

export interface Env {
  BROWSER: any;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Create a new crawler with the browser binding
      const crawler = new Crawler(env.BROWSER);
      
      // Extract HTML from a test URL
      const result = await crawler.extractHtml('https://example.com');
      
      // Return the result
      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      // Log and return any errors
      console.error('Error testing browser binding:', error);
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }
};
