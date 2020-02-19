
let DATA = {};

/**
 * getCoords
 *  @param cb the callback function that returns the data
 * Returns the browser coordinates for each state that d3 can then draw accordingly
 */
DATA.getCoords = function(cb)
{
      $.getJSON("./js/coords.json", function(data)
      {
        //Shifts the coordinates to be more centered
        data.coord = data.map ((d) =>
        {
          d.coord[0] -= 200;
          d.coord[1] -= 50;
        })
        cb (data);
      });
}

/**
 * getBridgeData
 * @param cb the callback function that returns the data
 * Gets the bridge data that sorts the hexes. This is the data that apprears around the edge and in the legend. 
 * Also computes the a standardDeviation, average, and highestStandardDeviation for later calculations
 */
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
/**
 * getCenterData
 * @param cb the callback function that returns the data
 * Gets the center data that updates color in center of hexes.  
 */
DATA.getCenterData = function(cb)
{
      $.getJSON("./centerData.json", function(data)
      {
        cb (data);
      });
}
/**
 * getAverage
 * @param entries represents a list of floats (recieved from bridgeData)
 * returns the average values of all values in the entries array
 */
function getAverage(entries)
{
  let sum = 0;
  entries.forEach(v => sum+=v);
  return sum / entries.length;
}

/**
 * getStandardDeviation
 * @param entries represents a list of floats (recieved from getBridgeData)
 * @param avg the average value of all the bridge data values (recieved from getAverage)
 * Calculates standard deviation for bridge average
 */
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

