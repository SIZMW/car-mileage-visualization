Car Mileage Visualization
============================

## Description
This visualization is used to display statistics and trends in driving and mileage data.

### Visualizations
#### Mileage vs. Potential Mileage
This visualization shows a trend line over all the refueling dates, connecting the total mileage for each trip. It also shows a trend line over all the refueling dates, connecting the points for the total mileage plus the estimated remaining mileage. This chart shows the gap between the miles actually driven and the car's estimate of the miles that could be driven. It gives an idea of the utilization of fuel per trip, and can help identify if the driver is refueling too early or too late.

#### Average Miles Per Gallon
This visualization shows bars for each refueling date and the car's estimated miles per gallon for the driven trip between dates. This chart shows how fuel efficient the car was during each trip, and can give insight into whether or not improvements can be made, or a plateau of fuel efficiency has been reached.

#### Price Per Mile
This visualization shows bars for each refueling data and the estimated price per mile for the driven trip between dates. Price per mile is calculated by the following:

(`Gallons Filled` * `Price Per Gallon`) / `Mileage`

Price per mile is another metric to show how cost efficient the driven trip was in relation to the amount spent on fuel for that trip. The bars are colored by a scale from green to black, where green is a lower price per mile value, which is better. The scale is shown below.

![Color scale](img/price-per-mile-color-scale.png)

### Data Fields
Each `Date` entry is a date for when the fuel tank was refilled. At that time, I extract other information from the car's onboard computer to use in the visualizations.
* `Mileage`: The current trip's mileage. This is always reset when the car is refueled.
* `Miles Remaining`: The estimated number of miles that could still be driven on the remaining fuel, before it is refilled. This is a statistic that the car's computer estimates.
* `Gallons Filled`: The number of gallons filled during refueling. This number is from the meter at the gas station.
* `Price Per Gallon`: The cost per gallon of gas on the date that the car was refueled.
* `MPG`: The estimated miles per gallon that was achieved during the car trip, since the last reset of the trip's mileage. This is a statistic that the car's computer estimates.

## Usage
The visualization can be seen [here](https://sizmw.github.io/car-mileage-visualization/).
