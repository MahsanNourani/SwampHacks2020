DATA = {};
queue()
  .defer(d3.csv, "./Data/StateBasedData.csv")
  .await(function (error, data) {
    if (error)
      console.log(error);
    DATA.stateBasedData = data;
    startTask();
  });
CURRENT_YEAR = 2017;
CURRENT_STATE = "Texas";

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
    .scale(700)
    .translate([width / 2.5, height / 2.7]);


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

        div.text(d.properties.name + "\n" + numberWithCommas(totalEnrollement))
          .style("left", (d3.event.pageX + 30) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function (d) {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      })
      .on("click", function (d) {
        CURRENT_STATE = d.properties.name;
        console.log(CURRENT_STATE);
        removeOldCharts();
        renderChartsAndLabels();
        d3.select(this).classed("selectedState", true);
      });

  }
  genderChart();
  ethnicityChart();
}



function renderChartsAndLabels() {
  ethnicityChart();
  genderChart();
  d3.select('#gender-title').html("Enrollment Distribution by Gender in " + CURRENT_STATE);
  d3.select('#ethnicity-title').html("Enrollment Distribution by Ethnicity in " + CURRENT_STATE);
}

function removeOldCharts() {
  d3.select('#ethnicity-chart').select('svg').remove();
  d3.select('#gender-chart').select('svg').remove();
  d3.select(".selectedState").classed("selectedState", false);
}

function genderChart() {
  var width = 400, height = 300;
  var data = findStateGender(CURRENT_STATE);
  data = data.map(d => ({ ...d, count: Number(d.count) / 1000 }));
  var dataY = [];
  dataY.push(data[0].count);
  dataY.push(data[1].count);
  console.log(dataY);
  var dataX = ["Male", "Female"];

  var color = ["#7692FF", "#D8638A"];

  var gender = d3.select("#gender-chart");
  var genderSvg = gender.append("svg")
    .classed("border rounded border-dark", true)
    .attr("width", width)
    .attr("height", height)
    .style("background-color", "white");
  console.log(dataY);

  var ordinalScale = d3.scale.ordinal()
    .domain(dataX)
    .rangeBands([50, width - 50], 0.45, 0.2);
  ;

  var scaleDomain = [0, d3.max(dataY)];
  var scale = d3.scale.linear()
    .domain(scaleDomain)
    .range([height - 40, 10]);

  var x_axis = d3.svg.axis()
    .orient('bottom')
    .scale(ordinalScale);

  var y_axis = d3.svg.axis()
    .orient('left')
    .scale(scale);
  // .tickValues(d3.range(0, d3.max(dataY), 5000));


  genderSvg.append("g")
    .attr('class', 'axis')
    .call(x_axis)
    .attr("transform", "translate(0," + (height - 40) + ")");
  // .selectAll("text")
  // .style("text-anchor", "end")
  // .attr("dx", "-.8em")
  // .attr("dy", "-.55em")
  // .attr("transform", "rotate(-90)");

  genderSvg.append("g")
    .attr('class', 'axis')
    .attr("transform", "translate(55, 0)")
    .call(y_axis);



  genderSvg.selectAll("rect")
    .data(data).enter()
    .append("rect")
    .attr("fill", function (d, i) {
      return color[i];
    })
    .attr("width", "80px")
    .attr("height", function (d) {
      // return (d.count / d3.max(dataY)) *height;
      return height - scale(d.count) - 40;
    })
    .attr("y", function (d) {
      // return height - (d.count / d3.max(dataY)) *height - 40;
      console.log(d.count, scale(d.count), height);
      return scale(d.count);
    })
    .attr("x", function (d) {
      return ordinalScale(d.gender);
    })

}

function findStateGender(state) {
  console.log(state);
  var json = [];
  for (var i = 0; i < DATA.stateBasedData.length; i++) {
    if (DATA.stateBasedData[i].State == state) {
      json.push({ "gender": "Male", "count": DATA.stateBasedData[i].Male });
      json.push({ "gender": "Female", "count": DATA.stateBasedData[i].Female });
      break;
    }

  }
  return json;
}

function findStateTotal(state) {
  for (var i = 0; i < DATA.stateBasedData.length; i++) {
    if (DATA.stateBasedData[i].State == state)
      return DATA.stateBasedData[i].Total;
  }
  return 0;
}

function ethnicityChart() {


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
    if (DATA.stateBasedData[i].State == CURRENT_STATE) {
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

  return 0;
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}