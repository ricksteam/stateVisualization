const lineReader = require("line-reader");
const fs = require("fs");

let sumCycles = [];
let sumSnowfalls = [];
let counts = [];

for (let i = 0; i < 60; i++) {
    sumCycles.push(0);
    sumSnowfalls.push(0);
    counts.push(0)
}

let inc = 0;
lineReader.eachLine("c:/users/bricks/downloads/freezethaw-snowfall-allstates-allyears.csv", function (line, last) {
    if (inc != 0) {
        let splits = line.split(",");
        let state = splits[1];
        sumCycles[state] += +splits[6]
        sumSnowfalls[state] += +splits[7]
        counts[state]++;
    }
    inc++;

    if (last) {
        let toReturn = {
            cycles: [],
            snowfalls: []
        };
        for (let i = 0; i < sumCycles.length; i++) {
            let cycle = sumCycles[i] / counts[i];
            let snowfalls = sumSnowfalls[i] / counts[i];
            toReturn.cycles.push(cycle);
            toReturn.snowfalls.push(snowfalls)
        }
        let string = JSON.stringify(toReturn, null, 2);
        console.log(string)
        fs.writeFileSync('./snow.json', string);
        return false;
    }
})