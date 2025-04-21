/**
 * Custom type declarations for @cloudflare/puppeteer to avoid private identifier issues
 */

declare module '@cloudflare/puppeteer' {
  export interface Browser {
    newPage(): Promise<Page>;
    close(): Promise<void>;
    isConnected(): boolean;
    sessionId(): string;
  }

  export interface Page {
    setDefaultTimeout(timeout: number): void;
    setUserAgent(userAgent: string): Promise<void>;
    setViewport(viewport: Viewport): Promise<void>;
    setRequestInterception(value: boolean): Promise<void>;
    on(event: string, callback: Function): void;
    goto(url: string, options?: GoToOptions): Promise<Response | null>;
    content(): Promise<string>;
    evaluate<T>(fn: Function | string, ...args: any[]): Promise<T>;
    title(): Promise<string>;
    $eval<T>(selector: string, fn: Function, ...args: any[]): Promise<T>;
    close(): Promise<void>;
    isClosed?(): boolean;
    waitForNetworkIdle(options?: { idleTime?: number }): Promise<void>;
    waitForTimeout(timeout: number): Promise<void>;
  }

  export interface Response {
    text(): Promise<string>;
  }

  export interface Viewport {
    width: number;
    height: number;
  }

  export interface GoToOptions {
    timeout?: number;
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  }

  export function launch(browser: any): Promise<Browser>;
}
