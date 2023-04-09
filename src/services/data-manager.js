import { v4 as uuidv4 } from "uuid";
import { findGCD, getLCM, exportDataRunsToExcel } from "./../utils/core";
import { EventEmitter } from "fbemitter";
import { sensors } from "./sensor-service";
import {
  FREQUENCIES,
  SAMPLING_MANUAL_FREQUENCY,
  EMIT_DATA_MANUAL_FREQUENCY,
  TIMER_INTERVAL,
  SAMPLING_AUTO,
  SAMPLING_MANUAL,
} from "../js/constants";

const TIME_STAMP_ID = 0;
const NUM_NON_DATA_SENSORS_CALLBACK = 3;

/**
 * Class representing a data manager that stores and manages data runs and subscriptions.
 */
export class DataManager {
  constructor() {
    // Initialize variables
    this.initializeVariables();

    // calls two scheduler functions
    this.runEmitSubscribersScheduler();
    this.dummySensorData();
  }

  initializeVariables() {
    /**
     * Object containing subscriber information.
     * @type {Object.<string, {sensorIds: number, subscription: EventEmitter.subscription}>}
     */
    this.subscribers = {};

    /**
     * Object containing sensor data buffer.
     * @type {Object.<number, Array(string)>}
     */
    this.buffer = {};

    /**
     * Object containing data run information.
     * @type {Object.<string, {name: string, data: Array(string)}, interval: number>}
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

    // Parameters for Timer
    this.timerCollectingTime = 0;
    this.timerSubscriber = {};
  }

  init() {
    this.stopEmitSubscribersScheduler();
    this.initializeVariables();
    this.runEmitSubscribersScheduler();
  }

  /**
   * Returns the instance of the DataManager class.
   * @returns {DataManager} - The instance of the DataManager class.
   */
  static getInstance() {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  // -------------------------------- SUBSCRIBER -------------------------------- //
  /**
   * Subscribe to data updates for the specified sensor IDs.
   * @param {Function} emitFunction - A function to be called whenever data is updated for any of the specified sensors.
   * @param {number[]} sensorIds - An array of integers representing the IDs of the sensors to subscribe to.
   * @returns {string|false} - A unique subscriber ID if the subscription is successful, false otherwise.
   */
  subscribe(emitFunction, sensorIds) {
    try {
      const hasEmitFunction = typeof emitFunction === "function";
      const isSensorIdsArray = Array.isArray(sensorIds);
      const validSensorId =
        isSensorIdsArray &&
        sensorIds.length &&
        sensorIds.every(
          (sensorId) => Number.isInteger(sensorId) && this.sensorIds.includes(sensorId) && sensorId !== 0
        );

      if (!hasEmitFunction || !validSensorId) {
        // console.log(`DATA_MANAGER-subscribe-INVALID-sensorIds_${sensorIds}`);
        return false;
      }

      const subscriberId = uuidv4();
      const subscription = this.emitter.addListener(subscriberId, emitFunction);

      this.subscribers[subscriberId] = {
        sensorIds: sensorIds,
        subscription: subscription,
      };

      // console.log(`DATA_MANAGER-subscribe-subscriberId_${subscriberId}-sensorIds_${sensorIds}`);

      return subscriberId;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  subscribeTimer(emitFunction, stopTime) {
    try {
      const hasEmitFunction = typeof emitFunction === "function";

      if (!hasEmitFunction) {
        // console.log("DATA_MANAGER-subscribeTimer-INVALID-emitFunction");
        return false;
      }

      const subscriberTimerId = "TIMER_SUBSCRIBER";
      const subscription = this.emitter.addListener(subscriberTimerId, emitFunction);

      this.timerSubscriber = {
        subscriberTimerId: subscriberTimerId,
        stopTime: stopTime,
        subscription: subscription,
      };
      // console.log(`DATA_MANAGER-subscribeTimer-subscriberTimerId_${subscriberTimerId}-stopTime_${stopTime}`);

      return subscriberTimerId;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  unsubscribeTimer() {
    try {
      if (this.timerSubscriber && this.timerSubscriber.subscription) {
        this.timerSubscriber.subscription.remove();
        // console.log(`DATA_MANAGER-unsubscribeTimer-ID_${this.timerSubscriber.subscriberTimerId}`);
        this.timerSubscriber = {};
        return true;
      } else {
        // console.log("DATA_MANAGER-unsubscribeTimer-ID_NOT_FOUND");
        return false;
      }
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
      if (subscriberId && subscriberId in this.subscribers) {
        this.subscribers[subscriberId].subscription.remove();
        delete this.subscribers[subscriberId];
        // console.log(`DATA_MANAGER-unsubscribe-ID_${subscriberId}`);
        return true;
      } else {
        // console.log(`DATA_MANAGER-unsubscribe-NOT_EXIST_${subscriberId}`);
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
   * Sets the frequency at which data is collected.
   * @param {number} frequency - The frequency at which data is collected.
   * @returns {boolean} - Returns true if the frequency is valid and was successfully set.
   */
  setCollectingDataFrequency(frequency) {
    const isValidFrequency = FREQUENCIES.includes(frequency) || frequency === 0;

    if (!isValidFrequency) {
      console.error(`DATA_MANAGER-setCollectingDataFrequency-INVALID_${frequency}`);
      return false;
    }

    if (frequency === SAMPLING_MANUAL_FREQUENCY) {
      this.samplingMode = SAMPLING_MANUAL;
      this.collectingDataInterval = (1 / EMIT_DATA_MANUAL_FREQUENCY) * 1000;
      // console.log(`DATA_MANAGER-setCollectingDataFrequency-FREQUENCY_${EMIT_DATA_MANUAL_FREQUENCY}Hz-INTERVAL_${this.collectingDataInterval}-SAMPLING_MODE.`);
    } else {
      this.collectingDataInterval = (1 / frequency) * 1000;
      this.samplingMode = SAMPLING_AUTO;
      // console.log(`DATA_MANAGER-setCollectingDataFrequency-FREQUENCY_${frequency}Hz-INTERVAL_${this.collectingDataInterval}-AUTO_SAMPLING_MODE`);
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
   * @returns {string} - Returns the curDataRunId.
   */
  startCollectingData() {
    this.collectingDataTime = 0;
    this.timerCollectingTime = 0;
    this.isCollectingData = true;
    const dataRunId = this.createDataRun(null);
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
   * @returns {string} The ID of the newly created data run.
   */
  createDataRun(name) {
    /**
     * A dictionary of data runs, where each key is a data run ID and the value is a `DataRun` object.
     * @typedef {Object.<string, DataRun>} DataRuns
     */

    /**
     * @typedef {Object} DataRun
     * @property {string} name - The name of the data run.
     * @property {Array} data - An array of sensor data collected during the data run.
     */
    const dataRunName = name || `Run ${Object.keys(this.dataRuns).length + 1}`;
    this.curDataRunId = uuidv4();
    this.dataRuns[this.curDataRunId] = {
      name: dataRunName,
      data: [],
      interval: this.collectingDataInterval,
    };
    // console.log(`DATA_MANAGER-createDataRun-${this.curDataRunId}`);
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
      // console.log(`updateDataRun: dataRunId ${dataRunId} does not exist`);
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
      // console.log(`deleteDataRun: dataRunId ${dataRunId} does not exist`);
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
      // console.log(`appendDataRun: dataRunId ${dataRunId} does not exist`);
      return;
    }

    dataRun.data.push(sensorsData);
  }

  /**
   * Returns an array of data run IDs and names associated with a given activity.
   * @returns {Array.<{id: string, name: string}>} An array of objects containing the data run ID and name.
   */
  getActivityDataRunPreview() {
    const dataRunInfos = Object.keys(this.dataRuns).map((dataRunId) => {
      const dataRun = this.dataRuns[dataRunId];
      return { id: dataRunId, name: dataRun.name };
    });
    return dataRunInfos;
  }

  /**
   * Returns an array of data runs associated with a given activity, each containing the data run ID, name, and data.
   * @returns {Array.<{id: string, name: string, data: Array}>} An array of objects containing the data run ID, name, and data.
   */
  getActivityDataRun() {
    const dataRunInfos = Object.keys(this.dataRuns).map((dataRunId) => {
      const dataRun = this.dataRuns[dataRunId];
      return { id: dataRunId, name: dataRun.name, data: dataRun.data, interval: dataRun.interval };
    });
    return dataRunInfos;
  }

  /**
   * Import and store data runs of an activity in the data manager.
   * @param {Array<Object>} dataRuns - The data runs of the activity.
   * Each data run object has the following properties:
   *   @param {string} id - The ID of the data run.
   *   @param {string} name - The name of the data run.
   *   @param {Array<Array<number>>} data - The data of the data run, where each inner array contains
   *     data points for a specific timestamp and sensor ID, in the following format:
   *     [[timestamp_1, sensor_1_value, sensor_2_value, ...], [timestamp_2, sensor_1_value, sensor_2_value, ...], ...].
   */
  importActivityDataRun(dataRuns) {
    for (const dataRun of dataRuns) {
      this.dataRuns[dataRun.id] = {
        name: dataRun.name,
        data: dataRun.data,
        interval: dataRun.interval,
      };

      // console.log(`DATA_MANAGER-importActivityDataRun-dataRunId_${dataRun.id}`);
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
          const parsedSensorId = parseInt(sensorId);
          if (parsedSensorId === 0) return false;
          return {
            time: sample[0][0],
            sensorId: parsedSensorId,
            values: sample[parsedSensorId],
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
      // console.log(`DATA_MANAGER-setCurrentDataRun-${dataRunId}`);
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
  exportDataRunExcel() {
    const recordedSensors = new Set();
    const invertedSensorsInfo = {};
    const headers = [];
    let currentIndex = 0;

    const dataRunsInfo = Object.keys(this.dataRuns).map((id) => ({
      id: id,
      sheetRows: [],
      sheetName: this.dataRuns[id].name,
    }));

    // Get all sensor IDs in all data runs and find max record time
    for (const dataRun of Object.values(this.dataRuns)) {
      for (const sample of dataRun.data) {
        Object.keys(sample).forEach((sensorId) => {
          recordedSensors.add(sensorId);
        });
      }
    }

    // Create Row Names with all sensor that had been recorded
    for (const sensorId of recordedSensors) {
      const sensorInfo = sensors[sensorId];
      const subSensorIds = Object.keys(sensorInfo.data);
      invertedSensorsInfo[sensorId] = {
        name: sensorInfo.name,
        sensorIndexInRow: currentIndex,
        numSubSensor: subSensorIds.length,
      };
      currentIndex += subSensorIds.length;

      if (sensorId === TIME_STAMP_ID) {
        headers.push(`${sensorInfo.data[0].name} (${sensorInfo.data[0].unit})`);
        continue;
      }
      for (const subSensorId of subSensorIds) {
        headers.push(`${sensorInfo.data[subSensorId].name} (${sensorInfo.data[subSensorId].unit})`);
      }
    }

    dataRunsInfo.forEach((dataRunInfo) => {
      const dataRunData = this.dataRuns[dataRunInfo.id].data;
      dataRunInfo.sheetRows.push(headers);

      dataRunData.forEach((sample) => {
        const row = new Array(headers.length).fill("");
        Object.keys(sample).forEach((sensorId) => {
          const invertedSensor = invertedSensorsInfo[sensorId];
          const sensorData = sample[sensorId];

          if (sensorId === TIME_STAMP_ID) {
            const parsedTimeStamp = (sensorData / 1000).toFixed(3);
            row[invertedSensor.sensorIndexInRow] = parsedTimeStamp;
            return;
          }
          for (let i = 0; i < invertedSensor.numSubSensor; i++) {
            row[invertedSensor.sensorIndexInRow + i] = sensorData[i];
          }
        });
        dataRunInfo.sheetRows.push(row);
      });
    });

    exportDataRunsToExcel(null, "ReportDataRun", dataRunsInfo);
  }

  // -------------------------------- Read sensor data -------------------------------- //

  /**
   * Callback function called in DeviceManager when there is data available
   * @param {string} sensorsData - The format sensor data (@, id, data1, data2, data3, data 4, *).
   * @returns {void} - No return.
   */
  callbackReadSensor(data) {
    try {
      const sensorId = data[0];
      const dataLength = data[2];
      const sensorsData = [];
      for (let i = 0; i < dataLength; i++) {
        sensorsData.push(data[NUM_NON_DATA_SENSORS_CALLBACK + i]);
      }
      this.buffer[parseInt(sensorId)] = sensorsData;
    } catch (e) {
      console.error(`callbackReadSensor: ${e.message}`);
    }
  }

  /**
   * Callback function called in DeviceManager when a sensor is disconnected
   * @param {string} sensorsData - Last data received from sensor to identify which one
   * @returns {void} - No return.
   */
  callbackSensorDisconnected(data) {
    try {
      const sensorId = data[0];
      delete this.buffer[parseInt(sensorId)];
    } catch (e) {
      console.error(`callbackSensorDisconnected: ${e.message}`);
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
  getManualSample(sensorId, sensorIndex, isAppend = true) {
    const dataRunId = this.curDataRunId;
    const parsedTime = this.getParsedCollectingDataTime();
    isAppend && this.appendDataRun(dataRunId, { ...this.buffer, 0: [parsedTime] });
    return isAppend ? this.buffer[sensorId][sensorIndex] : { ...this.buffer };
  }

  updateDataRunDataAtIndex(selectedIndex, curBuffer) {
    const newDataRunData = this.dataRuns[this.curDataRunId].data.map((data, index) => {
      if (index === selectedIndex) {
        return { ...curBuffer, 0: data[0] };
      } else {
        return data;
      }
    });
    this.dataRuns[this.curDataRunId].data = [...newDataRunData];
  }

  // -------------------------------- COLLECTING_DATA_TIME -------------------------------- //
  getParsedCollectingDataTime() {
    const parsedTime = (this.collectingDataTime / 1000).toFixed(3);
    return parsedTime;
  }

  getTimerCollectingTime() {
    return this.timerCollectingTime;
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
              const parsedTime = this.getParsedCollectingDataTime();
              this.appendDataRun(this.curDataRunId, { ...this.buffer, 0: [parsedTime] });
            }

            // Update total time collecting data
            this.collectingDataTime += this.collectingDataInterval;
          }
        }

        if (curInterval % TIMER_INTERVAL === 0) {
          this.timerCollectingTime += TIMER_INTERVAL;
          if (this.timerCollectingTime > this.timerSubscriber.stopTime) {
            this.emitter.emit(this.timerSubscriber.subscriberTimerId);
            this.unsubscribeTimer();
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
     * @property {number} 2 - The ID of the sensor.
     * @property {Array} 3 - An array of sensor data values.
     */

    for (const subscriberId in this.subscribers) {
      const subscriber = this.subscribers[subscriberId];
      if (!subscriber.subscription.subscriber) {
        delete this.subscribers[subscriberId];
        // console.log(`emitSubscribersScheduler: Remove subscriberId_${subscriberId}`);
        continue;
      }

      const dataRunId = this.isCollectingData ? this.curDataRunId || -1 : -1;
      const parsedTime = this.isCollectingData ? this.getParsedCollectingDataTime() : "0.000";

      const emittedDatas = subscriber.sensorIds.map((sensorId) => {
        const sensorData = this.buffer[sensorId] || [];
        return [dataRunId, parsedTime, sensorId, ...sensorData];
      });
      // Notify subscriber
      this.emitter.emit(subscriberId, emittedDatas);
    }
  }

  // TODO: stop EmitSubscribersScheduler when object is destroyed. Otherwise leading to leak memory
  stopEmitSubscribersScheduler() {
    clearInterval(this.emitSubscribersIntervalId);
  }

  dummySensorData() {
    setInterval(() => {
      const sensorId = (Math.random() * (2 - 1) + 1).toFixed(0);
      const sensorSerialId = 0;

      const sensorInfo = sensors.find((sensor) => Number(sensorId) === Number(sensor.id));
      const dummyData = [sensorId, sensorSerialId, sensorInfo.data.length];
      for (const numData in sensorInfo.data) {
        const dataInfo = sensorInfo.data[numData];
        const data = (Math.random() * (dataInfo.max - dataInfo.min) + dataInfo.min).toFixed(2);
        dummyData.push(data);
      }

      this.callbackReadSensor(dummyData);
    }, 1000);
  }
}

export default DataManager.getInstance();
