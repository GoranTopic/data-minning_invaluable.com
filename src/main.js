// For more information, see https://crawlee.dev/
//import { PlaywrightCrawler, ProxyConfiguration } from 'crawlee';
//import { test, expect } from '@playwright/test';
//import { router } from './routes.js';
import { cookieStringToToughCookie } from 'crawlee';
import { chromium} from 'playwright';
const startUrls = ['https://www.invaluable.com/search?upcoming=false&query=%28rugs%2520carpets%29&keyword=%28rugs%2520carpets%29'];

const browser = await chromium.launch({
    headless: true,
});

// Open a new page / tab in the browser.
const page = await browser.newPage();

/*
await page.route(
    'https://algolia.invaluable.com/1/indexes/**',
    async (route, request) => {
        // Make the original request
        //const response = await page.request.fetch(route.request());
        //console.log('response', response);
        //await route.fulfill({ response, })
        let res = await route.continue();
        console.log('res', res);
    }
);
*/

page.on('response', async response => {
    if (response.url().match(/https:\/\/algolia.invaluable.com\/1\/indexes\/.*/g)) {
        let response = await response.json();
        console.log( response.results[0].hits );
    }
});


// Tell the tab to navigate to the JavaScript topic page.
await page.goto(startUrls[0]);
