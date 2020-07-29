let bridgeData; //Represents probability of bridge repair over time
let coordData; //The coordinates in localspace for each space
let centerData; //the centerData json that sorts color in center of hex
let maxValue = 0;
let minMax = 1;
let sortType = "map";
let centerType = "none";
let viewMap = true;
let currentThreshHold = 0.003;
//aspect ratio and balance variables
let aspectRatio = 0;
let viewBoxWidth = 750;
let viewBoxHeight = 750;
let numOfBoxesPerRow = 6;
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;

let boxSize = 75;
let coords = [];
let mapSvg = null;
let standardDev = 0;
let standardDevAvg = 0;
let standardDevMulti = 2;
let pieColor;
let centerColor;
let cellHover = {}; //data for the current cell the mouse is over
let isHover = false;
let CenterMin = {
};
let CenterMax = {
};
let legendLeniency;
let legendCount = 20;

/**
 * hashCode
 * Generates a unique hash based on the string it was called on. This is used to randomize the id names
 */
String.prototype.hashCode = function () {
    var hash = 0;
    if (this.length == 0) {
        return hash;
    }
    for (var i = 0; i < this.length; i++) {
        var char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

/**
 * resize
 * Makes sure the aspect ratio remains the same during browser resize
 */
function resize() {
    console.log(window.innerWidth + ":" + window.innerHeight)
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight * 0.90;
    if (mapSvg != null) {
        mapSvg.attr("width", windowWidth)
            .attr("height", windowHeight)

    }

}
resize();
window.addEventListener('resize', resize);


//D3 Setup
mapSvg = d3.select("#us-map")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("width", windowWidth)
    .attr("height", windowHeight)
    .attr("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`)
    .attr("class", "svg_content"),
    width = +mapSvg.attr("width"),
    height = +mapSvg.attr("height");


//Get Coordinates from JSON
DATA.getCoords(function (data) {
    coordData = data;
});

//Get center data from JSON
DATA.getCenterData(function (data) {
    centerData = data;
    if(data.length > 0){
        let anEntry = data[0];
        let keys = Object.keys(anEntry);
        for(let i = 0; i < keys.length; i++){
            let key = keys[i];
            if(key == "name" || key == "State" || key.startsWith("Material") || key.startsWith("Structure")) continue;
            let readableKey = key;
            readableKey = readableKey
                .replace(/_/g, " ") //Replace underscores with spaces
                .split(" ")         //Split into words
                .map(x=>x[0].toUpperCase() + x.substring(1))    //Make every word upper case, https://stackoverflow.com/q/1026069/10047920
                .join(" ")          //Put back into a phrase
                .replace(/Average$/, "(State Average)")   //If the phrase ends in average, put it in parens
                .replace(/Median$/, "(State Median)");    //If the phrase ends in median, put it in parens

            app.centerSelectItems.push({value:key,text:readableKey})
        }
    }

    SetCenterMinMax();
});
//Get Bridge data from JSON and calculate standard deviation
DATA.getBridgeData(function (newData, standardDevData) {
    standardDev = standardDevData.standardDev;
    standardDevAvg = standardDevData.avg;

    //CreateSlider(standardDevData.highestStandardDev); //setup slider values
    //ChangeStandardDevLabelValue(); //Setup slider text
    SetPieColor(); //Set the color scale that will be used to represent bridge data

    for (let i = 0; i < newData.length; i++) {
        let state = newData[i];
        let stateMax = 0;
        for (let j = 0; j < state.entries.length; j++) {
            let entry = state.entries[j];
            for (let k = 0; k < entry.length; k++) {
                if (entry[k] > maxValue) {
                    maxValue = entry[k];
                    // console.log(newData[i].stateAbbr + " set a new max of " + maxValue);
                }
                if (k == 0 && entry[k] > stateMax) {
                    stateMax = entry[k];
                }
            }
        }
        if (stateMax < minMax) {
            minMax = stateMax;
            // console.log(newData[i].stateAbbr + " set a new min max of " + minMax);
        }
    }
    console.log("max value is " + maxValue);
    maxValue = .1;
    updateData(newData);

});


function update(data) {

    /**
     * translateHexes
     * @param data the bridge data list  
     * @param i Current index in data 
     * Translates the hexes from a map postion to a list position 
     */
    function translateHexes(data, i) {
        let listStart = { x: 350, y: 100 };

        let column = Math.floor(i / 9);
        let row = (i % 9);

        let coord = getCoord(data);
        let disX = listStart.x - coord[0];
        let disY = listStart.y - coord[1];

        if (viewMap) {
            return `translate(0 0)`;
        }
        else {
            let offsetX = (column % 2 == 1) ? boxSize / 2 : 0;
            return `translate(${disX + offsetX + row * boxSize} ${disY + column * boxSize})`;
        }

    }

   

    // JOIN new data with old elements.
    var g = d3.select("#us-map").selectAll(".states")
        .data(data, function (d) { return d.stateAbbr; });



    // EXIT old elements not present in new data.
    g.exit()
        .remove();


    // UPDATE old elements present in new data.
    g.transition()
        .duration(1500)
        .attr("transform", translateHexes)

    // ENTER new elements present in new data.
    var gEnter = g.enter().append("g");

    gEnter
        .attr("class", "states")
        .transition()
        .duration(1500)
        .attr("transform", translateHexes)

    /**
     * 
     * @param data the bridge data
     * @param i current index in data
     * @param scale the scale of the hexes (default is 1 (100%) or normal scale)
     * @param offset a balance variable. if we are in the list form...offset the coords so it fits nicely
     */
    function getPath(data, i, scale, offset) {
        if (scale == undefined) scale = 1;
        let coord = getCoord(data);
        let hexSize = boxSize * scale;

        let x = coord[0] + ((scale < 1) ? (boxSize / 2) * (1 - scale) : 0);
        let y = coord[1] + ((scale < 1) ? (boxSize / 2) * (1 - scale) : 0);
        if (offset) {
            x = -boxSize / 2;
            y = -boxSize / 2;
        }
        let hexagon = [
            [x + hexSize / 2, y],
            [x + hexSize, y + hexSize * (1 - (Math.sqrt(3) / 2))],
            [x + hexSize, y + hexSize * (Math.sqrt(3) / 2)],
            [x + hexSize / 2, y + hexSize],
            [x, y + hexSize * (Math.sqrt(3) / 2)],
            [x, y + boxSize * (1 - (Math.sqrt(3) / 2))],
            [x + hexSize / 2, y]
        ];
        let lineGenerator = d3.line();
        let path = lineGenerator(hexagon);
        return path;
    }

    let boundBox = gEnter
        .append("clipPath")
        .attr("id", function (data) {
            let ret = "boundBox" + JSON.stringify(data).hashCode();
            return ret;
        })
        .append("path")
        .attr("d", function (data, i) {
            return getPath(data, i, 1, true);
        })

    // Create Pie Chart
    let pieRadius = boxSize / 1.3;

    var arc = d3.arc()
        .outerRadius(pieRadius - 10)
        .innerRadius(0);

    var pie = d3.pie()
        .sort(null)
        .value(function (d) { return d; });

    var pieChart = gEnter
        .append("g")
        .attr("transform", function (data, i) {
            let coord = getCoord(data);
            return `translate(${coord[0] + boxSize / 2}, ${coord[1] + boxSize / 2})`
        })
        .attr("clip-path", function (data) {
            let ret = "boundBox" + JSON.stringify(data).hashCode();

            return `url('#${ret}')`;
        })

    var g = pieChart.selectAll(".arc")
        .data(function (data, i) {
            let mapped = mapData(data.entries);
            //console.log(mapped);
            return pie(mapped)
        })
        .enter().append("g")
        .attr("class", "arc")


    g.append("path")
        .attr("class", "slice")
        .attr("d", arc)

    FillPieChart();


    gEnter.append("path")
        .attr("class", "center")
        .attr("d", function (data, i) {
            return getPath(data, i, 0.8);
        });
    FillCenter();

    //the state text in the hexes
    gEnter.append('path').attr('class', 'years');
    gEnter
        .append("text")
        .attr("x", function (d) {
            let coord = getCoord(d);
            return coord[0] + boxSize / 2;
        })
        .attr("y", function (d) {
            let coord = getCoord(d);
            return coord[1] + boxSize / 2;
        })
        .text(function (d) { return d.stateAbbr; })
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .style("font-size", 20)
        .style("fill", "white");

    mapSvg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(20,20)");
    mapSvg.append("g")
        .attr("class", "legend_center")
        .attr("transform", "translate(140, 20)");
    UpdateLegend();

    /**
     * getCoord
     * @param data the bridge data list
     * Takes the bridge data list and returns the corisponding coord data
     */
    function getCoord(data) {
        return coordData.find(c => c.state == data.stateAbbr).coord;
    }
    /**
     * mapData
     * @param entries the bridge data list
     * thats the bridge data list and maps it to only the first value of the 5 years to make it more accurate.
     */
    function mapData(entries) {
        return entries.map(x => x[0]);
    }


}

/**
 * maxEntry 
 * @param array The bridge data array
 * returns the max entry...used for sorting by max
 */
function maxEntry(array) {
    let max = 0;
    for (let i = 0; i < array.length; i++) {
        if (array[i][0] > max)
            max = array[i][0];
    }
    return max;
}

/**
 * avgEntry 
 * @param array The bridge data array
 * returns the average entry...used for sorting by average
 */
function avgEntry(array) {
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
        sum += array[i][0];
    }
    return sum / array.length;
}

/**
* thresholdEntry 
* @param array The bridge data array
* returns the entry based on the given threshold variable (number picker UI element)...used for sorting 
*/
function thresholdEntry(array) {
    for (let i = 0; i < array.length; i++) {
        if (array[i][0] >= currentThreshHold)
            return array.length - 1 - i;
    }
    return 0;

}
function getCenterValueEntry(entry) {
    let ste = centerData.find(x => x.State == entry.stateAbbr);
    switch (centerType) {
        case "none":
            return;
        case "density":
            return ste.Density;
        case "pop":
            return ste.Pop;
        case "veh_reg":
            return (ste.trucks_registered + ste.cars_registered)
        case "LandArea":
            return ste.LandArea;
    }

}
/**
 * updateData
 * @param data  The bridge data array
 * Updates the data based on the current sort type (keep in mind. "Map" is not a sort type in this function. This only refers to data and not appearance)
 * Sort types: Max, Average, Name, Threshold
 */
function updateData(data) {

    if (sortType == "max") {
        for (let i = 0; i < data.length; i++) {
            data[i].max = maxEntry(data[i].entries);
        }
    }
    if (sortType == "avg") {
        for (let i = 0; i < data.length; i++) {
            data[i].avg = avgEntry(data[i].entries);
        }
    }
    if (sortType == "threshold") {
        for (let i = 0; i < data.length; i++) {
            data[i].threshold = thresholdEntry(data[i].entries);
        }
    }
    if (sortType == "centerValue") {
        for (let i = 0; i < data.length; i++) {

            data[i].centerValue = getCenterValueEntry(data[i]);
        }
    }

    if (sortType == "name") {
        data = data.sort((a, b) => a.stateAbbr.localeCompare(b.stateAbbr))
    }
    else {

        data = data.sort((a, b) => a[sortType] - b[sortType])
    }

    bridgeData = data;
    update(bridgeData);
}

/**
 * filter
 * @param select the select DOM element 
 * called from the onchange action in the sorting select element
 */
function filter(select) {
    //console.log("SELECT VAL: " + select.value);
    sortType = select.value;
    viewMap = (sortType == "map");
    if (sortType == "threshold") {
        $("#threshold").attr("hidden", false);
    }
    else {
        $("#threshold").attr("hidden", true);
    }
    updateData(bridgeData);

}

/**
 * filterCenter
 * @param select the select DOM element 
 * called from the onchange action in the sorting select element
 */
function filterCenter(select) {
    //console.log("SELECT VAL: " + select.value);
    centerType = select.value;

    updateData(bridgeData);
    UpdateCenterLegend();
}

/**
 * thresholdChanged
 * @param text the number picker DOM element
 * updates the threshold whenever the number picker (threshold representation) is updated
 */
function thresholdChanged(text) {
    if (!isNaN(text.value)) {
        currentThreshHold = text.value;
        updateData(bridgeData);
    }
}

/**
* standardDevChanged
* @param value the slider DOM element
* updates the standarddeviation whenever the slider is updated
*/
function standardDevChanged(value) {
    standardDevMulti = value;
    ChangeStandardDevLabelValue();
    SetPieColor();
    FillPieChart();
}

/**
 * customStandardDeviation
 * @param check the checkbox DOM element
 * hides and spawns the slider based on checkbox value. if it is not check value is reset to 2
 */
function customStandardDeviation(check) {
    $("#standardDev").attr("hidden", !check.checked)
    if (check.checked == false) {
        standardDevChanged(2);
        $("#slider").slider('option', "value", 2);
        $("#custom-handle").text("2");
    }
}

/**
 * ChangeStandardDevLabelValue
 * Changes the lable value for standard deviation next to the slider
 */
function ChangeStandardDevLabelValue() {

    $("#standardDevLabel").html("Standard Deviation: " + standardDevMulti);
}

/**
 * FillPieChart
 * Fills the pie chart with the appropiate color whenever the standarddeviation is updated the value in the color scale is as well.
 * Also handles color change on legend hover
 */
function FillPieChart() {
    d3.selectAll(".slice").attr("fill", function (d) {
        if (isHover) {
            if (pieColor(d.data) == "#fcffa4") console.log(d)
            if (d.data <= cellHover.value + legendLeniency && d.data >= cellHover.value - legendLeniency) {
                return pieColor(d.data);
            }

            else {
                return "#588d8d";
            }

        }
        else {
            return pieColor(d.data);
        }
    })
}
function FillCenter() {
    let centerType = app.selectedCenterFormat;
    if(centerType != "none"){
        SetCenterColor(CenterMin[centerType], CenterMax[centerType]);
    }

    d3.selectAll(".center").attr("fill", function (d) {
        let ste = centerData.find(x => x.State == d.stateAbbr);
        if(centerType == "none")
                return "#588d8d";
        else
                return centerColor(ste[centerType]);
    })
}
/**
 * Sets the global variable pieColor based on the standarddevation
 * The color is based on d3 color scaleSequential (interpolateInferno)
 */
function SetPieColor(sel) {
    let snd = standardDevAvg + (standardDevMulti * standardDev);
    //let inter = eval($("#filterColor option:selected").val())
    //eval($("#filterColor option:selected").val())
    let inter = eval(app.selectedColorScheme)
    let dom = (sel ? [snd, 0] : [0, snd])
    console.log(dom);
    pieColor = d3.scaleSequential()
        .interpolator(inter)
        //.domain([Math.min(...mapped), Math.max(...mapped)]);
        .domain(dom)

    legendLeniency = snd / legendCount;
    UpdateLegend();

}

/**
 * Sets the global variable centerColor based on the centerType
 */
function SetCenterColor(min, max) {
    centerColor = d3.scaleLinear()
        .domain([min, max])
        .range(["#00afff", "#ff1400"]);
    UpdateCenterLegend();
}

/**
 * UpdateLegend
 * Creates the legend using d3-legend library. 
 */
function UpdateLegend() {

    var legendSequential = d3.legendColor()
        .labelFormat(d3.format(".3f"))
        .labels(function ({ i, genLength, generatedLabels, labelDelimiter }) {
            //Was planning on multiplying it by 100 but I'm not sure if you want that.
            return (generatedLabels[i] * 100).toFixed(2);;

        })
        .shapeWidth(30)
        .cells(legendCount)
        .orient("vertical")
        .scale(pieColor)
        //.title("Cell Border Legend")
        .on("cellover", function (d) { LegendCellMouseOver(d) })
        .on("cellout", function (d) { LegendCellMouseExit(d) });

    mapSvg.select(".legend")
        .call(legendSequential);
}
function UpdateCenterLegend() {

    var legendCenter = d3.legendColor()
        .shapeWidth(30)
        .labelAlign("start")
        .orient("vertical")
        .scale(centerColor)
        .cells(10)
        .labels(function ({ i, genLength, generatedLabels, labelDelimiter }) {
            return d3.format(".2s")(generatedLabels[i])

        })
    if (centerType == "none") {
        console.log("hi")
        mapSvg.select(".legend_center").selectAll("*").remove();
    }
    else {
        mapSvg.select(".legend_center")
            .call(legendCenter);
    }

}
/**
* ResetThreshold
* Resets the threshold when the checkbox is unchecked
*/
function resetThreshold() {
    currentThreshHold = 0.003;
    $("#thresholdTxt").val(0.003);
    updateData(bridgeData);
}

/**
* LegendCellMouseOver
* called when mouse enter a legend cell
*/
function LegendCellMouseOver(d) {
    let color = pieColor(d);

    cellHover.color = color;
    cellHover.value = d;
    //console.log(cellHover.color);
    isHover = true;
    FillPieChart();
}

/**
 * LegendCellMouseExit
 * called when mouse leaves a legend cell
 */
function LegendCellMouseExit() {
    cellHover.color = null;
    cellHover.value = null;
    //console.log(cellHover.color);
    isHover = false;
    FillPieChart();
}

/**
* SetCenterMinMax
* Sets min max value for center hex
*/
function SetCenterMinMax() {

    if(centerData.length > 0){
        CenterMax = {};
        CenterMin = {};
        
        Object.keys(centerData[0]).forEach(key=>{
            CenterMax[key] = Number.NEGATIVE_INFINITY;
            CenterMin[key] = Number.POSITIVE_INFINITY;
        })   

        centerData.forEach(state=>{
            Object.keys(state).forEach(key=>{
                if(CenterMax[key] < +state[key]) CenterMax[key] = +state[key];
                if(CenterMin[key] > +state[key]) CenterMin[key] = +state[key];
            })
        })
    }


    // centerData.forEach(x => {
    //     // Max
    //     if (x.Density > CenterMax.Density) CenterMax.Density = x.Density;
    //     if (x.Pop > CenterMax.Population) CenterMax.Population = x.Pop;
    //     if ((x.trucks_registered + x.cars_registered) > CenterMax.Vehicle_Reg) CenterMax.Vehicle_Reg = (x.trucks_registered + x.cars_registered);
    //     if (x.LandArea > CenterMax.LandArea) CenterMax.LandArea = x.LandArea;
    //     // Min
    //     if (x.Density < CenterMin.Density) CenterMin.Density = x.Density;
    //     if (x.Pop < CenterMin.Population) CenterMin.Population = x.Pop;
    //     if ((x.trucks_registered + x.cars_registered) < CenterMin.Vehicle_Reg) CenterMin.Vehicle_Reg = (x.trucks_registered + x.cars_registered);
    //     if (x.LandArea < CenterMin.LandArea) CenterMin.LandArea = x.LandArea;

    // });

}

/**
 * CreateSlider 
 * @param max the max value the slider can have
 * Creates the slider and checkbox...needs to be instantiated because values are determined on standarddeviation
 */
function CreateSlider(max) {
    var handle = $("#custom-handle");
    $("#slider").slider({
        range: "max",
        min: 1,
        max: max,
        value: 2,
        create: function () {
            handle.text($(this).slider("value"));
        },
        slide: function (event, ui) {
            handle.text(ui.value);
            standardDevChanged(ui.value);
        }
    });
}
// $(function () {
//     $("#customStandardDev").checkboxradio();
// });


function TESTCOLOR(ch) {
    if (ch != null) {

        SetPieColor(ch.checked)
    }
    else {
        SetPieColor(false);
    }

    updateData(bridgeData);
}