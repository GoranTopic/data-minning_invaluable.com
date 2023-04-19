import json2xls from  'json2xls';
import { read_json } from 'files-js';
import fs from 'fs';

let file = './storage/cleaned/uniqueHits.json';

let hits = read_json(file);


// convert hit 
hits = hits.map(hit => {
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


console.log('reading: ' + file);
var xls = json2xls(hits);

console.log('saving: /storage/cleaned/data.xlsx');
fs.writeFileSync('./storage/cleaned/data.xlsx', xls, 'binary');
