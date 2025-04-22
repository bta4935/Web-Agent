
API Endpoints
1. /crawler/html
Method: GET
Description: Extracts the full HTML of a page (after JS execution) using Puppeteer.
Handler: handleHtmlExtraction
2. /crawler/text
Method: GET
Description: Extracts all visible text content from a page.
Handler: handleTextExtraction
3. /crawler/selector
Method: GET
Description: Extracts content from elements matching specified CSS selectors.
Handler: handleSelectorExtraction
4. /crawler/js
Method: GET, POST
Description: Extracts HTML or text after custom JavaScript execution on the page.
Handler: handleJsExtraction
5. /crawler/execute
Method: POST
Description: Executes a custom JavaScript function on the page and returns the result.
Handler: handleCustomJsExecution
6. /crawler/sitemap
Method: GET
Description: Fetches and parses an XML sitemap, returning all discovered URLs.
Handler: handleSitemapRequest