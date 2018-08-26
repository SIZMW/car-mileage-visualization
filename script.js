$(function () {
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

  // Colors for charts
  var blueLight = '#c6dbef';
  var blueDark = '#084594';
  var greenLight = '#c7e9c0';
  var greenDark = '#005a32';
  var redLight = '#fee0d2';
  var redDark = '#cb181d';

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
      var mpg = +d['MPG'];

      var pricePerMile = pricePerGallon / mpg;
      var gasUtilization = mileage / (mileage + milesRemaining);

      return {
        date: d['Date'],
        mileage: mileage,
        milesRemaining: milesRemaining,
        gallonsFilled: gallonsFilled,
        pricePerGallon: pricePerGallon,
        mpg: mpg,
        pricePerMile: pricePerMile,
        gasUtilization: gasUtilization
      };
    }, function (error, data) {
      if (error) {
        console.log('Read error');
        return;
      }

      /**
       * Adds an attribute to each data value for the number of days since
       * the previous fillup date.
       *
       * @param data The data for the chart(s).
       */
      function calculateDaysSinceFillup(data) {
        var DEFAULT_VAL = 30;
        var dayConversionFactor = (1000 * 60 * 60 * 24);

        for (i = 1; i < data.length; i++) {
          if ((i - 1) == 0) {
            data[i - 1]['daysSinceFillup'] = DEFAULT_VAL;
          }

          var prev = data[i - 1];
          var curr = data[i];

          var prevDate = new Date(prev.date);
          var currDate = new Date(curr.date);

          var daysSince = (currDate - prevDate) / dayConversionFactor;
          data[i]['daysSinceFillup'] = daysSince;
        }
      }

      calculateDaysSinceFillup(data);

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
        var timeScale = d3.scalePoint()
          .domain(data.map(function (d) {
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
          .tickFormat(function (d) {
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
            tooltipMouseOver(d, tooltipTextMileageLine(d));
          })
          .on('mousemove', function (d) {
            tooltipMouseMove(d, tooltipTextMileageLine(d));
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
            tooltipMouseOver(d, tooltipTextRemainingMilesLine(d));
          })
          .on('mousemove', function (d) {
            tooltipMouseMove(d, tooltipTextRemainingMilesLine(d));
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

        var barWidth = 16;
        var percent = 0.025;

        // Axes scales
        var timeScale = d3.scalePoint()
          .domain(data.map(function (d) {
            return d.date;
          }))
          .range([margin.left, canvasWidth - margin.right])
          .padding(0.5);

        var avgMPGScale = d3.scaleLinear()
          .domain([(Math.floor(d3.min(data.map(function (d) {
            return d.mpg;
          }))) * (1.0 - percent)), (Math.floor(d3.max(data.map(function (d) {
            return d.mpg;
          }))) * (1.0 + percent))])
          .range([canvasHeight - margin.bottom, margin.top]);

        // Interpolated color scale
        var colorScale = function (d) {
          return d3.scaleLinear()
            .domain([((d3.max(data.map(function (d) {
              return d.mpg;
            })))), ((d3.min(data.map(function (d) {
              return d.mpg;
            }))))])
            .range([blueLight, blueDark])
            .interpolate(d3.interpolateRgb)(d);
        }

        // D3 axes
        var xAxis = d3.axisBottom()
          .scale(timeScale)
          .tickFormat(function (d) {
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
            tooltipMouseOver(d, tooltipTextAvgMPG(d));
          })
          .on('mousemove', function (d) {
            tooltipMouseMove(d, tooltipTextAvgMPG(d));
          })
          .on('mouseout', function (d) {
            tooltipMouseOut(d);
          });

        // Legend
        var scaleWidth = 20;
        var scaleHeight = 100;
        generateGradientLegend(svg, 'average-mpg-gradient-scale', scaleWidth, scaleHeight, avgMPGScale.domain(), [(canvasHeight - margin.top) / 2 + scaleHeight / 2 - 1, (canvasHeight - margin.top) / 2 - scaleHeight / 2], [blueLight, blueDark]);
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

        var barWidth = 16;
        var percent = 0.3;

        // Axes scales
        var timeScale = d3.scalePoint()
          .domain(data.map(function (d) {
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
        var colorScale = function (d) {
          return d3.scaleLinear()
            .domain([((d3.min(data.map(function (d) {
              return d.pricePerMile;
            })))), ((d3.max(data.map(function (d) {
              return d.pricePerMile;
            }))))])
            .range([greenLight, greenDark])
            .interpolate(d3.interpolateRgb)(d);
        }

        // D3 axes
        var xAxis = d3.axisBottom()
          .scale(timeScale)
          .tickFormat(function (d) {
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
            tooltipMouseOver(d, tooltipTextPriceMile(d));
          })
          .on('mousemove', function (d) {
            tooltipMouseMove(d, tooltipTextPriceMile(d));
          })
          .on('mouseout', function (d) {
            tooltipMouseOut(d);
          });

        // Legend
        var scaleWidth = 20;
        var scaleHeight = 100;
        generateGradientLegend(svg, 'price-per-mile-gradient-scale', scaleWidth, scaleHeight, priceMileScale.domain(), [(canvasHeight - margin.top) / 2 + scaleHeight / 2 - 1, (canvasHeight - margin.top) / 2 - scaleHeight / 2], [greenDark, greenLight]);
      }

      /**
       * Loads the fillup frequency chart.
       *
       * @param data The data for the chart.
       */
      function loadFillupFrequencyChart(data) {
        var thisCanvasHeight = canvasHeight / 2;
        var svg = d3.select('#fillup-freq-canvas')
          .attr('width', canvasWidth)
          .attr('height', thisCanvasHeight);

        // Indices for ordinal colors
        var milesColorIndex = 0;
        var percent = 0.2;

        // Scales
        var timeScale = d3.scaleTime()
          .domain([d3.timeMonth.offset(new Date(data[0].date), -1), d3.timeMonth.offset(new Date(data[data.length - 1].date), 1)])
          .rangeRound([margin.left, canvasWidth - margin.right]);

        var daysFreqScale = d3.scaleLinear()
          .domain([((d3.min(data.map(function (d) {
            return d.daysSinceFillup;
          })))), ((d3.max(data.map(function (d) {
            return d.daysSinceFillup;
          }))))])
          .range([redDark, redLight]);

        var colorScale = function (d) {
          return daysFreqScale
            .interpolate(d3.interpolateRgb)(d);
        }

        // D3 axes
        var xAxis = d3.axisBottom()
          .scale(timeScale)
          .tickFormat(d3.timeFormat('%Y/%m'));

        // Axes
        svg.append('g')
          .attr('class', 'x-axis')
          .attr('transform', 'translate(0,' + (thisCanvasHeight - margin.bottom) + ')');

        svg.append('g')
          .attr('class', 'y-axis')
          .attr('transform', 'translate(' + margin.left + ',0)');

        svg.select('.x-axis')
          .call(xAxis)
          .selectAll('text')
          .attr('x', -25)
          .attr('y', 5)
          .attr('transform', 'rotate(-45, 0, 0)');

        // Chart labels
        svg
          .append('text')
          .classed('label', true)
          .attr('x', canvasWidth / 2)
          .attr('y', thisCanvasHeight - margin.top / 2 + 5)
          .attr('text-anchor', 'middle')
          .text('Date');

        svg.append('g')
          .classed('dots', true);

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
            return timeScale(new Date(d.date));
          })
          .attr('cy', function (d) {
            return ((thisCanvasHeight - margin.top - (margin.bottom / 2)) / 2);
          })
          .attr('opacity', 1)
          .attr('fill', function (d) {
            return colorScale(d.daysSinceFillup);
          })
          .on('mouseover', function (d) {
            tooltipMouseOver(d, tooltipTextFillupFreq(d));
          })
          .on('mousemove', function (d) {
            tooltipMouseMove(d, tooltipTextFillupFreq(d));
          })
          .on('mouseout', function (d) {
            tooltipMouseOut(d);
          });

        // Legend
        var scaleWidth = 20;
        var scaleHeight = 75;
        generateGradientLegend(svg, 'fillup-freq-gradient-scale', scaleWidth, scaleHeight, daysFreqScale.domain(), [((thisCanvasHeight - margin.top - (margin.bottom / 2)) / 2) + scaleHeight / 2 - 1,
          ((thisCanvasHeight - margin.top - (margin.bottom / 2)) / 2) - scaleHeight / 2
        ], [redLight, redDark]);
      }

      /**
       * Generates a gradient legend scale for the specified chart.
       *
       * @param svg The chart to draw on.
       * @param id The unique ID for the gradient.
       * @param scaleWidth The width of the gradient rectangle.
       * @param scaleHeight The height of the gradient rectangle.
       * @param vertScaleDomain The domain for the legend scale.
       * @param vertRange The range of coordinates for the scale.
       * @param colorRange The start and stop points for the gradient.
       */
      function generateGradientLegend(svg, id, scaleWidth, scaleHeight, vertScaleDomain, vertRange, colorRange) {
        var defs = svg.append('defs');
        var gradient = defs.append('linearGradient')
          .attr('id', id);

        var legendScale = d3.scaleLinear()
          .domain(vertScaleDomain)
          .range(vertRange);

        var legendAxis = d3.axisLeft(legendScale)
          .tickFormat(function (d, i) {
            return d;
          })
          .ticks(6);

        gradient
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "0%")
          .attr("y2", "100%");

        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-opacity', 1.0)
          .attr('stop-color', colorRange[0]);

        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-opacity', 1.0)
          .attr('stop-color', colorRange[1]);

        svg.append('rect')
          .attr('class', 'legend')
          .attr('x', Math.floor(canvasWidth - (margin.right / 2)))
          .attr('y', vertRange[1])
          .attr('width', scaleWidth)
          .attr('height', scaleHeight)
          .attr('stroke', 'black')
          .attr('stroke-width', 0)
          .style('fill', 'url(#' + id + ')');

        svg
          .append('g')
          .classed('legend-axis', true)
          .attr('transform', 'translate(' + Math.floor(canvasWidth - (margin.right / 2)) + ',0)')
          .attr('stroke-width', 1)
          .call(legendAxis);
      }

      function tooltipTextMileageLine(d) {
        return d.mileage;
      }

      function tooltipTextRemainingMilesLine(d) {
        return d.mileage + ' + ' + d.milesRemaining + ' = ' + (d.milesRemaining + d.mileage);
      }

      function tooltipTextAvgMPG(d) {
        return d.mpg + ' mpg';
      }

      function tooltipTextPriceMile(d) {
        return Number(d.pricePerMile)
          .toFixed(3) + ' $/mile';
      }

      function tooltipTextFillupFreq(d) {
        return '[' + d.date + ']: ' + d.daysSinceFillup.toFixed(0) + ' days';
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

      // Load all charts
      loadMileageLineChart(data);
      loadAverageMPGChart(data);
      loadPricePerMileChart(data);
      loadFillupFrequencyChart(data);
    });
  }

  // Load data
  loadTSV();
});
