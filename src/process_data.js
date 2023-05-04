import { write_json, read_json, ls_files } from "files-js";
import json2xls from  'json2xls';
import fs from 'fs';

let path = './storage/responces/'

// Get all files in the directory
let files = ls_files(path);

let hits = [];

// let sepater all the response file by the tags
// get tags from all files
let tags = [ ...(new Set( files.map((file) => file.split('-')[1]) )) ]

// for each tag make a file with all the hits
hits = tags.map( tag => {
    let tagHits = [];
    files.forEach((file, index) => {
        if (file.split('-')[1] == tag) {
            let data = read_json(path + file)
            // add all the hits to the array
            data.hits.forEach((hit) => tagHits.push(hit))
        }
    })
    // return and object with the tag and the hits
    return { tag: tag, hits: tagHits }
})

// how that have separeted_by_tags 
// we can remove all the repeated hits by only using the objectID

/*
hits = hits.map( hits => {
    // make a set of all unique objectIds
    let uniqueIDs = new Set();
    let uniqueHits = [];
    let repeatedObjecIds = 0;
    // for each hit, check if it is unique
    hits.hits.forEach( hit => {
        if (uniqueIDs.has(hit.objectID)) {
            repeatedObjecIds++
        } else {
            uniqueIDs.add(hit.objectID);
            uniqueHits.push(hit);
        }
    })
    // return and object with the tag and the hits
    return { tag: hits.tag, hits: uniqueHits, repeated: repeatedObjecIds }
})
*/


// add in item url for each of the hits
let baseDomain = 'https://www.invaluable.com/v2/auction-lot/';
hits = hits.map( hits => ({
    ...hits,
    // for each hit, 
    hits: hits.hits.map(hit => ({
        ...hit,
        // remove all non alphanumeric characters from the lotTitle value
        // and replace all spaces with a dash
        // and add the auctionId
        // and preappend the baseDomain
        url: baseDomain + hit.lotTitle.replace(/[^a-zA-Z0-9 ]/g, "").replace(/ /g, "-") + '-' + hit.lotRef + '/'
    }))
}));

// now that we know that each hit is unique 
// we must format the hits
hits = hits.map( hits => {
    // for each hit, 
    let formatedHits = hits.hits.map(hit => {
        hit = { ...hit,
            moreText: hit._highlightResult.moreText.value,
            lotTitle: hit._highlightResult.lotTitle.value,
            lotDescription: hit._highlightResult.lotDescription.value,
            matchedWords: Array.from( new Set( 
                [ ...hit._highlightResult.lotDescription.matchedWords, 
                    ...hit._highlightResult.lotTitle.matchedWords,
                    ...hit._highlightResult.moreText.matchedWords ] 
            )),
        };
        delete hit._highlightResult;
        return hit;
    });
    // return and object with the tag and the hits
    return { tag: hits.tag, hits: formatedHits }
})

// let remove any that sold for 0 dollars
hits = hits.map( hits => {
    // for each hit, 
    hits.hits = hits.hits.filter( hit => hit.priceResult > 0 );
    // return and object with the tag and the hits
    return hits;
})

// now we save to excel file
for (let i = 0; i < hits.length; i++) {
    let xls = json2xls(hits[i].hits);
    console.log('saving: /storage/cleaned/' + hits[i].tag + '.xlsx');
    fs.writeFileSync('./storage/cleaned/' + hits[i].tag + '.xlsx', xls, 'binary');
}
