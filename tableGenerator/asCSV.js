//Port the json data to csv for latex

const fs = require('fs');

const data = JSON.parse(fs.readFileSync('../state.json', 'utf-8'));

let csvString = "State,";
for (let i = 1; i <= 96; i++) {
    csvString += "" + i;
    if(i!=96)
    i += ","
}
csvString += "\n";


for (let state of data) {
    let abb = state.stateAbbr;
    let values = state.entries.map(x => x[0]);
    csvString += abb + ",";
    csvString += values.join(",");
    csvString += "\n"
}

//LaTeX code

let midString = "";
let headerString = "";
for (let i = 1; i <= 96; i++) {
    midString += "|c ";
    headerString += "& \\textbf{" + i + "}"
}
midString += "|";

let latexString = `
\\begin{table*}[htb]
    \\centering
    \\begin{tabular}{|c ${midString}}\\hline
        \\textbf{State} ${headerString} \\\\\\hline
`;

for (let state of data) {
    let abb = state.stateAbbr;
    let values = state.entries.map(x => x[0].toFixed(3)).map(x => x == 0 ? "0" : x);
    latexString += abb + "&";
    latexString += values.join("&");
    latexString += "\\\\\\hline\n"
}

latexString +=
    `
    \\end{tabular}
    \\caption{Overview of the actuarial functions used.}
    \\label{table:probabilityItems}
\\end{table*}
`;




let latexOut = [];
let tablePages = 5;

for (let i = 0; i < tablePages; i++) {

    let start = Math.floor(data.length / tablePages * i);
    let end = Math.floor(data.length / tablePages * (i + 1));

    let midStringTranspose = "";
    let headerStringTranspose = "";
    for (let i = start; i < end; i++) {
        midStringTranspose += "c ";
        headerStringTranspose += "& \\textbf{" + data[i].stateAbbr + "}"
    }
    midStringTranspose += "|";

    let latexStringTranspose = `
\\begin{table*}[htb]
\\footnotesize
    \\centering
    \\begin{tabular}{|c| ${midStringTranspose}}\\hline
        \\textbf{Years} ${headerStringTranspose} \\\\\\hline
    `;

   

    for (let i = 0; i < 96; i+=2) {
        latexStringTranspose += "" + (i + 1) + "/" + (i + 2) + "&";
        for (let s = start; s < end; s++) {
            let proposed =  ((data[s].entries[i][0])*100).toFixed(1)
            let proposed2 = ((data[s].entries[i+1][0])*100).toFixed(1)
            latexStringTranspose += (proposed == 0 ? "0" : proposed)  + "/" + (proposed2 == 0 ? "0" : proposed2);
            if(s != end -1)
            latexStringTranspose += "& "
        }
        latexStringTranspose += "\\\\\\hline";
        latexStringTranspose += "\n";
    }

    latexStringTranspose +=
        `
    \\end{tabular}
    \\caption{Bridge repair or replacement probabilities (percentages) by bridge age, ${data[start].stateAbbr} to ${data[end-1].stateAbbr}.}
    \\label{table:states${i}}
\\end{table*}
    `;
    latexOut.push(latexStringTranspose)

}




fs.writeFileSync('repairProbabilities.csv', csvString);
fs.writeFileSync('repairProbabilities.tex', latexString);
 fs.writeFileSync(`repairProbabilitiesTranspose.tex`, latexOut.join("\n"));
