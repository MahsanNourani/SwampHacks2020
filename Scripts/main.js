DATA = {};
queue()
    .defer(d3.csv, "./Data/StateBasedData.csv")
    // .defer(d3.json, "assets/data/days.json")
    // .defer(d3.json, "assets/data/explanations.json")
    .await(function(error, data) {
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

}

function findStateTotal(state) {
    for (var i = 0; i < DATA.stateBasedData.length; i++) {
        if (DATA.stateBasedData[i].State == state)
            return DATA.stateBasedData[i].Total;
    }
    return 0;
}