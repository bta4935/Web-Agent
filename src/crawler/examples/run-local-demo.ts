/**
 * Local Crawler Demo Script
 * 
 * This script runs a local web server to serve the test site and then
 * runs the crawler against it to demonstrate the crawler's functionality.
 */

import { Crawler } from '../crawler';
// Import Puppeteer but avoid type issues by using require
const puppeteer = require('@cloudflare/puppeteer');
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to the test site
const TEST_SITE_PATH = path.join(__dirname, 'test-site', 'index.html');

// Create a simple HTTP server to serve the test site
async function startLocalServer(port: number = 3000): Promise<http.Server> {
  const server = http.createServer((req, res) => {
    fs.readFile(TEST_SITE_PATH, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end(`Error loading test site: ${err.message}`);
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  });
  
  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`Local test server running at http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function runLocalCrawlerDemo() {
  console.log('Starting Local Crawler Demo...');
  
  // Start the local server
  const server = await startLocalServer();
  const localUrl = 'http://localhost:3000';
  
  // Create a browser instance
  const browser = await puppeteer.launch({
    headless: true
  });
  
  try {
    // Initialize the crawler
    const crawler = new Crawler(browser);
    console.log('Crawler initialized successfully');
    
    // Example 1: Extract HTML content
    console.log('\n--- Example 1: HTML Extraction ---');
    const htmlResult = await crawler.extractHtml(localUrl, { includeMetadata: true });
    console.log(`Status: ${htmlResult.status}`);
    console.log(`Title: ${htmlResult.metadata?.title}`);
    console.log(`Description: ${htmlResult.metadata?.description}`);
    console.log(`HTML length: ${htmlResult.html?.length} characters`);
    
    // Example 2: Extract visible text content
    console.log('\n--- Example 2: Text Extraction ---');
    const textResult = await crawler.extractText(localUrl);
    console.log(`Status: ${textResult.status}`);
    console.log(`Text excerpt: ${textResult.text?.substring(0, 100)}...`);
    
    // Example 3: Extract elements using CSS selectors
    console.log('\n--- Example 3: Selector Extraction ---');
    const selectorResult = await crawler.extractBySelector(localUrl, [
      'h1', 
      'h2', 
      '.item', 
      'table tr'
    ]);
    
    console.log(`Status: ${selectorResult.status}`);
    
    if (selectorResult.elements) {
      const elements = selectorResult.elements;
      
      // Check if elements is an array (ElementExtractionResult[])
      if (Array.isArray(elements)) {
        console.log(`Number of selector results: ${elements.length}`);
        
        // Display the first result for each selector
        for (const element of elements) {
          console.log(`\nSelector: ${element.selector}`);
          console.log(`Found ${element.results.length} elements`);
          if (element.results.length > 0) {
            console.log(`First element text: ${element.results[0].text}`);
          }
        }
      } else {
        // Handle Record<string, string[]> case
        const selectorCount = Object.keys(elements).length;
        console.log(`Number of selector results: ${selectorCount}`);
        
        // Display results for each selector
        for (const [selector, results] of Object.entries(elements)) {
          console.log(`\nSelector: ${selector}`);
          console.log(`Found ${results.length} elements`);
          if (results.length > 0) {
            console.log(`First element text: ${results[0]}`);
          }
        }
      }
    }
    
    // Example 4: Extract content after JavaScript execution
    console.log('\n--- Example 4: JavaScript Execution ---');
    const jsResult = await crawler.extractAfterJsExecution(localUrl, {
      // Removed waitTime: 3000 as it is not a valid ExtractionOptions property
    });
    
    console.log(`Status: ${jsResult.status}`);
    console.log(`HTML after JS execution contains dynamic content: ${jsResult.html?.includes('Dynamically Loaded Content')}`);
    console.log(`Text after JS execution contains dynamic items: ${jsResult.text?.includes('Dynamic item')}`);
    
    // Example 5: Execute custom JavaScript
    console.log('\n--- Example 5: Custom JavaScript Execution ---');
    const customJsResult = await crawler.executeCustomFunction(localUrl, `
      // Wait for dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Extract all headings
      const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
        level: h.tagName,
        text: h.textContent.trim()
      }));
      
      // Extract dynamic content
      const dynamicContent = document.getElementById('dynamic-content');
      const dynamicItems = Array.from(document.querySelectorAll('#dynamic-list li')).map(li => li.textContent.trim());
      
      return { 
        headings, 
        dynamicContent: dynamicContent.innerHTML,
        dynamicItems
      };
    `);
    
    console.log(`Status: ${customJsResult.status}`);
    if (customJsResult.result) {
      console.log(`Found ${customJsResult.result.headings?.length} headings`);
      console.log(`Dynamic items: ${JSON.stringify(customJsResult.result.dynamicItems)}`);
    }
    
    console.log('\nLocal Crawler Demo completed successfully!');
  } catch (error) {
    console.error('Error in Local Crawler Demo:', error);
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed');
    
    // Close the server
    server.close(() => {
      console.log('Local test server closed');
    });
  }
}

// Run the demo
runLocalCrawlerDemo().catch(console.error);
