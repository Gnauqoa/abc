import { READ_SERIAL_INTERVAL, RUNNER_TYPE, SCAN_SERIAL_INTERVAL, SERIAL_BAUD_RATE, USB_TYPE } from "../js/constants";
import dataManager from "./data-manager";

export class MobileSerialManager {
  constructor() {}

  init() {
    this.initVariables();
    this.initInterval();
  }

  initVariables() {
    // List of all devices
    this.devices = [];
    // List of active devices currently connected
    this.activeDevices = [];
    // Index of the current device being read
    this.readingDevice = 0;
    // Flag to track if the system is waiting for data from a device
    this.isReading = false;
    // Flag to track if a scan for new devices is ongoing
    this.flagScan = false;
    // Timeout handler for reading device data
    this.flagSend = false;
    this.readTimeOut = null;

    this.scanInterval = null;

    this.readInterval = null;

    this.sendInterval = null;

    this.runnerQueue = [];

    this.runnerInterval = null;

    this.isRunning = false;
  }

  initInterval() {
    if (!this.scanInterval)
      this.scanInterval = setInterval(() => {
        this.runnerQueue.push({ type: RUNNER_TYPE.SCAN, opts: {} });
      }, SCAN_SERIAL_INTERVAL);

    if (!this.readInterval)
      this.readInterval = setInterval(() => {
        if (this.activeDevices.length <= 0)
          return;

        const deviceId = this.activeDevices[this.readingDevice].deviceId;

        this.readingDevice = (this.readingDevice + 1) % this.activeDevices.length;

        this.runnerQueue.push({ type: RUNNER_TYPE.READ, opts: { deviceId } });
      }, READ_SERIAL_INTERVAL);

    if (!this.runnerInterval) {
      this.runnerInterval = setInterval(async () => {
        if (this.runnerQueue.length <= 0 || this.isRunning) return;

        this.isRunning = true;
        const runner = this.runnerQueue.shift();

        try {
          if (runner.type === RUNNER_TYPE.SCAN) {
            await this.scan();
          } else if (runner.type === RUNNER_TYPE.READ) {
            await this.readDeviceData(runner.opts.deviceId);
          }
        } catch (error) {
          this.handleError(error);
        } finally {
          this.isRunning = false;
        }
      }, 100);
    }
  }

  /**
   * Returns the instance of the DataManager class.
   * @returns {MobileSerialManager} - The instance of the DataManager class.
   */
  static getInstance() {
    if (!MobileSerialManager.instance) {
      MobileSerialManager.instance = new MobileSerialManager();
    }
    return MobileSerialManager.instance;
  }

  handleError(message) {
    console.error("Serial Error:", message);

    // if (!message.includes("No device found") && !message.includes("Already open")) {
    //   alert(`Error: ${message}`);
    // }
  }

  onReadDataSuccess(newData, deviceId) {
    console.log("Data received: ", newData.join(", "));

    clearTimeout(this.readTimeOut);

    this.isReading = false;

    dataManager.onDataCallback(newData, USB_TYPE, { deviceId });
  }

  disconnectAllDevices() {
    if (!window.serial) return;

    this.activeDevices.forEach((device) => dataManager.callbackSensorDisconnected([device.deviceId, USB_TYPE]));
    this.activeDevices = [];
  }

  async updateActiveDevices(device) {
    if (device && !this.devices.find((d) => d.deviceId === device.deviceId)) {
      this.activeDevices.push(device);
      console.log("New device connected: ", JSON.stringify(device));
    }
    try {
      await this.getDevices();

      for (let i = 0; i < this.activeDevices.length; i++) {
        console.log("devices: ", JSON.stringify(this.devices));
        if (!this.devices.find((d) => d.deviceId === this.activeDevices[i].deviceId)) {
          const disconnectedDevice = this.activeDevices.splice(i, 1);
          console.log("Device disconnected: ", JSON.stringify(disconnectedDevice));
          dataManager.callbackSensorDisconnected([disconnectedDevice[0].deviceId, USB_TYPE]);
        }
      }
    } catch (error) {
      this.disconnectAllDevices();
      this.handleError(error);
    }
  }

  async requestPermission() {
    if (!window.serial) return;

    return new Promise((resolve, reject) => {
      serial.requestPermission(
        (device) => resolve(device),
        (error) => reject(error)
      );
    });
  }

  async scan() {
    if (!window.serial) return;

    try {
      const device = await this.requestPermission();
      this.updateActiveDevices(device);
    } catch (error) {
      this.updateActiveDevices();
      this.handleError(error);
    }
  }

  async writeSerialByDeviceId(deviceId, data) {
    if (!window.serial) return;

    return new Promise((resolve, reject) => {
      serial.writeSerialByDeviceId(
        {
          deviceId,
          data,
        },
        resolve,
        reject
      );
    });
  }

  async getDevices() {
    if (!window.serial) return [];

    return new Promise((resolve, reject) => {
      serial.getDevices(
        (newDevices) => {
          console.log("New devices: ", JSON.stringify(newDevices));
          this.devices = newDevices;
          resolve(newDevices);
        },
        (error) => {
          this.devices = [];
          reject(error);
        }
      );
    });
  }

  async closeSerial() {
    if (!window.serial) return;

    return new Promise((resolve, reject) => {
      serial.close(resolve, (error) => (error.includes("Already closed") ? resolve() : reject(error)));
    });
  }

  async readSerialByDeviceId({ deviceId, baudRate }) {
    if (!window.serial) return;

    return new Promise((resolve, reject) => {
      serial.readSerialByDeviceId(
        { deviceId, baudRate },
        (data) => {
          console.log("Read success: ", new Uint8Array(data).join(", "));
          resolve(data);
        },
        reject
      );
    });
  }

  async readDeviceData(deviceId) {
    console.log("Reading device data: ", deviceId);

    try {
      await this.closeSerial();

      const newData = await this.readSerialByDeviceId({
        baudRate: SERIAL_BAUD_RATE,
        deviceId,
      });

      this.onReadDataSuccess(new Uint8Array(newData), deviceId);
      return newData;
    } catch (error) {
      this.isReading = false;
      this.handleError(error);
      return [];
    }
  }
}

export default MobileSerialManager.getInstance();
