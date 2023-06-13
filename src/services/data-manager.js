import { v4 as uuidv4 } from "uuid";
import { exportDataRunsToExcel, getCurrentTime } from "./../utils/core";
import { EventEmitter } from "fbemitter";
import SensorServices from "./sensor-service";
import {
  FREQUENCIES,
  SAMPLING_MANUAL_FREQUENCY,
  EMIT_DATA_MANUAL_FREQUENCY,
  SAMPLING_AUTO,
  SAMPLING_MANUAL,
  BLE_TYPE,
  USB_TYPE,
  SAMPLING_INTERVAL_LESS_1HZ,
  RETURN_DICT_OPTION,
  RETURN_LIST_OPTION,
} from "../js/constants";
import { FIRST_COLUMN_DEFAULT_OPT } from "../utils/widget-table-chart/commons";

const TIME_STAMP_ID = 0;
const NUM_NON_DATA_SENSORS_CALLBACK = 5;

// TODO: Fix when collecting data with timer, if any happen like manual sampling,
// change frequency or start/stop collecting data. Stop timer

/**
 * Class representing a data manager that stores and manages data runs and subscriptions.
 */
export class DataManager {
  constructor() {
    // Initialize variables
    this.initializeVariables();

    // calls two scheduler functions
    // this.runEmitSubscribersScheduler();
    // this.dummySensorData();
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
    this.selectedInterval = 1000;

    this.samplingMode = SAMPLING_AUTO;
    this.sensorIds = SensorServices.getSensors().map((sensor) => sensor.id);

    // Parameters for Timer
    this.timerCollectingTime = 0;
    this.timerSubscriber = {};

    this.uartConnections = new Set();
    this.sensorsQueue = [];

    this.customUnits = [];
    this.customUnitDatas = {};
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
      const timer = stopTime * 1000;
      if (!hasEmitFunction) {
        // console.log("DATA_MANAGER-subscribeTimer-INVALID-emitFunction");
        return false;
      }

      const subscriberTimerId = "TIMER_SUBSCRIBER";
      const subscription = this.emitter.addListener(subscriberTimerId, emitFunction);

      this.timerSubscriber = {
        subscriberTimerId: subscriberTimerId,
        stopTime: timer,
        subscription: subscription,
      };
      // console.log(`DATA_MANAGER-subscribeTimer-subscriberTimerId_${subscriberTimerId}-stopTime_${timer}`);

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
      // For the frequency greater than 1, we set collectingDataInterval = selectedInterval.
      // However, when the frequency < 1, the timer will be stop until the next sampling interval
      // For this reason, we set collectingDataInterval = 1000ms for the timer to count the sampling interval
      // and the selectedInterval used to tracking when we sampled the data
      if (frequency >= 1) {
        this.selectedInterval = Number(((1 / frequency) * 1000).toFixed(0));
        this.collectingDataInterval = this.selectedInterval;
      } else {
        this.selectedInterval = Number((1 / frequency).toFixed(0) * 1000);
        this.collectingDataInterval = SAMPLING_INTERVAL_LESS_1HZ;
      }
      this.samplingMode = SAMPLING_AUTO;
      console.log(
        `DATA_MANAGER-setCollectingDataFrequency-FREQUENCY_${frequency}Hz-INTERVAL_${this.collectingDataInterval}-AUTO_SAMPLING_MODE`
      );
    }

    // Clear and create new job according to new frequency
    this.stopEmitSubscribersScheduler();
    this.runEmitSubscribersScheduler();

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
  startCollectingData({ unitId }) {
    this.collectingDataTime = 0;
    this.timerCollectingTime = 0;
    this.isCollectingData = true;
    // Clear custom axis datas
    this.clearCustomUnitDatas({ unitId });
    const dataRunId = this.createDataRun(null);
    this.emitSubscribersScheduler();
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
    // Find the max dataRun Name
    const maxDataRunNum = Object.values(this.dataRuns).reduce((maxValue, dataRun) => {
      const dataRunNameSplitted = dataRun.name.split(" ");
      const value = Number(dataRunNameSplitted?.[1]);
      return !Number.isNaN(value) && Math.max(maxValue, value);
    }, 0);

    const dataRunName = name || `Lần ${maxDataRunNum + 1}`;
    const createdAt = getCurrentTime();
    this.curDataRunId = uuidv4();
    this.dataRuns[this.curDataRunId] = {
      name: dataRunName,
      createdAt: createdAt,
      data: {},
      interval: this.collectingDataInterval,
    };
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
      // console.log(`DATA_MANAGER-updateDataRun: dataRunId ${dataRunId} does not exist`);
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
    const dataRun = this.dataRuns[dataRunId];
    if (!dataRun) {
      // console.log(`DATA_MANAGER-deleteDataRun: dataRunId ${dataRunId} does not exist`);
      return false;
    }

    // find the index of dataRunId in dataRuns
    const listDataRunIds = Object.keys(this.dataRuns);
    const index = listDataRunIds.indexOf(dataRunId);
    listDataRunIds.splice(index, 1);

    let newCurrentDataRunId;
    if (index < listDataRunIds.length) {
      newCurrentDataRunId = listDataRunIds[index];
    } else if (index > 0) {
      newCurrentDataRunId = listDataRunIds[index - 1];
    } else {
      newCurrentDataRunId = null;
    }

    this.curDataRunId = newCurrentDataRunId;
    delete this.dataRuns[dataRunId];
    return true;
  }

  getCurrentDataRunId() {
    return this.curDataRunId;
  }

  isDataRunIdExist(dataRunId) {
    return Object.keys(this.dataRuns).hasOwnProperty(dataRunId);
  }

  /**
   * Appends sensor data to a data run.
   * @param {string} dataRunId - The ID of the data run to append data to.
   * @param {object} sensorsData - An object containing the data from all sensors.
   */
  appendDataRun(dataRunId, parsedTime, curBuffer) {
    const dataRun = this.dataRuns[dataRunId];
    if (!dataRun) {
      // console.log(`DATA_MANAGER-appendDataRun: dataRunId ${dataRunId} does not exist`);
      return false;
    }
    const dataRunData = dataRun.data;

    Object.keys(curBuffer).forEach((sensorId) => {
      const sensorData = {
        time: parsedTime,
        values: curBuffer[sensorId],
      };
      if (Object.keys(dataRunData).includes(sensorId)) {
        dataRunData[sensorId].push(sensorData);
      } else {
        dataRunData[sensorId] = [sensorData];
      }
    });
  }

  /**
   * Returns an array of data run IDs and names associated with a given activity.
   * @returns {Array.<{id: string, name: string}>} An array of objects containing the data run ID and name.
   */
  getActivityDataRunPreview() {
    const dataRunInfos = Object.keys(this.dataRuns).map((dataRunId) => {
      const dataRun = this.dataRuns[dataRunId];
      return { id: dataRunId, name: dataRun.name, createdAt: dataRun.createdAt };
    });
    return dataRunInfos;
  }

  addSoundDataDataRun(sensorId, sensorData, dataRunId) {
    const dataRun = this.dataRuns[dataRunId];
    if (!dataRun) {
      // console.log(`DATA_MANAGER-addSensorDataDataRun: dataRunId ${dataRunId} does not exist`);
      return false;
    }

    const dataRunData = dataRun.data;
    dataRunData[sensorId] = [sensorData];
  }

  getSoundDataDataRun(sensorId, dataRunId) {
    const dataRun = this.dataRuns[dataRunId];
    if (!dataRun) {
      // console.log(`DATA_MANAGER-addSensorDataDataRun: dataRunId ${dataRunId} does not exist`);
      return false;
    }
    return dataRun.data[sensorId];
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
        createdAt: dataRun.createdAt,
      };

      // console.log(`DATA_MANAGER-importActivityDataRun-dataRunId_${dataRun.id}`);
    }
  }

  /**
   * Returns an array of data runs associated with a given activity, each containing the data run ID, name, and data.
   * @returns {Array.<{id: string, name: string, data: Array}>} An array of objects containing the data run ID, name, and data.
   */
  exportActivityDataRun() {
    const dataRunInfos = Object.keys(this.dataRuns).map((dataRunId) => {
      const dataRun = this.dataRuns[dataRunId];
      return {
        id: dataRunId,
        name: dataRun.name,
        data: dataRun.data,
        interval: dataRun.interval,
        createdAt: dataRun.createdAt,
      };
    });
    return dataRunInfos;
  }

  getWidgetDatasRunData(currentDataRunId, sensorIds) {
    const dataRun = this.dataRuns[currentDataRunId];
    if (!dataRun) {
      // console.log(`DATA_MANAGER-getWidgetDatasRunData: dataRunId ${currentDataRunId} does not exist`);
      return [];
    }

    const widgetDatas = [];
    for (const sensorId of sensorIds) {
      const sensorData = dataRun.data[parseInt(sensorId)];
      widgetDatas.push(sensorData ? [...sensorData] : []);
    }

    return widgetDatas;
  }

  setCurrentDataRun(dataRunId) {
    if (this.dataRuns.hasOwnProperty(dataRunId)) {
      this.curDataRunId = dataRunId;
      return true;
    }
    return false;
  }

  /**
   * Retrieves data from a data run.
   * @param {Object} options - Options object.
   * @param {string} options.dataRunId - The ID of the data run.
   * @param {number} [options.sensorId] - The ID of the sensor.
   * @param {number} [options.sensorIndex] - The index of the sensor value.
   * @returns {boolean|{time: time, values: [value1, value2, ...]}[]|number[]} - The retrieved data or false if not found.
   */
  getDataRunData({ dataRunId, sensorId, sensorIndex }) {
    const dataRun = this.dataRuns[dataRunId];
    if (!dataRun || !dataRun.data) {
      // console.log(`DATA_MANAGER-getDataRun: dataRunId ${dataRunId} does not exist`);
      return false;
    }

    if (sensorId !== undefined) {
      const dataRunWithSensorId = dataRun.data[parseInt(sensorId)];
      if (!dataRunWithSensorId || !Array.isArray(dataRunWithSensorId)) return false;

      if (sensorIndex !== undefined) {
        const dataRunWithSensorIndex = [];
        for (const dataPoint of dataRunWithSensorId) {
          const sensorValue = dataPoint.values?.[parseInt(sensorIndex)];
          sensorValue && dataRunWithSensorIndex.push(parseFloat(sensorValue));
        }

        return dataRunWithSensorIndex;
      } else {
        return dataRunWithSensorId;
      }
    } else {
      return (dataRun.data ??= []);
    }
  }

  addCustomSensor(sensorId) {
    const sensorsData = [];
    this.buffer[parseInt(sensorId)] = sensorsData;
  }

  getUartConnections() {
    return this.uartConnections;
  }

  // -------------------------------- Export -------------------------------- //
  /** Export the current data run to a CSV file.
   * @function
   * @name exportCSVDataRun
   * @memberof ClassName
   * @returns {void}
   */
  exportDataRunExcel() {
    const dataRunsInfo = Object.entries(this.dataRuns).map(([id, { interval, name }]) => ({
      id,
      interval,
      maxTimeStamp: 0,
      headers: [],
      sheetRows: [],
      sheetName: name,
      recordedSensors: new Set([TIME_STAMP_ID]),
      invertedSensorsInfo: {},
    }));

    for (const dataRunInfo of dataRunsInfo) {
      let currentIndex = 0;
      const dataRunData = this.dataRuns[dataRunInfo.id].data;

      // Collect all sensor IDs and find max record time for each data run
      for (const [sensorId, sensorData] of Object.entries(dataRunData)) {
        dataRunInfo.recordedSensors.add(sensorId);

        const lastSensorData = sensorData[sensorData.length - 1];
        const lastSensorDataTime = lastSensorData.time && parseInt(parseFloat(lastSensorData.time) * 1000);
        dataRunInfo.maxTimeStamp = Math.max(dataRunInfo.maxTimeStamp, lastSensorDataTime || 0);
      }

      // Create Row Names with all sensor that had been recorded
      const sensors = SensorServices.getAllSensors();
      for (const sensorId of dataRunInfo.recordedSensors) {
        const sensorInfo = sensors.find((sensor) => sensor.id === parseInt(sensorId));
        if (!sensorInfo) continue;
        const subSensorIds = Object.keys(sensorInfo.data);
        dataRunInfo.invertedSensorsInfo[sensorId] = {
          name: sensorInfo.name,
          sensorIndexInRow: currentIndex,
          numSubSensor: subSensorIds.length,
        };
        currentIndex += subSensorIds.length;

        if (sensorId === TIME_STAMP_ID) {
          dataRunInfo.headers.push(`${sensorInfo.data[0].name} (${sensorInfo.data[0].unit})`);
          continue;
        }
        for (const subSensorId of subSensorIds) {
          dataRunInfo.headers.push(`${sensorInfo.data[subSensorId].name} (${sensorInfo.data[subSensorId].unit})`);
        }
      }
    }

    dataRunsInfo.forEach((dataRunInfo) => {
      const { headers, interval: stepInterval, maxTimeStamp, recordedSensors, invertedSensorsInfo, id } = dataRunInfo;
      // dataRunData: {sensorId: [sensorData]}
      const dataRunData = this.dataRuns[id].data;
      const sheetRows = [headers];
      const sensorDataIndices = {};
      recordedSensors.forEach((sensorId) => {
        sensorDataIndices[sensorId] = 0;
      });

      for (let timeStamp = 0; timeStamp <= maxTimeStamp; timeStamp += stepInterval) {
        // Create default rows, Assign timeStamp for each row
        let hasData = false;
        const row = new Array(headers.length).fill("");
        row[TIME_STAMP_ID] = (timeStamp / 1000).toFixed(3);

        for (const sensorId of recordedSensors) {
          const invertedSensor = invertedSensorsInfo[sensorId];
          const sensorDataIndex = sensorDataIndices[sensorId];

          if (sensorId === TIME_STAMP_ID || !dataRunData[sensorId] || sensorDataIndex >= dataRunData[sensorId].length) {
            continue;
          }

          const sensorData = dataRunData[sensorId][sensorDataIndex];
          const sensorDataTime = parseInt(parseFloat(sensorData.time) * 1000);

          if (sensorDataTime === timeStamp) {
            sensorDataIndices[sensorId] = sensorDataIndex + 1;
            hasData = true;
            for (let i = 0; i < invertedSensor.numSubSensor; i++) {
              row[invertedSensor.sensorIndexInRow + i] = parseFloat(sensorData.values[i]);
            }
          }
        }
        if (hasData) {
          sheetRows.push([...row]);
        }
      }
      dataRunInfo.sheetRows = sheetRows;
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
      const sensorId = parseInt(data[0]);
      const battery = data[1];
      const source = data[2];
      const deviceId = data[3];
      const dataLength = data[4];
      const sensorsData = [];
      const sensorInfo = SensorServices.getSensorInfo(sensorId);
      if (sensorInfo === null) return;

      for (let i = 0; i < dataLength; i++) {
        let formatFloatingPoint = sensorInfo.data[i]?.formatFloatingPoint;
        formatFloatingPoint = formatFloatingPoint ??= 1;
        sensorsData.push(parseFloat(data[NUM_NON_DATA_SENSORS_CALLBACK + i]).toFixed(formatFloatingPoint));
      }

      this.buffer[sensorId] = sensorsData;

      // Add the sensor to sensorsQueue if not exist, otherwise update battery
      const activeSensorsIds = this.getActiveSensorIds();
      if (!activeSensorsIds.includes(sensorId)) {
        this.sensorsQueue.push({
          sensorId: sensorId,
          deviceId: deviceId,
          batteryStatus: parseInt(battery),
        });
      } else {
        const index = this.sensorsQueue.findIndex((element) => element.sensorId === sensorId);
        if (index !== -1) this.sensorsQueue[index].batteryStatus = parseInt(battery);
      }

      if (source !== BLE_TYPE) {
        this.uartConnections.add(sensorId);
      }
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
      const sensorId = parseInt(data[0]);
      const source = data[1];

      if (source === BLE_TYPE) {
        if (this.uartConnections.has(sensorId)) return;
      } else {
        this.uartConnections.delete(sensorId);
      }

      delete this.buffer[sensorId];
      const index = this.sensorsQueue.findIndex((element) => element.sensorId === sensorId);
      if (index !== -1) {
        this.sensorsQueue.splice(index, 1);
      }
    } catch (e) {
      console.error(`callbackSensorDisconnected: ${e.message}`);
    }
  }

  getListActiveSensor() {
    const activeSensors = Object.keys(this.buffer).map((sensorId) => parseInt(sensorId));
    return activeSensors;
  }

  /**
   * Get the data for a specific data run.
   * @param {string} dataRunId - The ID of the data run to retrieve.
   * @returns {(Array|boolean)} The data for the specified data run or false if the data run doesn't exist.
   */
  appendManualSample(sensorIds, sensorValues) {
    const curBuffer = { ...this.buffer };
    const parsedTime = this.getParsedCollectingDataTime();

    if (Array.isArray(sensorIds)) {
      sensorIds.forEach((sensorId, i) => {
        const sensorValue = sensorValues[i].values;

        if (curBuffer.hasOwnProperty(sensorId) && sensorValue !== {}) {
          curBuffer[sensorId] = sensorValue;
        }
      });
    }

    this.appendDataRun(this.curDataRunId, parsedTime, curBuffer);
    return { ...this.buffer };
  }

  updateDataRunDataAtIndex(selectedIndex, sensorIds, sensorValues) {
    const dataRunData = this.dataRuns[this.curDataRunId]?.data;

    sensorIds.forEach((sensorId, i) => {
      const sensorValue = sensorValues[i].values;
      if (dataRunData[sensorId] && dataRunData[sensorId][selectedIndex] && sensorValue !== {}) {
        dataRunData[sensorId][selectedIndex].values = sensorValue;
      }
    });
  }

  /**
   * Get data for a specific sensor from the buffer.
   *
   * @param {string} sensorId - The ID of the sensor to get data for.
   * @param {number=} sensorIndex - The index of the data to get (if the data is an array).
   * @returns {any} - The sensor data or the specified data item (if the data is an array).
   */
  getDataSensor(sensorId, sensorIndex) {
    const sensorData = this.buffer[sensorId];
    return Array.isArray(sensorData) && sensorIndex !== undefined ? sensorData[sensorIndex] : sensorData;
  }

  getBuffer() {
    return this.buffer;
  }

  getDataBuffer(sensorId) {
    return this.buffer[sensorId];
  }

  getBatteryStatus() {
    const batteryStatusDict = {};
    this.sensorsQueue.forEach((element) => {
      const { sensorId, batteryStatus } = element;
      batteryStatusDict[sensorId] = batteryStatus;
    });
    return batteryStatusDict;
  }

  getActiveSensorIds() {
    const activesSensorIds = [];
    this.sensorsQueue.forEach((element) => {
      activesSensorIds.push(element.sensorId);
    });
    return activesSensorIds;
  }

  removeWirelessSensor(sensorId) {
    try {
      delete this.buffer[parseInt(sensorId)];
    } catch (e) {
      console.error(`callbackSensorDisconnected: ${e.message}`);
    }
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
  emitSubscribersScheduler = () => {
    try {
      const curBuffer = { ...this.buffer };
      const parsedTime = this.getParsedCollectingDataTime();

      // Emit all subscribers
      this.emitSubscribers(parsedTime, curBuffer);

      // Append data to data run and increment collecting data time
      if (this.isCollectingData) {
        // Set this.collectingDataTime % this.selectedInterval === 0 for case frequency < 1Hz
        if (this.samplingMode === SAMPLING_AUTO && this.collectingDataTime % this.selectedInterval === 0) {
          this.appendDataRun(this.curDataRunId, parsedTime, curBuffer);
        }

        // Update total time collecting data
        this.collectingDataTime += this.collectingDataInterval;
      }

      // Increment timer collecting time and stop if it reaches the stop time
      this.timerCollectingTime += this.collectingDataInterval;
      if (this.timerCollectingTime > this.timerSubscriber.stopTime) {
        this.emitter.emit(this.timerSubscriber.subscriberTimerId);
        this.unsubscribeTimer();
      }
    } catch (error) {
      const schedulerError = new Error(`runEmitSubscribersScheduler: ${error.message}`);
      console.error(schedulerError);
    }
  };

  runEmitSubscribersScheduler() {
    this.emitSubscribersIntervalId = setInterval(this.emitSubscribersScheduler, this.collectingDataInterval);
    // console.log(`DATA_MANAGER-runEmitSubscribersScheduler-${this.emitSubscribersIntervalId}-${this.collectingDataInterval}`);
  }

  stopEmitSubscribersScheduler() {
    // console.log(`DATA_MANAGER-stopEmitSubscribersScheduler-${this.emitSubscribersIntervalId}`);
    clearInterval(this.emitSubscribersIntervalId);
  }

  /**
   * Emit data to all subscribers.
   */
  emitSubscribers(parsedTime, curBuffer) {
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
      const time = this.isCollectingData ? parsedTime : "0.000";

      const emittedDatas = subscriber.sensorIds.reduce((acc, sensorId) => {
        const sensorData = curBuffer[sensorId] || [];
        acc[sensorId] = [dataRunId, time, sensorId, ...sensorData];
        return acc;
      }, {});

      // Notify subscriber
      this.emitter.emit(subscriberId, emittedDatas);
    }
  }

  dummySensorData() {
    setInterval(() => {
      const sensorId = (Math.random() * (5 - 2) + 2).toFixed(0);
      const battery = (Math.random() * (100 - 10) + 10).toFixed(0);

      const sensorInfo = SensorServices.getSensors().find((sensor) => Number(sensorId) === Number(sensor.id));
      const dummyData = [sensorId, battery, USB_TYPE, "DUMMY", sensorInfo.data.length];
      for (const numData in sensorInfo.data) {
        const dataInfo = sensorInfo.data[numData];
        const data = (Math.random() * (dataInfo.max - dataInfo.min) + dataInfo.min).toFixed(2);
        dummyData.push(data);
      }

      this.callbackReadSensor(dummyData);
    }, 1000);
  }

  dataRunsSize() {
    return Object.keys(this.dataRuns).length;
  }

  getUsbDevices() {
    return this.sensorsQueue;
  }

  // -------------------------------- CUSTOM MEASUREMENTS -------------------------------- //
  addCustomUnit({ unitName, unit }) {
    const unitId = uuidv4();
    const unitInfo = {
      id: unitId,
      name: unitName,
      unit: unit,
    };
    this.customUnits.push(unitInfo);
    return unitInfo;
  }

  deleteCustomUnit() {}

  getCustomUnits() {
    return this.customUnits;
  }

  getCustomUnitSensorInfos({ unitId }) {
    const customUnitInfo = this.customUnitDatas[unitId];
    if (!customUnitInfo) {
      return [];
    }

    return customUnitInfo.sensorIds.map((sensorId) => {
      return parseInt(sensorId);
    });
  }

  getChartCustomUnitDatas({ unitId, sensorIds, returnOption = RETURN_DICT_OPTION }) {
    let result;
    if (returnOption === RETURN_DICT_OPTION) {
      result = {};
    } else if (returnOption === RETURN_LIST_OPTION) {
      result = [];
    }

    const customUnitInfo = this.customUnitDatas[unitId];
    if (!customUnitInfo) {
      console.log("DataManagerIST-getChartCustomUnitDatas: customXAxis not found");
      return [];
    }
    const customUnitData = customUnitInfo.data;
    const customUnitDataLabels = customUnitInfo.labels;

    for (const [sensorId, sensorDatas] of Object.entries(customUnitData)) {
      const parsedSensorId = parseInt(sensorId);
      if (!sensorIds || !sensorIds.has(parsedSensorId)) continue;

      if (returnOption === RETURN_LIST_OPTION) {
        result.push({
          sensorId: parsedSensorId,
          data: sensorDatas,
          labels: customUnitDataLabels,
        });
      } else if (returnOption === RETURN_DICT_OPTION) {
        result[parsedSensorId] = {
          data: sensorDatas,
          labels: customUnitDataLabels,
        };
      }
    }
    return result;
  }

  exportCustomUnitDatas() {
    const customXAxisDatas = Object.keys(this.customUnitDatas).map((unitId) => {
      const customXAxis = this.customUnitDatas[unitId];
      return {
        unitId: unitId,
        data: customXAxis.data,
        labels: customXAxis.labels,
        sensorIds: customXAxis.sensorIds,
      };
    });
    return customXAxisDatas;
  }

  importCustomUnitDatas(customXAxisDatas) {
    for (const customXAxisData of customXAxisDatas) {
      this.customUnitDatas[customXAxisData.unitId] = {
        data: customXAxisData.data,
        labels: customXAxisData.labels,
        sensorIds: customXAxisData.sensorIds,
      };
    }
  }

  importCustomUnit(customXAxis) {
    this.customUnits = customXAxis;
  }

  addCustomUnitDatas({ sensorIds, unitId, datas, index, label }) {
    const customXAxis = this.customUnitDatas[unitId] || { sensorIds: sensorIds, data: {}, labels: [] };
    const customXAxisData = customXAxis.data;
    const customXAxisLabels = customXAxis.labels;

    Object.keys(datas).forEach((sensorId) => {
      const values = datas[sensorId];

      if (Object.keys(customXAxisData).includes(sensorId)) {
        if (index !== undefined) {
          customXAxisData[sensorId][index] = values;
        } else {
          customXAxisData[sensorId].push(values);
        }
      } else {
        customXAxisData[sensorId] = [values];
      }
    });

    if (index !== undefined) {
      customXAxisLabels[index] = label;
    } else {
      customXAxisLabels.push(label);
    }

    this.customUnitDatas[unitId] = { ...customXAxis, data: customXAxisData, labels: customXAxisLabels };
    console.log("addCustomUnitDatas", this.customUnitDatas);
  }

  /**
   * Clear all the datas and the sensorIds of user unit
   *
   */
  clearCustomUnitDatas({ unitId }) {
    if ([FIRST_COLUMN_DEFAULT_OPT].includes(unitId) || !Object.keys(this.customUnitDatas).includes(unitId)) {
      return;
    }
    this.customUnitDatas[unitId] = { sensorIds: [], data: {} };
  }
}

export default DataManager.getInstance();
