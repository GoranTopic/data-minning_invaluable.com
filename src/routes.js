import { Dataset, createPlaywrightRouter, sleep } from 'crawlee';

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ enqueueLinks, page, log }) => {
    log.info(`enqueueing new URLs`);
    // click the button in puppeteer
    // add router to intercept the request and change the hitsPerPage
    await page.route(
        'https://algolia.invaluable.com/1/indexes/**',
        //inpterceptedAndReplaceRequest
        async (route, request) => {
            const response = await page.request.fetch(route.request());
            console.log('response', response);
            await route.fulfill({ response });
        }
    )

    /* // add all the links to the queue
    await enqueueLinks({
        globs: ['https://www.invaluable.com/auction-lot/**'],
        label: 'detail',
    });
    */
});


router.addHandler('detail', async ({ request, page, log }) => {
    const title = await page.title();
    log.info(`${title}`, { url: request.loadedUrl });
    //log.info(page.$('h4:contains("Description")'));

    await Dataset.pushData({
        url: request.loadedUrl,
        title,
    });
});


// add router to intercept the request and change the hitsPerPage
const inpterceptedAndReplaceRequest = async (route, request) => {
    // Make the original request
    // for some fetch requests does not work with the cloudflare firewall
    let url = request.url();
    //console.log('url', url);
    let method = request.method();
    //console.log('method', method);
    let headers = request.headers();
    //console.log('headers', headers);
    let postData = request.postData();
    postData = JSON.parse(postData);
    //console.log('post data:', postData);
    let params = postData.requests[0].params
    //params = params.replace(/&hitsPerPage=96/g, '&hitsPerPage=136000');
    console.log('params', params);
    postData.requests[0].params = params;
    // make the request
    // const response = await route.fetch({ url, method, headers, postData });
    // console.log('response', response)
    // await route.fulfill({ response });
    await route.continue({ url, method, headers, postData });
}