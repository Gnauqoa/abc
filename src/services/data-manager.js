import { v4 as uuidv4 } from "uuid";
import StoreService from "./store-service";
import { findGCD, getLCM, exportToCSV } from "./../utils/core";
import { EventEmitter } from "fbemitter";
import { sensors } from "./sensor-service";
import { FREQUENCIES, SAMPLING_MANUAL_FREQUENCY } from "../js/constants";

const NUM_NON_DATA_SENSORS_CALLBACK = 3;
export const SAMPLING_AUTO = 0;
export const SAMPLING_MANUAL = 1;
export const MANUAL_FREQUENCY = 1;

/**
 * Class representing a data manager that stores and manages data runs and subscriptions.
 */
class DataManager {
  constructor() {
    /**
     * Object containing subscriber information.
     * @type {Object.<string, {sensorId: number, subscription: EventEmitter.subscription}>}
     */
    this.subscribers = {};

    /**
     * Object containing sensor data buffer.
     * @type {Object.<number, Array(string)>}
     */
    this.buffer = {};

    /**
     * Object containing data run information.
     * @type {Object.<string, {name: string, data: Array(string), activityId: string}>}
     */
    this.dataRuns = {};

    /**
     * Interval ID for emitting subscribers.
     * @type {?number}
     */
    this.emitSubscribersIntervalId = null;

    /**
     * ID for the current data run.
     * @type {?string}
     */
    this.curDataRunId = null;

    /**
     * EventEmitter instance for handling subscriptions.
     * @type {EventEmitter}
     */
    this.emitter = new EventEmitter();

    /**
     * Intervals for emitting subscribers.
     * @type {number[]}
     */
    this.emitSubscribersIntervals = FREQUENCIES.map((e) => (1 / e) * 1000);

    /**
     * Maximum interval for emitting subscribers.
     * @type {number}
     */
    this.maxEmitSubscribersInterval = getLCM(this.emitSubscribersIntervals);

    /**
     * Interval for emitting subscribers.
     * @type {number}
     */
    this.emitSubscribersInterval = findGCD(this.emitSubscribersIntervals);

    /**
     * Total time for collecting data.
     * @type {number}
     */
    this.collectingDataTime = 0;

    /**
     * Boolean indicating if data is being collected.
     * @type {boolean}
     */
    this.isCollectingData = false;

    /**
     * interval to emit data when in collecting data mode
     * @type {number}
     */
    this.collectingDataInterval = 1000;

    this.samplingMode = SAMPLING_AUTO;
    this.sensorIds = sensors.map((sensor) => sensor.id);

    // calls two scheduler functions
    this.runEmitSubscribersScheduler();
    this.dummySensorData();
  }

  /**
   * Returns the instance of the DataManager class.
   * @returns {DataManager} - The instance of the DataManager class.
   */
  static getInstance() {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
      DataManager.instance.constructor = null;
    }
    return DataManager.instance;
  }

  // -------------------------------- SUBSCRIBER -------------------------------- //
  /**
   * Subscribes to a sensor data emitter.
   * @param {function} emitFunction - The function to be called when a sensor data emitter is triggered.
   * @param {string} sensorId - The ID of the sensor.
   * @returns {(string|boolean)} - The ID of the subscriber if successful; otherwise, false.
   */
  subscribe(emitFunction, sensorId) {
    try {
      const hasEmitFunction = typeof emitFunction === "function";
      const validSensorId = this.sensorIds.includes(Number(sensorId)) && Number(sensorId) !== 0;
      if (!hasEmitFunction || !validSensorId) {
        console.log(`SUBSCRIBE: Invalid parameters emitFunction_${emitFunction}-sensorId_${sensorId}`);
        return false;
      }

      const subscriberId = uuidv4();
      const subscription = this.emitter.addListener(subscriberId, emitFunction);

      this.subscribers[subscriberId] = {
        sensorId: Number(sensorId),
        subscription: subscription,
      };

      console.log(`SUBSCRIBE: subscriberId_${subscriberId}-sensorId_${sensorId}`);

      return subscriberId;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  /**
   * Removes a subscriber from the list of subscribers.
   * @param {string} subscriberId - The ID of the subscriber to remove.
   * @returns {boolean} - True if the subscriber was successfully removed, false otherwise.
   * @throws {Error} - If an error occurs while trying to remove the subscriber.
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
        return false;
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  /**
   * Check if a subscriber from the list of subscribers or not.
   * @param {string} subscriberId - The ID of the subscriber to remove.
   * @returns {boolean} - True if the subscriber in subscribers list, false otherwise.
   */
  isSubscribed(subscriberId) {
    return this.subscribers.hasOwnProperty(subscriberId);
  }

  // -------------------------------- SAMPLING SETTING -------------------------------- //
  /**
   * Sets the frequency at which data is collected in auto-sampling mode.
   * @param frequency - The frequency at which data should be collected in Hz.
   * @returns A boolean indicating whether the frequency was set successfully.
   */
  setCollectingDataFrequency(frequency) {
    const isValidFrequency = FREQUENCIES.includes(frequency) || frequency === 0;

    if (!isValidFrequency) {
      console.error(`Invalid frequency: ${frequency}`);
      return false;
    }

    if (frequency === SAMPLING_MANUAL_FREQUENCY) {
      this.samplingMode = SAMPLING_MANUAL;
      this.collectingDataInterval = (1 / MANUAL_FREQUENCY) * 1000;
      console.log(
        `Frequency set to ${MANUAL_FREQUENCY}Hz - ${this.collectingDataInterval}ms. Switching to manual-sampling mode.`
      );
    } else {
      this.collectingDataInterval = (1 / frequency) * 1000;
      this.samplingMode = SAMPLING_AUTO;
      console.log(
        `Frequency set to ${frequency}Hz - ${this.collectingDataInterval}ms. Switching to auto-sampling mode.`
      );
    }

    return true;
  }

  getCollectingDataFrequency() {
    return (1 / Number(this.collectingDataInterval)) * 1000;
  }

  getSamplingMode() {
    return this.samplingMode;
  }

  // -------------------------------- START/STOP -------------------------------- //
  /**
   * Start collecting data
   * @param {string} activityId - The ID of the activity.
   * @returns {string} - Returns the curDataRunId.
   */
  startCollectingData(activityId) {
    this.collectingDataTime = 0;
    this.isCollectingData = true;
    const dataRunId = this.createDataRun(null, activityId);
    return dataRunId;
  }

  /**
   * Stop collecting data
   */
  stopCollectingData() {
    this.isCollectingData = false;
  }

  // -------------------------------- DATA RUN -------------------------------- //
  /**
   * Creates a new data run and sets it as the current data run.
   *
   * @param {string} [name] - The name of the data run. If not provided, a default name will be used.
   * @param {string} [activityId] - The ID of the activity associated with the data run.
   * @returns {string} The ID of the newly created data run.
   */
  createDataRun(name, activityId) {
    /**
     * A dictionary of data runs, where each key is a data run ID and the value is a `DataRun` object.
     * @typedef {Object.<string, DataRun>} DataRuns
     */

    /**
     * @typedef {Object} DataRun
     * @property {string} name - The name of the data run.
     * @property {Array} data - An array of sensor data collected during the data run.
     * @property {string} [activityId] - The ID of the activity associated with the data run.
     */

    // TODO: Uncomment for support multiple data runs
    // const dataRunName = name || `Run ${Object.keys(this.dataRuns).length + 1}`;
    // this.curDataRunId = uuidv4();
    // this.dataRuns[this.curDataRunId] = {
    //   name: dataRunName,
    //   data: [],
    // };

    if (this.curDataRunId) {
      this.dataRuns[this.curDataRunId].data = [];
      return this.curDataRunId;
    }
    const dataRunName = name || `Run ${Object.keys(this.dataRuns).length + 1}`;
    this.curDataRunId = uuidv4();
    this.dataRuns[this.curDataRunId] = {
      name: dataRunName,
      data: [],
      activityId: activityId,
    };
    console.log(`DATA_MANAGER-createDataRun-${this.curDataRunId}`);
    return this.curDataRunId;
  }

  /**
   * Updates the name of a data run.
   * @param {string} dataRunId - The ID of the data run to update.
   * @param {string} dataRunName - The new name of the data run.
   * @returns {boolean} - Returns true if the data run was successfully updated, false otherwise.
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

  /**
   * Deletes a data run.
   * @param {string} dataRunId - The ID of the data run to delete.
   * @returns {boolean} - Returns true if the data run was successfully deleted, false otherwise.
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
   * Appends sensor data to a data run.
   * @param {string} dataRunId - The ID of the data run to append data to.
   * @param {object} sensorsData - An object containing the data from all sensors.
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
   * Returns an array of data run IDs and names associated with a given activity.
   * @param {string} activityId - The ID of the activity to retrieve data runs for.
   * @returns {Array.<{id: string, name: string}>} An array of objects containing the data run ID and name.
   */
  getActivityDataRunPreview(activityId) {
    const dataRunInfos = Object.keys(this.dataRuns)
      .map((dataRunId) => {
        const dataRun = this.dataRuns[dataRunId];
        if (dataRun.activityId === activityId) {
          return { id: dataRunId, name: dataRun.name };
        }
        return false;
      })
      .filter(Boolean);
    return dataRunInfos;
  }

  /**
   * Returns an array of data runs associated with a given activity, each containing the data run ID, name, and data.
   * @param {string} activityId - The ID of the activity to retrieve data runs for.
   * @returns {Array.<{id: string, name: string, data: Array}>} An array of objects containing the data run ID, name, and data.
   */
  getActivityDataRun(activityId) {
    const dataRunInfos = Object.keys(this.dataRuns)
      .map((dataRunId) => {
        const dataRun = this.dataRuns[dataRunId];
        if (dataRun.activityId === activityId) {
          return { id: dataRunId, name: dataRun.name, data: dataRun.data };
        }
        return false;
      })
      .filter(Boolean);
    return dataRunInfos;
  }

  /**
   * Import and store data runs of an activity in the data manager.
   * @param {string} activityId - The ID of the activity.
   * @param {Array<Object>} dataRuns - The data runs of the activity.
   * Each data run object has the following properties:
   *   @param {string} id - The ID of the data run.
   *   @param {string} name - The name of the data run.
   *   @param {Array<Array<number>>} data - The data of the data run, where each inner array contains
   *     data points for a specific timestamp and sensor ID, in the following format:
   *     [[timestamp_1, sensor_1_value, sensor_2_value, ...], [timestamp_2, sensor_1_value, sensor_2_value, ...], ...].
   */
  importActivityDataRun(activityId, dataRuns) {
    for (const dataRun of dataRuns) {
      this.dataRuns[dataRun.id] = {
        name: dataRun.name,
        data: dataRun.data,
        activityId: activityId,
      };

      console.log(`DATA_MANAGER-importActivityDataRun-activityId_${activityId}-dataRunId_${dataRun.id}`);
    }
  }

  /**
   * Parses dataRun.data of DataManager into a Activity DataRun format
   * @param {Array(Object.<time: string, ...[Object.<sensorId: Array(string)>]} dataRun - The data run to be parsed
   * @returns {Array} An array of sensor SensorData objects with time, sensorId, and array of values
   */
  parseActivityDataRun = (dataRun) => {
    /**
     * @typedef {Object} SensorData
     * @property {number} time - The timestamp of the sensor data
     * @property {number} sensorId - The ID of the sensor
     * @property {Array} values - The sensor data values
     */
    const parsedDataRun = [];
    if (!dataRun) return parsedDataRun;

    dataRun.forEach((sample) => {
      const sensorDatas = Object.keys(sample)
        .map((sensorId) => {
          if (parseInt(sensorId) === 0) return false;
          return {
            time: sample[0][0],
            sensorId: parseInt(sensorId),
            values: sample[sensorId],
          };
        })
        .filter(Boolean);
      parsedDataRun.push(...sensorDatas);
    });

    return parsedDataRun;
  };

  /**
   * Returns the data associated with a given data run ID.
   * @param {string} dataRunId - The ID of the data run.
   * @returns {(Array|boolean)} Returns an array of data associated with the data run ID if it exists, otherwise false.
   */
  getDataRunData(dataRunId) {
    if (this.dataRuns.hasOwnProperty(dataRunId)) {
      return this.dataRuns[dataRunId].data;
    }
    return false;
  }

  setCurrentDataRun(dataRunId) {
    if (this.dataRuns.hasOwnProperty(dataRunId)) {
      this.curDataRunId = dataRunId;
      console.log(`DATA_MANAGER-setCurrentDataRun-${dataRunId}`);
      return true;
    }
    return false;
  }

  // -------------------------------- Export -------------------------------- //
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

  // -------------------------------- Read sensor data -------------------------------- //

  /**
   * Callback function called in DeviceManager when there is data available
   * @param {string} sensorsData - The format sensor data (@, id, data1, data2, data3, data 4, *).
   * @returns {void} - No return.
   */
  callbackReadSensor(data) {
    try {
      const parseData = String(data).trim();
      const splitData = parseData.split(/\s*,\s*/);
      const validSensorId = this.sensorIds.includes(Number(splitData[1]));
      if (splitData[0] !== "@" || splitData[splitData.length - 1] !== "*" || !validSensorId) {
        console.log(`callbackReadSensor: Invalid sensor data format ${parseData}`);
        return;
      }

      const sensorId = Number(splitData[1]);
      const sensorsData = splitData.splice(2, splitData.length - NUM_NON_DATA_SENSORS_CALLBACK);
      this.buffer[sensorId] = sensorsData;
    } catch (e) {
      console.error(`callbackReadSensor: ${e.message} at ${parseData}`);
    }
  }

  /**
   * Callback function called in DeviceManager when a sensor is disconnected
   * @param {string} sensorsData - Last data received from sensor to identify which one
   * @returns {void} - No return.
   */
  callbackSensorDisconnected(data) {
    try {
      const parseData = String(data).trim();
      const splitData = parseData.split(/\s*,\s*/);
      const validSensorId = this.sensorIds.includes(Number(splitData[1]));
      if (splitData[0] !== "@" || splitData[splitData.length - 1] !== "*" || !validSensorId) {
        console.log(`callbackSensorDisconnected: Unecognized sensor data format ${parseData}`);
        return;
      }

      const sensorId = Number(splitData[1]);
      console.log("Sensor ", sensorId, " has been disconnected");
      // safe way to remove this sensor data from data buffer dictionary
      const { [sensorId]: buff, ...bufferWithoutSensorId } = this.buffer;
      this.buffer = bufferWithoutSensorId;
    } catch (e) {
      console.error(`callbackSensorDisconnected: ${e.message} at ${parseData}`);
    }
  }

  getListActiveSensor() {
    const activeSensors = Object.keys(this.buffer);
    return activeSensors;
  }

  /**
   * Get the data for a specific data run.
   * @param {string} dataRunId - The ID of the data run to retrieve.
   * @returns {(Array|boolean)} The data for the specified data run or false if the data run doesn't exist.
   */
  getManualSample(sensorId) {
    if (!this.sensorIds.includes(Number(sensorId))) {
      console.log(`getIndividualSample: sensorId ${sensorId} does not exist`);
      return false;
    }

    const dataRunId = this.curDataRunId;
    const parsedTime = (this.collectingDataTime / 1000).toFixed(3);
    const sensorData = this.buffer[Number(sensorId)] || [];

    this.appendDataRun(dataRunId, { ...this.buffer, 0: [parsedTime] });

    const returnedData = [parsedTime, ...sensorData];
    return returnedData;
  }

  // -------------------------------- SCHEDULERS -------------------------------- //
  /**
   * Runs a scheduler that emits data to subscribers at regular intervals.
   * This function also handles data collection when in "collecting data mode".
   */
  runEmitSubscribersScheduler() {
    let counter = 0;
    this.emitSubscribersIntervalId = setInterval(() => {
      try {
        const curInterval = counter * this.emitSubscribersInterval;
        if (curInterval % this.collectingDataInterval === 0) {
          this.emitSubscribers();

          if (this.isCollectingData) {
            if (this.samplingMode === SAMPLING_AUTO) {
            const parsedTime = (this.collectingDataTime / 1000).toFixed(3);
            this.appendDataRun(this.curDataRunId, { ...this.buffer, 0: [parsedTime] });
          }

            // Update total time collecting data
            this.collectingDataTime += this.emitSubscribersInterval;
          }
        }

        // Increment counter and loop back to 0 if greater than max interval
        counter = (counter + 1) % (this.maxEmitSubscribersInterval / this.emitSubscribersInterval);
      } catch (e) {
        const schedulerError = new Error(`runEmitSubscribersScheduler: ${error.message}`);
        log.error(schedulerError);
      }
    }, this.emitSubscribersInterval);
  }

  /**
   * Emit data to all subscribers.
   */
  emitSubscribers() {
    /**
     * @typedef {Array} EmittedData
     * @property {number | string} 0 - The data run ID, or -1 if not collecting data.
     * @property {string} 1 - The time elapsed since data collection began, formatted as a string (e.g. "0.000").
     * @property {string} 2 - The ID of the sensor.
     * @property {Array} 3 - An array of sensor data values.
     */

    for (const subscriberId in this.subscribers) {
      const subscriber = this.subscribers[subscriberId];
      if (!subscriber.subscription.subscriber) {
        delete this.subscribers[subscriberId];
        console.log(`emitSubscribersScheduler: Remove subscriberId_${subscriberId}`);
        continue;
      }

      const dataRunId = this.isCollectingData ? this.curDataRunId || -1 : -1;
      const parsedTime = this.isCollectingData ? (this.collectingDataTime / 1000).toFixed(3) : "0.000";
      const sensorData = this.buffer[subscriber.sensorId] || [];

      // Notify subscriber
      const emittedData = [dataRunId, parsedTime, subscriber.sensorId, ...sensorData];
      this.emitter.emit(subscriberId, emittedData);
    }
  }

  // TODO: stop EmitSubscribersScheduler when object is destroyed. Otherwise leading to leak memory
  stopEmitSubscribersScheduler() {
    clearInterval(this.emitSubscribersIntervalId);
  }

  dummySensorData() {
    setInterval(() => {
      const sensorId = (Math.random() * (2 - 1) + 1).toFixed(0);

      const datas = [];
      const sensorInfo = sensors.find((sensor) => Number(sensorId) === Number(sensor.id));
      for (const numData in sensorInfo.data) {
        const dataInfo = sensorInfo.data[numData];
        const data = (Math.random() * (dataInfo.max - dataInfo.min) + dataInfo.min).toFixed(2);
        datas.push(data);
      }
      const sensorData = datas.join(",");
      const dummyData = `@,${sensorId},${sensorData}, *`;

      this.callbackReadSensor(dummyData);
    }, 1000);
  }
}

export default DataManager.getInstance();
