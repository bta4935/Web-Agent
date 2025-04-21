/**
 * Test file to isolate and fix the Puppeteer browser launch issue
 */

import puppeteer from '@cloudflare/puppeteer';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    console.log("Attempting simple browser launch...");
    try {
      // Direct test - does this line work?
      const browser = await puppeteer.launch(env.BROWSER);
      console.log("Simple launch successful, closing.");
      await browser.close();
      return new Response("Simple browser launch test successful!");
    } catch (e: any) {
      console.error("Simple browser launch failed:", e);
      return new Response(`Simple launch error: ${e.message}`, { status: 500 });
    }
  }
};

// Ensure Env interface includes the BROWSER binding
interface Env {
  BROWSER: any;
}
