DATA = {};
queue()
  .defer(d3.csv, "./Data/StateBasedData.csv")
  .await(function (error, data) {
    if (error)
      console.log(error);
    DATA.stateBasedData = data;
    startTask();
  });

function startTask() {

  // MAP
  var map = d3.select("#map");
  var width = 800,
    height = 450;

  // Tooltip Div
  var div = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  var projection = d3.geo.albersUsa()
    .scale(800)
    .translate([width / 2, height / 2]);


  var path = d3.geo.path()
    .projection(projection);


  var mapSvg = map.append("svg")
    .attr("width", width)
    .attr("height", height);


  queue()
    .defer(d3.json, "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json")
    .await(ready);

  function ready(error, us_geojson) {
    var us = us_geojson;

    mapSvg.append("g")
      .attr("class", "states").selectAll("path")
      .data(us.features).enter()
      .append("path")
      .attr("d", path)
      .on("mouseover", function (d) {
        div.transition()
          .duration(200)
          .style("opacity", .9);

        var totalEnrollement = findStateTotal(d.properties.name);
        //read the csv file to find the total number of enrollments

        div.text(d.properties.name + "\n" + totalEnrollement)
          .style("left", (d3.event.pageX + 30) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function (d) {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });



  }

  //Gender Chart
  var gender = d3.select("#gender-chart");
  var genderSvg = gender.append("svg")
    .attr("width", width)
    .attr("height", height);

  ethnicityChart("Total");

}

function findStateTotal(state) {
  for (var i = 0; i < DATA.stateBasedData.length; i++) {
    if (DATA.stateBasedData[i].State == state)
      return DATA.stateBasedData[i].Total;
  }
  return 0;
}

function ethnicityChart(state) {


  var ethnicity = d3.select("#ethnicity-chart");
  const rect = ethnicity.node().getBoundingClientRect();

  var width = rect.width;
  var height = rect.height;

  //race vars
  var native; //American Indian or Alaska Native
  var asianOrPI; // Asian or Pacific Islander
  var asian; // Asian
  var hawaiianOrPI; //Native Hawaiian or Other Pacific Islander
  var black; //Black or African American
  var hispanic; //Hispanic or Latino
  var white; //White
  var multiRacial; //Two or more races
  var unknown; //Race/ethnicity unknown
  var alien; //Nonresident alien

  for (var i = 0; i < DATA.stateBasedData.length; i++) {
    if (DATA.stateBasedData[i].State == state) {
      native = DATA.stateBasedData[i]["American Indian or Alaska Native"];
      asianOrPI = DATA.stateBasedData[i]["Asian or Pacific Islander"];
      asian = DATA.stateBasedData[i].Asian
      hawaiianOrPI = DATA.stateBasedData[i]["Native Hawaiian or Other Pacific Islander"];
      black = DATA.stateBasedData[i]["Black or African American"];
      hispanic = DATA.stateBasedData[i]["Hispanic or Latino"];
      white = DATA.stateBasedData[i].White;
      multiRacial = DATA.stateBasedData[i]["Two or more races"];
      unknown = DATA.stateBasedData[i]["Race/ethnicity unknown"];
      alien = DATA.stateBasedData[i]["Nonresident alien"];
    }
  }
  var raceData = [native, asianOrPI, asian, hawaiianOrPI, black, hispanic, white, multiRacial, unknown, alien].map(Number);

  console.log(raceData);
  // v3
  var yScale = d3.scale.linear()
    .domain([0, d3.max(raceData)])
    .range([0, height])
  var xScale = d3.scale.ordinal()
    .domain(d3.range(0, raceData.length))
    .rangeBands([0, width])
  var colors = d3.scale.linear()
    .domain([0, raceData.length])
    .range(['#90ee90', '#30c230'])

  var ethnicitySVG = ethnicity.append("svg")
    .attr("width", width)
    .attr("height", height)
    .selectAll('rect')
    .data(raceData)
    .enter().append('rect')
    .style('fill', function (d, i) {
      return colors(i);
    })
    .attr('width', xScale.rangeBand())
    .attr('height', function (d) {
      return yScale(d);
    })
    .attr('x', function (d, i) {
      return xScale(i);
    })
    .attr('y', function (d) {
      return height - yScale(d);
    })

}