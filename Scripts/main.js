(function () {
    var map = d3.select("#map").style("background-color", "red");
    var projection = d3.geo.albersUsa()
        .translate([700, 230])
        .scale([500]);
})();