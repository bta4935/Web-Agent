/**
 * Global test setup and teardown for Vitest
 * This file is automatically loaded by Vitest when running tests
 */

// Mock global objects that might not be available in the test environment
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    url: string;
    method: string;
    headers: Headers;
    body: any;

    constructor(url: string, init?: RequestInit) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this.body = init?.body;
    }
  } as any;
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    status: number;
    statusText: string;
    headers: Headers;
    body: any;

    constructor(body?: any, init?: ResponseInit) {
      this.status = init?.status || 200;
      this.statusText = init?.statusText || '';
      this.headers = new Headers(init?.headers);
      this.body = body;
    }

    json() {
      return Promise.resolve(JSON.parse(this.body));
    }

    text() {
      return Promise.resolve(this.body);
    }
  } as any;
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    private headers: Map<string, string>;

    constructor(init?: HeadersInit) {
      this.headers = new Map();
      
      if (init) {
        if (init instanceof Headers) {
          // Copy headers from another Headers instance
          init.forEach((value, key) => {
            this.set(key, value);
          });
        } else if (Array.isArray(init)) {
          // Initialize from array of name-value pairs
          init.forEach(([key, value]) => {
            this.set(key, value);
          });
        } else {
          // Initialize from object literal
          Object.entries(init).forEach(([key, value]) => {
            this.set(key, value);
          });
        }
      }
    }

    append(name: string, value: string): void {
      this.set(name, value);
    }

    delete(name: string): void {
      this.headers.delete(name.toLowerCase());
    }

    get(name: string): string | null {
      return this.headers.get(name.toLowerCase()) || null;
    }

    has(name: string): boolean {
      return this.headers.has(name.toLowerCase());
    }

    set(name: string, value: string): void {
      this.headers.set(name.toLowerCase(), value);
    }

    forEach(callback: (value: string, key: string) => void): void {
      this.headers.forEach((value, key) => callback(value, key));
    }
  } as any;
}

// Add any global setup code here
beforeAll(() => {
  // Global setup before all tests
  console.log('Starting Vitest test suite');
});

// Add any global teardown code here
afterAll(() => {
  // Global teardown after all tests
  console.log('Completed Vitest test suite');
});
