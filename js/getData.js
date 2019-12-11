
let DATA = {};

DATA.getCoords = function(cb)
{
      $.getJSON("./js/coords.json", function(data)
      {
        data.coord = data.map ((d) =>
        {
          d.coord[0] -= 200;
          d.coord[1] -= 50;
        })
        cb (data);
      });
}
DATA.getBridgeData = function(cb)
{
      $.getJSON("./state.json", function(data)
      {
        let completeData = data.map(v => v.entries.map(v => v[0])).reduce((a, b) => a.concat(b)); 
        
        let avg = getAverage(completeData);
        let standardDev = getStandardDeviation(completeData, avg);
        let highestStandardDev =  Math.max(...completeData) / standardDev;
        cb (data, {standardDev: standardDev, avg: avg, highestStandardDev: highestStandardDev});
      });
}

function getAverage(entries)
{
  let sum = 0;
  entries.forEach(v => sum+=v);
  return sum / entries.length;
}

function getStandardDeviation(entries, avg)
{


  let squareDiffs = entries.map(v => 
    {
      let diff = v - avg;
      let sqrDiff = Math.pow(diff, 2)
      return sqrDiff;
    });
  let squareDiffAvg = getAverage(squareDiffs);
  return Math.sqrt(squareDiffAvg);
} 

