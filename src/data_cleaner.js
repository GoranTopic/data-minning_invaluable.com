import { write_json, read_json, ls_files } from "files-js";

let path = './storage/responces/'

// Get all files in the directory
let files = ls_files(path);

// Array to store all the hits
let allHits = [];

// for each json response, make a set of all unique the hits
files.forEach((file, index) => {
    let data = read_json(path + file)
    //console.log(data.hits.length)
    // add hits to totalHits
    data.hits.forEach((hit) => allHits.push(hit))
})


// for each hit, check if it is unique
let repeatedObjecIds = 0
// make a set of all unique objectIds
let uniqueIDs = new Set();
let uniqueHits = new Array();

// for each hit, check if it is unique
allHits.forEach((hit) => {
    if (uniqueIDs.has(hit.objectID)) {
        repeatedObjecIds++
    } else {
        uniqueIDs.add(hit.objectID);
        uniqueHits.push(hit);
    }
})

// transform the set to an array

console.log('uid', uniqueIDs.size)
console.log('all', allHits.length)
console.log('repeated', repeatedObjecIds)


console.log(uniqueHits[150])
write_json(uniqueHits, './storage/cleaned/uniqueHits.json')


let hits = read_json('./storage/cleaned/uniqueHits.json')

console.log(hits[150])




