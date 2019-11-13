let DATA = {};

DATA.getCoords = function(cb)
{
      $.getJSON("./js/coords.json", function(data)
      {
        cb (data);
      });
}
DATA.getBridgeData = function(cb)
{
      $.getJSON("./state.json", function(data)
      {
        cb (data);
      });
}
