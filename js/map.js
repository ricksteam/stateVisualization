

const EXPORT_MAP_COORDS = true;
let bridgeData;
let coordData;
let maxValue = 0;
let minMax = 1;
let sortType = "map";
let viewMap = true;
let currentThreshHold = 0.003;
let mapCoords;
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

String.prototype.hashCode = function() {
  var hash = 0;
  if (this.length == 0) {
      return hash;
  }
  for (var i = 0; i < this.length; i++) {
      var char = this.charCodeAt(i);
      hash = ((hash<<5)-hash)+char;
      hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

function resize()
{
  console.log(window.innerWidth + ":" + window.innerHeight)
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight * 0.90;
  if (mapSvg != null)
  {
    mapSvg.attr("width", windowWidth)
    .attr("height", windowHeight)

  }

}
resize();
window.addEventListener('resize', resize);



 mapSvg = d3.select("#us-map")
.attr("preserveAspectRatio", "xMinYMin meet")
.attr("width", windowWidth)
.attr("height", windowHeight)
.attr("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`)
.attr("class", "svg_content"),
    width = +mapSvg.attr("width"),
    height = +mapSvg.attr("height");


//Get Data from JSON
DATA.getCoords(function(data)
{
  coordData = data;
});

DATA.getBridgeData(function(newData, standardDevData)
{
      standardDev = standardDevData.standardDev;
      standardDevAvg = standardDevData.avg;  

      CreateSlider( standardDevData.highestStandardDev);
      ChangeStandardDevLabelValue();
      SetPieColor();
      for (let i = 0; i < newData.length; i++) {
        let state = newData[i];
        let stateMax = 0;
        for (let j = 0; j < state.entries.length; j++) {
          let entry = state.entries[j];
          for (let k = 0; k < entry.length; k++) {
            if (entry[k] > maxValue) {
              maxValue = entry[k];
              console.log(newData[i].stateAbbr + " set a new max of " + maxValue);
            }
            if (k == 0 && entry[k] > stateMax) {
              stateMax = entry[k];
            }
          }
        }
        if (stateMax < minMax) {
          minMax = stateMax;
          console.log(newData[i].stateAbbr + " set a new min max of " + minMax);
        }
      }
      console.log("max value is " + maxValue);
      maxValue = .1;
      updateData(newData);

    });


    function update(data) {
  
      function translateHexes(data, i) {
        let listStart = {x: 350, y: 100};

        let column = Math.floor(i / 9);
        let row = (i % 9);

        let coord =  getCoord(data);
        let disX =  listStart.x - coord[0];
        let disY =  listStart.y - coord[1]; 
        
        if (viewMap)
        {
          return `translate(0 0)`;
        }
        else
        {
          let offsetX = (column % 2 == 1) ? boxSize / 2 : 0;
          return `translate(${disX + offsetX + row * boxSize} ${disY + column * boxSize})`;
        }

      }


      // JOIN new data with old elements.

      // JOIN new data with old elements.
      var g = mapSvg.selectAll(".states")
        .data(bridgeData, function (d) { return d.stateAbbr; });



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


        function getPath(data, i, scale, test)
        {
          if (scale == undefined) scale = 1;
          let coord = getCoord(data);
          let hexSize = boxSize * scale;

          let x = coord[0] + ((scale < 1) ? (boxSize / 2) * (1 - scale) : 0);
          let y = coord[1] + ((scale < 1) ? (boxSize / 2) * (1 - scale) : 0);
          if (test) 
          {
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
        .attr("id", function(data)
        {
           let ret = "boundBox" + JSON.stringify(data).hashCode();
          //console.log(ret);
           return ret;
        })
        .append("path")
        .attr("d", function(data, i)
        {
        return getPath(data, i, 1, true);
       })

     let pieRadius = boxSize / 1.3;
     

    /* var pieColor  = d3.scaleQuantize()
    .domain([0, 0.02])
    .range(["rgb(0, 0, 255)", "rgb(50, 0, 205)", "rgb(100, 0, 155)", "rgb(150, 0, 105)", "rgb(200, 0, 55)", "rgb(255, 0, 0)"]);
*/ 
    var arc = d3.arc()
    .outerRadius(pieRadius - 10)
    .innerRadius(0);

    var pie = d3.pie()
    .sort(null)
    .value(function(d) { return d; });

    var pieChart = gEnter
    .append("g")
    .attr("transform", function(data, i)
    {
      let coord = getCoord(data);
      return `translate(${coord[0] + boxSize / 2}, ${coord[1] + boxSize / 2})`
    })
    .attr("clip-path", function(data)
    {
      let ret = "boundBox" + JSON.stringify(data).hashCode();
      
       return `url('#${ret}')`;
    })
    
    var g = pieChart.selectAll(".arc")
      .data(function(data, i)    {
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
      .attr("fill", "#588d8d")
      .attr("d", function(data, i)
    {
      return getPath(data, i, 0.8);
    });

      gEnter.append('path').attr('class', 'years');
        gEnter
        .append("text")
        .attr("x", function(d) {
          let coord = getCoord(d);
          return coord[0] + boxSize / 2;
        })
        .attr("y", function(d) {
          let coord = getCoord(d);
        return coord[1] + boxSize / 2;
      })
          .text(function (d) {return d.stateAbbr;})
          .attr("text-anchor", "middle")
          .attr("alignment-baseline", "central")
          .style("font-size", 20)
          .style("fill", "white");


      
      function getCoord(data)
      {
        return coordData.find(c => c.state == data.stateAbbr).coord;
      }  
      function mapData(entries)
      {
          return entries.map(x => x[0]);
      }
      
     
    }
   
 
    function maxEntry(array) {
      let max = 0;
      for (let i = 0; i < array.length; i++) {
        if (array[i][0] > max)
          max = array[i][0];
      }
      return max;
    }

    function avgEntry(array) {
      let sum = 0;
      for (let i = 0; i < array.length; i++) {
        sum += array[i][0];
      }
      return sum / array.length;
    }

    function thresholdEntry(array) {
      for (let i = 0; i < array.length; i++) {
        if(array[i][0] >= currentThreshHold)
          return array.length -1 - i;
      }
      return 0;

    }

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

      if (sortType == "name")

        data = data.sort((a, b) => a.stateAbbr.localeCompare(b.stateAbbr))
      else {

        data = data.sort((a, b) => a[sortType] - b[sortType])
      }
      bridgeData = data;
      update(bridgeData);
    }
    function filter (select) {
      console.log("SELECT VAL: " + select.value);
      sortType = select.value;
      viewMap = (sortType == "map");
      if (sortType == "threshold")
      {
        $("#threshold").attr("hidden", false);
      }
      else
      {  
        $("#threshold").attr("hidden", true);
      }
      updateData(bridgeData);

    }
    function thresholdChanged(text)
    {
      if (!isNaN(text.value))
      {
        currentThreshHold = text.value;
        updateData(bridgeData);
      }
    }
    function getMaxStandardDev()
    {
      return 5;
    }
    function standardDevChanged(value)
    {
      standardDevMulti = value;
      ChangeStandardDevLabelValue();
      SetPieColor();
      FillPieChart();
    }
    function customStandardDeviation(check)
    {
      $("#standardDev").attr("hidden", !check.checked)
      if (check.checked == false) 
      {
        standardDevChanged(2);
        $("#slider").slider('option', "value", 2);
        $( "#custom-handle" ).text("2");
      }
    }
     function ChangeStandardDevLabelValue()
     {
          
        $("#standardDevLabel").html("Standard Deviation: " + standardDevMulti);
     }
      function FillPieChart()
      {
        d3.selectAll(".slice").attr("fill", function(d) {  
          return pieColor(d.data); 
        });
      }
     function SetPieColor()
     { 
       pieColor = d3.scaleSequential()
      .interpolator(d3.interpolateInferno)
      //.domain([Math.min(...mapped), Math.max(...mapped)]);
      .domain([0, standardDevAvg + (standardDevMulti * standardDev)])
    
      UpdateLegend();
     }
    function UpdateLegend()
    {
      mapSvg.append("g")
      .attr("class", "legend")
      .attr("transform", "translate(20,20)");
  
  var legendSequential = d3.legendColor()
     .labelFormat(d3.format(".3f"))
      .labels(function({i, genLength, generatedLabels, labelDelimiter}) {
        //Was planning on multiplying it by 100 but I'm not sure if you want that.
        return generatedLabels[i];

      })
      .shapeWidth(30)
      .cells(20)
      .orient("vertical")
      .scale(pieColor)
     
  
  mapSvg.select(".legend")
    .call(legendSequential);
    }
    function resetThreshold()
    {
      currentThreshHold = 0.003;
      $("#thresholdTxt").val(0.003);
      updateData(bridgeData);
    }
  
  function CreateSlider(max)
  {
    var handle = $( "#custom-handle" );
     $( "#slider" ).slider({
      range: "max",
      min: 1,
      max: max,
      value: 2, 
      create: function() {
        handle.text( $( this ).slider( "value" ) );
      },
      slide: function( event, ui ) {
        handle.text( ui.value );
        standardDevChanged(ui.value);
      }
    });
  }
    $( function() {
      $("#customStandardDev").checkboxradio();
    });