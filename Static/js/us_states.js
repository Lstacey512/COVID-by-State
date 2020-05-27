
//Add table headers (prior to piping in any data)
var tableHeader = d3.select("#top-states").append("thead").append("tr").attr("class", "table-head");

tableHeader.append("th").attr("class", "table-text state").text("State");
tableHeader.append("th").attr("class", "table-dummy")
tableHeader.append("th").attr("Class", "table-text cases").html("Cases Per <br>1K Residents");



//----Map Basics--//

var mapWidth = 800;
var mapHeight = 400;
var legendContent = ["Under statewide lockdown", "Not under statewide lockdown", "Cases per 1K residents"];
var legendColor = ["rgb(237,60,67)", "lightgrey"];
var bubbleGraphic = "Assets/Visuals/Map_legend_bubbles.png"

var projection = d3.geoAlbersUsa().scale(800) // Sets zoom so that we can see the full map
    .translate([width / 2, height / 1.5]);

var path = d3.geoPath().projection(projection);   // path generator that will convert GeoJSON to SVG paths

var svgMap = d3.select("#US-map")
    .append("svg")
    .attr("width", mapWidth)
    .attr("height", mapHeight)
    .attr("id", "map");

// //Map legend
var legendBase = d3.select("#map")
    .append("g")
    .attr("transform", "translate(625,250)")
    .append("svg")
    .attr("width", 140)
    .attr("height", 150)

var legend = legendBase
    .selectAll("g")
    .data(legendContent)
    .enter()
    .append("g")
    .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

legend.append("image")
    .attr("width", 18)
    .attr("height", 18)
    .attr("href",bubbleGraphic)

legend.append("rect")
    .data(legendColor)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", d => d)

legend.append("text")
    .data(legendContent)
    .attr("x", 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("font-family", "arial")
    .style("font-size", "8px")
    .text( d => d)

var legendEnd = legendBase.append("g")

legendEnd.append("rect")
.attr("width", 140)
.attr("height", 25)
.attr("transform", "translate(0,70)")
.attr("class", "legend")

legendEnd.append("text")
.attr("transform", "translate(3,85)")
.style("font-family", "arial")
.style("font-size", "8px")
.text("Click on a state to see timeline below")


//Tooltip
var maptip = d3.select("body")
    .append("div")
    .attr("class", "tooltip-map")
    .style("opacity", 1);

//---- Populate map with data---//
d3.csv('Assets/Data/states.csv').then(function (data) {

    let date = new Date('2020-04-23T00:00:00');

    //console.log(data)

    data.forEach(d => {
        d.cases = +d.cases,
            d.deaths = +d.deaths,
            d.datetime = new Date(d.datetime),
            d.cases_per1K = +d.cases_per1K,
            d.daily_infected = +d.daily_infected
    });

    //slice the data to only grab records for the selected date
    let stateDate = data.filter(d => date <= d.datetime)

    //console.log(stateDate);

    //now sort by descending order on cases per 1k and take the top 6 states
    topstates = stateDate.sort((a, b) => d3.descending(a.cases_per1K < b.cases_per1K)).slice(0, 10);

    //console.log(topstates);

    var body = d3.select("#top-states").append("tbody")

    var row = body.selectAll("tr").data(topstates).enter().append("tr")

    row.append("td")
        .attr("class", "table-text state").html((d) => d.state);

    row.append("td")
        .attr("class", "table-dummy");

    row.append("td")
        .attr("class", "table-text cases").html((d) => d.cases_per1K);


    //----- GET COORDINATES FROM GEOJSON FOR MAPPING--//

    // Load GeoJSON data and merge with states data
    d3.json('Assets/Data/us-states.json').then(function (json) {
        d3.csv('Assets/Data/states_lat_long.csv').then(function (states_data) {

            //console.log(json);

            //merge geojson with its appropriate state
            stateDate.forEach(function (entry) {
                //get state name
                var stateName = entry.state;

                //loop through the json
                for (var j = 0; j < json.features.length; j++) {
                    //get state name
                    var jsonState = json.features[j].properties.NAME;

                    //if the csv state matches the json state, then add coordinates to csv
                    if (stateName == jsonState) {
                        var coordinates = json.features[j].geometry.coordinates;

                        if (entry.is_in_lockdown == "TRUE") { var color = "rgb(237, 60, 67)" }
                        else { var color = "lightgrey" }

                        svgMap.append("path")
                            .datum(json.features[j])
                            .attr("d", path)
                            .attr("fill", color)
                            .attr("stroke", "white")
                            .attr("class", "state-shape")
                            .attr("id", stateName)
                            .on("click",function(){
                                var stateSelected = this.id
                                console.log(this.id +" was selected")
                                CreateStateTimeline(stateSelected)
                               
                            })
                    };

                };

                states_data.forEach(function (record) {

                    //console.log(record.state);

                    if (stateName == record.State) {

                        svgMap.append("circle")
                            .datum(record)
                            .attr("cy", function (d) { return projection([d.Long, d.Lat])[1] })
                            .attr("cx", function (d) { return projection([d.Long, d.Lat])[0] })
                            .attr("r", function (d) {

                                var case_radius = entry.cases_per1K;

                                if (case_radius < 1.5) { return case_radius *5 }
                                else { return case_radius * 2.5 }
                            })
                            .attr("class", "bubble")
                            .on("mouseover", function (d) {

                                maptip.transition()
                                    .duration(200)
                                    .style("opacity", .9);

                                maptip.html("<p><strong>" + d.Abbreviation + "</strong></br>" + entry.cases_per1K + " case(s) per 1,000 residents </p>")
                                    .style("left", (d3.event.pageX) + "px")
                                    .style("top", (d3.event.pageY - 28) + "px");
                            })
                            .on("mouseout", function (d) {
                                maptip.transition()
                                    .duration(500)
                                    .style("opacity", 0);
                            })
                    }

                })
            });
        });
    });

    //------------CREATE TIMELINE SVG------------//

    //State timeline & key states charts//

    function CreateStateTimeline (state){
    
        let stateData = data.filter(d => d.state == state).filter(d => new Date('2020-03-01T00:00:00') <= d.datetime)
        //console.log(stateData);

        var title = state.toUpperCase()+" CASES"

        //d3.select("#timeline-title").text(state.toUpperCase()+" CASES")
        
        //Create bar chart with plotly

        var timelineDates = stateData.map(d=> d.date);
        var timelineCases = stateData.map(d=> d.cases);
        var lockdownBoolean = stateData.map(d=> d.is_in_lockdown);

        var timelineStateColor = [];
        
        lockdownBoolean.forEach( entry => {
            if (entry === "TRUE") { 
                return timelineStateColor.push('rgb(237, 60, 67)') }
            else {return timelineStateColor.push('rgb(200,200,200)')}
        })

        //console.log(timelineDates);
        //console.log(timelineCases);
        //console.log(timelineStateColor);

        var chartData = [{
            x: timelineDates,
            y: timelineCases,
            type: 'bar', 
            marker: {color: timelineStateColor}
        }];

        var chartLayout = {
            title: {
                text: title,
                x:0.01,
                xref:'container',
                font:{ family: 'Open Sans Condensed', size: 24,weight:"bold" },
            },
            xaxis: {tickfont: {
                size: 10,
                color: 'rgb(107, 107, 107)',
                family:'Arial'
              }},
            yaxis: {
              title: 'Confirmed cases',
              titlefont: {
                size: 10,
                color: 'rgb(107, 107, 107)',
                family: 'arial'
              },
              tickfont: {
                size: 8,
                color: 'rgb(107, 107, 107)',
                family:'Arial'
              }
            },
            paper_bgcolor:'rgb(252,251,250)',
            plot_bgcolor: 'rgb(252,251,250',
            margin: {l:40, t:50}
          };  

          Plotly.newPlot('state-timeline', chartData, chartLayout) 
          
          //Grab stats for populating side stats
          var mostRecent = stateData.slice(-1)[0];
          //console.log(mostRecent);
          var recentCases = mostRecent.cases
          var recentCasesPer = mostRecent.cases_per1K

          var pastWeek = stateData.slice(-8);
          //console.log(pastWeek)

          var infected = pastWeek.map(d => d.daily_infected);
          var averageInfected = Math.round(infected.reduce((a,b) => a+b)/infected.length);
          //console.log(averageInfected);

          d3.select("#cases").text(recentCases);
          d3.select("#casespercapita").text(recentCasesPer);
          d3.select("#avgcases").text(averageInfected);
    }
            
    //Initial selection for state timeline
    CreateStateTimeline("Alabama");
        

});

