import { v4 as uuidv4 } from "uuid";
import StoreService from "./store-service";
import { findGCD, getLCM } from "./../utils/core";
import { EventEmitter } from "fbemitter";

/** @class DataManager
 * @property subscribers {Object} List of subscribers
 * @property buffer {Object} The buffer used to store sensors data
 * @property readSensorIntervalId {number} read sensor interval id
 */
class DataManager {
  subscribers = {};
  buffer = {};
  dataRuns = [];
  emitSubscribersIntervalId = null;

  constructor() {
    console.log("construct");
    this.emitter = new EventEmitter();
    this.storeService = new StoreService("data-manager");

    // initializes variables
    this.readSensorFrequency = 1;
    this.readSensorInterval = (1 / this.readSensorFrequency) * 1000;
    this.emitSubscribersFrequencies = [1, 2, 5, 10];
    this.emitSubscribersIntervals = this.emitSubscribersFrequencies.map(
      (e) => (1 / e) * 1000
    );

    this.maxEmitSubscribersInterval = getLCM(this.emitSubscribersIntervals);
    this.emitSubscribersInterval = findGCD(this.emitSubscribersIntervals);

    // calls two scheduler functions
    this.runEmitSubscribersScheduler();
  }

  /**
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
   * @param {number} sensorId - The sensor Id subscription.
   * @param {(data: any) => void} emitFunction - The emit function subscription.
   * @param {number} frequency - The frequency to call emitFunction.
   * @returns {string | boolean} subscriberId - The subscriber's unique id if register successfully otherwise false.
   */
  subscribe(sensorId, emitFunction, frequency) {
    try {
      const hasEmitFunction = typeof emitFunction === "function";
      const isValidFrequency = this.emitSubscribersFrequencies.includes(
        Number(frequency)
      );
      if (!isValidFrequency || !hasEmitFunction) {
        console.log(
          `SUBSCRIBE: Invalid parameters frequency_${frequency}-emitFunction_${emitFunction}-sensorId_${sensorId}`
        );
        return false;
      }

      const subscriberId = uuidv4();
      const interval = (1 / frequency) * 1000;
      const subscription = this.emitter.addListener(subscriberId, emitFunction);

      this.subscribers[subscriberId] = {
        sensorId: sensorId,
        interval: interval,
        subscription: subscription,
      };

      console.log(
        `SUBSCRIBE: subscriberId_${subscriberId}-sensorId_${sensorId}-frequency_${frequency}Hz-interval_${interval}ms`
      );

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

  // -------------------------------- DATA RUN -------------------------------- //
  addDataRun(dataRunName) {}
  updateDataRun(dataRunId, dataRunName) {}
  deleteDataRun(dataRunId) {}
  appendDataRun(dataRunId, sensorsData) {}
  exportCSVDataRun() {}

  // -------------------------------- EDL -------------------------------- //
  importELD() {}
  exportEDL() {}

  // -------------------------------- SCHEDULERS -------------------------------- //
  runEmitSubscribersScheduler() {
    let counter = 0;

    this.emitSubscribersIntervalId = setInterval(() => {
      const curInterval = counter * this.emitSubscribersInterval;

      Object.keys(this.subscribers).forEach((subscriberId) => {
        const subscriber = this.subscribers[subscriberId];
        try {
          if (curInterval % subscriber.interval !== 0) return;

          if (!subscriber.subscription.subscriber) {
            delete this.subscribers[subscriberId];
            console.log(
              `emitSubscribersScheduler: Remove subscriberId_${subscriberId}`
            );
            return;
          }
          this.emitter.emit(subscriberId, Math.random());
        } catch (error) {
          console.error(error);
          if (!this.subscribers.hasOwnProperty(subscriberId)) return;
          delete this.subscribers[subscriberId];
        }
      });

      counter =
        (counter + 1) %
        (this.maxEmitSubscribersInterval / this.emitSubscribersInterval);
    }, this.emitSubscribersInterval);
  }

  stopEmitSubscribersScheduler() {
    clearInterval(this.emitSubscribersIntervalId);
  }
}

export default DataManager.getInstance();
