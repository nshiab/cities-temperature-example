// Data from https://kilthub.cmu.edu/articles/dataset/Compiled_daily_temperature_and_precipitation_data_for_the_U_S_cities/7890488

// The goal of this script is to pick interesting cities for this observable notebook: {ADD LINK}

import { SimpleDataNode } from "simple-data-analysis";

const sdInfo = new SimpleDataNode({ verbose: true })
  .loadDataFromLocalFile({ path: "./data/city_info.csv" })
  .filterValues({
    key: "Name",
    valueComparator: (Name) =>
      [
        "Sacramento",
        "WashingtonDC",
        "NewYork",
        "SaltLakeCity",
        "Detroit",
        "Tampa",
        "Phoenix",
        "Savannah",
        "Baltimore",
        "Memphis",
      ].includes(Name),
  })
  .renameKey({ oldKey: "ID", newKey: "oldId" })
  .selectKeys({ keys: ["oldId", "Name", "Lat", "Lon"] })
  .removeDuplicates()
  .addRank({ newKey: "id" })
  .formatAllKeys();

const citiesIds = sdInfo
  .clone()
  .selectKeys({ keys: ["id", "oldId"] })
  .getData();

// Individual files
for (const cityIds of citiesIds) {
  new SimpleDataNode({ verbose: true })
    .loadDataFromLocalFile({
      path: `./data/csv/${cityIds.oldId}.csv`,
      fileNameAsId: true,
    })
    .filterValues({ key: "tmax", valueComparator: (tmax) => tmax !== "NA" })
    .modifyValues({
      key: "id",
      valueGenerator: (val) => val.split(".")[0],
    })
    .formatAllKeys()
    .renameKey({ oldKey: "id", newKey: "oldId" })
    .mergeItems({
      dataToBeMerged: sdInfo,
      commonKey: "oldId",
    })
    .removeKey({ key: "oldId" })
    .selectKeys({ keys: ["id", "date", "tmax"] })
    .saveData({ path: `./output/cities-for-observable/${cityIds.id}.csv` });
}

sdInfo
  .removeKey({ key: "oldId" })
  .saveData({ path: "./output/cities-for-observable/cities-info.csv" });
