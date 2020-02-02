DATA = {};
queue()
	.defer(d3.csv, "./Data/StateBasedData.csv")
	.await(function(error, data) {
		if (error)
			console.log(error);
		DATA.stateBasedData = data;
		updateCharts();
		startTask();
	});
CURRENT_YEAR = 2017;
CURRENT_STATE = "USA";

// const activeCountries = [CURRENT_STATE];
const activeCountries = ["USA"];

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
                // window.alert("ya");
                var disselect = false;
                if (CURRENT_STATE == d.properties.name) {
                    disselect = true;
                }
                CURRENT_STATE = d.properties.name;
                console.log(CURRENT_STATE);
                removeOldCharts();
                renderChartsAndLabels(disselect);
                // d3.select(this).classed("selectedState", true);
                // if toggle button is true:
                toggleCountry(this, d);
            });

    }
    genderChart();
    ethnicityChart();
}



function renderChartsAndLabels(isDisselected) {
    ethnicityChart();
    genderChart();
    if ($('#aggregate-toggle').is(':checked')) {
        d3.select('#gender-title').html("Aggregated Enrollment Distribution by Gender for Selected States");
        d3.select('#ethnicity-title').html("Aggregated Enrollment Distribution by Ethnicity for Selected States");
    }
    else {
        d3.select('#gender-title').html("Enrollment Distribution by Gender in " + CURRENT_STATE);
        d3.select('#ethnicity-title').html("Enrollment Distribution by Ethnicity in " + CURRENT_STATE);
    }
    if (CURRENT_STATE == 'Florida' && !isDisselected) {
        d3.select('#stream-title').html("Enrollment Distribution by Ethnicity Years 2007-2017 in Florida");
        streamGraph();
    }
    else {
        d3.select('#stream-title').html("");
    }
}

function removeOldCharts() {
    d3.select('#ethnicity-chart').select('svg').remove();
    d3.select('#gender-chart').select('svg').remove();
    d3.select('#stream-chart').select('svg').remove();
    d3.select(".selectedState").classed("selectedState", false);
}

function toggleCountry(div, data) {
    // add or remove data from active array
    let countryName = data.properties.name;
    let idx = activeCountries.indexOf(countryName);
    if (idx == -1) {//If you click on a new state
        var totalIdx = activeCountries.indexOf("USA");
        if ( totalIdx >= 0) {
            activeCountries.splice(totalIdx,1);
        }
        if ($('#aggregate-toggle').is(':checked')) {
            activeCountries.push(countryName);
            // mark country in geo map
            div.classList.toggle("active");
        }
        else {
            activeCountries.length = 0;
            activeCountries.push(countryName);
            d3.select("#map").selectAll(".active").classed("active", false);
            div.classList.toggle("active");
        }
    }
    else { //If you click an already selected state, it will be unselected.
        activeCountries.splice(idx, 1);
        div.classList.toggle("active");
        if (activeCountries.length == 0) {
            activeCountries.push("USA");
            CURRENT_STATE = "USA";
            renderChartsAndLabels();

        }
    }

    updateCharts();
}

function updateCharts() {
    genderChart();
    ethnicityChart();
}

function genderChart() {

	var width = 400, height = 300;
	var data = findStateGender(activeCountries);
	data = data.map(d => ({ ...d, count: Number(d.count)}));
	var dataY = [];
	dataY.push(data[0].count);
	dataY.push(data[1].count);
	console.log(dataY);
	var dataX = ["Male","Female"];

	var color = ["#7692FF","#F3C98B"];

	var gender = d3.select("#gender-chart");
    gender.html(""); // clear last chart;

	var genderSvg = gender.append("svg")
		.classed("border rounded border-dark", true)
		.attr("width", width)
		.attr("height", height)
		.style("background-color", "white");
	console.log(dataY);

	var ordinalScale = d3.scale.ordinal()
		.domain(dataX)
		.rangeBands([50, width-50], 0.7, 0.2);


	var scaleDomain = [0, d3.max(dataY)];
	var scale = d3.scale.linear()
		.domain(scaleDomain)
		.range([height - 40, 10]);

	var x_axis = d3.svg.axis()
		.orient('bottom')
		.scale(ordinalScale);

	var y_axis = d3.svg.axis()
		.orient('left')
		.tickFormat(d3.format("s"))
		.scale(scale);
		// .tickValues(d3.range(0, d3.max(dataY), 5000));


	genderSvg.append("g")
		.attr('class','axis')
		.call(x_axis)
		.attr("transform", "translate(0," + (height - 40) + ")");
		// .selectAll("text")
		// .style("text-anchor", "end")
		// .attr("dx", "-.8em")
		// .attr("dy", "-.55em")
		// .attr("transform", "rotate(-90)");

	genderSvg.append("g")
		.attr('class','axis')
		.attr("transform", "translate(55, 0)")
		.call(y_axis);

    // Tooltip for ethnicity
        var divToolTip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("min-width", "103px");

	genderSvg.selectAll("rect")
		.data(data).enter()
		.append("rect")
		.attr("fill", function (d,i) {
			return color[i];
		})
		.attr("width", "50px")
		.attr("height", function (d) {
			// return (d.count / d3.max(dataY)) *height;
			return height - scale(d.count) - 40;
		})
		.attr("y", function (d) {
			return scale(d.count);
		})
		.attr("x", function (d) {
			return ordinalScale(d.gender);
		})
        .on("mouseover", function (d,i) {
            divToolTip.transition()
                .duration(200)
                .style("opacity", .9);

            divToolTip.text(numberWithCommas(d.count) + " enrolled")
                .style("left", (d3.event.pageX + 15) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function (d,i) {
            divToolTip.transition()
                .duration(500)
                .style("opacity", 0);
        });


}

function findStateGender(stateArray) {
    var json = [
        { gender: "Male", count: 0 },
        { gender: "Female", count: 0 }
    ];
    // sum all counts of active states
    for (var i = 0; i < DATA.stateBasedData.length; i++) {
        if (stateArray.includes(DATA.stateBasedData[i].State)) {
            json[0].count += +DATA.stateBasedData[i].Male;
            json[1].count += +DATA.stateBasedData[i].Female;
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

function getRaceOptions() {
    //race vars
    var native = 0; //American Indian or Alaska Native
    var asianOrPI = 0; // Asian or Pacific Islander
    var asian = 0; // Asian
    var hawaiianOrPI = 0; //Native Hawaiian or Other Pacific Islander
    var black = 0; //Black or African American
    var hispanic = 0; //Hispanic or Latino
    var white = 0; //White
    var multiRacial = 0; //Two or more races
    var unknown = 0; //Race/ethnicity unknown
    var alien = 0; //Nonresident alien

    for (var i = 0; i < DATA.stateBasedData.length; i++) {
        if (activeCountries.includes(DATA.stateBasedData[i].State)) {
            native += +DATA.stateBasedData[i]["American Indian or Alaska Native"];
            asianOrPI += +DATA.stateBasedData[i]["Asian or Pacific Islander"];
            asian += +DATA.stateBasedData[i].Asian;
            hawaiianOrPI += +DATA.stateBasedData[i][
                "Native Hawaiian or Other Pacific Islander"
                ];
            black += +DATA.stateBasedData[i]["Black or African American"];
            hispanic += +DATA.stateBasedData[i]["Hispanic or Latino"];
            white += +DATA.stateBasedData[i].White;
            multiRacial += +DATA.stateBasedData[i]["Two or more races"];
            unknown += +DATA.stateBasedData[i]["Race/ethnicity unknown"];
            alien += +DATA.stateBasedData[i]["Nonresident alien"];
        }
    }
    var raceData = [
        native,
        asianOrPI,
        asian,
        hawaiianOrPI,
        black,
        hispanic,
        white,
        multiRacial,
        unknown,
        alien
    ].map(Number);
    return raceData;
}

function ethnicityChart() {
  var ethnicityList = ["American Indian or Alaska Native", "Asian or Pacific Islander", "Asian", "Native Hawaiian or Other Pacific Islander",
	  "Black or African American", "Hispanic or Latino", "White", "Two or more races", "Race/ethnicity unknown", "Nonresident alien"];
  var ethnicity = d3.select("#ethnicity-chart");
  ethnicity.html(""); // clear old content
  // const rect = ethnicity.node().getBoundingClientRect();

  var width = 600;
  var height = 220;

  var raceData = getRaceOptions();

  // Tooltip for ethnicity
	var divToolTip = d3.select("body")
		.append("div")
		.attr("class", "tooltip")
		.style("opacity", 0)
        .style("min-width", "103px");

	var yScale = d3.scale.linear()
	.domain([0, d3.max(raceData)])
	.range([height-40, 0]);
  var xScale = d3.scale.ordinal()
	.domain(d3.range(0, raceData.length))
	.rangeBands([65, width-100], 0.2, 0.2);
	// .rangeBands([0, width]);
  // var colors = d3.scale.linear()
	// .domain([0, raceData.length])
  //     .range(["#7692FF","#F3C98B"]);
	// // .range(['#5FBFF9', '#331832']);
    var colors = d3.scale.linear()
        .domain([0, raceData.length])
        .range(["#7692FF","#F3C98B"]);


  // var x_axis = d3.svg.axis()
  //     .orient('bottom')
  //     .scale(xScale);

  var y_axis = d3.svg.axis()
	.orient('left')
    .ticks(5)
	.tickFormat(d3.format("s"))
	.scale(yScale);

  var ethnicitySVG = ethnicity.append("svg")
	.classed("border rounded border-dark mb-2 bg-white", true)
	.attr("width", width)
	.attr("height", height);

  // ethnicitySVG.append("g")
  //     .attr('class','axis')
  //     .call(x_axis)
  //     .attr("transform", "translate(0," + (height - 40) + ")");

  ethnicitySVG.append("g")
	  .attr('class','axis')
      // .attr("dy", ".15em")
	  .attr("transform", "translate(60, 37.5)")
	  .call(y_axis);

  ethnicitySVG.selectAll('rect')
	.data(raceData)
	.enter().append('rect')
	.style('fill', function (d, i) {
	  return colors(i);
	})
	.attr('width', xScale.rangeBand())
	.attr('height', function (d) {
	  return height - yScale(d) - 40;
	})
	.attr('x', function (d, i) {
	  return xScale(i);
	})
	.attr('y', function (d) {
	  return yScale(d) + 37.5;
	})
      .on("mouseover", function (d,i) {
          divToolTip.transition()
              .duration(200)
              .style("opacity", .9);

          divToolTip.text(ethnicityList[i] + "\n" + numberWithCommas(d))
              .style("left", (d3.event.pageX + 30) + "px")
              .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function (d,i) {
          divToolTip.transition()
              .duration(500)
              .style("opacity", 0);
      });

	return 0;
}

function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function aggregateChange() {
    if (!$('#aggregate-toggle').is(':checked')) {
        activeCountries.length = 0;
        CURRENT_STATE = "USA";
        activeCountries.push(CURRENT_STATE);
        d3.select("#map").selectAll(".active").classed("active", false);
        renderChartsAndLabels();
    }
}

function streamGraph() {
    var margin = {top: 20, right: 80, bottom: 30, left: 50},
        width = 520 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

    var parseDate = d3.time.format("%Y").parse;
    // var domainX = ["2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017"];
    var x = d3.time.scale()
        // .domain(domainX)
        // .rangeBands([10, width-10], 0.7, 0.2);
        .range([0, width + margin.right]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var color = d3.scale.category20c();
    // var colors = d3.scale.linear()
    //     .domain([0, raceData.length])
    //     .range(["#7692FF","#F3C98B"]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .ticks(5)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .tickFormat(d3.format("s"))
        .orient("left");

    var line = d3.svg.line()
        .interpolate("basis")
        .x(function(d) { return x(d.year); })
        .y(function(d) { return y(d.count); });

    var svg = d3.select("#stream-chart").append("svg")
        .classed("bg-white mb-2 border rounded border-dark", true)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.csv("./Data/Florida.csv", function(error, data) {
        if (error) throw error;

        color.domain(d3.keys(data[0])
            .filter(function(key) { return key !== "Year"; }));

        data.forEach(function(d) {
            d.year = parseDate(d.Year);
        });

        var cities = color.domain().map(function(name) {
            return {
                name: name,
                values: data.map(function(d) {
                    return {year: d.year, count: Number(d[name])};
                })
            };
        });

        console.log(cities);
        x.domain(d3.extent(data, function(d) { return d.year; }));

        y.domain([
            d3.min(cities, function(c) { return d3.min(c.values, function(v) { return v.count; }); }),
            d3.max(cities, function(c) { return d3.max(c.values, function(v) { return v.count; }); })
        ]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");
            // .text("Cases");

        var div = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        var city = svg.selectAll(".city")
            .data(cities)
            .enter().append("g")
            .attr("class", "city");

        city.append("path")
            .attr("class", "line")
            .attr("d", function(d) { return line(d.values); })
            .style("stroke", function(d) { return color(d.name); })
            .style("stroke-width", "2px")
            .style("fill", "none")
            .on ("mouseover", function (d) {
                div.transition()
                    .duration(200)
                    .style("opacity", .9);

                div.text(d.name)
                    .style("left", (d3.event.pageX + 30) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function (d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // city.append("text")
        //     .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
        //     .attr("transform", function(d) { return "translate(" + x(d.value.year) + "," + y(d.value.count) + ")"; })
        //     .attr("x", 3)
        //     .attr("dy", ".35em")
        //     .text(function(d) { return d.name; });
    });
}
