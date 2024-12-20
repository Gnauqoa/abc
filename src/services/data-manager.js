import { v4 as uuidv4 } from "uuid";
import { exportDataRunsToExcel, getCurrentTime, getFromBetween, parseSensorInfo } from "./../utils/core";
import { EventEmitter } from "fbemitter";
import _, { isArray } from "lodash";
import SensorServicesIST, { CURRENT_SENSOR_V2_ID, VOLTAGE_SENSOR_V2_ID, SOUND_SENSOR_V2_ID } from "./sensor-service";
import {
  FREQUENCIES,
  SAMPLING_MANUAL_FREQUENCY,
  EMIT_DATA_MANUAL_FREQUENCY,
  SAMPLING_AUTO,
  SAMPLING_MANUAL,
  BLE_TYPE,
  USB_TYPE,
  SAMPLING_INTERVAL_LESS_1HZ,
  CONDITION,
  READ_BUFFER_INTERVAL,
  RENDER_INTERVAL,
  SENSOR_VERSION,
  NUM_NON_DATA_SENSORS_CALLBACK,
  NUM_NON_DATA_SENSORS_CALLBACK_V2,
  START_BYTE_V1,
  START_BYTE_V2,
  START_BYTE_V2_LOG,
  STOP_BYTE,
  SENSOR_TYPE,
} from "../js/constants";
import { FIRST_COLUMN_DEFAULT_OPT, FIRST_COLUMN_SENSOR_OPT } from "../utils/widget-table-chart/commons";
import buffers, {
  addBufferData,
  getBufferData,
  clearAllBuffersData,
  clearBufferData,
  currentBuffer,
  keepRecentBuffersData,
} from "./buffer-data-manager";

const TIME_STAMP_ID = 0;

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
     * Object containing uncompleted sensor data.
     * @type {Uint8Array}
     */
    this.usb_rx_buffer = null;

    this.usb_rx_data_lenth = 0;

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

    this.delayStartCollectingDataIntervalId = null;

    this.checkingSensorSubscriber = {};
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
     * Boolean indicating if data is waiting start collect data.
     */
    this.isWaitingCollectingData = false;

    /**
     * Boolean indicating if data is need clear data run before start collect data.
     */
    this.isClearDataRun = false;

    /**
     * interval to emit data when in collecting data mode
     * @type {number}
     */
    this.collectingDataInterval = 1000;
    this.delayStartCollectingDataInterval = 1000;
    this.selectedInterval = 1000;

    this.samplingMode = SAMPLING_AUTO;
    this.sensorIds = SensorServicesIST.getSensors().map((sensor) => sensor.id);

    // Parameters for Timer
    this.timerCollectingTime = 0;
    this.timerSubscriber = {};
    this.delayStartCollectingDataTimer = 0;

    this.uartConnections = new Set();
    this.sensorsQueue = [];

    this.customUnits = [];
    // this.customUnitDatas = {};

    this.remoteLoggingBuffer = {
      sensorId: null,
      data: [],
    };

    this.selectedSensorIds = [];
  }

  init() {
    this.stopEmitSubscribersScheduler();
    this.initializeVariables();
    this.runEmitSubscribersScheduler();
    this.renderDataScheduler();
  }

  renderDataScheduler() {
    setInterval(() => {
      const parsedTime = this.getParsedCollectingDataTime();
      const curBuffer = { ...currentBuffer };
      this.emitSubscribers(parsedTime, curBuffer);
    }, RENDER_INTERVAL);
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
      console.log({ hasEmitFunction, stopTime });
      const timer = stopTime * 1000;
      if (!hasEmitFunction) {
        // console.log("DATA_MANAGER-subscribeTimer-INVALID-emitFunction");
        return false;
      }

      const subscriberTimerId = "TIMER_SUBSCRIBER";
      const subscription = this.emitter.addListener(subscriberTimerId, () => {
        this.unsubscribeTimer();
        emitFunction();
      });

      this.timerSubscriber = {
        subscriberTimerId: subscriberTimerId,
        stopTime: timer,
        subscription: subscription,
      };
      console.log(`DATA_MANAGER-subscribeTimer-subscriberTimerId_${subscriberTimerId}-stopTime_${timer}`);

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
        this.selectedInterval = (1 / frequency) * 1000;
        this.collectingDataInterval = this.selectedInterval;
      } else {
        this.selectedInterval = (1 / frequency) * 1000;
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
  startCollectingData({ unitId, unit = "Lần", isWaiting = false }) {
    this.collectingDataTime = 0;
    this.timerCollectingTime = 0;
    this.isCollectingData = true;
    if (isWaiting) this.startWaitingCollectingData();
    // Clear custom axis datas
    // this.clearCustomUnitDatas({ unitId });
    const dataRunId = this.createDataRun(null, unit);
    // this.emitSubscribersScheduler();
    return dataRunId;
  }

  /**
   * Stop collecting data
   */
  stopCollectingData() {
    this.isCollectingData = false;
    this.stopWaitingCollectingData();
    this.stopDelayStartCollectingDataTimer();
    this.stopCheckingSensor();
  }

  startDelayStartCollectingDataTimer(delayTime, callback) {
    const isValidDelay = Number.isInteger(delayTime) && delayTime >= 0;

    if (!isValidDelay) {
      console.error(`DATA_MANAGER-startDelayStartCollectingDataTimer-INVALID_${delayTime}`);
      return false;
    }

    console.log(
      `DATA_MANAGER-startDelayStartCollectingDataTimer-DELAY_TIME_${delayTime}Hz-INTERVAL_${this.delayStartCollectingDataInterval}`
    );

    this.stopDelayStartCollectingDataTimer();
    this.runDelayStartCollectingDataTimer(delayTime, callback);

    return true;
  }

  startWaitingCollectingData() {
    this.isWaitingCollectingData = true;
    this.isClearDataRun = true;
  }

  stopWaitingCollectingData() {
    this.isWaitingCollectingData = false;
  }

  runDelayStartCollectingDataTimer(delayTime, callback) {
    this.delayStartCollectingDataTimer = 0;
    this.delayStartCollectingDataIntervalId = setInterval(() => {
      this.delayStartCollectingDataTimer += this.delayStartCollectingDataInterval;
      if (this.delayStartCollectingDataTimer >= delayTime * 1000) {
        this.stopDelayStartCollectingDataTimer();
        callback();
      }
    }, this.delayStartCollectingDataInterval);
  }

  stopDelayStartCollectingDataTimer() {
    clearInterval(this.delayStartCollectingDataIntervalId);
  }

  handleCheckingSensor(emitData) {
    const { checkingSensorSubscriber, sensorsData, previousSensorsData } = emitData;
    const { sampleCondition, onCheckingSuccess } = checkingSensorSubscriber;

    const currentData = sensorsData.length ? sensorsData[sampleCondition.sensor.index] : null;
    const previousData = previousSensorsData.length ? previousSensorsData[sampleCondition.sensor.index] : null;

    if (!currentData) return;

    if (sampleCondition.condition === CONDITION.GREATER_THAN && currentData >= sampleCondition.conditionValue) {
      return onCheckingSuccess();
    }

    if (sampleCondition.condition === CONDITION.LESS_THAN && currentData <= sampleCondition.conditionValue) {
      return onCheckingSuccess();
    }

    if (!previousData) return;

    if (
      sampleCondition.condition === CONDITION.RISES_ABOVE &&
      previousData < sampleCondition.conditionValue &&
      currentData >= sampleCondition.conditionValue
    ) {
      return onCheckingSuccess();
    }
    if (
      sampleCondition.condition === CONDITION.FALLS_BELOW &&
      previousData > sampleCondition.conditionValue &&
      currentData <= sampleCondition.conditionValue
    ) {
      onCheckingSuccess();
    }
  }

  startCheckingSensor(sampleCondition, onCheckingSuccess) {
    const subscriberId = uuidv4();
    const subscription = this.emitter.addListener(subscriberId, this.handleCheckingSensor);

    this.checkingSensorSubscriber = {
      subscriberId,
      subscription,
      sampleCondition,
      onCheckingSuccess,
      previousSensorsData: [],
    };

    return subscriberId;
  }

  stopCheckingSensor() {
    this.unsubscribe(this.checkingSensorSubscriber.subscriberId);
    this.checkingSensorSubscriber = {};
  }
  // -------------------------------- DATA RUN -------------------------------- //
  /**
   * Creates a new data run and sets it as the current data run.
   *
   * @param {string} [name] - The name of the data run. If not provided, a default name will be used.
   * @returns {string} The ID of the newly created data run.
   */
  createDataRun(name, unit) {
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

    const dataRunName = name || this.createDataRunName(unit);
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

  createDataRunName(unit) {
    const maxDataRunNum = Object.values(this.dataRuns).reduce((maxValue, dataRun) => {
      const value = parseInt(dataRun.name.replace(`${unit} `, ""));
      return !Number.isNaN(value) && Math.max(maxValue, value);
    }, 0);
    return `${unit} ${maxDataRunNum + 1}`;
  }

  /**
   * Add a new remote logging data run.
   * @param {object} dataRun - The data run to add.
   * @returns {string} The ID of the newly added data run.
   */
  addRemoteLoggingDataRun(dataRun) {
    const maxRemoteLoggingDataRunNum = Object.values(this.dataRuns).reduce((maxValue, dataRun) => {
      const value = parseInt(dataRun.name.replace("Remote logging ", ""));
      return !Number.isNaN(value) && Math.max(maxValue, value);
    }, 0);

    dataRun.name = `Remote logging ${maxRemoteLoggingDataRunNum + 1}`;
    dataRun.createdAt = getCurrentTime();
    const dataRunId = uuidv4();
    this.dataRuns[dataRunId] = dataRun;
    return dataRunId;
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
    if (curBuffer) {
      Object.keys(curBuffer).forEach((sensorId) => {
        if (!this.selectedSensorIds.includes(Number(sensorId))) return;

        const sensorData = {
          time: parsedTime,
          values: curBuffer[sensorId],
        };
        if (dataRunData.hasOwnProperty(sensorId)) {
          dataRunData[sensorId].push(sensorData);
        } else {
          dataRunData[sensorId] = [sensorData];
        }
      });
    } else {
      const sampleSize = READ_BUFFER_INTERVAL / this.selectedInterval;
      buffers.keys().forEach((sensorId) => {
        if (!this.selectedSensorIds.includes(Number(sensorId))) return;

        const sensorBuffer = getBufferData(sensorId, sampleSize);

        if (!sensorBuffer) return;

        const sensorDataList = sensorBuffer.map((value, index) => {
          return {
            time: (Number(parsedTime) + (index * this.selectedInterval) / 1000).toFixed(4),
            values: value,
          };
        });

        if (dataRunData.hasOwnProperty(sensorId)) {
          dataRunData[sensorId] = dataRunData[sensorId].concat(sensorDataList);
        } else {
          dataRunData[sensorId] = sensorDataList;
        }
      });
    }
  }

  clearDataRun(dataRunId) {
    const dataRun = this.dataRuns[dataRunId];
    if (!dataRun) {
      // console.log(`DATA_MANAGER-appendDataRun: dataRunId ${dataRunId} does not exist`);
      return false;
    }
    dataRun.data = {};
  }

  replaceDataRun(dataRunId, parsedTime, curBuffer) {
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
      dataRunData[sensorId] = [sensorData];
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

  getSensorsOfDataRun(dataRunId) {
    const result = [];
    const dataRun = this.dataRuns[dataRunId];
    if (!dataRun) {
      // console.log(`DATA_MANAGER-addSensorDataDataRun: dataRunId ${dataRunId} does not exist`);
      return [];
    }

    for (const sensorId of Object.keys(dataRun.data)) {
      const sensor = SensorServicesIST.getSensorInfo(sensorId);
      if (!sensor || !sensor.data?.length) continue;

      result.push({
        sensorId: parseInt(sensorId),
        sensorIndex: sensor.data.length - 1,
      });
    }
    return result;
  }

  addOscDataDataRun(sensorId, sensorData, dataRunId) {
    const dataRun = this.dataRuns[dataRunId];
    if (!dataRun) {
      // console.log(`DATA_MANAGER-addSensorDataDataRun: dataRunId ${dataRunId} does not exist`);
      return false;
    }

    const dataRunData = dataRun.data;
    dataRunData[sensorId] = [sensorData];
  }

  getOscDataDataRun(sensorId, dataRunId) {
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

  getDataRuns() {
    return Object.keys(this.dataRuns).map((value) => ({ id: value, name: this.dataRuns[value].name }));
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

  resetRemoteLoggingBuffer() {
    this.remoteLoggingBuffer = {
      data: [],
      sensorId: null,
    };
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
  exportDataRunExcel({ fileName }) {
    const dataRunsInfo = this.createDataRunInfos();
    exportDataRunsToExcel({ filePath: null, fileName: fileName, dataRunsInfo: dataRunsInfo });
  }

  createDataRunInfos(dataRuns = this.dataRuns) {
    const defaultDataRunInfo = {
      id: 0,
      interval: 1000,
      maxTimeStamp: 0,
      headers: [],
      sheetRows: [],
      sheetName: "Sheet 1",
      recordedSensors: new Set([TIME_STAMP_ID]),
      invertedSensorsInfo: {},
    };

    const dataRunsInfo = Object.entries(dataRuns).map(([id, { interval, name }]) => ({
      id,
      interval,
      maxTimeStamp: 0,
      headers: [],
      sheetRows: [],
      sheetName: name,
      recordedSensors: new Set([TIME_STAMP_ID]),
      invertedSensorsInfo: {},
    }));

    if (dataRunsInfo.length === 0) {
      return [defaultDataRunInfo];
    }

    for (const dataRunInfo of dataRunsInfo) {
      let currentIndex = 0;
      const dataRunData = dataRuns[dataRunInfo.id].data;

      // Collect all sensor IDs and find max record time for each data run
      for (const [sensorId, sensorData] of Object.entries(dataRunData)) {
        dataRunInfo.recordedSensors.add(sensorId);

        const lastSensorData = sensorData[sensorData.length - 1];
        const lastSensorDataTime = lastSensorData.time && parseInt(parseFloat(lastSensorData.time) * 1000);
        dataRunInfo.maxTimeStamp = Math.max(dataRunInfo.maxTimeStamp, lastSensorDataTime || 0);
      }

      // Create Row Names with all sensor that had been recorded
      const sensors = SensorServicesIST.getAllSensors();
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
      const dataRunData = dataRuns[id].data;
      const sheetRows = [headers];
      const sensorDataIndices = {};
      recordedSensors.forEach((sensorId) => {
        sensorDataIndices[sensorId] = 0;
      });

      for (let timeStamp = 0; timeStamp <= maxTimeStamp; timeStamp += stepInterval) {
        // Create default rows, Assign timeStamp for each row
        let hasData = false;
        const row = new Array(headers.length).fill("");
        row[TIME_STAMP_ID] = (timeStamp / 1000).toFixed(4);

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

    return dataRunsInfo;
  }

  /**
   * Util function to combine 2 buffer array
   * @param {Uint8Array} a Array to be combined
   * @param {Uint8Array} b Array to be combined
   *
   */
  concatTypedArrays(a, b) {
    var c = new a.constructor(a.length + b.length + 1);
    c.set(a, 0);
    c.set([STOP_BYTE], a.length);
    c.set(b, a.length + 1);
    return c;
  }

  // -------------------------------- Read sensor data -------------------------------- //

  /**
   * Entry point for all kind of device data
   * @param {string} data Uint8Array data from sensor
   * @param {string} source The connection type. Can be USB_TYPE or BLE_TYPE.
   * @param {object} device - The device object {code, deviceId}, deviceId is sensor ID or USB port path.
   *
   */
  onDataCallback(data, source, device) {
    if (device.code && (device.code.includes("BLE-9909") || device.code.includes("BLE-C600"))) {
      const dataArray = this.decodeDataFromBLE9909Sensor(data, source, device);
      dataArray && this.callbackReadSensor(dataArray);
      return { sensorType: SENSOR_TYPE.ble9909 };
    } else if (device.code && device.code.includes("BLE-9100")) {
      const dataArray = this.decodeDataFromBLE9100Sensor(data, source, device);
      dataArray && this.callbackReadSensor(dataArray);
      return { sensorType: SENSOR_TYPE.ble9100 };
    } else {
      if (data[0] === START_BYTE_V1 || data[0] === START_BYTE_V2 || data[0] === START_BYTE_V2_LOG) {
        // new sensor message
        let header_bytes;
        if (data[0] === START_BYTE_V1) {
          // V1 message
          header_bytes = NUM_NON_DATA_SENSORS_CALLBACK;
          this.rx_data_lenth = data[4] + header_bytes + 1; // data + header bytes
        } else if (data[0] === START_BYTE_V2 || data[0] === START_BYTE_V2_LOG) {
          // V2 message
          header_bytes = NUM_NON_DATA_SENSORS_CALLBACK_V2;
          this.rx_data_lenth = ((data[5] << 8) | data[6]) + header_bytes + 1; // data + header bytes
        }

        if (data[data.length - 1] === STOP_BYTE) {
          this.rx_data_lenth += 1; // 1 ending byte
        }
        if (data.length === this.rx_data_lenth) {
          // full message in one shot
          const dataArray = this.decodeDataFromInnoLabSensor(data, source, device);
          dataArray && this.callbackReadSensor([data[0], ...dataArray]);

          this.usb_rx_buffer = null;
        } else if (data.length < this.rx_data_lenth) {
          // not enough data, wait for full message received
          this.usb_rx_buffer = new Uint8Array(data);
        }
      } else {
        if (this.usb_rx_buffer !== null) {
          // append to last message received
          let buf_data = this.concatTypedArrays(this.usb_rx_buffer, data);

          if (buf_data.length === this.rx_data_lenth) {
            // now got full message
            const dataArray = this.decodeDataFromInnoLabSensor(buf_data, source, device);
            dataArray && this.callbackReadSensor([this.rx_data_buffer[0], ...dataArray]);
            this.usb_rx_buffer = null;
          } else if (buf_data.length > this.rx_data_lenth) {
            console.log("Invalid data received");
            this.usb_rx_buffer = null;
          } else {
            // wait for more data to be completed
            this.usb_rx_buffer = buf_data;
          }
        } else {
          data = new TextDecoder("utf-8").decode(data);
          this.callbackCommandDTO(data);
        }
      }
      return { sensorType: SENSOR_TYPE.innoLab };
    }
  }

  decodeDataFromInnoLabSensor(data, source, device) {
    // sensor data
    /* Each sensor data record has following structure
        0xAA or 0xCC or 0xDD - start byte (V1=0xAA, V2 = 0xCC or 0xDD)
        Sensor ID - 1 byte
        Sensor Serial ID - 2 bytes (1 bytes if sensor V1)
        Sensor Battery - 1 byte
        Data length - 1 byte (V1) 2 bytes (V2)
        Sensor data [0..len] - 4 byte per data
        Checksum - 1 byte xor(start byte, sensor id, sensor serial ... data[len])
        0xBB - stop byte (already cut off by serial delimiter parser)
      */
    let header_bytes;
    let sensorId = data[1];
    let sensorSerial; // TODO: Will use later;
    let battery = data[3];
    let totalDataLength;

    const sensorInfo = SensorServicesIST.getSensorInfo(sensorId);
    if (sensorInfo === null) return;

    if (data[0] == START_BYTE_V1) {
      // Sensor V1 message
      header_bytes = NUM_NON_DATA_SENSORS_CALLBACK;
      sensorSerial = data[2]; // TODO: Will use later;
      totalDataLength = data[4]; // total data length in bytes
    } else if (data[0] == START_BYTE_V2 || data[0] == START_BYTE_V2_LOG) {
      // Sensor V2 message
      header_bytes = NUM_NON_DATA_SENSORS_CALLBACK_V2;
      sensorSerial = (data[2] << 8) | data[3]; // total data length in bytes
      totalDataLength = (data[5] << 8) | data[6]; // total data length in bytes
    }

    let checksum = data[header_bytes + totalDataLength];
    let calculatedChecksum = 0xff;
    for (let i = 0; i < totalDataLength + header_bytes; i++) {
      calculatedChecksum = calculatedChecksum ^ data[i];
    }

    if (calculatedChecksum != checksum) {
      console.log("decodeDataFromInnoLabSensor: Invalid data received");
      return;
    }

    let dataRead = header_bytes; // only read after header bytes
    let sensorData = [];
    let dataRecords = 0; // total data length in terms of data records

    while (dataRead < totalDataLength + header_bytes) {
      for (let i = 0; i < sensorInfo.data.length; i++) {
        let dataSize = sensorInfo.data[i].dataSize ?? 4;
        if (data[0] == START_BYTE_V2_LOG) {
          dataSize = 4; // remote log data always sent using 4-byte float
        }
        let dataLength = sensorInfo.data[i].dataLength ?? 1;
        let dataArray = [];
        for (let j = 0; j < dataLength; j++) {
          // read next dataSize bytes
          let rawBytes = data.slice(dataRead, dataRead + dataSize);

          let view = new DataView(new ArrayBuffer(dataSize));

          rawBytes.forEach(function (b, i) {
            view.setUint8(dataSize - i - 1, b);
          });

          let num;

          if (dataSize == 1) {
            num = view.getInt8(0);
          } else if (dataSize == 2) {
            num = view.getInt16(0);
          } else if (dataSize == 4) {
            num = view.getFloat32(0);
          }

          if (sensorInfo.data[i].calcFunc && data[0] != START_BYTE_V2_LOG) {
            // only apply recalculation for real time data
            num = sensorInfo.data[i].calcFunc(num);
          }

          dataArray.push(num);
          dataRead += dataSize;
        }

        if (dataLength == 1) {
          sensorData.push(dataArray[0]);
        } else {
          sensorData.push(dataArray);
        }
      }

      dataRecords++;
    }

    var dataArray = [sensorId, battery, source, device.deviceId, dataRecords];
    sensorData.forEach(function (d, i) {
      dataArray.push(d);
    });

    //console.log(sensorData);

    return dataArray;
  }

  decodeDataFromBLE9909Sensor(message, source, device) {
    //YINMIK BLE-9909 type sensors
    /* Each sensor data record has following structure
      serial    number            data    significance
      0         1                 data
                2                 Calibration data
      1         fixed at 2
      2         0                 BLE-None,    Product name code
                12                BLE-9100,
                BLE-9100
      3         DO(mg/L)Value high 8 bits
      4         DO(mg/L)lower 8 bits of value
      5         DO(%)Value high 8 bits
      6         DO(%)lower 8 bits of value
      7
      8
      9
      10
      11
      12
      13        8-bit high temperature value
      14        Temperature value lower 8 bits
      15        Battery voltage value high 8 bits
      16        Battery voltage value lower 8 bits
      17        flag bit        0b 0000 0000    7    6    5    4    3    2    1    0
                    hold reading    Backlight status
      18
      19
      20
      21
      22
      23    Check Digit    Please refer to the CheckSum form
    */
    // ### DECODING ###
    let tmp = 0;
    let hibit = 0;
    let lobit = 0;
    let hibit1 = 0;
    let lobit1 = 0;

    for (let i = message.length - 1; i > 0; i--) {
      tmp = message[i];
      hibit1 = (tmp & 0x55) << 1;
      lobit1 = (tmp & 0xaa) >> 1;
      tmp = message[i - 1];
      hibit = (tmp & 0x55) << 1;
      lobit = (tmp & 0xaa) >> 1;

      message[i] = ~(hibit1 | lobit);
      message[i - 1] = ~(hibit | lobit1);
    }

    let hold_reading = message[17] >> 4;

    let backlight = (message[17] & 0x0f) >> 3;

    let ec = (message[5] << 8) + message[6];

    let tds = (message[7] << 8) + message[8];

    let salt_tds = (message[9] << 8) + message[10];

    let salt_sg = ((message[11] << 8) + message[12]) / 100;

    let ph = ((message[3] << 8) + message[4]) / 100;

    let temp = ((message[13] << 8) + message[14]) / 10;

    let batt = parseInt(((message[15] << 8) + message[16]) / 32);

    var sensorData = [];

    sensorData.push(ph);
    sensorData.push(ec);
    sensorData.push(tds);
    sensorData.push(salt_sg);
    sensorData.push(salt_tds);
    sensorData.push(temp);

    var dataArray = [START_BYTE_V2, device.id, batt, source, device.deviceId, 1];
    sensorData.forEach(function (d, i) {
      dataArray.push(d);
    });

    return dataArray;
  }

  decodeDataFromBLE9100Sensor(message, source, device) {
    //YINMIK BLE-9100 DO type sensors
    /* Each sensor data record has following structure
      serial    number            data    significance
      0         1                 data
                2                 Calibration data
      1         fixed at 2
      2         0                 BLE-None,    Product name code
                12                BLE-9100,
                BLE-9100
      3         DO(mg/L)Value high 8 bits
      4         DO(mg/L)lower 8 bits of value
      5         DO(%)Value high 8 bits
      6         DO(%)lower 8 bits of value
      7
      8
      9
      10
      11
      12
      13        8-bit high temperature value
      14        Temperature value lower 8 bits
      15        Battery voltage value high 8 bits
      16        Battery voltage value lower 8 bits
      17        flag bit        0b 0000 0000    7    6    5    4    3    2    1    0
                    hold reading    Backlight status
      18
      19
      20
      21
      22
      23    Check Digit    Please refer to the CheckSum form
    */

    // ### DECODING ###
    let tmp = 0;
    let hibit = 0;
    let lobit = 0;
    let hibit1 = 0;
    let lobit1 = 0;

    for (let i = message.length - 1; i > 0; i--) {
      tmp = message[i];
      hibit1 = (tmp & 0x55) << 1;
      lobit1 = (tmp & 0xaa) >> 1;
      tmp = message[i - 1];
      hibit = (tmp & 0x55) << 1;
      lobit = (tmp & 0xaa) >> 1;

      message[i] = ~(hibit1 | lobit);
      message[i - 1] = ~(hibit | lobit1);
    }

    let do_mg = ((message[3] << 8) + message[4]) / 100;
    //console.log('DO (mg/L) = ' + do_mg);
    let do_percent = ((message[5] << 8) + message[6]) / 10;
    //console.log('DO (%) = ' + do_percent);
    let temp = ((message[13] << 8) + message[14]) / 10;
    //console.log('Temp (*C) = ' + (((temp/10.0) * (9.0/5.0)) + 32.0));
    let batt = parseInt(((message[15] << 8) + message[16]) / 32);
    //console.log('Battery (%) = ' + batt);

    var sensorData = [];

    sensorData.push(do_mg);
    sensorData.push(do_percent);
    sensorData.push(temp);

    var dataArray = [START_BYTE_V2, device.id, batt, source, device.deviceId, 1];
    sensorData.forEach(function (d, i) {
      dataArray.push(d);
    });

    return dataArray;
  }

  /**
   * Callback function called in DeviceManager when there is data available
   * @param {string} sensorsData - The format sensor data (@, id, data1, data2, data3, data 4, *).
   * @returns {void} - No return.
   */
  callbackReadSensor(data) {
    try {
      const startByte = data[0];
      const sensorVersion = startByte === START_BYTE_V1 ? SENSOR_VERSION.V1 : SENSOR_VERSION.V2;
      const sensorId = parseInt(data[1]);
      const battery = data[2];
      const source = data[3];
      const deviceId = data[4];
      const totalRecords = data[5];
      const sensorsData = [];

      const sensorInfo = SensorServicesIST.getSensorInfo(sensorId);
      if (sensorInfo === null) return;

      let recordsRead = 0;

      while (recordsRead < totalRecords) {
        let sample = [];
        for (let i = 0; i < sensorInfo.data.length; i++) {
          let value = data[6 + recordsRead * sensorInfo.data.length + i];
          let formatFloatingPoint = sensorInfo.data[i]?.formatFloatingPoint;
          formatFloatingPoint = formatFloatingPoint ??= 1;

          if (isArray(value)) {
            let subSample = [];
            for (let j = 0; j < value.length; j++) {
              subSample.push(parseFloat(value[j]).toFixed(formatFloatingPoint));
            }
            sample.push(subSample);
          } else {
            sample.push(parseFloat(value).toFixed(formatFloatingPoint));
          }
        }
        recordsRead++;
        sensorsData.push(sample);
      }

      if (startByte === START_BYTE_V2_LOG) {
        // remote logging data
        if (this.remoteLoggingBuffer.sensorId !== sensorId) {
          this.remoteLoggingBuffer = {
            sensorId: sensorId,
            data: sensorsData,
          };
          //console.log("New buffer data: ", sensorsData);
        } else {
          this.remoteLoggingBuffer.data = this.remoteLoggingBuffer.data.concat(sensorsData);
          //console.log("Add data to buffer: ", sensorsData);
        }
        document.dispatchEvent(new CustomEvent("log,get", { detail: { log_version: 2, data: sensorsData } }));
        return;
      } else {
        // real time data
        addBufferData(sensorId, sensorsData);

        // Add the sensor to sensorsQueue if not exist, otherwise update battery
        const activeSensorsIds = this.getActiveSensorIds();
        if (!activeSensorsIds.includes(sensorId)) {
          this.sensorsQueue.push({
            sensorId: sensorId,
            deviceId: deviceId,
            batteryStatus: parseInt(battery),
            sensorVersion: sensorVersion,
          });
        } else {
          const index = this.sensorsQueue.findIndex((element) => element.sensorId === sensorId);
          if (index !== -1) this.sensorsQueue[index].batteryStatus = parseInt(battery);
        }

        if (source !== BLE_TYPE) {
          this.uartConnections.add(sensorId);
        }

        if (
          this.checkingSensorSubscriber.sampleCondition &&
          this.checkingSensorSubscriber.sampleCondition.sensor.id === sensorId
        ) {
          this.emitter.emit(this.checkingSensorSubscriber.subscriberId, {
            sensorsData: sensorsData,
            previousSensorsData: this.checkingSensorSubscriber.previousSensorsData,
            checkingSensorSubscriber: this.checkingSensorSubscriber,
          });

          this.checkingSensorSubscriber.previousSensorsData = sensorsData;
        }
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

      delete currentBuffer[sensorId];
      clearBufferData(sensorId);

      const index = this.sensorsQueue.findIndex((element) => element.sensorId === sensorId);
      if (index !== -1) {
        this.sensorsQueue.splice(index, 1);
      }
    } catch (e) {
      console.error(`callbackSensorDisconnected: ${e.message}`);
    }
  }

  getListActiveSensor() {
    const activeDeviceSensors = Object.keys(currentBuffer).map((sensorId) => parseInt(sensorId));

    // Get the status of built-in devices
    const activeBuiltinSensors = SensorServicesIST.getActiveBuiltinSensors();

    return [...activeDeviceSensors, ...activeBuiltinSensors];
  }

  /**
   * Get the data for a specific data run.
   * @param {string} dataRunId - The ID of the data run to retrieve.
   * @returns {(Array|boolean)} The data for the specified data run or false if the data run doesn't exist.
   */
  appendManualSample(sensorIds, sensorValues) {
    const curBuffer = { ...currentBuffer };
    const parsedTime = this.getParsedCollectingDataTime();

    if (Array.isArray(sensorIds)) {
      sensorIds.forEach((sensorId, i) => {
        const sensorValue = sensorValues[i].values;

        if (curBuffer.hasOwnProperty(sensorId) && !_.isEmpty(sensorValue)) {
          curBuffer[sensorId] = sensorValue;
        }
      });
    }

    this.appendDataRun(this.curDataRunId, parsedTime, curBuffer);
    return { ...currentBuffer };
  }

  updateDataRunDataAtIndex(selectedIndex, sensorIds, sensorValues) {
    const dataRunData = this.dataRuns[this.curDataRunId]?.data;

    sensorIds.forEach((sensorId, i) => {
      const sensorValue = sensorValues[i].values;
      if (dataRunData[sensorId] && dataRunData[sensorId][selectedIndex] && !_.isEmpty(sensorValue)) {
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
    const sensorData = currentBuffer[sensorId];
    return Array.isArray(sensorData) && sensorIndex !== undefined ? sensorData[sensorIndex] : sensorData;
  }

  getBuffer() {
    return currentBuffer;
  }

  getDataBuffer(sensorId) {
    return currentBuffer[sensorId];
  }

  getBatteryStatus() {
    const batteryStatusDict = {};
    this.sensorsQueue.forEach((element) => {
      const { sensorId, batteryStatus } = element;
      batteryStatusDict[sensorId] = batteryStatus;
    });
    return batteryStatusDict;
  }

  getActiveSensorWithId(sensorId) {
    const sensor = this.sensorsQueue.find((element) => element.sensorId === sensorId);

    if (sensor != undefined) {
      const sensorInfo = this.sensorsQueue.find((element) => element.sensorId === sensorId);
      return {
        ...sensorInfo,
        sensorVersion: sensor.sensorVersion != undefined ? sensor.sensorVersion : SENSOR_VERSION.V2,
      };
    } else {
      return {};
    }
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
      delete currentBuffer[parseInt(sensorId)];
    } catch (e) {
      console.error(`callbackSensorDisconnected: ${e.message}`);
    }
  }

  // -------------------------------- COLLECTING_DATA_TIME -------------------------------- //
  getParsedCollectingDataTime() {
    const parsedTime = (this.collectingDataTime / 1000).toFixed(4);
    return parsedTime;
  }

  getTimerCollectingTime() {
    return this.timerCollectingTime;
  }

  getTimerDelayStartCollectingDataTime() {
    return this.delayStartCollectingDataTimer;
  }

  resetTimerCollectingTime() {
    this.timerCollectingTime = 0;
  }
  // -------------------------------- SCHEDULERS -------------------------------- //
  emitSubscribersScheduler = () => {
    try {
      const curBuffer = { ...currentBuffer };
      const parsedTime = this.getParsedCollectingDataTime();

      // Append data to data run and increment collecting data time
      if (this.isWaitingCollectingData) {
        this.replaceDataRun(this.curDataRunId, (0).toFixed(4), curBuffer);
      } else if (this.isCollectingData) {
        // Set this.collectingDataTime % this.selectedInterval === 0 for case frequency < 1Hz
        if (this.isClearDataRun) {
          this.isClearDataRun = false;
          this.timerCollectingTime = 0;
          this.clearDataRun(this.curDataRunId);
        }
        if (this.samplingMode === SAMPLING_AUTO) {
          if (this.selectedInterval >= READ_BUFFER_INTERVAL && this.collectingDataTime % this.selectedInterval === 0) {
            // Set this.collectingDataTime % this.selectedInterval === 0 for case frequency < 1Hz
            this.appendDataRun(this.curDataRunId, parsedTime, curBuffer);
            // Update total time collecting data
          } else if (this.selectedInterval < READ_BUFFER_INTERVAL) {
            this.appendDataRun(this.curDataRunId, parsedTime);
          }
        }

        // Update total time collecting data
        this.collectingDataTime += READ_BUFFER_INTERVAL;
      }

      // Increment timer collecting time and stop if it reaches the stop time
      this.timerCollectingTime += READ_BUFFER_INTERVAL;
      if (this.timerCollectingTime >= this.timerSubscriber.stopTime) {
        this.emitter.emit(this.timerSubscriber.subscriberTimerId);
      }
    } catch (error) {
      const schedulerError = new Error(`runEmitSubscribersScheduler: ${error.message}`);
      console.error(schedulerError);
    }
  };

  runEmitSubscribersScheduler() {
    clearAllBuffersData();
    this.emitSubscribersIntervalId = setInterval(() => {
      this.emitSubscribersScheduler();
      keepRecentBuffersData();
    }, READ_BUFFER_INTERVAL);
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
      const sensorId = (Math.random() * (5 - 3) + 3).toFixed(0);
      const battery = (Math.random() * (100 - 10) + 10).toFixed(0);

      const sensorInfo = SensorServicesIST.getSensors().find((sensor) => Number(sensorId) === Number(sensor.id));
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

  callbackCommandDTO(data) {
    try {
      console.log("callbackCommandDTO", data);
      if (data.slice(0, 2) === "OK") {
        document.dispatchEvent(new CustomEvent("statusCmdDTO", { detail: { data: "OK" } }));
      } else if (data.slice(0, 3) === "ERR") {
        document.dispatchEvent(new CustomEvent("statusCmdDTO", { detail: { data: "ERR" } }));
      }

      // parse command DTO
      if (window.dataBuffer === undefined) window.dataBuffer = "";
      window.dataBuffer += data;
      const results = getFromBetween.get(window.dataBuffer, "$$$", "###");
      if (results.length > 0) {
        results.forEach((item) => {
          const result = item.split(",");
          document.dispatchEvent(new CustomEvent(`${result[0]},${result[1]}`, { detail: { data: result.slice(2) } }));
        });
        window.dataBuffer = window.dataBuffer.slice(window.dataBuffer.lastIndexOf("###") + 3);
        if ((window.dataBuffer.match(/\$\$\$/g) || []).length === (window.dataBuffer.match(/###/g) || []).length) {
          window.dataBuffer = "";
        }
      }
    } catch (e) {
      console.error(`callbackCommandDTO error: ${e.message}`);
    }
  }

  // -------------------------------- CUSTOM MEASUREMENTS -------------------------------- //
  addCustomUnit({ unitName, unit }) {
    const unitId = uuidv4();
    const unitInfo = {
      id: unitId,
      name: unitName,
      unit: unit,
      userInput: [],
    };
    this.customUnits.push(unitInfo);
    return unitInfo;
  }

  updateCustomUnit({ unitId, unitName, unit }) {
    const unitInfoIndex = this.customUnits.findIndex((unit) => unit.id === unitId);
    if (unitInfoIndex === -1) {
      console.error(`updateCustomUnit: Cannot find custom unit with id ${unitId}`);
      return false;
    }

    const updateUnitInfo = {
      ...this.customUnits[unitInfoIndex],
      name: unitName,
      unit: unit,
    };
    this.customUnits[unitInfoIndex] = updateUnitInfo;
    return updateUnitInfo;
  }

  deleteCustomUnit() {}

  getCustomUnits() {
    return this.customUnits;
  }

  getCustomUnitInfo({ unitId }) {
    return this.customUnits.find((unit) => unit.id === unitId);
  }

  importCustomUnit(customXAxis) {
    this.customUnits = customXAxis;
  }

  addUseInputCustomUnit({ unitId, input, index }) {
    index = parseInt(index);
    const unitIndex = this.customUnits.findIndex((unit) => unit.id === unitId);
    if (unitIndex === -1) {
      return false;
    }

    const unitInfo = this.customUnits[unitIndex];
    let userInput = unitInfo.userInput;
    if (index > userInput.length - 1) {
      const newUserInputLen = index + 1;
      const userInputLen = userInput.length;
      userInput = userInput.concat(Array(newUserInputLen - userInputLen).fill(""));
      userInput[index] = input;
    }

    userInput[index] = input;
    this.customUnits[unitIndex] = { ...unitInfo, userInput: userInput };
    return true;
  }

  getUseInputCustomUnit({ unitId }) {
    const unitIndex = this.customUnits.findIndex((unit) => unit.id === unitId);
    if (unitIndex === -1) {
      return [];
    }

    const userInput = this.customUnits[unitIndex].userInput;
    return userInput || [];
  }

  deleteSensorDataInDataRun({
    dataRunId,
    sensorInfo,
    selectedRange,
    unitId = FIRST_COLUMN_DEFAULT_OPT,
    isScope = false,
    chartInstance = null,
  }) {
    const sensorParse = parseSensorInfo(sensorInfo);

    if (unitId == FIRST_COLUMN_DEFAULT_OPT) {
      if (isScope) {
        const newDataSensor = this.dataRuns[dataRunId].data[sensorInfo][0].filter((item) => {
          return !(
            Number(item.x) >= Math.min(selectedRange.xMin, selectedRange.xMax) &&
            Number(item.x) <= Math.max(selectedRange.xMin, selectedRange.xMax) &&
            Number(item.y) >= Math.min(selectedRange.yMin, selectedRange.yMax) &&
            Number(item.y) <= Math.max(selectedRange.yMin, selectedRange.yMax)
          );
        });
        this.dataRuns[dataRunId].data[sensorInfo][0] = newDataSensor;

        chartInstance.data.datasets[0].data = newDataSensor;
        chartInstance.update();
      } else {
        const newDataSensor = this.dataRuns[dataRunId].data[sensorParse.id].filter((item) => {
          return !(
            Number(item.time) >= Math.min(selectedRange.xMin, selectedRange.xMax) &&
            Number(item.time) <= Math.max(selectedRange.xMin, selectedRange.xMax) &&
            Number(item.values[sensorParse.index]) >= Math.min(selectedRange.yMin, selectedRange.yMax) &&
            Number(item.values[sensorParse.index]) <= Math.max(selectedRange.yMin, selectedRange.yMax)
          );
        });

        this.dataRuns[dataRunId].data[sensorParse.id] = newDataSensor.map((item, i) => ({
          time: ((i * this.collectingDataInterval) / 1000).toFixed(4),
          values: item.values,
        }));
      }

      return {
        xAxisSensorId: FIRST_COLUMN_DEFAULT_OPT,
        data: null,
      };
    } else if (unitId.startsWith(FIRST_COLUMN_SENSOR_OPT)) {
      const xAxisSensorId = unitId.split(":")[1];
      const sensorDataWithXAxis = this.dataRuns[dataRunId].data[sensorParse.id].map((item) => ({
        time: this.dataRuns[dataRunId].data[xAxisSensorId].find((i) => i.time == item.time).values[sensorParse.index],
        values: item.values,
      }));
      const willDeleteIndexes = [];
      sensorDataWithXAxis.forEach((item, index) => {
        if (
          Number(item.time) >= Math.min(selectedRange.xMin, selectedRange.xMax) &&
          Number(item.time) <= Math.max(selectedRange.xMin, selectedRange.xMax) &&
          Number(item.values[sensorParse.index]) >= Math.min(selectedRange.yMin, selectedRange.yMax) &&
          Number(item.values[sensorParse.index]) <= Math.max(selectedRange.yMin, selectedRange.yMax)
        ) {
          willDeleteIndexes.push(index);
        }
      });
      this.dataRuns[dataRunId].data[sensorParse.id] = this.dataRuns[dataRunId].data[sensorParse.id].filter(
        (item, index) => {
          return !willDeleteIndexes.includes(index);
        }
      );
      return {
        xAxisSensorId,
        data: {
          dataRunId,
          indexes: willDeleteIndexes,
        },
      };
    }
  }

  deleteSensorDataInDataRunByIndexes({ dataRunId, sensorId, indexes }) {
    this.dataRuns[dataRunId].data[sensorId] = this.dataRuns[dataRunId].data[sensorId].filter((item, index) => {
      return !indexes.includes(index);
    });
  }

  setSelectedSensorIds(sensorIds) {
    this.selectedSensorIds = sensorIds;
  }

  getSelectedSensorIds() {
    return this.selectedSensorIds;
  }
}

const dataManager = DataManager.getInstance();

export default dataManager;
