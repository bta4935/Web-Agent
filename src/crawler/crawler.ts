// Minimal stub for Crawler class to unblock TypeScript imports
import puppeteer from "@cloudflare/puppeteer";
import type { Browser, Page } from "@cloudflare/puppeteer";
import type { Fetcher } from '@cloudflare/workers-types';
import type { ExtractionOptions, CrawlerOptions, CrawlerResponse, ElementExtractionResult } from './types';

export class Crawler {
  private browserEnvBinding: Fetcher;
  private options: CrawlerOptions;

  constructor(browserEnvBinding: Fetcher, options: CrawlerOptions = {}) {
    if (!browserEnvBinding) {
      throw new Error("Browser binding (env.BROWSER) is required!");
    }
    this.browserEnvBinding = browserEnvBinding;
    this.options = options;
  }

  // Helper to launch browser and page, applying options
  private async _getBrowserPage(): Promise<{ browser: Browser; page: Page }> {
    const browser = await puppeteer.launch(this.browserEnvBinding);
    const page = await browser.newPage();
    // Apply crawler options like viewport, userAgent etc.
    if (this.options.viewport) {
      await page.setViewport(this.options.viewport);
    }
    if (this.options.userAgent) {
      await page.setUserAgent(this.options.userAgent);
    }
    // Resource blocking (optional, see your task.md for details)
    if (this.options.blockImages || this.options.blockFonts || this.options.blockCSS) {
      await page.setRequestInterception(true);
      page.on('request', (interceptedRequest: any) => {
        const resourceType = interceptedRequest.resourceType();
        let shouldBlock = false;
        if (this.options.blockImages && resourceType === 'image') shouldBlock = true;
        if (this.options.blockFonts && resourceType === 'font') shouldBlock = true;
        if (this.options.blockCSS && resourceType === 'stylesheet') shouldBlock = true;
        if (shouldBlock) {
          interceptedRequest.abort().catch(() => {});
        } else {
          interceptedRequest.continue().catch(() => {});
        }
      });
    }
    return { browser, page };
  }

  async extractHtml(url: string, extractionOptions?: ExtractionOptions): Promise<Partial<CrawlerResponse>> {
    let browser: Browser | null = null;
    try {
      const { browser: launchedBrowser, page } = await this._getBrowserPage();
      browser = launchedBrowser;
      const waitUntil = (extractionOptions as any)?.waitUntil || this.options.waitUntil || 'networkidle0';
      const timeout = (extractionOptions as any)?.timeout || this.options.timeout || 30000;
      const response = await page.goto(url, {
        waitUntil,
        timeout
      });
      await (page as any).waitForSelector('body', { timeout: 10000 });
      const html = await page.content();
      console.log("Extracted HTML:", html);
      return { url, status: (response as any)?.status?.() ?? 200, html, timestamp: Date.now() };
    } catch (error: any) {
      console.error(`Error extracting HTML from ${url}:`, error);
      return { url, status: 500, error: String(error?.message || error), timestamp: Date.now() };
    } finally {
      if (browser) await browser.close();
    }
  }

  async extractText(url: string, extractionOptions?: ExtractionOptions): Promise<Partial<CrawlerResponse>> {
    let browser: Browser | null = null;
    try {
      const { browser: launchedBrowser, page } = await this._getBrowserPage();
      browser = launchedBrowser;
      const waitUntil = (extractionOptions as any)?.waitUntil || this.options.waitUntil || 'networkidle0';
      const timeout = (extractionOptions as any)?.timeout || this.options.timeout || 30000;
      const response = await page.goto(url, {
        waitUntil,
        timeout
      });
      await (page as any).waitForSelector('body', { timeout: 10000 });
      // Extract visible text from the page
      const text = String(await page.evaluate(() => document.body ? document.body.innerText : ''));
      return { url, status: (response as any)?.status?.() ?? 200, text, timestamp: Date.now() };
    } catch (error: any) {
      console.error(`Error extracting text from ${url}:`, error);
      return { url, status: 500, error: String(error?.message || error), timestamp: Date.now() };
    } finally {
      if (browser) await browser.close();
    }
  }

  async extractBySelector(url: string, selectors: string[], options?: any): Promise<Partial<CrawlerResponse>> {
    let browser: Browser | null = null;
    try {
      const { browser: launchedBrowser, page } = await this._getBrowserPage();
      browser = launchedBrowser;
      const waitUntil = options?.waitUntil || this.options.waitUntil || 'networkidle0';
      const timeout = options?.timeout || this.options.timeout || 30000;
      const response = await page.goto(url, { waitUntil, timeout });
      await (page as any).waitForSelector('body', { timeout: 10000 });

      const elements: ElementExtractionResult[] = await page.evaluate(
        (selectors: string[], opts: any) => {
          return selectors.map(selector => {
            const nodeList = Array.from(document.querySelectorAll(selector));
            const results = nodeList.map(el => {
              const text = el.textContent ?? '';
              const html = el.outerHTML;
              let attributes: { name: string; value: string }[] = [];
              if (opts?.includeAttributes && Array.isArray(opts.attributes) && opts.attributes.length > 0) {
                attributes = opts.attributes.map((attr: string) => ({
                  name: attr,
                  value: el.getAttribute(attr) ?? ''
                }));
              }
              // Position and dimensions
              const rect = el.getBoundingClientRect();
              return {
                text,
                html,
                attributes,
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
              };
            });
            return {
              selector,
              results
            };
          });
        },
        selectors,
        options || {}
      );

      return { elements, url, status: (response as any)?.status?.() ?? 200, timestamp: Date.now() };
    } catch (error: any) {
      console.error(`Error extracting by selector from ${url}:`, error);
      return { url, status: 500, error: String(error?.message || error), timestamp: Date.now() };
    } finally {
      if (browser) await browser.close();
    }
  }

  async extractAfterJsExecution(url: string, extractionOptions?: ExtractionOptions): Promise<Partial<CrawlerResponse>> {
    let browser: Browser | null = null;
    try {
      const { browser: launchedBrowser, page } = await this._getBrowserPage();
      browser = launchedBrowser;
      const waitUntil = (extractionOptions as any)?.waitUntil || this.options.waitUntil || 'networkidle0';
      const timeout = (extractionOptions as any)?.timeout || this.options.timeout || 30000;
      const response = await page.goto(url, { waitUntil, timeout });
      await (page as any).waitForSelector('body', { timeout: 10000 });
      // Optionally, run custom JS here if needed
      const html = await page.content();
      const text = String(await page.evaluate(() => document.body ? document.body.innerText : ''));
      return { url, status: (response as any)?.status?.() ?? 200, html, text, timestamp: Date.now() };
    } catch (error: any) {
      console.error(`Error extracting after JS execution from ${url}:`, error);
      return { url, status: 500, error: String(error?.message || error), timestamp: Date.now() };
    } finally {
      if (browser) await browser.close();
    }
  }

  async extractElementsAfterJsExecution(url: string, selectors: any, options?: any): Promise<any[]> {
    return [];
  }

  async executeCustomFunction(url: string, scriptFn: string, ...args: any[]): Promise<Partial<CrawlerResponse>> {
    let browser: Browser | null = null;
    try {
      const { browser: launchedBrowser, page } = await this._getBrowserPage();
      browser = launchedBrowser;
      const waitUntil = this.options.waitUntil || 'networkidle0';
      const timeout = this.options.timeout || 30000;
      const response = await page.goto(url, { waitUntil, timeout });
      await (page as any).waitForSelector('body', { timeout: 10000 });

      // Evaluate the script in the page context
      const result = await page.evaluate((fnStr: string, ...args: unknown[]) => {
        // Turn the string into a function
        // Accepts both "function() { ... }" and "() => { ... }"
        let fn;
        try {
          fn = eval('(' + fnStr + ')');
        } catch (e) {
          return { error: 'Script parse error: ' + String(e) };
        }
        try {
          return fn.apply(null, args);
        } catch (e) {
          return { error: 'Script runtime error: ' + String(e) };
        }
      }, scriptFn, ...args);

      return { result, url, status: (response as any)?.status?.() ?? 200, timestamp: Date.now() };
    } catch (error: any) {
      console.error(`Error executing custom function on ${url}:`, error);
      return { result: null, url, status: 500, error: String(error?.message || error), timestamp: Date.now() };
    } finally {
      if (browser) await browser.close();
    }
  }
}
