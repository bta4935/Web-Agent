By following this guide, you will create a Worker that uses the Browser Rendering API to take screenshots from web pages. This is a common use case for browser automation.

1. Sign up for a [Cloudflare account](https://dash.cloudflare.com/sign-up/workers-and-pages).
2. Install [`Node.js`](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

## 1. Create a Worker project

[Cloudflare Workers](https://developers.cloudflare.com/workers/) provides a serverless execution environment that allows you to create new applications or augment existing ones without configuring or maintaining infrastructure. Your Worker application is a container to interact with a headless browser to do actions, such as taking screenshots.

Create a new Worker project named `browser-worker` by running:

* npm

  ```sh
  npm create cloudflare@latest -- browser-worker
  ```

* pnpm

  ```sh
  pnpm create cloudflare@latest browser-worker
  ```

* yarn

  ```sh
  yarn create cloudflare browser-worker
  ```

For setup, select the following options:

* For *What would you like to start with?*, choose `Hello World Starter`.
* For *Which template would you like to use?*, choose `Worker only`.
* For *Which language do you want to use?*, choose `JavaScript / TypeScript`.
* For *Do you want to use git for version control?*, choose `Yes`.
* For *Do you want to deploy your application?*, choose `No` (we will be making some changes before deploying).

## 2. Install Puppeteer

In your `browser-worker` directory, install Cloudflare’s [fork of Puppeteer](https://developers.cloudflare.com/browser-rendering/platform/puppeteer/):

```sh
npm install @cloudflare/puppeteer --save-dev
```

## 3. Create a KV namespace

Browser Rendering can be used with other developer products. You might need a [relational database](https://developers.cloudflare.com/d1/), an [R2 bucket](https://developers.cloudflare.com/r2/) to archive your crawled pages and assets, a [Durable Object](https://developers.cloudflare.com/durable-objects/) to keep your browser instance alive and share it with multiple requests, or [Queues](https://developers.cloudflare.com/queues/) to handle your jobs asynchronous.

For the purpose of this guide, you are going to use a [KV store](https://developers.cloudflare.com/kv/concepts/kv-namespaces/) to cache your screenshots.

Create two namespaces, one for production, and one for development.

```sh
npx wrangler kv namespace create BROWSER_KV_DEMO
npx wrangler kv namespace create BROWSER_KV_DEMO --preview
```

Take note of the IDs for the next step.

## 4. Configure the Wrangler configuration file

Configure your `browser-worker` project's [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/) by adding a browser [binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/) and a [Node.js compatibility flag](https://developers.cloudflare.com/workers/configuration/compatibility-flags/#nodejs-compatibility-flag). Bindings allow your Workers to interact with resources on the Cloudflare developer platform. Your browser `binding` name is set by you, this guide uses the name `MYBROWSER`. Browser bindings allow for communication between a Worker and a headless browser which allows you to do actions such as taking a screenshot, generating a PDF and more.

Update your [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/) with the Browser Rendering API binding and the KV namespaces you created:

* wrangler.jsonc

  ```jsonc
  {
    "name": "browser-worker",
    "main": "src/index.js",
    "compatibility_date": "2023-03-14",
    "compatibility_flags": [
      "nodejs_compat"
    ],
    "browser": {
      "binding": "MYBROWSER"
    },
    "kv_namespaces": [
      {
        "binding": "BROWSER_KV_DEMO",
        "id": "22cf855786094a88a6906f8edac425cd",
        "preview_id": "e1f8b68b68d24381b57071445f96e623"
      }
    ]
  }
  ```

* wrangler.toml

  ```toml
  name = "browser-worker"
  main = "src/index.js"
  compatibility_date = "2023-03-14"
  compatibility_flags = [ "nodejs_compat" ]


  browser = { binding = "MYBROWSER" }
  kv_namespaces = [
    { binding = "BROWSER_KV_DEMO", id = "22cf855786094a88a6906f8edac425cd", preview_id = "e1f8b68b68d24381b57071445f96e623" }
  ]
  ```

## 5. Code

* JavaScript

  Update `src/index.js` with your Worker code:

  ```js
  import puppeteer from "@cloudflare/puppeteer";


  export default {
    async fetch(request, env) {
      const { searchParams } = new URL(request.url);
      let url = searchParams.get("url");
      let img;
      if (url) {
        url = new URL(url).toString(); // normalize
        img = await env.BROWSER_KV_DEMO.get(url, { type: "arrayBuffer" });
        if (img === null) {
          const browser = await puppeteer.launch(env.MYBROWSER);
          const page = await browser.newPage();
          await page.goto(url);
          img = await page.screenshot();
          await env.BROWSER_KV_DEMO.put(url, img, {
            expirationTtl: 60 * 60 * 24,
          });
          await browser.close();
        }
        return new Response(img, {
          headers: {
            "content-type": "image/jpeg",
          },
        });
      } else {
        return new Response("Please add an ?url=https://example.com/ parameter");
      }
    },
  };
  ```

* TypeScript

  Update `src/index.ts` with your Worker code:

  ```ts
  import puppeteer from "@cloudflare/puppeteer";


  interface Env {
    MYBROWSER: Fetcher;
    BROWSER_KV_DEMO: KVNamespace;
  }


  export default {
    async fetch(request, env): Promise<Response> {
      const { searchParams } = new URL(request.url);
      let url = searchParams.get("url");
      let img: Buffer;
      if (url) {
        url = new URL(url).toString(); // normalize
        img = await env.BROWSER_KV_DEMO.get(url, { type: "arrayBuffer" });
        if (img === null) {
          const browser = await puppeteer.launch(env.MYBROWSER);
          const page = await browser.newPage();
          await page.goto(url);
          img = (await page.screenshot()) as Buffer;
          await env.BROWSER_KV_DEMO.put(url, img, {
            expirationTtl: 60 * 60 * 24,
          });
          await browser.close();
        }
        return new Response(img, {
          headers: {
            "content-type": "image/jpeg",
          },
        });
      } else {
        return new Response("Please add an ?url=https://example.com/ parameter");
      }
    },
  } satisfies ExportedHandler<Env>;
  ```

This Worker instantiates a browser using Puppeteer, opens a new page, navigates to what you put in the `"url"` parameter, takes a screenshot of the page, stores the screenshot in KV, closes the browser, and responds with the JPEG image of the screenshot.

If your Worker is running in production, it will store the screenshot to the production KV namespace. If you are running `wrangler dev`, it will store the screenshot to the dev KV namespace.

If the same `"url"` is requested again, it will use the cached version in KV instead, unless it expired.

## 6. Test

Run [`npx wrangler dev --remote`](https://developers.cloudflare.com/workers/wrangler/commands/#dev) to test your Worker remotely before deploying to Cloudflare's global network. Local mode support does not exist for Browser Rendering so `--remote` is required.

To test taking your first screenshot, go to the following URL:

`<LOCAL_HOST_URL>/?url=https://example.com`

## 7. Deploy

Run `npx wrangler deploy` to deploy your Worker to the Cloudflare global network.

To take your first screenshot, go to the following URL:

`<YOUR_WORKER>.<YOUR_SUBDOMAIN>.workers.dev/?url=https://example.com`

## Related resources

* Other [Puppeteer examples](https://github.com/cloudflare/puppeteer/tree/main/examples)


---------------------------------------
By following this guide, you will create a Worker that uses the Browser Rendering API along with [Durable Objects](https://developers.cloudflare.com/durable-objects/) to take screenshots from web pages and store them in [R2](https://developers.cloudflare.com/r2/).

Using Durable Objects to persist browser sessions improves performance by eliminating the time that it takes to spin up a new browser session. Since Durable Objects re-uses sessions, it reduces the number of concurrent sessions needed.

1. Sign up for a [Cloudflare account](https://dash.cloudflare.com/sign-up/workers-and-pages).
2. Install [`Node.js`](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

## 1. Create a Worker project

[Cloudflare Workers](https://developers.cloudflare.com/workers/) provides a serverless execution environment that allows you to create new applications or augment existing ones without configuring or maintaining infrastructure. Your Worker application is a container to interact with a headless browser to do actions, such as taking screenshots.

Create a new Worker project named `browser-worker` by running:

* npm

  ```sh
  npm create cloudflare@latest -- browser-worker
  ```

* pnpm

  ```sh
  pnpm create cloudflare@latest browser-worker
  ```

* yarn

  ```sh
  yarn create cloudflare browser-worker
  ```

## 2. Install Puppeteer

In your `browser-worker` directory, install Cloudflare’s [fork of Puppeteer](https://developers.cloudflare.com/browser-rendering/platform/puppeteer/):

```sh
npm install @cloudflare/puppeteer --save-dev
```

## 3. Create a R2 bucket

Create two R2 buckets, one for production, and one for development.

Note that bucket names must be lowercase and can only contain dashes.

```sh
wrangler r2 bucket create screenshots
wrangler r2 bucket create screenshots-test
```

To check that your buckets were created, run:

```sh
wrangler r2 bucket list
```

After running the `list` command, you will see all bucket names, including the ones you have just created.

## 4. Configure your Wrangler configuration file

Configure your `browser-worker` project's [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/) by adding a browser [binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/) and a [Node.js compatibility flag](https://developers.cloudflare.com/workers/configuration/compatibility-flags/#nodejs-compatibility-flag). Browser bindings allow for communication between a Worker and a headless browser which allows you to do actions such as taking a screenshot, generating a PDF and more.

Update your Wrangler configuration file with the Browser Rendering API binding, the R2 bucket you created and a Durable Object:

* wrangler.jsonc

  ```jsonc
  {
    "name": "rendering-api-demo",
    "main": "src/index.js",
    "compatibility_date": "2023-09-04",
    "compatibility_flags": [
      "nodejs_compat"
    ],
    "account_id": "<ACCOUNT_ID>",
    "browser": {
      "binding": "MYBROWSER"
    },
    "r2_buckets": [
      {
        "binding": "BUCKET",
        "bucket_name": "screenshots",
        "preview_bucket_name": "screenshots-test"
      }
    ],
    "durable_objects": {
      "bindings": [
        {
          "name": "BROWSER",
          "class_name": "Browser"
        }
      ]
    },
    "migrations": [
      {
        "tag": "v1",
        "new_sqlite_classes": [
          "Browser"
        ]
      }
    ]
  }
  ```

* wrangler.toml

  ```toml
  name = "rendering-api-demo"
  main = "src/index.js"
  compatibility_date = "2023-09-04"
  compatibility_flags = [ "nodejs_compat"]
  account_id = "<ACCOUNT_ID>"




  # Browser Rendering API binding
  browser = { binding = "MYBROWSER" }


  # Bind an R2 Bucket
  [[r2_buckets]]
  binding = "BUCKET"
  bucket_name = "screenshots"
  preview_bucket_name = "screenshots-test"


  # Binding to a Durable Object
  [[durable_objects.bindings]]
  name = "BROWSER"
  class_name = "Browser"


  [[migrations]]
  tag = "v1" # Should be unique for each entry
  new_sqlite_classes = ["Browser"] # Array of new classes
  ```

## 5. Code

The code below uses Durable Object to instantiate a browser using Puppeteer. It then opens a series of web pages with different resolutions, takes a screenshot of each, and uploads it to R2.

The Durable Object keeps a browser session open for 60 seconds after last use. If a browser session is open, any requests will re-use the existing session rather than creating a new one. Update your Worker code by copy and pasting the following:

```js
import puppeteer from "@cloudflare/puppeteer";


export default {
  async fetch(request, env) {
    let id = env.BROWSER.idFromName("browser");
    let obj = env.BROWSER.get(id);


    // Send a request to the Durable Object, then await its response.
    let resp = await obj.fetch(request.url);


    return resp;
  },
};


const KEEP_BROWSER_ALIVE_IN_SECONDS = 60;


export class Browser {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.keptAliveInSeconds = 0;
    this.storage = this.state.storage;
  }


  async fetch(request) {
    // screen resolutions to test out
    const width = [1920, 1366, 1536, 360, 414];
    const height = [1080, 768, 864, 640, 896];


    // use the current date and time to create a folder structure for R2
    const nowDate = new Date();
    var coeff = 1000 * 60 * 5;
    var roundedDate = new Date(
      Math.round(nowDate.getTime() / coeff) * coeff,
    ).toString();
    var folder = roundedDate.split(" GMT")[0];


    //if there's a browser session open, re-use it
    if (!this.browser || !this.browser.isConnected()) {
      console.log(`Browser DO: Starting new instance`);
      try {
        this.browser = await puppeteer.launch(this.env.MYBROWSER);
      } catch (e) {
        console.log(
          `Browser DO: Could not start browser instance. Error: ${e}`,
        );
      }
    }


    // Reset keptAlive after each call to the DO
    this.keptAliveInSeconds = 0;


    const page = await this.browser.newPage();


    // take screenshots of each screen size
    for (let i = 0; i < width.length; i++) {
      await page.setViewport({ width: width[i], height: height[i] });
      await page.goto("https://workers.cloudflare.com/");
      const fileName = "screenshot_" + width[i] + "x" + height[i];
      const sc = await page.screenshot();


      await this.env.BUCKET.put(folder + "/" + fileName + ".jpg", sc);
    }


    // Close tab when there is no more work to be done on the page
    await page.close();


    // Reset keptAlive after performing tasks to the DO.
    this.keptAliveInSeconds = 0;


    // set the first alarm to keep DO alive
    let currentAlarm = await this.storage.getAlarm();
    if (currentAlarm == null) {
      console.log(`Browser DO: setting alarm`);
      const TEN_SECONDS = 10 * 1000;
      await this.storage.setAlarm(Date.now() + TEN_SECONDS);
    }


    return new Response("success");
  }


  async alarm() {
    this.keptAliveInSeconds += 10;


    // Extend browser DO life
    if (this.keptAliveInSeconds < KEEP_BROWSER_ALIVE_IN_SECONDS) {
      console.log(
        `Browser DO: has been kept alive for ${this.keptAliveInSeconds} seconds. Extending lifespan.`,
      );
      await this.storage.setAlarm(Date.now() + 10 * 1000);
      // You could ensure the ws connection is kept alive by requesting something
      // or just let it close automatically when there  is no work to be done
      // for example, `await this.browser.version()`
    } else {
      console.log(
        `Browser DO: exceeded life of ${KEEP_BROWSER_ALIVE_IN_SECONDS}s.`,
      );
      if (this.browser) {
        console.log(`Closing browser.`);
        await this.browser.close();
      }
    }
  }
}
```

## 6. Test

Run [`npx wrangler dev --remote`](https://developers.cloudflare.com/workers/wrangler/commands/#dev) to test your Worker remotely before deploying to Cloudflare's global network. Local mode support does not exist for Browser Rendering so `--remote` is required.

## 7. Deploy

Run [`npx wrangler deploy`](https://developers.cloudflare.com/workers/wrangler/commands/#deploy) to deploy your Worker to the Cloudflare global network.

## Related resources

* Other [Puppeteer examples](https://github.com/cloudflare/puppeteer/tree/main/examples)
* Get started with [Durable Objects](https://developers.cloudflare.com/durable-objects/get-started/)
* [Using R2 from Workers](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/)


The best way to improve the performance of your browser rendering Worker is to reuse sessions. One way to do that is via [Durable Objects](https://developers.cloudflare.com/browser-rendering/workers-binding-api/browser-rendering-with-do/), which allows you to keep a long running connection from a Worker to a browser. Another way is to keep the browser open after you've finished with it, and connect to that session each time you have a new request.

In short, this entails using `browser.disconnect()` instead of `browser.close()`, and, if there are available sessions, using `puppeteer.connect(env.MY_BROWSER, sessionID)` instead of launching a new browser session.

## 1. Create a Worker project

[Cloudflare Workers](https://developers.cloudflare.com/workers/) provides a serverless execution environment that allows you to create new applications or augment existing ones without configuring or maintaining infrastructure. Your Worker application is a container to interact with a headless browser to do actions, such as taking screenshots.

Create a new Worker project named `browser-worker` by running:

* npm

  ```sh
  npm create cloudflare@latest -- browser-worker
  ```

* pnpm

  ```sh
  pnpm create cloudflare@latest browser-worker
  ```

* yarn

  ```sh
  yarn create cloudflare browser-worker
  ```

For setup, select the following options:

* For *What would you like to start with?*, choose `Hello World Starter`.
* For *Which template would you like to use?*, choose `Worker only`.
* For *Which language do you want to use?*, choose `TypeScript`.
* For *Do you want to use git for version control?*, choose `Yes`.
* For *Do you want to deploy your application?*, choose `No` (we will be making some changes before deploying).

## 2. Install Puppeteer

In your `browser-worker` directory, install Cloudflare's [fork of Puppeteer](https://developers.cloudflare.com/browser-rendering/platform/puppeteer/):

```sh
npm install @cloudflare/puppeteer --save-dev
```

## 3. Configure the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/)

* wrangler.jsonc

  ```jsonc
  {
    "name": "browser-worker",
    "main": "src/index.ts",
    "compatibility_date": "2023-03-14",
    "compatibility_flags": [
      "nodejs_compat"
    ],
    "browser": {
      "binding": "MYBROWSER"
    }
  }
  ```

* wrangler.toml

  ```toml
  name = "browser-worker"
  main = "src/index.ts"
  compatibility_date = "2023-03-14"
  compatibility_flags = [ "nodejs_compat" ]


  browser = { binding = "MYBROWSER" }
  ```

## 4. Code

The script below starts by fetching the current running sessions. If there are any that don't already have a worker connection, it picks a random session ID and attempts to connect (`puppeteer.connect(..)`) to it. If that fails or there were no running sessions to start with, it launches a new browser session (`puppeteer.launch(..)`). Then, it goes to the website and fetches the dom. Once that's done, it disconnects (`browser.disconnect()`), making the connection available to other workers.

Take into account that if the browser is idle, i.e. does not get any command, for more than the current [limit](https://developers.cloudflare.com/browser-rendering/platform/limits/), it will close automatically, so you must have enough requests per minute to keep it alive.

```ts
import puppeteer from "@cloudflare/puppeteer";


interface Env {
  MYBROWSER: Fetcher;
}


export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    let reqUrl = url.searchParams.get("url") || "https://example.com";
    reqUrl = new URL(reqUrl).toString(); // normalize


    // Pick random session from open sessions
    let sessionId = await this.getRandomSession(env.MYBROWSER);
    let browser, launched;
    if (sessionId) {
      try {
        browser = await puppeteer.connect(env.MYBROWSER, sessionId);
      } catch (e) {
        // another worker may have connected first
        console.log(`Failed to connect to ${sessionId}. Error ${e}`);
      }
    }
    if (!browser) {
      // No open sessions, launch new session
      browser = await puppeteer.launch(env.MYBROWSER);
      launched = true;
    }


    sessionId = browser.sessionId(); // get current session id


    // Do your work here
    const page = await browser.newPage();
    const response = await page.goto(reqUrl);
    const html = await response!.text();


    // All work done, so free connection (IMPORTANT!)
    browser.disconnect();


    return new Response(
      `${launched ? "Launched" : "Connected to"} ${sessionId} \n-----\n` + html,
      {
        headers: {
          "content-type": "text/plain",
        },
      },
    );
  },


  // Pick random free session
  // Other custom logic could be used instead
  async getRandomSession(endpoint: puppeteer.BrowserWorker): Promise<string> {
    const sessions: puppeteer.ActiveSession[] =
      await puppeteer.sessions(endpoint);
    console.log(`Sessions: ${JSON.stringify(sessions)}`);
    const sessionsIds = sessions
      .filter((v) => {
        return !v.connectionId; // remove sessions with workers connected to them
      })
      .map((v) => {
        return v.sessionId;
      });
    if (sessionsIds.length === 0) {
      return;
    }


    const sessionId =
      sessionsIds[Math.floor(Math.random() * sessionsIds.length)];


    return sessionId!;
  },
};
```

Besides `puppeteer.sessions()`, we've added other methods to facilitate [Session Management](https://developers.cloudflare.com/browser-rendering/platform/puppeteer/#session-management).

## 5. Test

Run [`npx wrangler dev --remote`](https://developers.cloudflare.com/workers/wrangler/commands/#dev) to test your Worker remotely before deploying to Cloudflare's global network. Local mode support does not exist for Browser Rendering so `--remote` is required.

To test go to the following URL:

`<LOCAL_HOST_URL>/?url=https://example.com`

## 6. Deploy

Run `npx wrangler deploy` to deploy your Worker to the Cloudflare global network and then to go to the following URL:

`<YOUR_WORKER>.<YOUR_SUBDOMAIN>.workers.dev/?url=https://example.com`

----------------------------------
The `/content` endpoint instructs the browser to navigate to a website and capture the fully rendered HTML of a page, including the `head` section, after JavaScript execution. This is ideal for capturing content from JavaScript-heavy or interactive websites.

## Basic usage

* curl

  Go to `https://example.com` and return the rendered HTML.

  ```bash
  curl -X 'POST' 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/content' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer <apiToken>' \
    -d '{"url": "https://example.com"}'
  ```

* TypeScript SDK

  ```typescript
  import Cloudflare from "cloudflare";


  const client = new Cloudflare({
    apiEmail: process.env["CLOUDFLARE_EMAIL"], // This is the default and can be omitted
    apiKey: process.env["CLOUDFLARE_API_KEY"], // This is the default and can be omitted
  });


  const content = await client.browserRendering.content.create({
    account_id: "account_id",
  });


  console.log(content);
  ```

## Advanced usage

Navigate to `https://cloudflare.com/` but block images and stylesheets from loading. Undesired requests can be blocked by resource type (`rejectResourceTypes`) or by using a regex pattern (`rejectRequestPattern`). The opposite can also be done, only allow requests that match `allowRequestPattern` or `allowResourceTypes`.

```bash
curl -X POST 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/content' \
  -H 'Authorization: Bearer <apiToken>' \
  -H 'Content-Type: application/json' \
  -d '{
      "url": "https://cloudflare.com/",
      "rejectResourceTypes": ["image"],
      "rejectRequestPattern": ["/^.*\\.(css)"]
    }'
```

Many more options exist, like setting HTTP headers using `setExtraHTTPHeaders`, setting `cookies`, and using `gotoOptions` to control page load behaviour - check the endpoint [reference](https://developers.cloudflare.com/api/resources/browser_rendering/subresources/content/methods/create/) for all available parameters.

------------------------------------

The `/screenshot` endpoint renders the webpage by processing its HTML and JavaScript, then captures a screenshot of the fully rendered page.

## Basic usage

* curl

  Sets the HTML content of the page to `Hello World!` and then takes a screenshot. The option `omitBackground` hides the default white background and allows capturing screenshots with transparency.

  ```bash
  curl -X POST 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/screenshot' \
    -H 'Authorization: Bearer <apiToken>' \
    -H 'Content-Type: application/json' \
    -d '{
      "html": "Hello World!",
      "screenshotOptions": {
        "omitBackground": true
      }
    }' \
    --output "screenshot.png"
  ```

* TypeScript SDK

  ```typescript
  import Cloudflare from "cloudflare";


  const client = new Cloudflare({
    apiEmail: process.env["CLOUDFLARE_EMAIL"], // This is the default and can be omitted
    apiKey: process.env["CLOUDFLARE_API_KEY"], // This is the default and can be omitted
  });


  const screenshot = await client.browserRendering.screenshot.create({
    account_id: "account_id",
  });


  console.log(screenshot.status);
  ```

For more options to control the final screenshot, like `clip`, `captureBeyondViewport`, `fullPage` and others, check the endpoint [reference](https://developers.cloudflare.com/api/resources/browser_rendering/subresources/screenshot/methods/create/).

## Advanced usage

Navigate to `https://cloudflare.com/`, changing the page size (`viewport`) and waiting until there are no active network connections (`waitUntil`) or up to a maximum of `4500ms` (`timeout`). Then take a `fullPage` screenshot.

```bash
curl -X POST 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/screenshot' \
  -H 'Authorization: Bearer <apiToken>' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://cnn.com/",
    "screenshotOptions": {
       "fullPage": true
    },
    "viewport": {
      "width": 1280,
      "height": 720
    },
    "gotoOptions": {
      "waitUntil": "networkidle0",
      "timeout": 45000
    }
  }' \
  --output "advanced-screenshot.png"
```

## Customize CSS and embed custom JavaScript

Instruct the browser to go to `https://example.com`, embed custom JavaScript (`addScriptTag`) and add extra styles (`addStyleTag`), both inline (`addStyleTag.content`) and by loading an external stylesheet (`addStyleTag.url`).

```bash
curl -X POST 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/screenshot' \
  -H 'Authorization: Bearer <apiToken>' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com/",
    "addScriptTag": [
      { "content": "document.querySelector(`h1`).innerText = `Hello World!!!`" }
    ],
    "addStyleTag": [
      {
        "content": "div { background: linear-gradient(45deg, #2980b9  , #82e0aa  ); }"
      },
      {
        "url": "https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap.min.css"
      }
    ]
  }' \
  --output "screenshot.png"
```

Many more options exist, like setting HTTP credentials using `authenticate`, setting `cookies`, and using `gotoOptions` to control page load behaviour - check the endpoint [reference](https://developers.cloudflare.com/api/resources/browser_rendering/subresources/screenshot/methods/create/) for all available parameters.



The `/pdf` endpoint instructs the browser to render the webpage as a PDF document.

## Basic usage

* curl

  Navigate to `https://example.com/` and inject custom CSS and an external stylesheet. Then return the rendered page as a PDF.

  ```bash
  curl -X POST 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/pdf' \
    -H 'Authorization: Bearer <apiToken>' \
    -H 'Content-Type: application/json' \
    -d '{
      "url": "https://example.com/",
      "addStyleTag": [
        { "content": "body { font-family: Arial; }" },
        { "url": "https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap.min.css" }
      ]
    }' \
    --output "output.pdf"
  ```

* TypeScript SDK

  ```typescript
  import Cloudflare from "cloudflare";


  const client = new Cloudflare({
    apiEmail: process.env["CLOUDFLARE_EMAIL"], // This is the default and can be omitted
    apiKey: process.env["CLOUDFLARE_API_KEY"], // This is the default and can be omitted
  });


  const pdf = await client.browserRendering.pdf.create({
    account_id: "account_id",
  });


  console.log(pdf);


  const content = await pdf.blob();
  console.log(content);
  ```

## Advanced usage

Navigate to `https://example.com`, first setting an additional HTTP request header and configuring the page size (`viewport`). Then, wait until there are no more than 2 network connections for at least 500 ms, or until the maximum timeout of 4500 ms is reached, before considering the page loaded and returning the rendered PDF document.

The `goToOptions` parameter exposes most of [Puppeteer'd API](https://pptr.dev/api/puppeteer.gotooptions).

```bash
curl -X POST 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/pdf' \
  -H 'Authorization: Bearer <apiToken>' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com/",
    "setExtraHTTPHeaders": {
      "X-Custom-Header": "value"
    },
    "viewport": {
      "width": 1200,
      "height": 800
    },
    "gotoOptions": {
      "waitUntil": "networkidle2",
      "timeout": 45000
    }
  }' \
  --output "advanced-output.pdf"
```

## Blocking images and styles when generating a PDF

The options `rejectResourceTypes` and `rejectRequestPattern` can be used to block requests. The opposite can also be done, *only* allow certain requests using `allowResourceTypes` and `allowRequestPattern`.

```bash
curl -X POST https://api.cloudflare.com/client/v4/accounts/<acccountID>/browser-rendering/pdf \
  -H 'Authorization: Bearer <apiToken>' \
  -H 'Content-Type: application/json' \
  -d '{
  "url": "https://cloudflare.com/",
  "rejectResourceTypes": ["image"],
  "rejectRequestPattern": ["/^.*\\.(css)"]
}' \
  --output "cloudflare.pdf"
```

## Generate PDF from custom HTML

If you have HTML you'd like to generate a PDF from, the `html` option can be used. The option `addStyleTag` can be used to add custom styles.

```bash
curl -X POST https://api.cloudflare.com/client/v4/accounts/<acccountID>/browser-rendering/pdf \
  -H 'Authorization: Bearer <apiToken>' \
  -H 'Content-Type: application/json' \
  -d '{
  "html": "<html><body>Advanced Snapshot</body></html>",
  "addStyleTag": [
      { "content": "body { font-family: Arial; }" },
      { "url": "https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap.min.css" }
    ]
}' \
  --output "invoice.pdf"
```

Many more options exist, like setting HTTP credentials using `authenticate`, setting `cookies`, and using `gotoOptions` to control page load behaviour - check the endpoint [reference](https://developers.cloudflare.com/api/resources/browser_rendering/subresources/pdf/methods/create/) for all available parameters.

-----------------------------------
The `/snapshot` endpoint captures both the HTML content and a screenshot of the webpage in one request. It returns the HTML as a text string and the screenshot as a Base64-encoded image.

## Basic usage

* curl

  1. Go to `https://example.com/`.
  2. Inject custom JavaScript.
  3. Capture the rendered HTML.
  4. Take a screenshot.

  ```bash
  curl -X POST 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/snapshot' \
    -H 'Authorization: Bearer <apiToken>' \
    -H 'Content-Type: application/json' \
    -d '{
      "url": "https://example.com/",
      "addScriptTag": [
        { "content": "document.body.innerHTML = \"Snapshot Page\";" }
      ]
    }'
  ```

  ```json
  {
    "success": true,
    "result": {
      "screenshot": "Base64EncodedScreenshotString",
      "content": "<html>...</html>"
    }
  }
  ```

* TypeScript SDK

  ```typescript
  import Cloudflare from "cloudflare";


  const client = new Cloudflare({
    apiEmail: process.env["CLOUDFLARE_EMAIL"], // This is the default and can be omitted
    apiKey: process.env["CLOUDFLARE_API_KEY"], // This is the default and can be omitted
  });


  const snapshot = await client.browserRendering.snapshot.create({
    account_id: "account_id",
  });


  console.log(snapshot.content);
  ```

## Advanced usage

The `html` property in the JSON payload, it sets the html to `<html><body>Advanced Snapshot</body></html>` then does the following steps:

1. Disable JavaScript.
2. Sets the screenshot to `fullPage`.
3. Changes the page size `(viewport)`.
4. Waits up to `30000ms` or until the `DOMContentLoaded` event fires.
5. Returns the rendered HTML content and a base-64 encoded screenshot of the page.

```bash
curl -X POST 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/snapshot' \
  -H 'Authorization: Bearer <apiToken>' \
  -H 'Content-Type: application/json' \
  -d '{
    "html": "<html><body>Advanced Snapshot</body></html>",
    "setJavaScriptEnabled": false,
    "screenshotOptions": {
       "fullPage": true
    },
    "viewport": {
      "width": 1200,
      "height": 800
    },
    "gotoOptions": {
      "waitUntil": "domcontentloaded",
      "timeout": 30000
    }
  }'
```

```json
{
  "success": true,
  "result": {
    "screenshot": "AdvancedBase64Screenshot",
    "content": "<html><body>Advanced Snapshot</body></html>"
  }
}
```

Many more options exist, like setting HTTP credentials using `authenticate`, setting `cookies`, and using `gotoOptions` to control page load behaviour - check the endpoint [reference](https://developers.cloudflare.com/api/resources/browser_rendering/subresources/snapshot/) for all available parameters.

-----------------------------------

The `/scrape` endpoint extracts structured data from specific elements on a webpage, returning details such as element dimensions and inner HTML.

## Basic usage

* curl

  Go to `https://example.com` and extract metadata from all `h1` and `a` elements in the DOM.

  ```bash
  curl -X POST 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/scrape' \
    -H 'Authorization: Bearer <apiToken>' \
    -H 'Content-Type: application/json' \
    -d '{
    "url": "https://example.com/",
    "elements": [{
      "selector": "h1"
    },
    {
      "selector": "a"
    }]
  }'
  ```

  ```json
  {
    "success": true,
    "result": [
      {
        "results": [
          {
            "attributes": [],
            "height": 39,
            "html": "Example Domain",
            "left": 100,
            "text": "Example Domain",
            "top": 133.4375,
            "width": 600
          }
        ],
        "selector": "h1"
      },
      {
        "results": [
          {
            "attributes": [
              { "name": "href", "value": "https://www.iana.org/domains/example" }
            ],
            "height": 20,
            "html": "More information...",
            "left": 100,
            "text": "More information...",
            "top": 249.875,
            "width": 142
          }
        ],
        "selector": "a"
      }
    ]
  }
  ```

* TypeScript SDK

  ```typescript
  import Cloudflare from "cloudflare";


  const client = new Cloudflare({
    apiEmail: process.env["CLOUDFLARE_EMAIL"], // This is the default and can be omitted
    apiKey: process.env["CLOUDFLARE_API_KEY"], // This is the default and can be omitted
  });


  const scrapes = await client.browserRendering.scrape.create({
    account_id: "account_id",
    elements: [{ selector: "selector" }],
  });


  console.log(scrapes);
  ```

Many more options exist, like setting HTTP credentials using `authenticate`, setting `cookies`, and using `gotoOptions` to control page load behaviour - check the endpoint [reference](https://developers.cloudflare.com/api/resources/browser_rendering/subresources/scrape/methods/create/) for all available parameters.

### Response fields

* `results` *(array of objects)* - Contains extracted data for each selector.

  * `selector` *(string)* - The CSS selector used.

  * `results` *(array of objects)* - List of extracted elements matching the selector.

    * `text` *(string)* - Inner text of the element.
    * `html` *(string)* - Inner HTML of the element.
    * `attributes` *(array of objects)* - List of extracted attributes such as `href` for links.
    * `height`, `width`, `top`, `left` *(number)* - Position and dimensions of the element.

--------------------------------------------

The `/json` endpoint extracts structured data from a webpage. You can specify the expected output using either a `prompt` or a `response_format` parameter which accepts a JSON schema. The endpoint returns the extracted data in JSON format.

Note

The `/json` endpoint leverages [Workers AI](https://developers.cloudflare.com/workers-ai/) for data extraction. Using this endpoint incurs usage on Workers AI, which you can monitor usage through the Workers AI Dashboard.

## Basic Usage

* curl

  ### With a Prompt and JSON schema

  This example captures webpage data by providing both a prompt and a JSON schema. The prompt guides the extraction process, while the JSON schema defines the expected structure of the output.

  ```bash
  curl --request POST 'https://api.cloudflare.com/client/v4/accounts/CF_ACCOUNT_ID/browser-rendering/json' \
    --header 'authorization: Bearer CF_API_TOKEN' \
    --header 'content-type: application/json' \
    --data '{
    "url": "https://developers.cloudflare.com/",
    "prompt": "Get me the list of AI products",
    "response_format": {
      "type": "json_schema",
      "json_schema": {
          "type": "object",
          "properties": {
            "products": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "link": {
                    "type": "string"
                  }
                },
                "required": [
                  "name"
                ]
              }
            }
          }
        }
    }
  }'
  ```

  ```json
  {
    "success": true,
    "result": {
      "products": [
        {
          "name": "Build a RAG app",
          "link": "https://developers.cloudflare.com/workers-ai/tutorials/build-a-retrieval-augmented-generation-ai/"
        },
        {
          "name": "Workers AI",
          "link": "https://developers.cloudflare.com/workers-ai/"
        },
        {
          "name": "Vectorize",
  ```

  ### With only a prompt

  In this example, only a prompt is provided. The endpoint will use the prompt to extract the data, but the response will not be structured according to a JSON schema. This is useful for simple extractions where you don't need a specific format.

  ```bash
  curl --request POST 'https://api.cloudflare.com/client/v4/accounts/CF_ACCOUNT_ID/browser-rendering/json' \
    --header 'authorization: Bearer CF_API_TOKEN' \
    --header 'content-type: application/json' \
    --data '{
      "url": "https://developers.cloudflare.com/",
      "prompt": "get me the list of AI products"
    }'
  ```

  ```json
    "success": true,
    "result": {
      "AI Products": [
        "Build a RAG app",
        "Workers AI",
        "Vectorize",
        "AI Gateway",
        "AI Playground"
      ]
    }
  }
  ```

  ### With only a JSON schema (no prompt)

  In this case, you supply a JSON schema via the `response_format` parameter. The schema defines the structure of the extracted data.

  ```bash
  curl --request POST 'https://api.cloudflare.com/client/v4/accounts/CF_ACCOUNT_ID/browser-rendering/json' \
    --header 'authorization: Bearer CF_API_TOKEN' \
    --header 'content-type: application/json' \
    --data '"response_format": {
      "type": "json_schema",
      "json_schema": {
          "type": "object",
          "properties": {
            "products": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "link": {
                    "type": "string"
                  }
                },
                "required": [
                  "name"
                ]
              }
            }
          }
        }
    }'
  ```

  ```json
  {
    "success": true,
    "result": {
      "products": [
        {
          "name": "Workers",
          "link": "https://developers.cloudflare.com/workers/"
        },
        {
          "name": "Pages",
          "link": "https://developers.cloudflare.com/pages/"
        },
  ```

* TypeScript SDK

  Below is an example using the TypeScript SDK:

  ```typescript
  import Cloudflare from "cloudflare";


  const client = new Cloudflare({
    apiEmail: process.env["CLOUDFLARE_EMAIL"], // This is the default and can be omitted
    apiKey: process.env["CLOUDFLARE_API_KEY"], // This is the default and can be omitted
  });


  const json = await client.browserRendering.json.create({
    account_id: "account_id",
  });


  console.log(json);
  ```

-------------------------------------------------

The `/markdown` endpoint retrieves a webpage's content and converts it into Markdown format. You can specify a URL and optional parameters to refine the extraction process.

## Basic usage

### Using a URL

* curl

  This example fetches the Markdown representation of a webpage.

  ```bash
  curl -X 'POST' 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/markdown' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer <apiToken>' \
    -d '{
      "url": "https://example.com"
    }'
  ```

  ```json
    "success": true,
    "result": "# Example Domain\n\nThis domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.\n\n[More information...](https://www.iana.org/domains/example)"
  }
  ```

* TypeScript SDK

  ```typescript
  import Cloudflare from "cloudflare";


  const client = new Cloudflare({
    apiEmail: process.env["CLOUDFLARE_EMAIL"], // This is the default and can be omitted
    apiKey: process.env["CLOUDFLARE_API_KEY"], // This is the default and can be omitted
  });


  const markdown = await client.browserRendering.markdown.create({
    account_id: "account_id",
  });


  console.log(markdown);
  ```

### Use raw HTML

Instead of fetching the content by specifying the URL, you can provide raw HTML content directly.

```bash
curl -X 'POST' 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/markdown' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <apiToken>' \
  -d '{
    "html": "<div>Hello World</div>"
  }'
```

```json
{
  "success": true,
  "result": "Hello World"
}
```

## Advanced usage

You can refine the Markdown extraction by using the `rejectRequestPattern` parameter. In this example, requests matching the given regex pattern (such as CSS files) are excluded.

```bash
curl -X 'POST' 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/markdown' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <apiToken>' \
  -d '{
    "url": "https://example.com",
    "rejectRequestPattern": ["/^.*\\.(css)/"]
  }'
```

```json
{
  "success": true,
  "result": "# Example Domain\n\nThis domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.\n\n[More information...](https://www.iana.org/domains/example)"
}
```

## Potential use-cases

1. **Content extraction:** Convert a blog post or article into Markdown format for storage or further processing.
2. **Static site generation:** Retrieve structured Markdown content for use in static site generators like Jekyll or Hugo.
3. **Automated summarization:** Extract key content from web pages while ignoring CSS, scripts, or unnecessary elements.

--------------------------------------------

The `/links` endpoint retrieves all links from a webpage. It can be used to extract all links from a page, including those that are hidden.

## Basic usage

* curl

  This example grabs all links from the Cloudflare Developers homepage. The response will be a JSON array containing the links found on the page.

  ```bash
  curl -X POST 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/links' \
    -H 'Authorization: Bearer <apiToken>' \
    -H 'Content-Type: application/json' \
    -d '{
      "url": "https://developers.cloudflare.com/"
    }'
  ```

  ```json
  {
    "success": true,
    "result": [
      "https://developers.cloudflare.com/",
      "https://developers.cloudflare.com/products/",
      "https://developers.cloudflare.com/api/",
      "https://developers.cloudflare.com/fundamentals/api/reference/sdks/",
      "https://dash.cloudflare.com/",
      "https://developers.cloudflare.com/fundamentals/subscriptions-and-billing/",
      "https://developers.cloudflare.com/api/",
      "https://developers.cloudflare.com/changelog/",
  ```

* TypeScript SDK

  ```typescript
  import Cloudflare from "cloudflare";


  const client = new Cloudflare({
    apiEmail: process.env["CLOUDFLARE_EMAIL"], // This is the default and can be omitted
    apiKey: process.env["CLOUDFLARE_API_KEY"], // This is the default and can be omitted
  });


  const links = await client.browserRendering.links.create({
    account_id: "account_id",
  });


  console.log(links);
  ```

## Advanced usage

In this example we can pass a `visibleLinksOnly` parameter to only return links that are visible on the page.

```bash
curl -X POST 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/links' \
  -H 'Authorization: Bearer <apiToken>' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://developers.cloudflare.com/",
    "visibleLinksOnly": true
  }'
```

```json
{
  "success": true,
  "result": [
    "https://developers.cloudflare.com/",
    "https://developers.cloudflare.com/products/",
    "https://developers.cloudflare.com/api/",
    "https://developers.cloudflare.com/fundamentals/api/reference/sdks/",
    "https://dash.cloudflare.com/",
    "https://developers.cloudflare.com/fundamentals/subscriptions-and-billing/",
    "https://developers.cloudflare.com/api/",
    "https://developers.cloudflare.com/changelog/",
  ]
}
```

--------------------------------------------
Browser Rendering
browser_rendering

Browser Rendering
Content
browser_rendering.content

Methods

Get HTML Content -> Envelope<string>
post
/accounts/{account_id}/browser-rendering/content
Fetches rendered HTML content from provided URL or HTML. Check available options like gotoOptions and waitFor* to control page load behaviour.

Browser Rendering
Json
browser_rendering.json

Methods

Get Json -> Envelope<Record<string, unknown>>
post
/accounts/{account_id}/browser-rendering/json
Gets json from a webpage from a provided URL or HTML. Pass prompt or schema in the body. Control page loading with gotoOptions and waitFor* options.

Browser Rendering
Links
browser_rendering.links

Methods

Get Links -> Envelope<Array<string>>
post
/accounts/{account_id}/browser-rendering/links
Get links from a web page.

Browser Rendering
Markdown
browser_rendering.markdown

Methods

Get Markdown -> Envelope<string>
post
/accounts/{account_id}/browser-rendering/markdown
Gets markdown of a webpage from provided URL or HTML. Control page loading with gotoOptions and waitFor* options.

Browser Rendering
PDF
browser_rendering.pdf

Methods

Get PDF -> unknown
post
/accounts/{account_id}/browser-rendering/pdf
Fetches rendered PDF from provided URL or HTML. Check available options like gotoOptions and waitFor* to control page load behaviour.

Browser Rendering
Scrape
browser_rendering.scrape

Methods

Scrape Elements -> Envelope<Array<{ result, selector }>>
post
/accounts/{account_id}/browser-rendering/scrape
Get meta attributes like height, width, text and others of selected elements.

Browser Rendering
Screenshot
browser_rendering.screenshot

Methods

Get Screenshot -> { status, errors }
post
/accounts/{account_id}/browser-rendering/screenshot
Takes a screenshot of a webpage from provided URL or HTML. Control page loading with gotoOptions and waitFor* options. Customize screenshots with viewport, fullPage, clip and others.

Browser Rendering
Snapshot
browser_rendering.snapshot

Methods

Get HTML Content And Screenshot -> Envelope<{ content, screenshot }>
post
/accounts/{account_id}/browser-rendering/snapshot
Returns the page's HTML content and screenshot. Control page loading with gotoOptions and waitFor*


-------------------------------------

As seen in the [Getting Started guide](https://developers.cloudflare.com/browser-rendering/workers-binding-api/screenshots/), Browser Rendering can be used to generate screenshots for any given URL. Alongside screenshots, you can also generate full PDF documents for a given webpage, and can also provide the webpage markup and style ourselves.

## Prerequisites

1. Use the `create-cloudflare` CLI to generate a new Hello World Cloudflare Worker script:

```sh
npm create cloudflare@latest -- browser-worker
```

1. Install `@cloudflare/puppeteer`, which allows you to control the Browser Rendering instance:

```sh
npm install @cloudflare/puppeteer --save-dev
```

1. Add your Browser Rendering binding to your new Wrangler configuration:

* wrangler.jsonc

  ```jsonc
  {
    "browser": {
      "binding": "BROWSER"
    }
  }
  ```

* wrangler.toml

  ```toml
  browser = { binding = "BROWSER" }
  ```

1. Replace the contents of `src/index.ts` (or `src/index.js` for JavaScript projects) with the following skeleton script:

```ts
import puppeteer from "@cloudflare/puppeteer";


const generateDocument = (name: string) => {};


export default {
  async fetch(request, env) {
    const { searchParams } = new URL(request.url);
    let name = searchParams.get("name");


    if (!name) {
      return new Response("Please provide a name using the ?name= parameter");
    }


    const browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();


    // Step 1: Define HTML and CSS
    const document = generateDocument(name);


    // Step 2: Send HTML and CSS to our browser
    await page.setContent(document);


    // Step 3: Generate and return PDF


    return new Response();
  },
};
```

## 1. Define HTML and CSS

Rather than using Browser Rendering to navigate to a user-provided URL, manually generate a webpage, then provide that webpage to the Browser Rendering instance. This allows you to render any design you want.

Note

You can generate your HTML or CSS using any method you like. This example uses string interpolation, but the method is also fully compatible with web frameworks capable of rendering HTML on Workers such as React, Remix, and Vue.

For this example, we're going to take in user-provided content (via a '?name=' parameter), and have that name output in the final PDF document.

To start, fill out your `generateDocument` function with the following:

```ts
const generateDocument = (name: string) => {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      html,
      body,
      #container {
        width: 100%;
        height: 100%;
        margin: 0;
      }
      body {
        font-family: Baskerville, Georgia, Times, serif;
        background-color: #f7f1dc;
      }
      strong {
        color: #5c594f;
        font-size: 128px;
        margin: 32px 0 48px 0;
      }
      em {
        font-size: 24px;
      }
      #container {
        flex-direction: column;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
    </style>
  </head>


  <body>
    <div id="container">
      <em>This is to certify that</em>
      <strong>${name}</strong>
      <em>has rendered a PDF using Cloudflare Workers</em>
    </div>
  </body>
</html>
`;
};
```

This example HTML document should render a beige background imitating a certificate showing that the user-provided name has successfully rendered a PDF using Cloudflare Workers.

Note

It is usually best to avoid directly interpolating user-provided content into an image or PDF renderer in production applications. To render contents like an invoice, it would be best to validate the data input and fetch the data yourself using tools like [D1](https://developers.cloudflare.com/d1/) or [Workers KV](https://developers.cloudflare.com/kv/).

## 2. Load HTML and CSS Into Browser

Now that you have your fully styled HTML document, you can take the contents and send it to your browser instance. Create an empty page to store this document as follows:

```ts
const browser = await puppeteer.launch(env.BROWSER);
const page = await browser.newPage();
```

The [`page.setContent()`](https://github.com/cloudflare/puppeteer/blob/main/docs/api/puppeteer.page.setcontent.md) function can then be used to set the page's HTML contents from a string, so you can pass in your created document directly like so:

```ts
await page.setContent(document);
```

## 3. Generate and Return PDF

With your Browser Rendering instance now rendering your provided HTML and CSS, you can use the [`page.pdf()`](https://github.com/cloudflare/puppeteer/blob/main/docs/api/puppeteer.page.pdf.md) command to generate a PDF file and return it to the client.

```ts
let pdf = page.pdf({ printBackground: true });
```

The `page.pdf()` call supports a [number of options](https://github.com/cloudflare/puppeteer/blob/main/docs/api/puppeteer.pdfoptions.md), including setting the dimensions of the generated PDF to a specific paper size, setting specific margins, and allowing fully-transparent backgrounds. For now, you are only overriding the `printBackground` option to allow your `body` background styles to show up.

Now that you have your PDF data, return it to the client in the `Response` with an `application/pdf` content type:

```ts
return new Response(pdf, {
  headers: {
    "content-type": "application/pdf",
  },
});
```

## Conclusion

The full Worker script now looks as follows:

```ts
import puppeteer from "@cloudflare/puppeteer";


const generateDocument = (name: string) => {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
    html, body, #container {
    width: 100%;
      height: 100%;
    margin: 0;
    }
      body {
        font-family: Baskerville, Georgia, Times, serif;
        background-color: #f7f1dc;
      }
      strong {
        color: #5c594f;
    font-size: 128px;
    margin: 32px 0 48px 0;
      }
    em {
    font-size: 24px;
    }
      #container {
    flex-direction: column;
        display: flex;
        align-items: center;
        justify-content: center;
    text-align: center
      }
    </style>
  </head>


  <body>
    <div id="container">
    <em>This is to certify that</em>
    <strong>${name}</strong>
    <em>has rendered a PDF using Cloudflare Workers</em>
  </div>
  </body>
</html>
`;
};


export default {
  async fetch(request, env) {
    const { searchParams } = new URL(request.url);
    let name = searchParams.get("name");


    if (!name) {
      return new Response("Please provide a name using the ?name= parameter");
    }


    const browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();


    // Step 1: Define HTML and CSS
    const document = generateDocument(name);


    // // Step 2: Send HTML and CSS to our browser
    await page.setContent(document);


    // // Step 3: Generate and return PDF
    const pdf = await page.pdf({ printBackground: true });


    return new Response(pdf, {
      headers: {
        "content-type": "application/pdf",
      },
    });
  },
};
```

You can run this script to test it using Wrangler’s `--remote` flag:

```sh
npx wrangler@latest dev --remote
```

With your script now running, you can pass in a `?name` parameter to the local URL (such as `http://localhost:8787/?name=Harley`) and should see the following:

![A screenshot of a generated PDF, with the author's name shown in a mock certificate.](https://developers.cloudflare.com/_astro/pdf-generation.Diel53Hp_F2F5w.webp)

***

Dynamically generating PDF documents solves a number of common use-cases, from invoicing customers to archiving documents to creating dynamic certificates (as seen in the simple example here).

--------------------------------------------

This tutorial explains how to build and deploy a web crawler with Queues, [Browser Rendering](https://developers.cloudflare.com/browser-rendering/), and [Puppeteer](https://developers.cloudflare.com/browser-rendering/platform/puppeteer/).

Puppeteer is a high-level library used to automate interactions with Chrome/Chromium browsers. On each submitted page, the crawler will find the number of links to `cloudflare.com` and take a screenshot of the site, saving results to [Workers KV](https://developers.cloudflare.com/kv/).

You can use Puppeteer to request all images on a page, save the colors used on a site, and more.

## Prerequisites

1. Sign up for a [Cloudflare account](https://dash.cloudflare.com/sign-up/workers-and-pages).
2. Install [`Node.js`](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

## 1. Create new Workers application

To get started, create a Worker application using the [`create-cloudflare` CLI](https://github.com/cloudflare/workers-sdk/tree/main/packages/create-cloudflare). Open a terminal window and run the following command:

* npm

  ```sh
  npm create cloudflare@latest -- queues-web-crawler
  ```

* pnpm

  ```sh
  pnpm create cloudflare@latest queues-web-crawler
  ```

* yarn

  ```sh
  yarn create cloudflare queues-web-crawler
  ```

For setup, select the following options:

* For *What would you like to start with?*, choose `Hello World Starter`.
* For *Which template would you like to use?*, choose `Worker only`.
* For *Which language do you want to use?*, choose `TypeScript`.
* For *Do you want to use git for version control?*, choose `Yes`.
* For *Do you want to deploy your application?*, choose `No` (we will be making some changes before deploying).

Then, move into your newly created directory:

```sh
cd queues-web-crawler
```

## 2. Create KV namespace

We need to create a KV store. This can be done through the Cloudflare dashboard or the Wrangler CLI. For this tutorial, we will use the Wrangler CLI.

```sh
npx wrangler kv namespace create crawler_links
npx wrangler kv namespace create crawler_screenshots
```

```sh
🌀 Creating namespace with title "web-crawler-crawler-links"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
[[kv_namespaces]]
binding = "crawler_links"
id = "<GENERATED_NAMESPACE_ID>"


🌀 Creating namespace with title "web-crawler-crawler-screenshots"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
[[kv_namespaces]]
binding = "crawler_screenshots"
id = "<GENERATED_NAMESPACE_ID>"
```

### Add KV bindings to the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/)

Then, in your Wrangler file, add the following with the values generated in the terminal:

* wrangler.jsonc

  ```jsonc
  {
    "kv_namespaces": [
      {
        "binding": "CRAWLER_SCREENSHOTS_KV",
        "id": "<GENERATED_NAMESPACE_ID>"
      },
      {
        "binding": "CRAWLER_LINKS_KV",
        "id": "<GENERATED_NAMESPACE_ID>"
      }
    ]
  }
  ```

* wrangler.toml

  ```toml
  kv_namespaces = [
    { binding = "CRAWLER_SCREENSHOTS_KV", id = "<GENERATED_NAMESPACE_ID>" },
    { binding = "CRAWLER_LINKS_KV", id = "<GENERATED_NAMESPACE_ID>" }
  ]
  ```

## 3. Set up Browser Rendering

Now, you need to set up your Worker for Browser Rendering.

In your current directory, install Cloudflare’s [fork of Puppeteer](https://developers.cloudflare.com/browser-rendering/platform/puppeteer/) and also [robots-parser](https://www.npmjs.com/package/robots-parser):

```sh
npm install @cloudflare/puppeteer --save-dev
npm install robots-parser
```

Then, add a Browser Rendering binding. Adding a Browser Rendering binding gives the Worker access to a headless Chromium instance you will control with Puppeteer.

* wrangler.jsonc

  ```jsonc
  {
    "browser": {
      "binding": "CRAWLER_BROWSER"
    }
  }
  ```

* wrangler.toml

  ```toml
  browser = { binding = "CRAWLER_BROWSER" }
  ```

## 4. Set up a Queue

Now, we need to set up the Queue.

```sh
npx wrangler queues create queues-web-crawler
```

```txt
Creating queue queues-web-crawler.
Created queue queues-web-crawler.
```

### Add Queue bindings to wrangler.toml

Then, in your Wrangler file, add the following:

* wrangler.jsonc

  ```jsonc
  {
    "queues": {
      "consumers": [
        {
          "queue": "queues-web-crawler",
          "max_batch_timeout": 60
        }
      ],
      "producers": [
        {
          "queue": "queues-web-crawler",
          "binding": "CRAWLER_QUEUE"
        }
      ]
    }
  }
  ```

* wrangler.toml

  ```toml
  [[queues.consumers]]
  queue = "queues-web-crawler"
  max_batch_timeout = 60


  [[queues.producers]]
  queue = "queues-web-crawler"
  binding = "CRAWLER_QUEUE"
  ```

Adding the `max_batch_timeout` of 60 seconds to the consumer queue is important because Browser Rendering has a limit of two new browsers per minute per account. This timeout waits up to a minute before collecting queue messages into a batch. The Worker will then remain under this browser invocation limit.

Your final Wrangler file should look similar to the one below.

* wrangler.jsonc

  ```jsonc
  {
    "name": "web-crawler",
    "main": "src/index.ts",
    "compatibility_date": "2024-07-25",
    "compatibility_flags": [
      "nodejs_compat"
    ],
    "kv_namespaces": [
      {
        "binding": "CRAWLER_SCREENSHOTS_KV",
        "id": "<GENERATED_NAMESPACE_ID>"
      },
      {
        "binding": "CRAWLER_LINKS_KV",
        "id": "<GENERATED_NAMESPACE_ID>"
      }
    ],
    "browser": {
      "binding": "CRAWLER_BROWSER"
    },
    "queues": {
      "consumers": [
        {
          "queue": "queues-web-crawler",
          "max_batch_timeout": 60
        }
      ],
      "producers": [
        {
          "queue": "queues-web-crawler",
          "binding": "CRAWLER_QUEUE"
        }
      ]
    }
  }
  ```

* wrangler.toml

  ```toml
  #:schema node_modules/wrangler/config-schema.json
  name = "web-crawler"
  main = "src/index.ts"
  compatibility_date = "2024-07-25"
  compatibility_flags = ["nodejs_compat"]


  kv_namespaces = [
    { binding = "CRAWLER_SCREENSHOTS_KV", id = "<GENERATED_NAMESPACE_ID>" },
    { binding = "CRAWLER_LINKS_KV", id = "<GENERATED_NAMESPACE_ID>" }
  ]


  browser = { binding = "CRAWLER_BROWSER" }


  [[queues.consumers]]
  queue = "queues-web-crawler"
  max_batch_timeout = 60


  [[queues.producers]]
  queue = "queues-web-crawler"
  binding = "CRAWLER_QUEUE"
  ```

## 5. Add bindings to environment

Add the bindings to the environment interface in `src/index.ts`, so TypeScript correctly types the bindings. Type the queue as `Queue<any>`. The following step will show you how to change this type.

```ts
import { BrowserWorker } from "@cloudflare/puppeteer";


export interface Env {
  CRAWLER_QUEUE: Queue<any>;
  CRAWLER_SCREENSHOTS_KV: KVNamespace;
  CRAWLER_LINKS_KV: KVNamespace;
  CRAWLER_BROWSER: BrowserWorker;
}
```

## 6. Submit links to crawl

Add a `fetch()` handler to the Worker to submit links to crawl.

```ts
type Message = {
  url: string;
};


export interface Env {
  CRAWLER_QUEUE: Queue<Message>;
  // ... etc.
}


export default {
  async fetch(req, env): Promise<Response> {
    await env.CRAWLER_QUEUE.send({ url: await req.text() });
    return new Response("Success!");
  },
} satisfies ExportedHandler<Env>;
```

This will accept requests to any subpath and forwards the request's body to be crawled. It expects that the request body only contains a URL. In production, you should check that the request was a `POST` request and contains a well-formed URL in its body. This has been omitted for simplicity.

## 7. Crawl with Puppeteer

Add a `queue()` handler to the Worker to process the links you send.

```ts
import puppeteer from "@cloudflare/puppeteer";
import robotsParser from "robots-parser";


async queue(batch: MessageBatch<Message>, env: Env): Promise<void> {
  let browser: puppeteer.Browser | null = null;
  try {
    browser = await puppeteer.launch(env.CRAWLER_BROWSER);
  } catch {
    batch.retryAll();
  return;
  }


  for (const message of batch.messages) {
    const { url } = message.body;


    let isAllowed = true;
    try {
      const robotsTextPath = new URL(url).origin + "/robots.txt";
      const response = await fetch(robotsTextPath);


      const robots = robotsParser(robotsTextPath, await response.text());
      isAllowed = robots.isAllowed(url) ?? true; // respect robots.txt!
    } catch {}


    if (!isAllowed) {
      message.ack();
      continue;
    }


  // TODO: crawl!
    message.ack();
  }


  await browser.close();
},
```

This is a skeleton for the crawler. It launches the Puppeteer browser and iterates through the Queue's received messages. It fetches the site's `robots.txt` and uses `robots-parser` to check that this site allows crawling. If crawling is not allowed, the message is `ack`'ed, removing it from the Queue. If crawling is allowed, you can continue to crawl the site.

The `puppeteer.launch()` is wrapped in a `try...catch` to allow the whole batch to be retried if the browser launch fails. The browser launch may fail due to going over the limit for number of browsers per account.

```ts
type Result = {
  numCloudflareLinks: number;
  screenshot: ArrayBuffer;
};


const crawlPage = async (url: string): Promise<Result> => {
  const page = await (browser as puppeteer.Browser).newPage();


  await page.goto(url, {
    waitUntil: "load",
  });


  const numCloudflareLinks = await page.$$eval("a", (links) => {
    links = links.filter((link) => {
      try {
        return new URL(link.href).hostname.includes("cloudflare.com");
      } catch {
        return false;
      }
    });
    return links.length;
  });


  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });


  return {
    numCloudflareLinks,
    screenshot: ((await page.screenshot({ fullPage: true })) as Buffer).buffer,
  };
};
```

This helper function opens a new page in Puppeteer and navigates to the provided URL. `numCloudflareLinks` uses Puppeteer's `$$eval` (equivalent to `document.querySelectorAll`) to find the number of links to a `cloudflare.com` page. Checking if the link's `href` is to a `cloudflare.com` page is wrapped in a `try...catch` to handle cases where `href`s may not be URLs.

Then, the function sets the browser viewport size and takes a screenshot of the full page. The screenshot is returned as a `Buffer` so it can be converted to an `ArrayBuffer` and written to KV.

To enable recursively crawling links, add a snippet after checking the number of Cloudflare links to send messages recursively from the queue consumer to the queue itself. Recursing too deep, as is possible with crawling, will cause a Durable Object `Subrequest depth limit exceeded.` error. If one occurs, it is caught, but the links are not retried.

```ts
// const numCloudflareLinks = await page.$$eval("a", (links) => { ...


await page.$$eval("a", async (links) => {
  const urls: MessageSendRequest<Message>[] = links.map((link) => {
    return {
      body: {
        url: link.href,
      },
    };
  });
  try {
    await env.CRAWLER_QUEUE.sendBatch(urls);
  } catch {} // do nothing, likely hit subrequest limit
});


// await page.setViewport({ ...
```

Then, in the `queue` handler, call `crawlPage` on the URL.

```ts
// in the `queue` handler:
// ...
if (!isAllowed) {
  message.ack();
  continue;
}


try {
  const { numCloudflareLinks, screenshot } = await crawlPage(url);
  const timestamp = new Date().getTime();
  const resultKey = `${encodeURIComponent(url)}-${timestamp}`;
  await env.CRAWLER_LINKS_KV.put(resultKey, numCloudflareLinks.toString(), {
    metadata: { date: timestamp },
  });
  await env.CRAWLER_SCREENSHOTS_KV.put(resultKey, screenshot, {
    metadata: { date: timestamp },
  });
  message.ack();
} catch {
  message.retry();
}


// ...
```

This snippet saves the results from `crawlPage` into the appropriate KV namespaces. If an unexpected error occurred, the URL will be retried and resent to the queue again.

Saving the timestamp of the crawl in KV helps you avoid crawling too frequently.

Add a snippet before checking `robots.txt` to check KV for a crawl within the last hour. This lists all KV keys beginning with the same URL (crawls of the same page), and check if any crawls have been done within the last hour. If any crawls have been done within the last hour, the message is `ack`'ed and not retried.

```ts
type KeyMetadata = {
  date: number;
};


// in the `queue` handler:
// ...
for (const message of batch.messages) {
  const sameUrlCrawls = await env.CRAWLER_LINKS_KV.list({
    prefix: `${encodeURIComponent(url)}`,
  });


  let shouldSkip = false;
  for (const key of sameUrlCrawls.keys) {
    if (timestamp - (key.metadata as KeyMetadata)?.date < 60 * 60 * 1000) {
      // if crawled in last hour, skip
      message.ack();
      shouldSkip = true;
      break;
    }
  }
  if (shouldSkip) {
    continue;
  }


  let isAllowed = true;
  // ...
```

The final script is included below.

```ts
import puppeteer, { BrowserWorker } from "@cloudflare/puppeteer";
import robotsParser from "robots-parser";


type Message = {
  url: string;
};


export interface Env {
  CRAWLER_QUEUE: Queue<Message>;
  CRAWLER_SCREENSHOTS_KV: KVNamespace;
  CRAWLER_LINKS_KV: KVNamespace;
  CRAWLER_BROWSER: BrowserWorker;
}


type Result = {
  numCloudflareLinks: number;
  screenshot: ArrayBuffer;
};


type KeyMetadata = {
  date: number;
};


export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // util endpoint for testing purposes
    await env.CRAWLER_QUEUE.send({ url: await req.text() });
    return new Response("Success!");
  },
  async queue(batch: MessageBatch<Message>, env: Env): Promise<void> {
    const crawlPage = async (url: string): Promise<Result> => {
      const page = await (browser as puppeteer.Browser).newPage();


      await page.goto(url, {
        waitUntil: "load",
      });


      const numCloudflareLinks = await page.$$eval("a", (links) => {
        links = links.filter((link) => {
          try {
            return new URL(link.href).hostname.includes("cloudflare.com");
          } catch {
            return false;
          }
        });
        return links.length;
      });


      // to crawl recursively - uncomment this!
      /*await page.$$eval("a", async (links) => {
        const urls: MessageSendRequest<Message>[] = links.map((link) => {
          return {
            body: {
              url: link.href,
            },
          };
        });
        try {
          await env.CRAWLER_QUEUE.sendBatch(urls);
        } catch {} // do nothing, might've hit subrequest limit
      });*/


      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });


      return {
        numCloudflareLinks,
        screenshot: ((await page.screenshot({ fullPage: true })) as Buffer)
          .buffer,
      };
    };


    let browser: puppeteer.Browser | null = null;
    try {
      browser = await puppeteer.launch(env.CRAWLER_BROWSER);
    } catch {
      batch.retryAll();
      return;
    }


    for (const message of batch.messages) {
      const { url } = message.body;
      const timestamp = new Date().getTime();
      const resultKey = `${encodeURIComponent(url)}-${timestamp}`;


      const sameUrlCrawls = await env.CRAWLER_LINKS_KV.list({
        prefix: `${encodeURIComponent(url)}`,
      });


      let shouldSkip = false;
      for (const key of sameUrlCrawls.keys) {
        if (timestamp - (key.metadata as KeyMetadata)?.date < 60 * 60 * 1000) {
          // if crawled in last hour, skip
          message.ack();
          shouldSkip = true;
          break;
        }
      }
      if (shouldSkip) {
        continue;
      }


      let isAllowed = true;
      try {
        const robotsTextPath = new URL(url).origin + "/robots.txt";
        const response = await fetch(robotsTextPath);


        const robots = robotsParser(robotsTextPath, await response.text());
        isAllowed = robots.isAllowed(url) ?? true; // respect robots.txt!
      } catch {}


      if (!isAllowed) {
        message.ack();
        continue;
      }


      try {
        const { numCloudflareLinks, screenshot } = await crawlPage(url);
        await env.CRAWLER_LINKS_KV.put(
          resultKey,
          numCloudflareLinks.toString(),
          { metadata: { date: timestamp } },
        );
        await env.CRAWLER_SCREENSHOTS_KV.put(resultKey, screenshot, {
          metadata: { date: timestamp },
        });
        message.ack();
      } catch {
        message.retry();
      }
    }


    await browser.close();
  },
};
```

## 8. Deploy your Worker

To deploy your Worker, run the following command:

```sh
npx wrangler deploy
```

You have successfully created a Worker which can submit URLs to a queue for crawling and save results to Workers KV.

To test your Worker, you could use the following cURL request to take a screenshot of this documentation page.

```bash
curl <YOUR_WORKER_URL> \
  -H "Content-Type: application/json" \
  -d 'https://developers.cloudflare.com/queues/tutorials/web-crawler-with-browser-rendering/'
```

Refer to the [GitHub repository for the complete tutorial](https://github.com/cloudflare/queues-web-crawler), including a front end deployed with Pages to submit URLs and view crawler results.

## Related resources

* [How Queues works](https://developers.cloudflare.com/queues/reference/how-queues-works/)
* [Queues Batching and Retries](https://developers.cloudflare.com/queues/configuration/batching-retries/)
* [Browser Rendering](https://developers.cloudflare.com/browser-rendering/)
* [Puppeteer Examples](https://github.com/puppeteer/puppeteer/tree/main/examples)

-----------------------------------

