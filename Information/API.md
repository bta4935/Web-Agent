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

The crawler provides the following API endpoints in two styles: RESTful and legacy query parameter-based. Both styles are fully supported and functionally equivalent.

### HTML Extraction

Extract the full HTML content of a web page.

**Endpoint:** `/crawler/html`

**Method:** `GET` or `POST`

**Query Parameters:**
- `url` (required): The URL of the web page to crawl
- `includeMetadata` (optional): Set to `true` to include page metadata (title, description, etc.)
- `removeScripts` (optional): Set to `true` to remove script tags from the HTML
- `removeStyles` (optional): Set to `true` to remove style tags from the HTML
- `timeout` (optional): Timeout in milliseconds (default: 30000)
- `waitUntil` (optional): Navigation wait strategy ('load', 'domcontentloaded', 'networkidle0', 'networkidle2')
- `userAgent` (optional): Custom user agent string
- `viewportWidth` (optional): Viewport width in pixels
- `viewportHeight` (optional): Viewport height in pixels
- `blockImages` (optional): Set to `true` to block image loading
- `blockFonts` (optional): Set to `true` to block font loading
- `blockCSS` (optional): Set to `true` to block CSS loading

**Example Request:**
```bash
curl -X GET "http://localhost:8787/crawler/html?url=https://example.com&includeMetadata=true"
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

**Method:** `GET` or `POST`

**Query Parameters:**
- `url` (required): The URL of the web page to crawl
- `preserveNewlines` (optional): Set to `true` to preserve newline characters
- `includeHiddenText` (optional): Set to `true` to include hidden text
- `timeout` (optional): Timeout in milliseconds (default: 30000)
- `waitUntil` (optional): Navigation wait strategy ('load', 'domcontentloaded', 'networkidle0', 'networkidle2')
- Other crawler options as described in HTML extraction

**Example Request:**
```bash
curl -X GET "http://localhost:8787/crawler/text?url=https://example.com&preserveNewlines=true"
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

**Method:** `GET` or `POST`

**Query Parameters:**
- `url` (required): The URL of the web page to crawl
- `selectors` (required): CSS selectors to extract, as a comma-separated list or JSON array
- `includeAttributes` (optional): Set to `true` to include element attributes
- `includeHTML` (optional): Set to `true` to include element HTML
- `includePosition` (optional): Set to `true` to include element position information
- Other crawler options as described in HTML extraction

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

### JavaScript Execution

Extract content after JavaScript execution on the page.

**Endpoint:** `/crawler/js`

**Method:** `GET` or `POST`

**Query Parameters:**
- `url` (required): The URL of the web page to crawl
- `waitTime` (optional): Time to wait in milliseconds after page load
- `selectors` (optional): CSS selectors to extract after JavaScript execution
- Other crawler options as described in HTML extraction

**POST Body (optional):**
```json
{
  "customScript": "// JavaScript to execute on the page"
}
```

**Example Request:**
```bash
curl -X GET "http://localhost:8787/crawler/js?url=https://example.com&waitTime=2000"
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

**Method:** `POST`

**Query Parameters:**
- `url` (required): The URL of the web page to crawl
- Other crawler options as described in HTML extraction

**POST Body (required):**
```json
{
  "script": "function() { return { title: document.title, links: Array.from(document.querySelectorAll('a')).map(a => ({ text: a.textContent, href: a.href })) }; }",
  "args": [] // Optional arguments to pass to the script
}
```

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

For backward compatibility, the crawler also supports a legacy query parameter-based API style:

**Base Endpoint:** `/crawler`

**Method:** `GET` or `POST`

**Query Parameters:**
- `url` (required): The URL of the web page to crawl
- `type` (required): The extraction type, one of: `html`, `text`, `selector`, `js`, or `execute`
- Other parameters as described in the respective RESTful endpoint sections

**Example Requests:**
```bash
# HTML extraction
curl -X GET "http://localhost:8787/crawler?url=https://example.com&type=html"

# Text extraction
curl -X GET "http://localhost:8787/crawler?url=https://example.com&type=text"

# Selector extraction
curl -X GET "http://localhost:8787/crawler?url=https://example.com&type=selector&selectors=h1,p,a"

# JavaScript execution
curl -X GET "http://localhost:8787/crawler?url=https://example.com&type=js&waitTime=2000"

# Custom JavaScript execution
curl -X POST "http://localhost:8787/crawler?url=https://example.com&type=execute" \
  -H "Content-Type: application/json" \
  -d '{"script": "function() { return { title: document.title, links: Array.from(document.querySelectorAll(\"a\")).map(a => ({ text: a.textContent, href: a.href })) }; }"}'
```

The response formats are identical to those of the corresponding RESTful endpoints.

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
