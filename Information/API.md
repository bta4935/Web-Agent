# Puppeteer Web Crawler API Documentation

This document provides comprehensive documentation for the Puppeteer Web Crawler API endpoints.

## Base URL

All API endpoints are relative to the base URL of your deployed Cloudflare Worker:

```
https://your-worker.your-subdomain.workers.dev
```

For local development, the base URL is:

```
http://localhost:8787
```

## API Endpoints

The crawler provides the following API endpoints. **Paths must match exactly (no trailing slashes)** and use the correct HTTP method as shown below.

### HTML Extraction

Extract the full HTML content of a web page.

**Endpoint:** `/crawler/html`  
**Method:** `GET` (**no trailing slash!**)

**Example Request:**
```bash
curl -X GET "http://localhost:8787/crawler/html?url=https://example.com"
```

**Example Response:**
```json
{
  "url": "https://example.com",
  "status": 200,
  "timestamp": 1650465789123,
  "html": "<!DOCTYPE html><html>...</html>",
  "metadata": {
    "title": "Example Domain",
    "description": "Example website for demonstration purposes"
  }
}
```

### Text Extraction

Extract only the visible text content from a web page.

**Endpoint:** `/crawler/text`  
**Method:** `GET` (**no trailing slash!**)

**Example Request:**
```bash
curl -X GET "http://localhost:8787/crawler/text?url=https://example.com"
```

**Example Response:**
```json
{
  "url": "https://example.com",
  "status": 200,
  "timestamp": 1650465789123,
  "text": "Example Domain\n\nThis domain is for use in illustrative examples in documents."
}
```

### Selector Extraction

Extract specific elements from a web page using CSS selectors.

**Endpoint:** `/crawler/selector`  
**Method:** `GET` (**no trailing slash!**)

**Example Request:**
```bash
curl -X GET "http://localhost:8787/crawler/selector?url=https://example.com&selectors=h1,p,a"
```

**Example Response:**
```json
{
  "url": "https://example.com",
  "status": 200,
  "timestamp": 1650465789123,
  "elements": [
    {
      "selector": "h1",
      "results": [
        {
          "text": "Example Domain",
          "html": "<h1>Example Domain</h1>",
          "attributes": [],
          "top": 0,
          "left": 0,
          "width": 100,
          "height": 50
        }
      ]
    },
    {
      "selector": "p",
      "results": [
        {
          "text": "This domain is for use in illustrative examples in documents.",
          "html": "<p>This domain is for use in illustrative examples in documents.</p>",
          "attributes": [],
          "top": 50,
          "left": 0,
          "width": 100,
          "height": 20
        }
      ]
    }
  ]
}
```

### JavaScript Extraction

Extract content after running JavaScript on the page (e.g., after client-side rendering).

**Endpoint:** `/crawler/js`  
**Method:** `GET` (**no trailing slash!**)

**Important:** Ensure the path is exact and does not include a trailing slash. Use the correct HTTP method (`GET`).

**Example Request:**
```bash
curl -X GET "http://localhost:8787/crawler/js?url=https://example.com"
```

**Example Response:**
```json
{
  "url": "https://example.com",
  "status": 200,
  "timestamp": 1650465789123,
  "html": "<!DOCTYPE html><html>...</html>",
  "text": "Example Domain\n\nThis domain is for use in illustrative examples in documents."
}
```

### Custom JavaScript Execution

Execute custom JavaScript on a web page and return the result.

**Endpoint:** `/crawler/execute`  
**Method:** `POST` (**no trailing slash!**)

**Example Request:**
```bash
curl -X POST "http://localhost:8787/crawler/execute?url=https://example.com" \
  -H "Content-Type: application/json" \
  -d '{"script": "function() { return { title: document.title, links: Array.from(document.querySelectorAll(\"a\")).map(a => ({ text: a.textContent, href: a.href })) }; }"}'
```

**Example Response:**
```json
{
  "url": "https://example.com",
  "status": 200,
  "timestamp": 1650465789123,
  "result": {
    "title": "Example Domain",
    "links": [
      {
        "text": "More information...",
        "href": "https://www.iana.org/domains/example"
      }
    ]
  }
}
```

## Legacy Query Parameter-Based Endpoints

For backward compatibility, the crawler also supports a legacy query parameter-based API style. **Paths must match exactly and use the correct method.**

**Base Endpoint:** `/crawler`  
**Method:** `GET` (**no trailing slash!**)

**Example Requests:**
```bash
curl -X GET "http://localhost:8787/crawler?url=https://example.com&type=html"
curl -X GET "http://localhost:8787/crawler?url=https://example.com&type=text"
curl -X GET "http://localhost:8787/crawler?url=https://example.com&type=selector&selectors=h1,p,a"
curl -X GET "http://localhost:8787/crawler?url=https://example.com&type=js"
curl -X POST "http://localhost:8787/crawler?url=https://example.com&type=execute" \
  -H "Content-Type: application/json" \
  -d '{"script": "function() { return { title: document.title, links: Array.from(document.querySelectorAll(\"a\")).map(a => ({ text: a.textContent, href: a.href })) }; }"}'
```

## Troubleshooting: API route not found

If you receive `{ "error": "API route not found" }`, check the following:
- **Path must match exactly.** For example, use `/crawler/html`, not `/crawler/html/` (no trailing slash).
- **Use the correct HTTP method.** For example, `/crawler/html` only supports `GET`.
- **Check for typos or extra characters in the URL.**
- **Legacy endpoints:** `/crawler` must be used without a trailing slash and with the correct `type` parameter.

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: Request successful
- `400 Bad Request`: Invalid parameters or request
- `404 Not Found`: Resource not found
- `405 Method Not Allowed`: Incorrect HTTP method
- `500 Internal Server Error`: Server error

Error responses include a JSON body with error details:

```json
{
  "error": "Error message"
}
```

## Crawler Options

The following options can be applied to all endpoints:

| Option | Type | Description |
|--------|------|-------------|
| `timeout` | number | Request timeout in milliseconds (default: 30000) |
| `waitUntil` | string | Navigation wait strategy ('load', 'domcontentloaded', 'networkidle0', 'networkidle2') |
| `userAgent` | string | Custom user agent string |
| `viewportWidth` | number | Viewport width in pixels |
| `viewportHeight` | number | Viewport height in pixels |
| `blockImages` | boolean | Block image loading (default: true) |
| `blockFonts` | boolean | Block font loading (default: true) |
| `blockCSS` | boolean | Block CSS loading (default: false) |
