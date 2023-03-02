// Data from https://kilthub.cmu.edu/articles/dataset/Compiled_daily_temperature_and_precipitation_data_for_the_U_S_cities/7890488

// The goal of this script is to make a chart with the average max temperature per year for each city, with a trendline.

// We import the SimpleDataNode class. Make sure to run "npm install" or "npm install simple-data-analysis" before!
import { SimpleDataNode } from "simple-data-analysis";
// We also import readdirSync, to retrieve the list of the files in the directory "./data/csv/". fs stands for file-system. It comes with Node. No need to install it.
import { readdirSync } from "fs";

// We will exclude years with less than 90 % of the data.
const missingDataThreshold = 0.9;

// The name of the cities is in a separate file: ./data/city_info.csv. We load it.
const sdInfo = new SimpleDataNode().loadDataFromLocalFile({
  path: "./data/city_info.csv",
});

// Here, we retrieve the list of all csv files in the directory "./data/csv/".
const pathToCsvFiles = "./data/csv/";
const csvFiles = readdirSync(pathToCsvFiles);

// Now, we can loop through each csv file.
for (const csv of csvFiles) {
  // First, we retrieve the city id out of the csv file name.
  const id = csv.replace(".csv", "");

  // With the id, we can retrieve the name from sdInfo (which loaded the data from "./data/city_info.csv").
  const name = sdInfo
    // We clone it before filtering, so it will keep all of the data while being called in the loop.
    .clone()
    // We filter the cities based on the id we retrieved from the csv file name.
    .filterValues({ key: "ID", valueComparator: (ID) => ID === id })
    // There will be only one result. We grab him and keep only the value of the key Name.
    .getFirst().Name;

  // Just to make sure, we log the csv, the id and the name. "\n" adds an empty line before logging this information. It makes the logs clearer.
  console.log("\n", csv, id, name);

  // It's time to load the data from the CSV file. We use the option autotype so dates and numbers will be parsed. Otherwise, everything would be string values, because a CSV file is just text. No need to store everything in a variable. We just want to export a chart.
  new SimpleDataNode()
    .loadDataFromLocalFile({
      path: `${pathToCsvFiles}${csv}`,
      autoType: true,
    })
    // For the rest, go check the notebook here. We are doing pretty much the same thing. The big difference is that we use saveChart instead of getChart, because we want to write a file.
    .keepNumbers({ key: "tmax" })
    .addKey({
      key: "year",
      itemGenerator: (item) => item.Date.getFullYear(),
    })
    .summarize({
      keyValue: "tmax",
      keyCategory: "year",
      summary: ["count", "mean"],
    })
    .filterValues({
      key: "count",
      valueComparator: (count) => count >= 365 * missingDataThreshold,
    })
    .saveChart({
      path: `./output/charts-years/${name}.html`,
      type: "dot",
      x: "year",
      y: "mean",
      color: "mean",
      title: name,
      trend: true,
      showTrendEquation: true,
    });
}
