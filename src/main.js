import { write_json, file_exists, mkdir } from "files-js";
import { chromium } from 'playwright-extra';
import { encodeUrl } from './utils/encoders.js';
import Checklist from 'checklist-js'
import prompt_sync from 'prompt-sync';
import extra_stealth from 'puppeteer-extra-plugin-stealth'
import fs from 'fs';
// create a prompt
let prompt = prompt_sync();
// add stealth plugin and use defaults (all evasion techniques)
chromium.use(extra_stealth())

// domain
let domain = 'https://www.invaluable.com';
// exmaple url
// 'https://www.invaluable.com/search?dateTimeUTCUnix%5Bmin%5D=1366732800&dateTimeUTCUnix%5Bmax%5D=1641024000&dateType=Custom&upcoming=false&query=%28rugs%2520carpets%29&keyword=%28rugs%2520carpets%29'

let current_hits = 0;
let total_hits = 0;

// get all lines
const filename = fs.readFileSync('./storage/search_keys.txt', 'utf-8');
// read the keywords line by line from the text file
const keywords = filename.split(/\r?\n/);
// keywords
let keyword = '';


// browser
const browser = await chromium.launch({
    headless: true,
    // open devtools
    devtools: false,
});


// set the headers
let setHeaders = async page =>
    await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
    });


// add router to intercept the request and change the hitsPerPage
const inpterceptedAndReplaceRequest = async (route, request) => {
    // Make the original request
    // hits per page`hitsPerPage=96`
    let hitsPerPage = 1000
    // for some fetch requests does not work with the cloudflare firewall
    let url = request.url();
    // get the method
    let method = request.method();
    // get the headers
    let headers = request.headers();
    // get the postData
    let postData = request.postData();
    // parse the postData
    //console.log('postData', postData);
    postData = JSON.parse(postData);
    // get the params
    let params = postData.requests[0].params
    // replace the hitsPerPage
    params = params.replace(/&hitsPerPage=96/g, `&hitsPerPage=${hitsPerPage}`);
    // add the new hitsPerPage
    postData.requests[0].params = params;
    //console.log('postData', postData);
    // continue with the request
    //let response = await route.fetch({ url, method, headers, body: postData, json: true })
    await route.continue({ url, method, headers, postData });
}

// click the load more button until all the hits are loaded
const clickLoadMoreHits = async page => {
    // loop over clicking the load more button
    // wait until the page is loaded    
    await page.waitForLoadState('domcontentloaded', { timeout: 100000 });
    // get the loaded hits
    let hits = await page.locator("//div[@class='hit-holder']").count();
    console.log(`starting clicking button with ${hits} hits out of ${total_hits}`);
    // loop over clicking the load more button
    let button = await page.getByText('Load more', { timeout: 1000 * 5 });
    //await expect(page.locator("text=modal title")).toBeVisible()
    // while the hits are less than the total hits and the button is visible
    while (hits < total_hits && await button.isVisible()) {
        try {
            // loop over clicking the load more button
            console.log('getting the button');
            button = await page.getByText('Load more', { timeout: 1000 * 5 });
            console.log('is button visible: ', await button.isVisible());
            // click the button
            console.log('clicking the button');
            await button.click();
            // wait for 10 seconds
            await page.waitForTimeout(1000 * 10);
            // wait until the page is loaded
            await page.waitForLoadState('load');
        } catch (e) {
            console.log('error', e)
        }
        // get the loaded hits
        hits = await page.locator("//div[@class='hit-holder']").count();
        console.log(`loaded ${hits} hits out of ${total_hits} when clicking loading button`);
    }
}

// get the hits from the page
let setListener = async page =>
    // Listen for all responses.   
    page.on('response', async response => {
        //  if  repository url comes form the algolia api
        if (response.url().match(/https:\/\/algolia.invaluable.com*/g)) {
            try {
                // get json response
                let res = (await response.json()).results[0];
                // write json to file
                //console.log(res.hits[0]);
                console.log(`inptercept ${res.hits.length} hits out of ${res.nbHits}`);
                // get the current hits
                current_hits = res.hits.length;
                // get the total hits
                total_hits = res.nbHits;
                // make posible filename
                let filename = `./storage/responces/data-${keyword}-${res.queryID}.json`;
                if( file_exists(filename) )
                    filename = `./storage/responces/data-${keyword}-${res.queryID}-${Date.now()}.json`;
                // write the json file
                write_json(res, filename);
                // log the message
                console.log('json file saved');
            } catch (e) {
                console.log('error', e)
            }
        }
    });

// get the hits from the page
let setRouters = async page => {
    // add route to stop from loading images
    await page.route('**/*', (route) => {
        return route.request().resourceType() === 'image'
            ? route.abort()
            : route.continue()
    });
    // add router to intercept the request and change the hitsPerPage
    await page.route(
        'https://algolia.invaluable.com/1/indexes/**',
        inpterceptedAndReplaceRequest
    );
}


let make_url = ({date, query, keyword}) => { 
    let params = {};
    params['upcoming'] = 'false';
    if(query)
        params['query'] = query.replace(/ /g, '%20');
    if(keyword)
        params['keyword'] = keyword.replace(/ /g, '%20');
    if(date){
        params['dateType'] = 'Custom';
        params['dateTimeUTCUnix%5Bmin%5D'] = `${date.start}`;
        params['dateTimeUTCUnix%5Bmax%5D'] = `${date.end}`;
    }
    // encode the url
    return encodeUrl( domain, params );
}

/* // search by time stamp
let current_time = parseInt(Date.now() / 1000);
let start =  1601670000;
let date_range = 100000; // about  half a day
let dates = [];
// make a list of dates
while( current_time > start ){
    start = start + date_range;
    dates.push( { start, end: start + date_range } )
}
// make a checklist
let dates_checklist = new Checklist(dates);
// get the next date
let date = dates_checklist.next();
*/

// make a checklist
let keys_checklist = new Checklist( keywords );
keys_checklist.log();
// get the next date
keyword = keys_checklist.next();

// loop over the dates
while (keyword) {
    try {
        // encode paramters
        let url = make_url({query: keyword, keyword});
        // go to url
        console.log('going to: ', url);
        // Open a new page / tab in the browser.
        const page = await browser.newPage();
        // set the headers
        await setHeaders(page);
        // set the router
        await setRouters(page);
        // set the listener
        await setListener(page);
        //  go to the url
        console.log('going to url');
        await page.goto(url, {
            // wait for 15 minutes
            timeout: 1000 * 60 * 15,
            // wait until the page is loaded
            waitUntil: 'domcontentloaded',
        });
        // wait for 10 seconds
        console.log('waiting for 10 seconds');
        await page.waitForTimeout(1000 * 10);
        // wait until the page is loaded    
        console.log('waiting for load state');
        await page.waitForLoadState('domcontentloaded', { timeout: 1000 * 60 * 15 });
        console.log(`got ${current_hits} hits out of ${total_hits}`);
        // get the number loaded hits
        if(total_hits >= 15000) {
            console.log('total hits is more than 15k');
            // check as having too many hits
            keys_checklist.check(keyword, "too many hits");
            // close the page
            await page.close();
            // get the next key
            keyword = keys_checklist.next();
            // continue
            continue;
        }
        // check if the date is correct
        if (current_hits < total_hits){
            console.log('current hits is less than total hits, loading more');
            await clickLoadMoreHits(page);
        } else
            console.log('got all total hits');
        keys_checklist.check(keyword);
        // close the page
        await page.close();
        // get the next key
        keyword = keys_checklist.next();
    } catch (e) {
        console.log('error', e)
    }
}
// close the browser    
await browser.close();

