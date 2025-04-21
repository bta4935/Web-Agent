/**
 * Crawler API Server
 * 
 * This file sets up a Cloudflare Worker that exposes the crawler functionality
 * through HTTP endpoints for manual testing.
 */

import { Crawler } from './crawler';
import { CrawlerOptions } from './types';

// Import Puppeteer
const puppeteer = require('@cloudflare/puppeteer');

// Initialize browser instance
let browserPromise: Promise<any> | null = null;

// Get or create a browser instance
async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true
    });
  }
  return browserPromise;
}

// Handle requests to the worker
export default {
  async fetch(request: Request, env: any, ctx: any) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Add CORS headers to allow testing from any origin
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // Handle OPTIONS requests for CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    
    // Only accept POST requests for API endpoints
    if (request.method !== 'POST' && !path.startsWith('/crawler/test-page')) {
      return new Response('Method not allowed. Use POST for API endpoints.', {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain'
        }
      });
    }
    
    try {
      // Serve test pages for local testing
      if (path === '/crawler/test-page/simple') {
        return new Response(getSimpleTestPage(), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html'
          }
        });
      }
      
      if (path === '/crawler/test-page/complex') {
        // In a real implementation, this would load the complex test page
        return new Response(getComplexTestPage(), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html'
          }
        });
      }
      
      // Parse the request body for API endpoints
      let requestData: any = {};
      if (request.body) {
        try {
          requestData = await request.json();
        } catch (error) {
          return new Response('Invalid JSON body', {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/plain'
            }
          });
        }
      }
      
      // Validate required parameters
      if (!requestData.url && path !== '/crawler/status') {
        return new Response('Missing required parameter: url', {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain'
          }
        });
      }
      
      // Get the browser instance
      const browser = await getBrowser();
      
      // Initialize the crawler
      const crawler = new Crawler(browser);
      
      // Process the request based on the path
      let result;
      
      switch (path) {
        case '/crawler/status':
          // Return the status of the crawler
          result = {
            status: 'ok',
            version: '1.0.0',
            timestamp: Date.now()
          };
          break;
          
        case '/crawler/html':
          // Extract HTML content
          result = await crawler.extractHtml(
            requestData.url,
            requestData.options as ExtractionOptions
          );
          break;
          
        case '/crawler/text':
          // Extract text content
          result = await crawler.extractText(
            requestData.url,
            requestData.options
          );
          break;
          
        case '/crawler/selector':
          // Extract content by selector
          if (!requestData.selectors) {
            return new Response('Missing required parameter: selectors', {
              status: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'text/plain'
              }
            });
          }
          
          result = await crawler.extractBySelector(
            requestData.url,
            requestData.selectors,
            requestData.options
          );
          break;
          
        case '/crawler/js':
          // Extract content after JavaScript execution
          result = await crawler.extractAfterJsExecution(
            requestData.url,
            requestData.options
          );
          break;
          
        case '/crawler/custom-js':
          // Execute custom JavaScript
          if (!requestData.script) {
            return new Response('Missing required parameter: script', {
              status: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'text/plain'
              }
            });
          }
          
          result = await crawler.executeCustomFunction(
            requestData.url,
            requestData.script,
            ...(requestData.args || [])
          );
          break;
          
        default:
          return new Response('Endpoint not found', {
            status: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/plain'
            }
          });
      }
      
      // Return the result as JSON
      return new Response(JSON.stringify(result, null, 2), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error processing request:', error);
      
      // Return error response
      return new Response(`Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain'
        }
      });
    }
  }
};

// Simple test page for local testing
function getSimpleTestPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Simple test page for crawler testing">
  <title>Simple Test Page</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .hidden { display: none; }
    .dynamic-content { background-color: #f0f0f0; padding: 10px; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Simple Test Page</h1>
  <p>This is a simple test page for the Puppeteer Web Crawler.</p>
  
  <div class="section">
    <h2>Static Content</h2>
    <p>This is static content that should be easily extractable.</p>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </ul>
  </div>
  
  <div class="section">
    <h2>Hidden Content</h2>
    <p>The following content should not be visible in text extraction:</p>
    <p class="hidden">This text is hidden and should not be extracted.</p>
  </div>
  
  <div class="section">
    <h2>Dynamic Content</h2>
    <p>The following content will be loaded dynamically:</p>
    <div id="dynamic-content" class="dynamic-content">
      This content will be replaced by JavaScript.
    </div>
    <button id="load-data">Load Dynamic Content</button>
  </div>
  
  <script>
    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', function() {
      // Add event listener to the button
      document.getElementById('load-data').addEventListener('click', function() {
        loadDynamicContent();
      });
      
      // Automatically load dynamic content after 1 second
      setTimeout(loadDynamicContent, 1000);
    });
    
    // Function to load dynamic content
    function loadDynamicContent() {
      const dynamicContent = document.getElementById('dynamic-content');
      dynamicContent.innerHTML = \`
        <h3>Dynamically Loaded Content</h3>
        <p>This content was loaded by JavaScript at \${new Date().toLocaleTimeString()}</p>
        <ul>
          <li>Dynamic item 1</li>
          <li>Dynamic item 2</li>
          <li>Dynamic item 3</li>
        </ul>
      \`;
    }
  </script>
</body>
</html>`;
}

// Complex test page for local testing
function getComplexTestPage() {
  // In a real implementation, this would load the complex test page from a file
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Complex test page for advanced crawler testing">
  <meta property="og:title" content="Complex Crawler Test Page">
  <meta property="og:description" content="A page with complex structures for testing advanced extraction">
  <title>Complex Crawler Test Page</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .card { border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin-bottom: 20px; }
    .hidden { display: none; }
    .nested-level-1 { margin-left: 20px; border-left: 2px solid #ccc; padding-left: 10px; }
    .nested-level-2 { margin-left: 20px; border-left: 2px solid #999; padding-left: 10px; }
    .dynamic-content { background-color: #f0f0f0; padding: 10px; margin-top: 20px; }
  </style>
</head>
<body>
  <header>
    <h1>Complex Crawler Test Page</h1>
    <p>This page contains complex HTML structures and JavaScript interactions for testing advanced extraction capabilities.</p>
  </header>
  
  <main>
    <section class="card">
      <h2>Semantic HTML Structures</h2>
      
      <article data-importance="high" data-id="featured-article">
        <h3>Featured Article</h3>
        <p>This is a semantically structured article with high importance.</p>
      </article>
      
      <div class="grid-container">
        <article data-importance="medium" data-id="article-1">
          <h3>Structured Content 1</h3>
          <p>This is a medium importance article in a grid layout.</p>
        </article>
        
        <article data-importance="medium" data-id="article-2">
          <h3>Structured Content 2</h3>
          <p>This is another medium importance article in a grid layout.</p>
        </article>
      </div>
    </section>
    
    <section class="card">
      <h2>Nested Structures</h2>
      
      <div class="nested-level-1" data-level="level-1">
        <h3>Level 1 content</h3>
        <p>This is nested at level 1.</p>
        
        <div class="nested-level-2" data-level="level-2">
          <h4>Level 2 content</h4>
          <p>This is nested at level 2.</p>
          
          <div class="nested-level-2" data-level="level-3">
            <h5>Level 3 content</h5>
            <p>This is nested at level 3.</p>
          </div>
        </div>
      </div>
    </section>
    
    <section class="card">
      <h2>Dynamic Content</h2>
      <div id="dynamic-content" class="dynamic-content">
        This content will be replaced by JavaScript.
      </div>
      <button id="load-data">Load Dynamic Content</button>
    </section>
    
    <section class="card">
      <h2>Shadow DOM Example</h2>
      <div id="shadow-host">Shadow DOM will be attached here</div>
    </section>
  </main>
  
  <footer>
    <p>&copy; 2025 Crawler Test Page</p>
  </footer>
  
  <script>
    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', function() {
      // Add event listener to the button
      document.getElementById('load-data').addEventListener('click', function() {
        loadDynamicContent();
      });
      
      // Automatically load dynamic content after 1 second
      setTimeout(loadDynamicContent, 1000);
      
      // Create Shadow DOM
      createShadowDOM();
    });
    
    // Function to load dynamic content
    function loadDynamicContent() {
      const dynamicContent = document.getElementById('dynamic-content');
      dynamicContent.innerHTML = \`
        <h3>Dynamically Loaded Content</h3>
        <p>This content was loaded by JavaScript at \${new Date().toLocaleTimeString()}</p>
        <div class="dynamic-data">
          <h4>Dynamic Data</h4>
          <ul id="dynamic-list">
            <li data-id="item-1">Dynamic item 1</li>
            <li data-id="item-2">Dynamic item 2</li>
            <li data-id="item-3">Dynamic item 3</li>
          </ul>
        </div>
      \`;
      
      // Add event listeners to dynamic items
      document.querySelectorAll('#dynamic-list li').forEach(item => {
        item.addEventListener('click', function() {
          alert('Clicked: ' + this.textContent);
        });
      });
    }
    
    // Function to create Shadow DOM
    function createShadowDOM() {
      const host = document.getElementById('shadow-host');
      const shadowRoot = host.attachShadow({mode: 'open'});
      
      shadowRoot.innerHTML = \`
        <style>
          p { color: red; }
          .shadow-content { border: 1px dashed #999; padding: 10px; margin-top: 10px; }
        </style>
        <div class="shadow-content">
          <h3>Shadow DOM Content</h3>
          <p>This content is inside a Shadow DOM.</p>
          <button id="shadow-button">Shadow DOM Button</button>
        </div>
      \`;
      
      // Add event listener to shadow button
      shadowRoot.getElementById('shadow-button').addEventListener('click', function() {
        alert('Shadow DOM button clicked!');
      });
    }
  </script>
</body>
</html>`;
}
