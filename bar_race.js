
const datesAreEqual = (left, right) => {
  return left.getTime() === right.getTime();
}


// Code adapted from https://bl.ocks.org/jrzief/70f1f8a5d066a286da3a1e699823470f

//SETUP AND CHART OPTIONS
let svg = d3.select("#chart").append("svg")
.attr("width", 960)
.attr("height", 800);

var height = 800;
var width = 960;

//Sets speed of animation  
var tickDuration = 500;

//N display
var top_n = 25;

//Change margin on svg chart 
const margin = {
  top: 80,
  right: 0,
  bottom: 5,
  left: 0
};

//calculates bar padding [DNT]
let barPadding = (height-(margin.bottom+margin.top))/(top_n*5);

//Optional: set chart descriptors within svg
let title = svg.append('text')
  .attr('class', 'title')
  .attr('y', 24)
  .html('Confirmed Cases by State (March 1 to April 23)');

let subTitle = svg.append("text")
  .attr("class", "subTitle")
  .attr("y", 55)
  .html("Cases per 1,000 residents");

// let caption = svg.append('text')
//   .attr('class', 'caption')
//   .attr('x', width)
//   .attr('y', height-5)
//   .style('text-anchor', 'end')
//   .html('Source: New York Times');

//Set starting point
let date = new Date ('2020-03-01T00:00:00');

//Set next date
let endDate = new Date('2020-04-23T00:00:00')

//CHART ANIMATION 
d3.csv('StateData_asof_4_30_2020.csv').then(function(data) {
 // if (error) throw error;
  
 //console.log(data)
  
    data.forEach(d => {
    d.cases_per1K = +d.cases_per1K,
    d.cases_per1K = isNaN(d.cases_per1K) ? 0 : d.cases_per1K,
    d.datetime = new Date(d.datetime),
    d.cases = +d.cases,
    d.previous_day_CPC = +d.previous_day_CPC
  });

  //console.log(data);
  //console.log(date);

  let dateSlice = data.filter(d => datesAreEqual(d.datetime, date))
  .sort((a,b) => b.cases_per1K - a.cases_per1K)
  // .slice(0, top_n);

  dateSlice.forEach((d,i) => d.rank = i);

  dateSlice.forEach((d) => {
    if (d.is_in_lockdown === "FALSE"){
      d.color = d3.color("silver")}
    else {d.color = d3.color("red")}
    });


  //console.log('daySlice: ', dateSlice)

  let x = d3.scaleLinear()
    .domain([0, d3.max(dateSlice, d => d.cases_per1K)])
    .range([margin.left, width-margin.right-65]);

  let y = d3.scaleLinear()
    .domain([top_n, 0])
    .range([height-margin.bottom, margin.top]);

  let xAxis = d3.axisTop()
    .scale(x)
    .ticks(width > 500 ? 5:2)
    .tickSize(-(height-margin.top-margin.bottom))
    .tickFormat(d => d3.format(',')(d));

  svg.append('g')
    .attr('class', 'axis xAxis')
    .attr('transform', `translate(0, ${margin.top})`)
    .call(xAxis)
    .selectAll('.tick line')
    .classed('origin', d => d == 0);

  svg.selectAll('rect.bar')
    .data(dateSlice, d => d.state)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', x(0)+1)
    .attr('width', d => x(d.cases_per1K)-x(0)-1)
    .attr('y', d => y(d.rank)+5)
    .attr('height', y(1)-y(0)-barPadding)
    .style('fill', d => d.color);
  
  svg.selectAll('text.label')
    .data(dateSlice, d => d.state)
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr('x', d => x(d.cases_per1K)-8)
    .attr('y', d => y(d.rank)+5+((y(1)-y(0))/2)+1)
    .style('text-anchor', 'end')
    .html(d => d.state);
  
svg.selectAll('text.valueLabel')
  .data(dateSlice, d => d.state)
  .enter()
  .append('text')
  .attr('class', 'valueLabel')
  .attr('x', d => x(d.cases_per1K)+5)
  .attr('y', d => y(d.rank)+5+((y(1)-y(0))/2)+1)
  .text(d => (d.cases_per1K));

let dateText = svg.append('text')
  // .attr('style', )
  .attr('x', width-margin.right)
  .attr('y', height-25)
  .style('text-anchor', 'end')
  .html(date)
  // .call(halo, 10);
  
let ticker = d3.interval(e => {

  dateSlice = data.filter(d => datesAreEqual(d.datetime, date))
  .sort((a,b) => b.cases_per1K - a.cases_per1K)

  dateSlice.forEach((d,i) => d.rank = i);
  
  dateSlice.forEach((d) => {
    if (d.is_in_lockdown === "FALSE"){
      d.color = d3.color("silver")}
    else {d.color = d3.color("red")}
    });

  
  console.log('Date: ', dateSlice);

  x.domain([0, d3.max(dateSlice, d => d.cases_per1K)]); 
  
  svg.select('.xAxis')
    .transition()
    .duration(tickDuration)
    .ease(d3.easeLinear)
    .call(xAxis);

    let bars = svg.selectAll('.bar').data(dateSlice, d => d.state);

    bars
    .enter()
    .append('rect')
    .attr('class', d => `bar ${d.state}`)
    .attr('x', x(0)+1)
    .attr( 'width', d => x(d.cases_per1K)-x(0)-1)
    .attr('y', d => y(top_n+1)+5)
    .attr('height', y(1)-y(0)-barPadding)
    .style('fill', d => d.color)
    .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr('y', d => y(d.rank)+5);
      
    bars
    .style('fill', d => d.color)
    .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr('width', d => x(d.cases_per1K)-x(0)-1)
      .attr('y', d => y(d.rank)+5);
        
    bars
    .exit()
    .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr('width', d => x(d.cases_per1K)-x(0)-1)
      .attr('y', d => y(top_n+1)+5)
      .remove();

    let labels = svg.selectAll('.label')
      .data(dateSlice, d => d.state);
  
    labels
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr('x', d => x(d.cases_per1K)-8)
    .attr('y', d => y(top_n+1)+5+((y(1)-y(0))/2))
    .style('text-anchor', 'end')
    .html(d => d.state)    
    .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr('y', d => y(d.rank)+5+((y(1)-y(0))/2)+1);
          

    labels
      .transition()
      .duration(tickDuration)
        .ease(d3.easeLinear)
        .attr('x', d => x(d.cases_per1K)-8)
        .attr('y', d => y(d.rank)+5+((y(1)-y(0))/2)+1);
  
    labels
      .exit()
      .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attr('x', d => x(d.cases_per1K)-8)
        .attr('y', d => y(top_n+1)+5)
        .remove();
      
    let valueLabels = svg.selectAll('.valueLabel').data(dateSlice, d => d.state);

    valueLabels
      .enter()
      .append('text')
      .attr('class', 'valueLabel')
      .attr('x', d => x(d.cases_per1K)+5)
      .attr('y', d => y(top_n+1)+5)
      .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attr('y', d => y(d.rank)+5+((y(1)-y(0))/2)+1);
        
    valueLabels
      .text(d => d.cases_per1K)
      .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attr('x', d => x(d.cases_per1K)+5)
        .attr('y', d => y(d.rank)+5+((y(1)-y(0))/2)+1)
        .tween("text", function(d) {
          return d3.interpolateString(d.previous_day_CPC, d.cases_per1K)}); 
  
  valueLabels
    .exit()
    .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr('x', d => x(d.cases_per1K)+5)
      .attr('y', d => y(top_n+1)+5)
      .remove();

  dateText.html(date);
  
  if(datesAreEqual(date, endDate)) ticker.stop();
    date.setDate(date.getDate()+1);

    console.log(date);

    },tickDuration);

}
);

// const halo = function(text, strokeWidth) {
// text.select(function() { return this.parentNode.insertBefore(this.cloneNode(true), this); })
// .style('fill', '#ffffff')
//   .style( 'stroke','#ffffff')
//   .style('stroke-width', strokeWidth)
//   .style('stroke-linejoin', 'round')
//   .style('opacity', 1);
