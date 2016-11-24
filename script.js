// Margin amounts
var margin = {
  top: 20,
  right: 20,
  bottom: 40,
  left: 50
};

// Canvas size
var canvasWidth = 600;
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
    var gasUtilization = mileage / (mileage + milesRemaining);

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
      var svg = d3.select('#mileage-canvas')
        .attr('width', canvasWidth)
        .attr('height', canvasHeight);

      var milesColorIndex = 0;
      var remainingMilesColorIndex = 1;

      // Scales
      var timeScale = d3.scaleTime()
        .domain([d3.timeDay.offset(new Date(data[0].date), -3), d3.timeDay.offset(new Date(data[data.length - 1].date), 1)])
        .rangeRound([margin.left, canvasWidth - margin.right]);

      var milesScale = d3.scaleLinear()
        .domain([0, Math.floor((d3.max(data.map(function(d) {
          return d.mileage + d.milesRemaining;
        })) / 10) + 1) * 10 + 100])
        .range([canvasHeight - margin.bottom, margin.top]);
      console.log(milesScale.domain())

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
        .tickFormat(d3.timeFormat('%Y/%m'));

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

      svg
        .append('text')
        .classed('label', true)
        .attr('x', canvasWidth / 2)
        .attr('y', canvasHeight - margin.top / 2)
        .attr('text-anchor', 'middle')
        .text('Date');

      svg.append('text')
        .classed('label', true)
        .attr('x', -canvasHeight / 2)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90, 0, 0)')
        .text('Miles Driven');

      svg.append('g')
        .classed('dots', true);

      svg.select('.x-axis')
        .call(xAxis);

      svg.select('.y-axis')
        .call(yAxis);

      svg
        .append('text')
        .classed('chart-title', true)
        .attr('x', canvasWidth / 2)
        .attr('y', margin.bottom)
        .attr('text-anchor', 'middle')
        .text('Miles Before Fillup vs. Potential Drivable Miles');

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

    function loadAverageMPGChart(data) {
      var svg = d3.select('#avg-canvas')
        .attr('width', canvasWidth)
        .attr('height', canvasHeight);

      var barWidth = 10;
      var colorScale = d3.scaleOrdinal(d3.schemeCategory20);

      var timeScale = d3.scaleTime()
        .domain([d3.timeDay.offset(new Date(data[0].date), -5), d3.timeDay.offset(new Date(data[data.length - 1].date), 5)])
        .rangeRound([margin.left, canvasWidth - margin.right]);

      var avgMPGScale = d3.scaleLinear()
        .domain([(Math.floor(d3.min(data.map(function(d) {
          return d.mpg;
        })))), (Math.floor(d3.max(data.map(function(d) {
          return d.mpg;
        })) / 10) + 1) * 10])
        .range([canvasHeight - margin.bottom, margin.top]);

      var xAxis = d3.axisBottom()
        .scale(timeScale)
        .tickFormat(d3.timeFormat('%Y/%m'));

      var yAxis = d3.axisLeft()
        .scale(avgMPGScale);

      svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', 'translate(0,' + (canvasHeight - margin.bottom) + ')');

      svg.append('g')
        .attr('class', 'y-axis')
        .attr('transform', 'translate(' + margin.left + ',0)');

      svg.select('.x-axis')
        .call(xAxis);

      svg.select('.y-axis')
        .call(yAxis);

      svg
        .append('text')
        .classed('label', true)
        .attr('x', canvasWidth / 2)
        .attr('y', canvasHeight - margin.top / 2)
        .attr('text-anchor', 'middle')
        .text('Date');

      svg.append('text')
        .classed('label', true)
        .attr('x', -canvasHeight / 2)
        .attr('y', 10)
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90, 0, 0)')
        .text('Miles Per Gallon');

      svg
        .append('text')
        .classed('chart-title', true)
        .attr('x', canvasWidth / 2)
        .attr('y', margin.bottom)
        .attr('text-anchor', 'middle')
        .text('Average Mileage Between Fillups');

      var barGroup = svg
        .append('g')
        .classed('bars', true);

      var bars = barGroup.selectAll('.bar')
        .data(data)
        .enter()
        .append('g')
        .classed('bar', true);

      bars.append('rect')
        .attr('x', function(d) {
          return timeScale(new Date(d.date)) - (barWidth / 2);
        })
        .attr('y', function(d) {
          return avgMPGScale(d.mpg);
        })
        .attr('height', function(d) {
          return canvasHeight - avgMPGScale(d.mpg) - margin.bottom;
        })
        .attr('width', function(d) {
          return barWidth;
        })
        .attr('fill', function(d, i) {
          return colorScale(i % 20);
        })
        .on('mouseover', function(d) {
          tooltipAvgMPGMouseOver(d);
        })
        .on('mousemove', function(d) {
          tooltipAvgMPGMouseMove(d);
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

    function tooltipAvgMPGMouseOver(d) {
      tooltipMouseOver(d, d.date + ': ' + d.mpg + ' mpg');
    }

    function tooltipAvgMPGMouseMove(d) {
      tooltipMouseMove(d, d.date + ': ' + d.mpg + ' mpg');
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
    loadAverageMPGChart(data);
  });
}

loadTSV();