// Margin amounts
var margin = {
  top: 10,
  right: 20,
  bottom: 30,
  left: 40
};

// Canvas size
var canvasWidth = 1000;
var canvasHeight = 500;

// Tooltip
var tooltip = d3.select('body')
  .append('div')
  .attr('class', 'tooltip');

/**
 * Loads the data file.
 */
function loadTSV() {
  d3.tsv('data.tsv', function(d) {
    var mileage = +d['Mileage'];
    var gallonsFilled = +d['Gallons Filled'];
    var pricePerGallon = +d['Price Per Gallon'];
    var milesRemaining = +d['Miles Remaining'];

    var pricePerMile = (gallonsFilled * pricePerGallon) / mileage;
    var gasUtilization = mileage / (mileage + milesRemaining) * 100;

    return {
      date: d['Date'],
      mileage: mileage,
      milesRemaining: milesRemaining,
      gallonsFilled: gallonsFilled,
      pricePerGallon: pricePerGallon,
      mpg: +d['MPG'],
      pricePerMile: pricePerMile,
      gasUtilization: gasUtilization
    };
  }, function(error, data) {
    if (error) {
      console.log('Read error');
      return;
    }

    /**
     * Loads the mileage and miles remaining line chart.
     *
     * @param data The data for the chart.
     */
    function loadMileageLineChart(data) {
      var svg = d3.select('#canvas')
        .attr('width', canvasWidth)
        .attr('height', canvasHeight);

      var milesColorIndex = 0;
      var remainingMilesColorIndex = 1;

      // Scales
      var timeScale = d3.scaleTime()
        .domain([d3.timeDay.offset(new Date(data[0].date), -3), d3.timeDay.offset(new Date(data[data.length - 1].date), 1)])
        .rangeRound([margin.left, canvasWidth - margin.right]);

      var milesScale = d3.scaleLinear()
        .domain([0, d3.max(data.map(function(d) {
          return d.mileage + d.milesRemaining;
        }))])
        .range([canvasHeight - margin.bottom, margin.top]);

      var colorScale = d3.scaleOrdinal(d3.schemeCategory10);

      // Mileage line
      var mileageLine = d3.line()
        .x(function(d) {
          return timeScale(new Date(d.date));
        })
        .y(function(d) {
          return milesScale(d.mileage);
        });

      // Remaining miles line
      var remainingMilesLine = d3.line()
        .x(function(d) {
          return timeScale(new Date(d.date));
        })
        .y(function(d) {
          return milesScale(d.milesRemaining + d.mileage);
        });

      // Axes
      var xAxis = d3.axisBottom()
        .scale(timeScale)
        .tickFormat(d3.timeFormat('%m/%d'));

      var yAxis = d3.axisLeft()
        .scale(milesScale);

      // Data line groups
      var mileageLineGroup = svg.append('g')
        .classed('miles-line', true)

      mileageLineGroup.append('path')
        .attr('class', 'line')
        .attr('stroke', function(d) {
          return colorScale(milesColorIndex);
        })
        .attr('fill', 'none');

      var remainingMilesLineGroup = svg.append('g')
        .classed('remain-line', true)

      remainingMilesLineGroup.append('path')
        .attr('class', 'line')
        .attr('stroke', function(d) {
          return colorScale(remainingMilesColorIndex);
        })
        .attr('fill', 'none');

      // Data lines
      mileageLineGroup.select('.line')
        .datum(data)
        .attr('d', mileageLine);

      remainingMilesLineGroup.select('.line')
        .datum(data)
        .attr('d', remainingMilesLine);

      // SVG groups
      svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', 'translate(0,' + (canvasHeight - margin.bottom) + ')');

      svg.append('g')
        .attr('class', 'y-axis')
        .attr('transform', 'translate(' + margin.left + ',0)');

      svg.append('g')
        .classed('dots', true);

      svg.select('.x-axis')
        .call(xAxis);

      svg.select('.y-axis')
        .call(yAxis);

      // Add dots
      var dataDots = svg.select('.dots')
        .selectAll('.dot')
        .data(data)
        .enter()
        .append('g')
        .classed('dot', true);

      dataDots.append('circle')
        .attr('r', 4)
        .attr('cx', function(d) {
          return timeScale(new Date(d.date));
        })
        .attr('cy', function(d) {
          return milesScale(d.mileage);
        })
        .attr('opacity', 1)
        .attr('fill', function(d) {
          return colorScale(milesColorIndex);
        })
        .on('mouseover', function(d) {
          tooltipMileageLineMouseOver(d);
        })
        .on('mousemove', function(d) {
          tooltipMileageLineMouseMove(d);
        })
        .on('mouseout', function(d) {
          tooltipMouseOut(d);
        });

      dataDots.append('circle')
        .attr('r', 4)
        .attr('cx', function(d) {
          return timeScale(new Date(d.date));
        })
        .attr('cy', function(d) {
          return milesScale(d.milesRemaining + d.mileage);
        })
        .attr('opacity', 1)
        .attr('fill', function(d) {
          return colorScale(remainingMilesColorIndex);
        })
        .on('mouseover', function(d) {
          tooltipRemainingMilesLineMouseOver(d);
        })
        .on('mousemove', function(d) {
          tooltipRemainingMilesLineMouseMove(d);
        })
        .on('mouseout', function(d) {
          tooltipMouseOut(d);
        });
    }

    function tooltipMileageLineMouseOver(d) {
      tooltipMouseOver(d, d.mileage);
    }

    function tooltipRemainingMilesLineMouseOver(d) {
      tooltipMouseOver(d, d.mileage + ' + ' + d.milesRemaining + ' = ' + (d.milesRemaining + d.mileage));
    }

    function tooltipMileageLineMouseMove(d) {
      tooltipMouseMove(d, d.mileage);
    }

    function tooltipRemainingMilesLineMouseMove(d) {
      tooltipMouseMove(d, d.mileage + ' + ' + d.milesRemaining + ' = ' + (d.milesRemaining + d.mileage));
    }

    function tooltipMouseOver(d, text) {
      tooltip
        .style('top', (d3.event.pageY - 20) + "px")
        .style('left', (d3.event.pageX) + "px")
        .text(text);

      tooltip.transition()
        .duration(200)
        .style('opacity', 1)
    }

    function tooltipMouseMove(d, text) {
      tooltip
        .style('top', (d3.event.pageY - 20) + "px")
        .style('left', (d3.event.pageX) + "px")
        .text(text);
    }

    function tooltipMouseOut(d) {
      tooltip
        .transition()
        .duration(200)
        .style('opacity', 0)
    }

    loadMileageLineChart(data);
  });
}

loadTSV();
