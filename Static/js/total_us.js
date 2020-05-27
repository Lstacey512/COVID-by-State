//Date time helper, if needed
const datesAreEqual = (left, right) => {
  return left.getTime() === right.getTime();
}


//CREATE SVG
var margin = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20
}, 
height = 300 - margin.top - margin.bottom;
width = 800 -margin.left - margin.right

let svg = d3.select("#totalUScases").append("svg")
.attr("width", width)
.attr("height", height);

//Set chart titles
let title = svg.append("text")
.attr("class", "chart-text maintitle")
.attr("y",25)
.attr("x",20)
.html("TOTAL US CASES")

let subtitle = svg.append("text")
.attr("class", "chart-text subtitle")
.attr("y",50)
.attr("x",20)
.html("since March 1")

svg.append("text")
.attr("class", "chart-text instructional")
.attr("y",67)
.attr("x",20)
.html("hover over data point <br> to see today's stats")

// //Set starting point & end point
let date = new Date ('2020-03-01T00:00:00');

//CREATE CHART
d3.csv('../Assets/Data/us.csv').then(function(data) {

   // console.log(data)
  
    data.forEach(d => {
        d.cases = +d.cases,
        d.deaths = +d.deaths,
        d.datetime = new Date(d.datetime),
        d.daily_infected = +d.daily_infected,
        d.daily_infected_p = d.daily_infected_p,
        d.weekly_infected = +d.weekly_infected,
        d.weekly_infected_p = d.weekly_infected_p
      });

    //slice the data to only grab records March 1 or later
    let dateSlice = data.filter(d =>  date <= d.datetime)

    //console.log(dateSlice)
    var count = dateSlice.length-1

    //console.log(dateSlice[count].datetime);

    //Scales
    var x = d3.scaleTime()
    .domain(d3.extent(dateSlice, d => d.datetime))
    .range([margin.left, width-margin.right-margin.right]);

    svg.append("g")
    .attr("transform", "translate(0," + (height-margin.bottom) + ")")
    .call(d3.axisBottom(x));  

    var y = d3.scaleLinear()
    .domain([0, d3.max(dateSlice, d => d.cases)])
    .range([height-margin.bottom, 50])

    var area = d3.area()
    .x(d => x(d.datetime))
    .y0(height-margin.bottom)
    .y1(d=> y(d.cases));

    //append to svg 
    svg.append("path")
    .datum(dateSlice)
    .attr("fill", "#f7686f")
    .attr("stroke", "#ed3c43")
    .attr("d", area);

    //Set latest data point highlight with tool tip/stats
    let latestSlice = dateSlice[count];
    //console.log (latestSlice);
    
    svg.append("circle")
    .datum(latestSlice)
    .attr("class", "datapoint")
    .attr("cx", (width-margin.right-margin.right))
    .attr("cy", d => y(d.cases))
    .attr("r", "10")
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut)

    function handleMouseOver (d,i) {

        //enlarge bubble
        d3.select(this).attr("r", "15");

        var dateformat = d3.timeFormat("%A, %B %d, %Y");
        var toolDate = dateformat(d.datetime);
        var toolCases = d.cases;
        var toolDaily =  d.daily_infected;
        var toolDailyP = d.daily_infected_p;
        var toolWeekly = d.weekly_infected;
        var toolWeeklyP = d.weekly_infected_p;

        var xNum = 350;

        var toolTip = svg.append ("g")
        
        toolTip.append("polygon")
        .attr("id", "tooltip")
        .attr("points", xNum+ ",0 575,0 575,30 650,40  575, 50 575,80 " + xNum +",80");

        toolTip.append("text")
        .attr("class", "tool-text")
        .attr("x", xNum+10)
        .attr("y", "20")
        .text(toolDate);
        
        toolTip.append("text")
        .attr("class", "tool-text")
        .attr("x", xNum+10)
        .attr("y", "35")
        .text("Total Cases: "+toolCases);

        toolTip.append("text")
        .attr("class", "tool-text")
        .attr("x", xNum+10)
        .attr("y", "50")
        .text("Past 24 Hours: "+toolDaily+" new cases ("+toolDailyP+")");
        
        toolTip.append("text")
        .attr("class", "tool-text")
        .attr("x", xNum+10)
        .attr("y", "65")
        .text("Past 7 Days: "+toolWeekly+" new cases ("+toolWeeklyP+")");
    
    }
    
    function handleMouseOut (d,i) {

        //enlarge bubble
        d3.select(this).attr("r", "10");

        d3.select("#tooltip").remove();
        d3.selectAll("text.tool-text").remove();

        
    }
});