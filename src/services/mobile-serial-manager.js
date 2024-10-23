import { READ_SERIAL_INTERVAL, SCAN_SERIAL_INTERVAL, SERIAL_BAUD_RATE, USB_TYPE } from "../js/constants";
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
    this.readTimeOut = null;

    this.scanInterval = null;

    this.readInterval = null;
  }

  initInterval() {
    if (!this.scanInterval)
      this.scanInterval = setInterval(() => {
        this.flagScan = true;
        this.scan();
      }, SCAN_SERIAL_INTERVAL);

    if (!this.readInterval)
      this.readInterval = setInterval(() => {
        if (this.activeDevices.length && !this.isReading && !this.flagScan) {
          this.readDeviceData();
        }
      }, READ_SERIAL_INTERVAL);
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

  scan() {
    if (!window.serial || !this.flagScan) return;
    this.flagScan = false;

    serial.requestPermission(
      (device) => {
        this.updateActiveDevices(device);
      },
      (error) => {
        this.updateActiveDevices();
        this.handleError(error);
      }
    );
  }

  async getDevices() {
    if (!window.serial) return [];

    return new Promise((resolve, reject) => {
      serial.getActiveDevices(
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
      serial.readSerialByDeviceId({ deviceId, baudRate }, resolve, reject);
    });
  }

  async readDeviceData() {
    console.log("Reading device data: ", JSON.stringify(this.activeDevices[this.readingDevice]));

    this.isReading = true;

    this.readTimeOut = setTimeout(() => {
      this.isReading = false;
    }, 1000);

    const deviceId = this.activeDevices[this.readingDevice].deviceId;
    this.readingDevice = (this.readingDevice + 1) % this.activeDevices.length;

    try {
      await this.closeSerial();

      const newData = await this.readSerialByDeviceId({
        baudRate: SERIAL_BAUD_RATE,
        deviceId,
      });

      this.onReadDataSuccess(new Uint8Array(newData), deviceId);
    } catch (error) {
      this.isReading = false;
      this.handleError(error);
    }
  }
}

export default MobileSerialManager.getInstance();
