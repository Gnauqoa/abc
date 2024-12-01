import {
  READ_SERIAL_INTERVAL,
  RUNNER_INTERVAL,
  RUNNER_TYPE,
  SCAN_SERIAL_INTERVAL,
  SERIAL_BAUD_RATE,
  USB_TYPE,
} from "../js/constants";
import dataManager from "./data-manager";

export class MobileSerialManager {
  constructor() {}

  init() {
    this.initVariables();
    this.initInterval();
    this.initReadCallback();
  }

  initVariables() {
    // List of all devices
    this.devices = [];
    // List of active devices currently connected
    this.activeDevices = [];
    // Index of the current device being read
    this.readingDevice = 0;

    this.scanInterval = null;

    this.readInterval = null;

    this.sendInterval = null;

    this.runnerQueue = [];

    this.runnerInterval = null;

    this.isRunning = false;

    this.isWaitingSensorResponse = false;
  }

  initInterval() {
    if (!this.scanInterval)
      this.scanInterval = setInterval(() => {
        this.runnerQueue.push({ type: RUNNER_TYPE.SCAN, opts: {} });
      }, SCAN_SERIAL_INTERVAL);

    if (!this.readInterval)
      this.readInterval = setInterval(() => {
        if (this.activeDevices.length <= 0) return;

        const deviceId = this.activeDevices[this.readingDevice].deviceId;

        this.readingDevice = (this.readingDevice + 1) % this.activeDevices.length;

        this.runnerQueue.push({ type: RUNNER_TYPE.READ, opts: { deviceId } });
      }, READ_SERIAL_INTERVAL);

    if (!this.runnerInterval) {
      this.runnerInterval = setInterval(async () => {
        if (this.runnerQueue.length <= 0 || this.isRunning || this.isWaitingSensorResponse) return;

        this.isRunning = true;
        const runner = this.runnerQueue.shift();

        try {
          if (runner.type === RUNNER_TYPE.SCAN) {
            await this.scan();
          } else if (runner.type === RUNNER_TYPE.READ) {
            await this.readDeviceData(runner.opts.deviceId);
          } else if (runner.type === RUNNER_TYPE.SEND) {
            if (runner.opts.waitingResponseCompletedEvent) {
              this.isWaitingSensorResponse = true;
              document.addEventListener(runner.opts.waitingResponseCompletedEvent, () =>
                this.onWaitingResponseCompletedEvent(runner.opts.waitingResponseCompletedEvent)
              );

              this.initReadCallback();
              await this.openSerialByDeviceId(runner.opts.deviceId);
            }

            await this.writeSerial(runner.opts.data);
          }
        } catch (error) {
          this.handleError(error);
        } finally {
          this.isRunning = false;
        }
      }, RUNNER_INTERVAL);
    }
  }

  onWaitingResponseCompletedEvent(eventName) {
    this.isWaitingSensorResponse = false;
    document.removeEventListener(eventName, this.onWaitingResponseCompletedEvent);
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

  async writeSerial(data) {
    if (!window.serial) return;

    return new Promise((resolve, reject) => {
      serial.write(data, resolve, reject);
    });
  }

  handleError(message) {
    console.error("Serial Error:", message);

    // if (!message.includes("No device found") && !message.includes("Already open")) {
    //   alert(`Error: ${message}`);
    // }
  }

  initReadCallback = () => {
    serial.registerReadCallback((data) => this.onReadDataSuccess(new Uint8Array(data)), this.handleError);
  };

  initOnNewApprovedDeviceCallback = () => {
    serial.registerNewApprovedDeviceCallback((device) => {
      this.updateActiveDevices(device);
    });
  };

  async openSerialByDeviceId(deviceId) {
    return new Promise((resolve, reject) => {
      serial.openSerialByDeviceId(
        {
          baudRate: SERIAL_BAUD_RATE,
          deviceId,
        },
        resolve,
        reject
      );
    });
  }

  isInnoLabSensor(data) {
    let dataLength = (data[4] << 8) | data[5];
    let checksum = data[NUM_NON_DATA_SENSORS_CALLBACK + dataLength];
    let calculatedChecksum = 0xff;
    for (let i = 0; i < dataLength + NUM_NON_DATA_SENSORS_CALLBACK; i++) {
      calculatedChecksum = calculatedChecksum ^ data[i];
    }

    if (calculatedChecksum != checksum) {
      return false;
    }
    return true;
  }

  onReadDataSuccess(newData, deviceId) {
    dataManager.onDataCallback(newData, USB_TYPE, { deviceId });

    if (this.isInnoLabSensor(newData)) {
      const index = this.activeDevices.findIndex((device) => device.deviceId === deviceId);
      this.activeDevices[index] = { ...this.activeDevices[index], sensorId: newData[1] };
    }
  }

  disconnectAllDevices() {
    if (!window.serial) return;

    this.activeDevices.forEach((device) => dataManager.callbackSensorDisconnected([device.sensorId, USB_TYPE]));
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
        if (!this.devices.find((d) => d.deviceId === this.activeDevices[i].deviceId)) {
          const disconnectedDevice = this.activeDevices.splice(i, 1);
          console.log(
            `Disconnect device ${disconnectedDevice[0].deviceId}, sensorId: ${disconnectedDevice[0].sensorId}`
          );

          dataManager.callbackSensorDisconnected([disconnectedDevice[0].sensorId, USB_TYPE]);
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

  async writeUsbData(deviceId, data, waitingResponseCompletedEvent) {
    const firstTask = this.runnerQueue[0];

    this.runnerQueue = [
      { type: RUNNER_TYPE.SEND, opts: { deviceId, data, waitingResponseCompletedEvent } },
      { type: RUNNER_TYPE.READ, opts: { deviceId } },
      ...this.runnerQueue.slice(1),
    ];

    if (firstTask) this.runnerQueue = [firstTask, ...this.runnerQueue];
  }

  async writeSerialByDeviceId(deviceId, data) {
    if (!window.serial) return;

    return new Promise((resolve, reject) => {
      serial.writeSerialByDeviceId(
        {
          baudRate: SERIAL_BAUD_RATE,
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

  async readDeviceData(deviceId) {
    console.log("Reading device data: ", deviceId);

    try {
      const newData = await this.readSerialByDeviceId({
        baudRate: SERIAL_BAUD_RATE,
        deviceId,
      });

      this.onReadDataSuccess(new Uint8Array(newData), deviceId);
      return newData;
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }
}

export default MobileSerialManager.getInstance();
