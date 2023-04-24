import { write_json, read_json, ls_files } from "files-js";
import json2xls from  'json2xls';
import fs from 'fs';

let path = './storage/responces/'

// Get all files in the directory
let files = ls_files(path);

// let sepater all the response file by the tags
// get tags from all files
let tags = [ ...(new Set( files.map((file) => file.split('-')[1]) )) ]

// for each tag make a file with all the hits
let separeted_by_tags = tags.map( tag => {
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
let uniqueHits = separeted_by_tags.map( hits => {
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

// now that we know that each hit is unique 
// we must format the hits

let formatedHits = separeted_by_tags.map( hits => {
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

//console.log(formatedHits)

//console.log(formatedHits[0].hits[0])
    
// now we write to excel file
for (let i = 0; i < formatedHits.length; i++) {
    let xls = json2xls(formatedHits[i].hits);
    console.log('saving: /storage/cleaned/' + formatedHits[i].tag + '.xlsx');
    fs.writeFileSync('./storage/cleaned/' + formatedHits[i].tag + '.xlsx', xls, 'binary');
}





