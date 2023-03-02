// Data from https://kilthub.cmu.edu/articles/dataset/Compiled_daily_temperature_and_precipitation_data_for_the_U_S_cities/7890488

// The goal of this script is to make a small multiples chart with the average max temperature per decade for each city, with a linear regression trend. We want the small multiples to show the cities with the strongest trends first.

// We import the SimpleDataNode class. Make sure to run "npm install" or "npm install simple-data-analysis" before!
import { SimpleDataNode } from "simple-data-analysis";

// We will exclude decades with less than 90 % of the data.
const missingDataThreshold = 0.9;
// We will exclude cities with less than 5 decades.
const minNbOfDecades = 5;

// We create a SimpleDataNode instance with verbose true. This option will log information in the console at each step. Very useful.
const sdAllCities = new SimpleDataNode({ verbose: true })
  // We have 210 csv files with around 10 million lines of data in total. Instead of loading them one by one, we load all of them directly. If you open one of the files (check inside ./data/csv/), you'll notice that there is no id in the data. So we use the option fileNameAsId. The instance will create a key id and put the file name in it. Handy! We also pass the autotype option as true, so numbers and dates are parsed automatically. Otherwise, in csv files, everything is a string.
  .loadDataFromLocalDirectory({
    path: "./data/csv/",
    autoType: true,
    fileNameAsId: true,
  })
  // We keep only items with a number as tmax value.
  .keepNumbers({ key: "tmax" })
  // We create a new key decade. With autotype, the Dates are actual date objects, so it's easy to retrieve the year and convert it to the decade.
  .addKey({
    key: "decade",
    itemGenerator: (item) => Math.floor(item.Date.getFullYear() / 10) * 10,
  })
  // We can now compute the average maximum temperature per decade for each city. We also count the number of values.
  .summarize({
    keyValue: "tmax",
    keyCategory: ["id", "decade"],
    summary: ["count", "mean"],
  })
  // We don't want decades with a lot of missing data. In the previous step, we counted the number of items in each decade. Now, we filter out decades with fewer data than our threshold (90%).
  .filterValues({
    key: "count",
    valueComparator: (count) => count >= 365 * 10 * missingDataThreshold,
  })
  // We clean the id key. Since they are based on the file name, the ids end with ".csv". But in the reference file for cities (./data/csv/city_info.csv), the ids are not. We will merge them, so we need the ids to match.
  .replaceValues({
    key: "id",
    oldValue: ".csv",
    newValue: "",
    method: "partialString",
  })
  // Finally, we select the three keys that we are interested in for the next steps.
  .selectKeys({ keys: ["id", "decade", "mean"] });

// Now, we need a list of cities with enough decades. This list will help us later to filter out cities.
const citiesToKeep = sdAllCities
  // We clone our data with the average temperature per decade and per city.
  .clone()
  // We summarize it again to count the number of decades per city.
  .summarize({ keyValue: "decade", keyCategory: "id", summary: "count" })
  // We filter out the cities with fewer decades than our threshold (5).
  .filterValues({
    key: "count",
    valueComparator: (count) => count >= minNbOfDecades,
  })
  // We get the data as a simple list of ids. These are the cities with enough decades!
  .getUniqueValues({ key: "id" });

// Just to make sure, we log this list. It's not a SimpleData instance, so verbose is not showing it.
console.log("citiesToKeep =>", citiesToKeep);

// We now exclude any city in our data (avg. temp. per city) that is not in the list.
sdAllCities.filterValues({
  key: "id",
  valueComparator: (id) => citiesToKeep.includes(id),
});

// We will draw a chart with a trend line (linear regression) for each city. We want to show the cities with the strongest trends first. So we need to compute the r-squared value for each city.
const sdAllCitiesRegressions = sdAllCities
  // We clone our data with the avg. temp. per city. There are only the cities with enough decades now.
  .clone()
  // We compute the linear regression for each city.
  .regression({ keyX: "decade", keyY: "mean", keyCategory: "id" })
  // We keep the only two keys that interest us.
  .selectKeys({ keys: ["id", "r2"] });

// We can now merge the regression values with our main data. They both have an id key, so it's easy.
sdAllCities
  .mergeItems({ dataToBeMerged: sdAllCitiesRegressions, commonKey: "id" })
  // And we sort the data based on the r2 value. r2 goes from 0 to 1. The closer to 1, the strongest the trend. So we sort descendingly.
  .sortValues({ key: "r2", order: "descending" });

// There is one last thing missing in our data: the name of the city. This information can be found in a separate file: ./data/city_info.csv. We create a SimpleDataNode instance and load its data.
const sdInfo = new SimpleDataNode()
  .loadDataFromLocalFile({
    path: "./data/city_info.csv",
  })
  // The id column is name ID. We rename it to match our data.
  .renameKey({ oldKey: "ID", newKey: "id" })
  // We keep only the key id and the key Name.
  .selectKeys({ keys: ["id", "Name"] });

sdAllCities
  // We can now merge our data with the Names!
  .mergeItems({ dataToBeMerged: sdInfo, commonKey: "id" })
  // And we have everything ready to draw our small multiple charts. Run the script by typing "node charts-decade.js" in your terminal and when done, open the ./output/all-cities-decade.html in your browser. Isn't that beautiful? You just crunched 10 million lines of data to produce this chart!
  .saveChart({
    path: "./output/chart-all-cities-decades.html",
    x: "decade",
    y: "mean",
    type: "dot",
    color: "mean",
    trend: true,
    showTrendEquation: true,
    smallMultipleKey: "Name",
    width: 1200,
    smallMultipleWidth: 300,
    smallMultipleHeight: 300,
  });
