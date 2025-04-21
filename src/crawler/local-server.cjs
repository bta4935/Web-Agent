/**
 * Local Express Server for Crawler Testing
 * 
 * This server provides:
 * 1. Static file serving for the test UI
 * 2. API endpoints that demonstrate crawler functionality using mock responses
 * 3. Test pages for crawler testing
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the test-ui directory
app.use(express.static(path.join(__dirname, 'test-ui')));

// CORS middleware to allow cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Mock responses for crawler endpoints
const createMockResponse = (url, status = 200, data = {}) => {
  return {
    url,
    status,
    timestamp: Date.now(),
    ...data
  };
};

// Serve test pages
app.get('/crawler/test-page/simple', (req, res) => {
  res.sendFile(path.join(__dirname, 'tests/fixtures/test-page.html'));
});

app.get('/crawler/test-page/complex', (req, res) => {
  res.sendFile(path.join(__dirname, 'tests/fixtures/complex-page.html'));
});

// API endpoint: Status
app.get('/crawler/status', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: Date.now()
  });
});

// API endpoint: HTML extraction
app.post('/crawler/html', (req, res) => {
  const { url, options } = req.body;
  
  if (!url) {
    return res.status(400).send('Missing required parameter: url');
  }
  
  // Read the test page HTML for the mock response
  let html;
  try {
    html = fs.readFileSync(path.join(__dirname, 'tests/fixtures/test-page.html'), 'utf-8');
  } catch (error) {
    html = '<html><body><h1>Test Page</h1></body></html>';
  }
  
  // Create mock response
  const response = createMockResponse(url, 200, {
    html,
    metadata: options?.includeMetadata ? {
      title: 'Test Page',
      description: 'A test page for crawler testing',
      'og:title': 'Test Page for Social Media',
      'og:description': 'This is how the page appears on social media'
    } : undefined
  });
  
  res.json(response);
});

// API endpoint: Text extraction
app.post('/crawler/text', (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).send('Missing required parameter: url');
  }
  
  // Create mock response
  const response = createMockResponse(url, 200, {
    text: 'Test Page\n\nThis is a test page for crawler testing.\n\nIt contains various elements for extraction testing.\n\nHeading 1\nParagraph 1\nHeading 2\nParagraph 2'
  });
  
  res.json(response);
});

// API endpoint: Selector extraction
app.post('/crawler/selector', (req, res) => {
  const { url, selectors } = req.body;
  
  if (!url) {
    return res.status(400).send('Missing required parameter: url');
  }
  
  if (!selectors || !Array.isArray(selectors)) {
    return res.status(400).send('Missing or invalid required parameter: selectors');
  }
  
  // Create mock element extraction results
  const elements = selectors.map(selector => {
    let results = [];
    
    if (selector === 'h1') {
      results = [{
        text: 'Heading 1',
        html: '<h1>Heading 1</h1>',
        attributes: [],
        top: 0,
        left: 0,
        width: 100,
        height: 50
      }];
    } else if (selector === 'p') {
      results = [{
        text: 'Paragraph 1',
        html: '<p>Paragraph 1</p>',
        attributes: [],
        top: 50,
        left: 0,
        width: 100,
        height: 20
      }];
    } else if (selector === 'a') {
      results = [
        {
          text: 'Link 1',
          html: '<a href="https://example.com/1">Link 1</a>',
          attributes: [{ name: 'href', value: 'https://example.com/1' }],
          top: 70,
          left: 0,
          width: 50,
          height: 20
        },
        {
          text: 'Link 2',
          html: '<a href="https://example.com/2">Link 2</a>',
          attributes: [{ name: 'href', value: 'https://example.com/2' }],
          top: 90,
          left: 0,
          width: 50,
          height: 20
        }
      ];
    }
    
    return {
      selector,
      results
    };
  });
  
  // Create mock response
  const response = createMockResponse(url, 200, {
    elements
  });
  
  res.json(response);
});

// API endpoint: JavaScript execution
app.post('/crawler/js', (req, res) => {
  const { url, options } = req.body;
  
  if (!url) {
    return res.status(400).send('Missing required parameter: url');
  }
  
  // Read the test page HTML for the mock response
  let html;
  try {
    html = fs.readFileSync(path.join(__dirname, 'tests/fixtures/test-page.html'), 'utf-8');
    // Simulate JavaScript execution by replacing placeholder content
    html = html.replace('This content will be replaced by JavaScript', 'This content was added by JavaScript');
  } catch (error) {
    html = '<html><body><h1>Test Page</h1><div>This content was added by JavaScript</div></body></html>';
  }
  
  // Create mock response
  const response = createMockResponse(url, 200, {
    html,
    text: 'Test Page\n\nThis is a test page for crawler testing.\n\nIt contains various elements for extraction testing.\n\nHeading 1\nParagraph 1\nHeading 2\nParagraph 2\n\nThis content was added by JavaScript'
  });
  
  res.json(response);
});

// API endpoint: Custom JavaScript execution
app.post('/crawler/custom-js', (req, res) => {
  const { url, script } = req.body;
  
  if (!url) {
    return res.status(400).send('Missing required parameter: url');
  }
  
  if (!script) {
    return res.status(400).send('Missing required parameter: script');
  }
  
  // Create mock result based on the script content
  let result;
  
  if (script.includes('document.querySelectorAll(\'a\')')) {
    // Script is likely extracting links
    result = {
      links: [
        { text: 'Link 1', href: 'https://example.com/1' },
        { text: 'Link 2', href: 'https://example.com/2' }
      ]
    };
  } else if (script.includes('document.title')) {
    // Script is likely extracting page metadata
    result = {
      title: 'Test Page',
      description: 'A test page for crawler testing'
    };
  } else {
    // Generic result
    result = {
      success: true,
      message: 'Custom JavaScript executed successfully',
      timestamp: Date.now()
    };
  }
  
  // Create mock response
  const response = createMockResponse(url, 200, {
    result
  });
  
  res.json(response);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Crawler test server running at http://localhost:3001`);
  console.log(`Test UI available at http://localhost:3001`);
  console.log(`Simple test page: http://localhost:3001/crawler/test-page/simple`);
  console.log(`Complex test page: http://localhost:3001/crawler/test-page/complex`);
});
