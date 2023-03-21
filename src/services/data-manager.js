import { v4 as uuidv4 } from "uuid";
import StoreService from "./store-service";
import { findGCD, getLCM, exportToCSV } from "./../utils/core";
import { EventEmitter } from "fbemitter";
import { sensors } from "./sensor-service";

const MIN_DATA_SENSORS_CALLBACK = 4;
const NUM_NON_DATA_SENSORS_CALLBACK = 3;

/** @class DataManager
 * @property subscribers {Object} List of subscribers
 * @property buffer {Object} The buffer used to store sensors data
 * @property readSensorIntervalId {number} read sensor interval id
 */
class DataManager {
  subscribers = {};
  buffer = {};
  dataRuns = {};
  emitSubscribersIntervalId = null;

  constructor() {
    console.log("construct");
    this.emitter = new EventEmitter();
    this.storeService = new StoreService("data-manager");

    // initializes variables
    this.readSensorFrequency = 1;
    this.readSensorInterval = (1 / this.readSensorFrequency) * 1000;
    this.emitSubscribersFrequencies = [1, 2, 5, 10];
    this.emitSubscribersIntervals = this.emitSubscribersFrequencies.map((e) => (1 / e) * 1000);

    this.maxEmitSubscribersInterval = getLCM(this.emitSubscribersIntervals);
    this.emitSubscribersInterval = findGCD(this.emitSubscribersIntervals);

    this.selectedSensorId = null;

    this.dataRuns = {};
    this.curDataRunId = null;

    // calls two scheduler functions
    this.runEmitSubscribersScheduler();
    this.dummySensorData();
  }

  /**
   * Get instance of DataManager
   * @returns {DataManager} DataManagerIST - The instance of DataManager
   */
  static getInstance() {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
      DataManager.instance.constructor = null;
    }
    return DataManager.instance;
  }

  /**
   * @param {(data: any) => void} emitFunction - The emit function subscription.
   * @param {number} frequency - The frequency to call emitFunction.
   * @returns {string | boolean} subscriberId - The subscriber's unique id if register successfully otherwise false.
   */
  subscribe(emitFunction, frequency) {
    try {
      const hasEmitFunction = typeof emitFunction === "function";
      const isValidFrequency = this.emitSubscribersFrequencies.includes(Number(frequency));
      if (!isValidFrequency || !hasEmitFunction) {
        console.log(`SUBSCRIBE: Invalid parameters frequency_${frequency}-emitFunction_${emitFunction}`);
        return false;
      }

      const subscriberId = uuidv4();
      const interval = (1 / frequency) * 1000;
      const subscription = this.emitter.addListener(subscriberId, emitFunction);

      this.subscribers[subscriberId] = {
        interval: Number(interval),
        subscription: subscription,
        totalTimeRunning: 0,
      };

      // Create new DataRuns
      this.createDataRun();

      console.log(`SUBSCRIBE: subscriberId_${subscriberId}-frequency_${frequency}Hz-interval_${interval}ms`);

      return subscriberId;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  /**
   * @param {string} subscriberId - The subscriberId to remove from list.
   * @returns {boolean} status - Whether the unsubscribe was successfully or not.
   */
  unsubscribe(subscriberId) {
    try {
      if (subscriberId && this.subscribers.hasOwnProperty(subscriberId)) {
        this.subscribers[subscriberId].subscription.remove();
        delete this.subscribers[subscriberId];
        console.log(`UNSUBSCRIBED: subscriberId_${subscriberId}`);
        return true;
      } else {
        console.error(`UNSUBSCRIBED: Invalid subscriberId_${subscriberId}`);
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  /**
   * @param {string} subscriberId - The subscriber to check for in list.
   * @returns {boolean} - Boolean indicating whether subscriber is in list.
   */
  isSubscribed(subscriberId) {
    return this.subscribers.hasOwnProperty(subscriberId);
  }

  /**
   * Change sensor data in callback function
   * @param {number} sensorId - The subscriber to check for in list.
   * @returns {boolean} - Success or failure
   */
  setSelectedSensorId(sensorId) {
    const selectedSensor = sensors.find((sensor) => Number(sensor.id) === Number(sensorId));

    if (selectedSensor) {
      this.selectedSensorId = Number(sensorId);
      return true;
    }

    console.log(`setSelectedSensorId: invalid sensorId ${sensorId}`);
    return false;
  }

  // -------------------------------- DATA RUN -------------------------------- //
  /**
   * Create a new data run with an optional name.
   * @param {string} [name] - The name of the data run (optional).
   */
  createDataRun(name) {
    // TODO: Uncomment for support multiple data runs
    // const dataRunName = name || `Run ${Object.keys(this.dataRuns).length + 1}`;
    // this.curDataRunId = uuidv4();
    // this.dataRuns[this.curDataRunId] = {
    //   name: dataRunName,
    //   data: [],
    // };

    if (this.curDataRunId) {
      this.dataRuns[this.curDataRunId].data = [];
      return;
    }

    const dataRunName = name || `Run ${Object.keys(this.dataRuns).length + 1}`;
    this.curDataRunId = uuidv4();
    this.dataRuns[this.curDataRunId] = {
      name: dataRunName,
      data: [],
    };
  }

  /**
   * Update the name of a data run.
   * @param {string} dataRunId - The ID of the data run to update.
   * @param {string} dataRunName - The new name of the data run.
   * @returns {boolean} True if the data run was updated successfully, false otherwise.
   */
  updateDataRun(dataRunId, dataRunName) {
    const dataRun = this.dataRuns[dataRunId];
    if (!dataRun || !dataRun.name) {
      console.log(`updateDataRun: dataRunId ${dataRunId} does not exist`);
      return false;
    }
    dataRun.name = dataRunName;
    return true;
  }

  /** Delete a data run.
   * @param {string} dataRunId - The ID of the data run to delete.
   * @returns {boolean} True if the data run was deleted successfully, false otherwise.
   */
  deleteDataRun(dataRunId) {
    if (!this.dataRuns[dataRunId]) {
      console.log(`deleteDataRun: dataRunId ${dataRunId} does not exist`);
      return false;
    }
    delete this.dataRuns[dataRunId];
    return true;
  }

  /**
   * Append data to a data run.
   * @param {string} dataRunId - The ID of the data run to append data to.
   * @param {object} sensorsData - The data to append to the data run.
   */
  appendDataRun(dataRunId, sensorsData) {
    const dataRun = this.dataRuns[dataRunId];
    if (!dataRun) {
      console.log(`appendDataRun: dataRunId ${dataRunId} does not exist`);
      return;
    }
    dataRun.data.push(sensorsData);
  }

  /**
   * Get the preview information for all data runs.
   * @returns {Array<Object>} An array of objects containing the ID and name of each data run.
   */
  getDataRunPreview() {
    const dataRunInfos = Object.keys(this.dataRuns).map((dataRunId) => {
      return { id: dataRunId, name: this.dataRuns[dataRunId].name };
    });
    return dataRunInfos;
  }

  /**
   * Get the data for a specific data run.
   * @param {string} dataRunId - The ID of the data run to retrieve.
   * @returns {(Array|boolean)} The data for the specified data run or false if the data run doesn't exist.
   */
  getDataRunData(dataRunId) {
    const dataRun = this.dataRuns[dataRunId];
    if (!dataRun) {
      return false;
    }
    return dataRun.data;
  }
  /** Export the current data run to a CSV file.
   * @function
   * @name exportCSVDataRun
   * @memberof ClassName
   * @returns {void}
   */
  exportCSVDataRun() {
    // TODO: Support multiple data runs in future
    if (!this.dataRuns[this.curDataRunId]) {
      console.log(`exportCSVDataRun: Can not export data run CSV`);
      return;
    }

    const rowNames = [];
    const rows = [];
    const invertedSensorIds = {};
    let currentIndex = 0;

    for (const sensor of sensors) {
      const sensorDataIds = Object.keys(sensor.data);
      invertedSensorIds[sensor.id] = {
        name: sensor.name,
        index: currentIndex,
        numValues: sensorDataIds.length,
      };
      currentIndex += sensorDataIds.length;

      for (const id of sensorDataIds) {
        rowNames.push(`${sensor.data[id].name} (${sensor.data[id].unit})`);
      }
    }

    rows.push(rowNames);
    for (const datas of this.dataRuns[this.curDataRunId].data) {
      const rowData = new Array(rowNames.length).fill(null);
      for (const key of Object.keys(datas)) {
        const data = datas[key];
        const invertedSensorId = invertedSensorIds[key];
        for (let i = 0; i < invertedSensorId.numValues; i++) {
          rowData[invertedSensorId.index + i] = data[i];
        }
      }
      rows.push(rowData);
    }
    exportToCSV("test.csv", rows);
  }

  // -------------------------------- EDL -------------------------------- //
  importELD() {}
  exportEDL() {}

  // -------------------------------- Read sensor data -------------------------------- //
  /**
   * Callback function called in DeviceManager when there is data available
   * @param {string} sensorsData - The format sensor data (@, id, data1, data2, data3, data 4, *).
   * @returns {void} - No return.
   */
  callbackReadSensor(data) {
    const splitData = data.split(/\s*,\s*/);
    // console.log(`RECEIVE SENSOR DATA: ${splitData}`);
    if (
      splitData[0] !== "@" ||
      splitData[splitData.length - 1] !== "*" ||
      splitData.length < MIN_DATA_SENSORS_CALLBACK
    ) {
      console.log(`callbackReadSensor: Invalid sensor data format ${data}`);
      return;
    }

    const sensorId = Number(splitData[1]);
    const sensorsData = splitData.splice(2, splitData.length - NUM_NON_DATA_SENSORS_CALLBACK);
    this.buffer[sensorId] = sensorsData;
  }

  // -------------------------------- SCHEDULERS -------------------------------- //
  runEmitSubscribersScheduler() {
    let counter = 0;

    this.emitSubscribersIntervalId = setInterval(() => {
      const curInterval = counter * this.emitSubscribersInterval;

      Object.keys(this.subscribers).forEach((subscriberId) => {
        const subscriber = this.subscribers[subscriberId];
        try {
          let sensorData = this.buffer[this.selectedSensorId];
          let totalTimeRunning = subscriber.totalTimeRunning;

          if (curInterval % subscriber.interval !== 0) return;
          if (!subscriber.subscription.subscriber) {
            delete this.subscribers[subscriberId];
            console.log(`emitSubscribersScheduler: Remove subscriberId_${subscriberId}`);
            return;
          }

          subscriber.totalTimeRunning += subscriber.interval;
          // Add all data in buffer to data run
          this.appendDataRun(this.curDataRunId, { ...this.buffer, 0: [totalTimeRunning] });

          // Notify subscriber
          this.emitter.emit(subscriberId, sensorData ? sensorData : []);
        } catch (error) {
          console.error(error);
          if (!this.subscribers.hasOwnProperty(subscriberId)) return;
          delete this.subscribers[subscriberId];
        }
      });

      counter = (counter + 1) % (this.maxEmitSubscribersInterval / this.emitSubscribersInterval);
    }, this.emitSubscribersInterval);
  }

  // TODO: stop EmitSubscribersScheduler when object is destroyed. Otherwise leading to leak memory
  stopEmitSubscribersScheduler() {
    clearInterval(this.emitSubscribersIntervalId);
  }

  dummySensorData() {
    setInterval(() => {
      const max = 4;
      const min = 1;
      const decimals = 2;

      const sensorId = (Math.random() * (max - min) + min).toFixed(0);
      const data1 = (Math.random() * (max - min) + min).toFixed(decimals);
      //   const data2 = (Math.random() * (max - min) + min).toFixed(decimals);
      //   const data3 = (Math.random() * (max - min) + min).toFixed(decimals);
      //   const data4 = (Math.random() * (max - min) + min).toFixed(decimals);
      const dummyData = `@, ${sensorId}, ${data1}, *`;

      //   console.log(`DUMMY SENSOR DATA: ${dummyData}`);
      this.callbackReadSensor(dummyData);
    }, 3000);
  }
}

export default DataManager.getInstance();
