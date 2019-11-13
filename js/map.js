


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
let coords =  [];
let mapSvg = null;

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
DATA.getBridgeData(function(newData)
{


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
        let listStart = {x: 500, y: 100};

        let column = Math.floor(i / 9);
        let row = (i % 9);

        let coord = coordData.find(c => c.state == data.stateAbbr);
        let disX =  listStart.x - coord.coord[0];
        let disY =  listStart.y - coord.coord[1];

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


        function getPath(data, i, scale)
        {
          if (scale == undefined) scale = 1;
          let coord = coordData.find(c => c.state == data.stateAbbr);
          let hexSize = boxSize * scale;

          let x = coord.coord[0] + ((scale < 1) ? (boxSize / 2) * (1 - scale) : 0);
          let y = coord.coord[1] + ((scale < 1) ? (boxSize / 2) * (1 - scale) : 0);
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



        /*gEnter.append("rect")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("x", function(d) {return d.coord[0]})
        .attr("y", function(d) {return d.coord[1]})
        .attr("width", boxSize)
        .attr("height", boxSize);*/

       gEnter.append("path")
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("fill", "#69a2a2")
        .attr("d", function(data, i)
      {
        return getPath(data, i);
      });

      /*gEnter.append("path")
       .attr("stroke-width", 2)
       .attr("fill", "gray")
       .attr("d", function(data, i)
     {
       return getPath(data, i, 0.70)
     });
*/

var arcGenerator = d3.arc();

var arcGen = arcGenerator({
  startAngle: 0,
  endAngle: 0.25 * Math.PI,
  innerRadius: 50,
  outerRadius: 100
});
  gEnter.selectAll('.years').data(arcGen);
gEnter.append('path').attr('class', 'years');
        gEnter
        .append("text")
        .attr("x", function(d) {
          let coord = coordData.find(c => c.state == d.stateAbbr);
          return coord.coord[0] + boxSize / 2;
        })
        .attr("y", function(d) {
          let coord = coordData.find(c => c.state == d.stateAbbr);
        return coord.coord[1] + boxSize / 2;
      })
          .text(function (d) {return d.stateAbbr;})
          .attr("text-anchor", "middle")
          .attr("alignment-baseline", "central")
          .style("font-size", 20)
          .style("fill", "white")



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
          //console.log(maxEntry(data[i].entries));
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
    function resetThreshold()
    {
      currentThreshHold = 0.003;
      $("#thresholdTxt").val(0.003);
      updateData(bridgeData);
    }
