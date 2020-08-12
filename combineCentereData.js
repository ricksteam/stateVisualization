//Combine center data and mapped data
const fs = require("fs");

let centerData = JSON.parse(fs.readFileSync("./centerData.json", "utf-8"))
let mappedFields = JSON.parse(fs.readFileSync("./mappedFields.json", "utf-8"))

console.log(centerData);
console.log(mappedFields);

let newList = [];

for(let i= 0; i < centerData.length; i++){
    let state = centerData[i].State;
    let center = centerData[i];
    let mapped = mappedFields.find(x=>x.State == state);
    if(!mapped) return "Error, could not find " + state;
    let keys = Object.keys(center);
    let newObject = JSON.parse(JSON.stringify(mapped));
    for(let key of keys){
        newObject[key] = center[key];
    }
    newList.push(newObject);

}

fs.writeFileSync('./newList.json', JSON.stringify(newList, null, 2));
