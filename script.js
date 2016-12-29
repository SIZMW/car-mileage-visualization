// Margin amounts
var margin = {
  top: 20,
  right: 80,
  bottom: 70,
  left: 50
};

// Canvas size
var canvasWidth = 800;
var canvasHeight = 400;

// Tooltip
var tooltip = d3.select('body')
  .append('div')
  .attr('class', 'tooltip');

/**
 * Loads the data file.
 */
function loadTSV() {
  d3.tsv('data.tsv', function (d) {
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
  }, function (error, data) {
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

      // Indices for ordinal colors
      var milesColorIndex = 0;
      var remainingMilesColorIndex = 1;

      var percent = 0.2;

      // Scales
      // var timeScale = d3.scaleTime()
      //   .domain([d3.timeMonth.offset(new Date(data[0].date), -1), d3.timeMonth.offset(new Date(data[data.length - 1].date), 1)])
      //   .rangeRound([margin.left, canvasWidth - margin.right]);
      var timeScale = d3.scalePoint()
        .domain(data.map(function(d) {
          return d.date;
        }))
        .range([margin.left, canvasWidth - margin.right])
        .padding(0.5);

      var milesScale = d3.scaleLinear()
        .domain([0, Math.floor((d3.max(data.map(function (d) {
          return d.mileage + d.milesRemaining;
        }))) * (1.0 + percent))])
        .range([canvasHeight - margin.bottom, margin.top]);

      // Color scale
      var colorScale = d3.scaleOrdinal(d3.schemeCategory10);

      // Mileage line
      var mileageLine = d3.line()
        .x(function (d) {
          return timeScale(d.date);
        })
        .y(function (d) {
          return milesScale(d.mileage);
        });

      // Remaining miles line
      var remainingMilesLine = d3.line()
        .x(function (d) {
          return timeScale(d.date);
        })
        .y(function (d) {
          return milesScale(d.milesRemaining + d.mileage);
        });

      // D3 axes
      var xAxis = d3.axisBottom()
        .scale(timeScale)
        // .tickFormat(d3.timeFormat('%Y/%m'));
        .tickFormat(function(d) {
          return d3.utcFormat('%Y/%m/%d')(new Date(d));
        });

      var yAxis = d3.axisLeft()
        .scale(milesScale);

      // Data line groups
      var mileageLineGroup = svg.append('g')
        .classed('miles-line', true)

      mileageLineGroup.append('path')
        .attr('class', 'line')
        .attr('stroke', function (d) {
          return colorScale(milesColorIndex);
        })
        .attr('fill', 'none');

      var remainingMilesLineGroup = svg.append('g')
        .classed('remain-line', true)

      remainingMilesLineGroup.append('path')
        .attr('class', 'line')
        .attr('stroke', function (d) {
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

      // Axes
      svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', 'translate(0,' + (canvasHeight - margin.bottom) + ')');

      svg.append('g')
        .attr('class', 'y-axis')
        .attr('transform', 'translate(' + margin.left + ',0)');

      svg.select('.x-axis')
        .call(xAxis)
        .selectAll('text')
        .attr('x', -32)
        .attr('y', 5)
        .attr('transform', 'rotate(-45, 0, 0)');

      svg.select('.y-axis')
        .call(yAxis);

      // Chart labels
      svg
        .append('text')
        .classed('label', true)
        .attr('x', canvasWidth / 2)
        .attr('y', canvasHeight - margin.top / 2 + 5)
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

      // svg
      //   .append('text')
      //   .classed('chart-title', true)
      //   .attr('x', canvasWidth / 2)
      //   .attr('y', margin.bottom / 2)
      //   .attr('text-anchor', 'middle')
      //   .text('Miles Before Fillup vs. Potential Drivable Miles');

      // Add dots
      var dataDots = svg.select('.dots')
        .selectAll('.dot')
        .data(data)
        .enter()
        .append('g')
        .classed('dot', true);

      dataDots.append('circle')
        .attr('r', 4)
        .attr('cx', function (d) {
          return timeScale(d.date);
        })
        .attr('cy', function (d) {
          return milesScale(d.mileage);
        })
        .attr('opacity', 1)
        .attr('fill', function (d) {
          return colorScale(milesColorIndex);
        })
        .on('mouseover', function (d) {
          tooltipMileageLineMouseOver(d);
        })
        .on('mousemove', function (d) {
          tooltipMileageLineMouseMove(d);
        })
        .on('mouseout', function (d) {
          tooltipMouseOut(d);
        });

      dataDots.append('circle')
        .attr('r', 4)
        .attr('cx', function (d) {
          return timeScale(d.date);
        })
        .attr('cy', function (d) {
          return milesScale(d.milesRemaining + d.mileage);
        })
        .attr('opacity', 1)
        .attr('fill', function (d) {
          return colorScale(remainingMilesColorIndex);
        })
        .on('mouseover', function (d) {
          tooltipRemainingMilesLineMouseOver(d);
        })
        .on('mousemove', function (d) {
          tooltipRemainingMilesLineMouseMove(d);
        })
        .on('mouseout', function (d) {
          tooltipMouseOut(d);
        });

      // Legend items
      svg.append('text')
        .classed('legend-item', true)
        .datum(data[data.length - 1])
        .attr('transform', function (d) {
          return 'translate(' + timeScale(d.date) + ',' + milesScale(d.mileage) + ')';
        })
        .attr('x', -10)
        .attr('y', -10)
        .attr('alignment-baseline', 'middle')
        .text('Mileage');

      svg.append('text')
        .classed('legend-item', true)
        .datum(data[data.length - 1])
        .attr('transform', function (d) {
          return 'translate(' + timeScale(d.date) + ',' + milesScale(d.milesRemaining + d.mileage) + ')';
        })
        .attr('x', -18)
        .attr('y', -10)
        .attr('alignment-baseline', 'middle')
        .text('Potential Miles');
    }

    /**
     * Loads the average mileage chart.
     *
     * @param data The data for the chart.
     */
    function loadAverageMPGChart(data) {
      var svg = d3.select('#avg-canvas')
        .attr('width', canvasWidth)
        .attr('height', canvasHeight);

      // var barWidth = (canvasWidth - margin.right - margin.left) / (data.length * 4);
      var barWidth = 20;
      var percent = 0.025;

      // Axes scales
      // var timeScale = d3.scaleTime()
      //   .domain([d3.timeMonth.offset(new Date(data[0].date), -1), d3.timeMonth.offset(new Date(data[data.length - 1].date), 1)])
      //   .rangeRound([margin.left, canvasWidth - margin.right]);

      var timeScale = d3.scalePoint()
        .domain(data.map(function(d) {
          return d.date;
        }))
        .range([margin.left, canvasWidth - margin.right])
        .padding(0.5);

      var avgMPGScale = d3.scaleLinear()
        .domain([(Math.floor(d3.min(data.map(function (d) {
          return d.mpg;
        })))), (Math.floor(d3.max(data.map(function (d) {
          return d.mpg;
        }))) * (1.0 + percent))])
        .range([canvasHeight - margin.bottom, margin.top]);

      // Interpolated color scale
      var colorScale = function(d) {
        return d3.scaleLinear()
          .domain([((d3.max(data.map(function (d) {
          return d.mpg;
        })))), ((d3.min(data.map(function (d) {
          return d.mpg;
        }))))])
          .range(['#c6dbef', '#084594'])
          .interpolate(d3.interpolateRgb)(d);
      }

      // D3 axes
      var xAxis = d3.axisBottom()
        .scale(timeScale)
        // .tickFormat(d3.timeFormat('%Y/%m'));
        .tickFormat(function(d) {
          return d3.utcFormat('%Y/%m/%d')(new Date(d));
        });

      var yAxis = d3.axisLeft()
        .scale(avgMPGScale);

      // Axes
      svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', 'translate(0,' + (canvasHeight - margin.bottom) + ')');

      svg.append('g')
        .attr('class', 'y-axis')
        .attr('transform', 'translate(' + margin.left + ',0)');

      svg.select('.x-axis')
        .call(xAxis)
        .selectAll('text')
        .attr('x', -32)
        .attr('y', 5)
        .attr('transform', 'rotate(-45, 0, 0)');

      svg.select('.y-axis')
        .call(yAxis);

      // Chart labels
      svg
        .append('text')
        .classed('label', true)
        .attr('x', canvasWidth / 2)
        .attr('y', canvasHeight - margin.top / 2 + 5)
        .attr('text-anchor', 'middle')
        .text('Date');

      svg.append('text')
        .classed('label', true)
        .attr('x', -canvasHeight / 2)
        .attr('y', 10)
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90, 0, 0)')
        .text('Miles Per Gallon');

      // svg
      //   .append('text')
      //   .classed('chart-title', true)
      //   .attr('x', canvasWidth / 2)
      //   .attr('y', margin.bottom / 2)
      //   .attr('text-anchor', 'middle')
      //   .text('Average Mileage Between Fillups');

      // Add bars
      var barGroup = svg
        .append('g')
        .classed('bars', true);

      var bars = barGroup.selectAll('.bar')
        .data(data)
        .enter()
        .append('g')
        .classed('bar', true);

      bars.append('rect')
        .attr('x', function (d) {
          // return timeScale(new Date(d.date)) - (barWidth / 2);
          return timeScale(d.date) - (barWidth / 2);
        })
        .attr('y', function (d) {
          return avgMPGScale(d.mpg);
        })
        .attr('height', function (d) {
          return canvasHeight - avgMPGScale(d.mpg) - margin.bottom;
        })
        .attr('width', function (d) {
          return barWidth;
        })
        .attr('fill', function (d) {
          return colorScale(d.mpg);
        })
        .on('mouseover', function (d) {
          tooltipAvgMPGMouseOver(d);
        })
        .on('mousemove', function (d) {
          tooltipAvgMPGMouseMove(d);
        })
        .on('mouseout', function (d) {
          tooltipMouseOut(d);
        });
    }

    /**
     * Loads the price per mile chart.
     *
     * @param data The data for the chart.
     */
    function loadPricePerMileChart(data) {
      var svg = d3.select('#price-mile-canvas')
        .attr('width', canvasWidth)
        .attr('height', canvasHeight);

      // var barWidth = (canvasWidth - margin.right - margin.left) / (data.length * 4);
      var barWidth = 20;
      var percent = 0.3;

      // Axes scales
      // var timeScale = d3.scaleTime()
      //   .domain([d3.timeMonth.offset(new Date(data[0].date), -1), d3.timeMonth.offset(new Date(data[data.length - 1].date), 1)])
      //   .rangeRound([margin.left, canvasWidth - margin.right]);

      var timeScale = d3.scalePoint()
        .domain(data.map(function(d) {
          return d.date;
        }))
        .range([margin.left, canvasWidth - margin.right])
        .padding(0.5);

      var priceMileScale = d3.scaleLinear()
        .domain([(Math.floor(d3.min(data.map(function (d) {
          return d.pricePerMile;
        })))), ((d3.max(data.map(function (d) {
          return d.pricePerMile;
        }))) * (1.0 + percent))])
        .range([canvasHeight - margin.bottom, margin.top]);

      // Interpolated color scale
      var colorScale = function(d) {
        return d3.scaleLinear()
          .domain([((d3.min(data.map(function (d) {
          return d.pricePerMile;
        })))), ((d3.max(data.map(function (d) {
          return d.pricePerMile;
        }))))])
          .range(['#c7e9c0', '#005a32'])
          .interpolate(d3.interpolateRgb)(d);
      }

      // D3 axes
      var xAxis = d3.axisBottom()
        .scale(timeScale)
        // .tickFormat(d3.timeFormat('%Y/%m'));
        .tickFormat(function(d) {
          return d3.utcFormat('%Y/%m/%d')(new Date(d));
        });

      var yAxis = d3.axisLeft()
        .scale(priceMileScale);

      // Axes
      svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', 'translate(0,' + (canvasHeight - margin.bottom) + ')');

      svg.append('g')
        .attr('class', 'y-axis')
        .attr('transform', 'translate(' + margin.left + ',0)');

      svg.select('.x-axis')
        .call(xAxis)
        .selectAll('text')
        .attr('x', -32)
        .attr('y', 5)
        .attr('transform', 'rotate(-45, 0, 0)');

      svg.select('.y-axis')
        .call(yAxis);

      // Chart labels
      svg
        .append('text')
        .classed('label', true)
        .attr('x', canvasWidth / 2)
        .attr('y', canvasHeight - margin.top / 2 + 5)
        .attr('text-anchor', 'middle')
        .text('Date');

      svg.append('text')
        .classed('label', true)
        .attr('x', -canvasHeight / 2)
        .attr('y', 10)
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90, 0, 0)')
        .text('Price Per Mile');

      // svg
      //   .append('text')
      //   .classed('chart-title', true)
      //   .attr('x', canvasWidth / 2)
      //   .attr('y', margin.bottom / 2)
      //   .attr('text-anchor', 'middle')
      //   .text('Price Per Mile By Fillup');

      // Add bars
      var barGroup = svg
        .append('g')
        .classed('bars', true);

      var bars = barGroup.selectAll('.bar')
        .data(data)
        .enter()
        .append('g')
        .classed('bar', true);

      bars.append('rect')
        .attr('x', function (d, i) {
          // return timeScale(new Date(d.date)) - (barWidth / 2);
          return timeScale(d.date) - (barWidth / 2);
        })
        .attr('y', function (d) {
          return priceMileScale(d.pricePerMile);
        })
        .attr('height', function (d) {
          return canvasHeight - priceMileScale(d.pricePerMile) - margin.bottom;
        })
        .attr('width', function (d) {
          return barWidth;
        })
        .attr('fill', function (d, i) {
          return colorScale(d.pricePerMile);
        })
        .on('mouseover', function (d) {
          tooltipPriceMileMouseOver(d);
        })
        .on('mousemove', function (d) {
          tooltipPriceMileMouseMove(d);
        })
        .on('mouseout', function (d) {
          tooltipMouseOut(d);
        });
    }

    function tooltipMileageLineMouseOver(d) {
      tooltipMouseOver(d, d.mileage);
    }

    function tooltipRemainingMilesLineMouseOver(d) {
      tooltipMouseOver(d, '[' + d.date + ']: ' + d.mileage + ' + ' + d.milesRemaining + ' = ' + (d.milesRemaining + d.mileage));
    }

    function tooltipMileageLineMouseMove(d) {
      tooltipMouseMove(d, '[' + d.date + ']: ' + d.mileage);
    }

    function tooltipRemainingMilesLineMouseMove(d) {
      tooltipMouseMove(d, '[' + d.date + ']: ' + d.mileage + ' + ' + d.milesRemaining + ' = ' + (d.milesRemaining + d.mileage));
    }

    function tooltipAvgMPGMouseOver(d) {
      tooltipMouseOver(d, d.mpg + ' mpg');
    }

    function tooltipAvgMPGMouseMove(d) {
      tooltipMouseMove(d, d.mpg + ' mpg');
    }

    function tooltipPriceMileMouseOver(d) {
      tooltipMouseOver(d, Number(d.pricePerMile).toFixed(3) + ' $/mile');
    }

    function tooltipPriceMileMouseMove(d) {
      tooltipMouseMove(d, Number(d.pricePerMile).toFixed(3) + ' $/mile');
    }

    /**
     * Updates the tooltip when the mouse enters over an item.
     *
     * @param d The data item being hovered on.
     * @param text The text to display in the tooltip.
     */
    function tooltipMouseOver(d, text) {
      tooltip
        .style('top', (d3.event.pageY - 20) + "px")
        .style('left', (d3.event.pageX) + "px")
        .text(text);

      tooltip.transition()
        .duration(200)
        .style('opacity', 1)
    }

    /**
     * Updates the tooltip when the mouse moves on an item.
     *
     * @param d The data item being hovered on.
     * @param text The text to display in the tooltip.
     */
    function tooltipMouseMove(d, text) {
      tooltip
        .style('top', (d3.event.pageY - 20) + "px")
        .style('left', (d3.event.pageX) + "px")
        .text(text);
    }

    /**
     * Updates the tooltip when the mouse exits an item.
     *
     * @param d The data item being exited.
     */
    function tooltipMouseOut(d) {
      tooltip
        .transition()
        .duration(200)
        .style('opacity', 0)
    }

    loadMileageLineChart(data);
    loadAverageMPGChart(data);
    loadPricePerMileChart(data);
  });
}

loadTSV();