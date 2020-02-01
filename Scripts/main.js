DATA = {};
queue()
    .defer(d3.csv, "./Data/StateBasedData.csv")
    .await(function(error, data) {
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
            // .classed('make-it-red', function (d) {
            //     if (d.properties.name === "Mississippi" || d.properties.name === "Oregon") {
            //         return true;
            //     }
            //     else {
            //         return false;
            //     }
            // })
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
            });



    }
    genderChart();

}



function genderChart() {
    var width = 400, height = 300;
    var data = findStateGender(CURRENT_STATE);
    data = data.map(d => ({ ...d, count: Number(d.count) / 1000 }));
    var dataY = [];
    dataY.push(data[0].count);
    dataY.push(data[1].count);
    console.log(dataY);
    var dataX = ["Male","Female"];

    var color = ["#7692FF","#D8638A"];

    var gender = d3.select("#gender-chart");
    var genderSvg = gender.append("svg")
        .classed("border rounded border-dark", true)
        .attr("width", width)
        .attr("height", height)
        .style("background-color", "white");
    console.log(dataY);

    var ordinalScale = d3.scale.ordinal()
        .domain(dataX)
        .rangeBands([50, width-50], 0.45, 0.2);
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



    genderSvg.selectAll("rect")
        .data(data).enter()
        .append("rect")
        .attr("fill", function (d,i) {
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
            json.push({"gender": "Male", "count":DATA.stateBasedData[i].Male});
            json.push({"gender": "Female", "count":DATA.stateBasedData[i].Female});
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

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}