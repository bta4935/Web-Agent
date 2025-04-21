# Web-Agent: Cloudflare-Powered Web Crawler

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub Actions](https://img.shields.io/badge/CI/CD-GitHub_Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Cloudflare Workers](https://img.shields.io/badge/Powered%20by-Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Puppeteer](https://img.shields.io/badge/Puppeteer-Headless_Chrome-40B5A4?logo=puppeteer&logoColor=white)](https://pptr.dev/)

A powerful, high-performance web crawling solution deployed on Cloudflare Workers with automatic CI/CD pipeline. This project combines the speed and reliability of Cloudflare's edge network with the capabilities of Puppeteer for comprehensive web scraping tasks.

## 🚀 Key Features

- **Puppeteer Web Crawler**: A comprehensive, type-safe web crawling solution
- **Edge Computing**: Deployed on Cloudflare's global network for optimal performance
- **Automated Deployment**: Continuous deployment using GitHub Actions
- **Multiple Extraction Methods**: HTML, text, selector-based, and JavaScript execution
- **Browser Rendering**: Properly configured browser binding for Cloudflare Workers

## 🔧 Wrangler Action

The Wrangler Action allows you to deploy your Cloudflare Workers projects directly from GitHub Actions workflows.

### Usage

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
```

### ⚙️ Configuration

| Input | Description | Required | Default |
| ----- | ----------- | -------- | ------- |
| `apiToken` | Cloudflare API Token | Yes | - |
| `accountId` | Cloudflare Account ID | No | - |
| `wranglerVersion` | Version of Wrangler to use | No | `latest` |
| `workingDirectory` | Directory where your worker project is located | No | `.` |
| `command` | Custom command to run with Wrangler | No | `publish` |
| `secrets` | Secrets to be set in the worker environment | No | - |

## 🕸️ Puppeteer Web Crawler

A powerful, type-safe web crawling solution built on Cloudflare Workers and Puppeteer. The crawler provides multiple extraction methods and a flexible API for web scraping tasks.

## 🚀 Automatic Deployment

This project is configured for automatic deployment to Cloudflare Workers whenever code is pushed to the repository. The deployment process is handled by GitHub Actions and includes:

1. **Automatic Builds**: The code is automatically built using `npm run build`
2. **Testing**: All tests are run to ensure code quality
3. **Deployment**: The built code is deployed to Cloudflare Workers

The deployment is triggered on pushes to both the `main` and `Render-Version` branches.

### ✨ Features

- Multiple extraction methods:
  - HTML extraction
  - Text extraction
  - Selector-based extraction
  - JavaScript-executed content extraction
  - Custom JavaScript execution
- Type-safe implementation with TypeScript
- Comprehensive error handling
- Resource blocking capabilities
- Flexible configuration options
- Proper browser binding initialization with Puppeteer
- Per-request browser instance management

### 🔌 API Endpoints

The crawler provides RESTful API endpoints and supports legacy query parameter-based endpoints for backward compatibility.

#### 🌐 RESTful Endpoints

**Important:** Paths must match exactly (no trailing slashes) and use the correct HTTP method.

```
GET  /crawler/html?url=https://example.com
GET  /crawler/text?url=https://example.com
GET  /crawler/selector?url=https://example.com&selectors=h1,p
GET  /crawler/js?url=https://example.com
POST /crawler/execute?url=https://example.com
```

#### 🔄 Legacy Endpoints

```
GET  /crawler?url=https://example.com&type=html
GET  /crawler?url=https://example.com&type=text
GET  /crawler?url=https://example.com&type=selector&selectors=h1,p
GET  /crawler?url=https://example.com&type=js
POST /crawler?url=https://example.com&type=execute
```

### 📝 Usage Examples

#### HTML Extraction

```javascript
// Using fetch
const response = await fetch('https://your-worker.workers.dev/crawler/html?url=https://example.com');
const data = await response.json();
console.log(data.html);
```

#### Text Extraction

```javascript
// Using fetch
const response = await fetch('https://your-worker.workers.dev/crawler/text?url=https://example.com');
const data = await response.json();
console.log(data.text);
```

#### Selector Extraction

```javascript
// Using fetch
const response = await fetch('https://your-worker.workers.dev/crawler/selector?url=https://example.com&selectors=h1,p,a');
const data = await response.json();
data.elements.forEach(element => {
  console.log(`Selector: ${element.selector}`);
  element.results.forEach(result => {
    console.log(`- Text: ${result.text}`);
  });
});
```

#### Custom JavaScript Execution

```javascript
// Using fetch with POST
const script = `function() {
  return {
    title: document.title,
    links: Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.textContent,
      href: a.href
    }))
  };
}`;

const response = await fetch('https://your-worker.workers.dev/crawler/execute?url=https://example.com', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ script })
});

const data = await response.json();
console.log(data.result);
```

### 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/bta4935/Web-Agent.git
cd Web-Agent

# Install dependencies
npm install

# Start the development server
npm run dev
```

Test the crawler endpoints at `http://localhost:8787/crawler/html?url=https://example.com` (no trailing slash!)

### 🚢 Deployment

```bash
# Configure your wrangler.toml file

# Deploy to Cloudflare Workers
npm run deploy
```

Alternatively, push to the main branch and let GitHub Actions handle the deployment automatically.

## 📚 Documentation

For detailed API documentation, see [Information/API.md](Information/API.md).

## ❗ Troubleshooting: API route not found

If you receive `{ "error": "API route not found" }`, check the following:
- **Path must match exactly.** For example, use `/crawler/html`, not `/crawler/html/` (no trailing slash).
- **Use the correct HTTP method.** For example, `/crawler/html` only supports `GET`.
- **Check for typos or extra characters in the URL.**
- **Legacy endpoints:** `/crawler` must be used without a trailing slash and with the correct `type` parameter.

## 🧪 Testing

The project uses Vitest for testing. All 144 tests are passing across 15 test files, including HTML Extractor Tests, Text Extractor Tests, Selector Extractor Tests, and more.

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 🔧 Browser Binding Configuration

This project uses Cloudflare's Browser Rendering API with Puppeteer. The implementation includes:

- Proper ESM import syntax for Puppeteer: `import puppeteer from '@cloudflare/puppeteer'`
- Browser binding configuration in `wrangler.toml`
- Browser instance management with the `launchBrowser` utility function
- Per-request browser initialization to prevent "The receiver is not an RPC object" errors
- Comprehensive resource cleanup to prevent memory leaks

