/**
 * Crawler Demo Script (ES Modules)
 * 
 * This script demonstrates how to use the Puppeteer Web Crawler programmatically.
 * It shows examples of different extraction methods and how to handle the results.
 */

// Import Puppeteer
import puppeteer from '@cloudflare/puppeteer';
import { Crawler } from '../crawler.js';

async function runCrawlerDemo() {
  console.log('Starting Crawler Demo...');
  
  // Create a browser instance
  const browser = await puppeteer.launch({
    headless: true
  });
  
  try {
    // Initialize the crawler
    const crawler = new Crawler(browser);
    console.log('Crawler initialized successfully');
    
    // Define a test URL
    const url = 'https://example.com';
    
    // Example 1: Extract HTML content
    console.log('\n--- Example 1: HTML Extraction ---');
    const htmlResult = await crawler.extractHtml(url, { includeMetadata: true });
    console.log(`Status: ${htmlResult.status}`);
    if (htmlResult.metadata) {
      console.log(`Title: ${htmlResult.metadata.title}`);
    }
    console.log(`HTML length: ${htmlResult.html?.length} characters`);
    
    // Example 2: Extract visible text content
    console.log('\n--- Example 2: Text Extraction ---');
    const textResult = await crawler.extractText(url);
    console.log(`Status: ${textResult.status}`);
    console.log(`Text: ${textResult.text?.substring(0, 100)}...`);
    
    // Example 3: Extract elements using CSS selectors
    console.log('\n--- Example 3: Selector Extraction ---');
    const selectorResult = await crawler.extractBySelector(url, ['h1', 'p', 'a']);
    console.log(`Status: ${selectorResult.status}`);
    
    if (selectorResult.elements) {
      console.log(`Number of selector results: ${selectorResult.elements.length}`);
      
      // Display the first result for each selector
      for (const element of selectorResult.elements) {
        console.log(`\nSelector: ${element.selector}`);
        console.log(`Found ${element.results.length} elements`);
        if (element.results.length > 0) {
          console.log(`First element text: ${element.results[0].text}`);
        }
      }
    }
    
    // Example 4: Extract content after JavaScript execution
    console.log('\n--- Example 4: JavaScript Execution ---');
    const jsResult = await crawler.extractAfterJsExecution(url);
    console.log(`Status: ${jsResult.status}`);
    console.log(`HTML after JS execution length: ${jsResult.html?.length} characters`);
    console.log(`Text after JS execution: ${jsResult.text?.substring(0, 100)}...`);
    
    // Example 5: Execute custom function
    console.log('\n--- Example 5: Custom Function Execution ---');
    const customFnResult = await crawler.executeCustomFunction(url, `
      function() {
        // Extract all links from the page
        const links = Array.from(document.querySelectorAll('a')).map(a => ({
          text: a.textContent,
          href: a.href
        }));
        
        // Extract meta information
        const meta = {};
        Array.from(document.querySelectorAll('meta')).forEach(m => {
          const name = m.getAttribute('name') || m.getAttribute('property');
          if (name) meta[name] = m.getAttribute('content');
        });
        
        return { links, meta };
      }
    `);
    
    console.log(`Status: ${customFnResult.status}`);
    if (customFnResult.result) {
      console.log(`Found ${customFnResult.result.links?.length} links`);
      console.log('Meta information:', customFnResult.result.meta);
    }
    
    // Example 6: Error handling
    console.log('\n--- Example 6: Error Handling ---');
    const errorResult = await crawler.extractHtml('https://this-url-does-not-exist.example');
    console.log(`Status: ${errorResult.status}`);
    console.log(`Error: ${errorResult.error}`);
    
    console.log('\nCrawler Demo completed successfully!');
  } catch (error) {
    console.error('Error in Crawler Demo:', error);
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the demo
runCrawlerDemo().catch(console.error);
