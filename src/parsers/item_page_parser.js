import * as cheerio from 'cheerio'
import fs from 'fs';

// read the html file
const htmlString = fs.readFileSync('../responces/item_page.html', 'utf8');

// this js function  extracts the data from the html string and returns a map of the data
const extractData = (html) => {
  // this function uses parses the html string and uses xpath to extract the data
  // let parse the html string
  const $ = cheerio.load(html);
  // extract the data
  let item = {};
  // get the title by id
  item.lotTitle = $('#lotTitle')[0].children[0].data;
  // get the lot number by id
  item.lotNumber = parseInt(item.lotTitle.split(' ')[1]);
  // get the images by class
  item.images = $('.carousel-link').map((i, el) => { return el.attribs.href }).get();
  // get item title by id
  item.title = $('#lotTitle')[0].children[1].children[0].data
  // get the lot estimation by class
  item.lotEstimation = $('.lot-estimate').text().trim();
  // get the lot ammount by class
  item.lotAmmount = $('.amount').text().trim()
  // get auction house by class
  item.auctionHouse = $('.house-name').text().trim();
  // get auction house link with a css selector with tag name and class
  item.auctionHouseLink = $('h4.house-name').children()[0].attribs.href;
  // get the house address by class
  item.auctionHouseLink = $('div .auction-date').text().trim();
  // get house address by class
  item.auctionHouseAdress = $('div .address').text().trim();
  // get the auction type by class
  item.auctionType = $('div .qa-auction-type').text().trim();
  // item Overview description by content of h4 tag and next sibling
  item.description = $('h4:contains("Description")').next().text().trim();
  // item Overview medium by content of h4 tag and next sibling
  item.medium = $('h4:contains("Medium")').next().text().trim();
  // item Overview condition report by content of h4 tag and next sibling
  item.conditionReport = $('h4:contains("Condition Report")').next().text().trim();
  // return the item 
  return item
}

console.log(extractData(htmlString));