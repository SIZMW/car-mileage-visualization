Car Mileage Visualization
============================

## Description
This visualization is used to display statistics and trends in driving and mileage data.

### Visualizations
#### Average Miles Per Gallon
This visualization shows the car's estimated miles per gallon for the driven trip between dates. We can see how fuel efficient the car was during each trip, and can get insight into whether or not improvements can be made, or a plateau of fuel efficiency has been reached.

#### Mileage vs. Potential Miles
This visualization shows a trend line over all the refueling dates, connecting the total mileage for each trip. It also shows a trend line over all the refueling dates, connecting the points for the total mileage plus the estimated remaining mileage. We get a clear sense of the gap between the miles actually driven and the car's estimate of the miles that could be driven. It gives an idea of the utilization of fuel per trip, and can help identify if the driver is refueling too early or too late.

#### Price Per Mile
This visualization shows bars for each refueling data and the estimated price per mile for the driven trip between dates. Price per mile is calculated by the following:

(`Gallons Filled` * `Price Per Gallon`) / `Mileage`

Price per mile is another metric to show how cost efficient the driven trip was in relation to the amount spent on fuel for that trip.

#### Fillup Frequency
This visualization shows data points for each data of a fuel fillup. The resulting view shows a horizontal clustering of points which show how often fillups occur over time. The closer the points, the more frequent the fillups occurred. This can give us an understanding of what time periods the car was refueled more often, and help us start to understand why exactly that happened.

### Data Fields
Each `Date` entry is a date for when the fuel tank was refilled. At that time, I extract other information from the car's onboard computer to use in the visualizations.
* `Mileage`: The current trip's mileage. This is always reset when the car is refueled.
* `Miles Remaining`: The estimated number of miles that could still be driven on the remaining fuel, before it is refilled. This is a statistic that the car's computer estimates.
* `Gallons Filled`: The number of gallons filled during refueling. This number is from the meter at the gas station.
* `Price Per Gallon`: The cost per gallon of gas on the date that the car was refueled.
* `MPG`: The estimated miles per gallon that was achieved during the car trip, since the last reset of the trip's mileage. This is a statistic that the car's computer estimates.

When processing the data, I also calculate the following fields:
* `Days Since Fillup`: The number of days from the previous fillup to the current fillup date.
* `Price Per Mile`: The cost per mile driven of the total mileage of the trip.
* `Gas Utilization`: The percentage utilization of the gas from the fillup. This is calculated by the following: `Mileage` / (`Mileage` + `Miles Remaining`).

## Usage
The visualization can be seen [here](https://sizmw.github.io/car-mileage-visualization/).
