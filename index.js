const fs = require("fs"); 
const CSVToJSON = require("csvtojson");
/*
fs.readdir("./StateProbabilitiesCSV", (err, allFiles)=>{
  if(err)
    return console.log("Error reading directory " + err);
  
  let files = allFiles.filter(i=>i.endsWith(".csv"))
  let allData = [];
  let promises = [];
  for(let i = 0; i < files.length; i++){
    let file = files[i];
    let stateAbbr = files[i].substr("probabilities".length, 2);
    
    let thisState = {stateAbbr, entries:[]};
    console.log("Parsing " + stateAbbr);
    let contents = fs.readFileSync("./" + file, "utf-8");

    let lines = contents.split("\r\n");
    console.log(lines)
    for(let i = 1; i <= 96; i++){

      let line = lines[i];
      let entries = line.split(",");
      let entryArray  = [];
      for(let j = 1; j < entries.length; j++){
        entryArray.push(+entries[j]);
      }
      thisState.entries.push(entryArray);
    }
    allData.push(thisState);
  }
  fs.writeFileSync("state.json", JSON.stringify(allData, null, 2));
})
*/
CSVToJSON().fromFile("./StateProbabilitiesCSV/Combined_pop_traffic_data.csv").then(source =>
  {
          console.log(source);
          fs.writeFileSync("centerData.json", JSON.stringify(source, null, 2));
  });   