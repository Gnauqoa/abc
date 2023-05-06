import { BLE_RX_ID } from "../js/constants";
import { BLE_SERVICE_ID, BLE_TX_ID, BLE_TYPE, DEVICE_PREFIX } from "../js/constants";

import DataManagerIST from "./data-manager";
import SensorServices from "./sensor-service";

const CHECKING_CONNECTION_INTERVAL = 1000;

export class DeviceManager {
  constructor() {
    // Initialize variables
    this.initializeVariables();

    this.startCheckingConnection();
  }

  initializeVariables() {
    this.devices = [];
    this.checkConnectionIntervalId;
  }

  /**
   * Returns the instance of the DataManager class.
   * @returns {DeviceManager} - The instance of the DataManager class.
   */
  static getInstance() {
    if (!DeviceManager.instance) {
      DeviceManager.instance = new DeviceManager();
    }
    return DeviceManager.instance;
  }

  // ============================== BLE functions =============================
  scan({ callback }) {
    try {
      ble.startScan(
        [],
        (device) => {
          // console.log(JSON.stringify(device));
          if (
            device?.name?.includes(DEVICE_PREFIX) ||
            device?.advertising?.kCBAdvDataLocalName?.includes(DEVICE_PREFIX)
          ) {
            // console.log("this.devices", JSON.stringify(this.devices));
            const deviceIndex = this.devices.findIndex((d) => d.deviceId === device.id || d.isConnected === false);
            if (deviceIndex < 0) {
              let deviceName = device.name || device.id;
              if (deviceName === "ESP32" && device?.advertising?.kCBAdvDataLocalName) {
                deviceName = device.advertising.kCBAdvDataLocalName;
              }
              const newFoundDevice = {
                deviceId: device.id,
                code: deviceName,
                rssi: device.rssi,
                type: BLE_TYPE,
                isConnected: false,
              };

              const sensor = SensorServices.getSensorByCode(newFoundDevice.code);
              sensor !== null && this.devices.push({ ...sensor, ...newFoundDevice });
            }
            callback([...this.devices]);
          }
        },
        (err) => {
          console.error("ble.startScan", err);
        }
      );

      // const dummyDeviceIds = ["C6:A1:7A:4B:C1:EB"];
      // const dummyDeviceNames = ["inno-009-kpa"];
      // for (let i = 0; i < dummyDeviceIds.length; i++) {
      //   const dummyDeviceId = dummyDeviceIds[i];
      //   const dummyDeviceName = dummyDeviceNames[i];
      //   const deviceIndex = this.devices.findIndex((d) => d.deviceId === dummyDeviceId || d.isConnected === false);
      //   if (deviceIndex < 0) {
      //     let deviceName = dummyDeviceName || dummyDeviceId;
      //     const newFoundDevice = {
      //       deviceId: dummyDeviceId,
      //       code: deviceName,
      //       rssi: "-85",
      //       type: BLE_TYPE,
      //       isConnected: false,
      //     };
      //     const sensor = SensorServices.getSensorByCode(newFoundDevice.code);
      //     if (sensor === null) return [];
      //     this.devices.push({ ...sensor, ...newFoundDevice });
      //     callback([...this.devices]);
      //   }
      // }
    } catch (err) {
      console.error("scan error", err.message);
    }
  }

  connect({ deviceId, callback }) {
    try {
      ble.connect(
        deviceId,
        () => {
          const currentDevice = this.devices.find((d) => d.deviceId === deviceId);
          currentDevice.isConnected = true;

          ble.requestConnectionPriority(
            deviceId,
            "high",
            () => {},
            () => {
              console.error(`Device ${deviceId} requestConnectionPriority error`);
            }
          );

          this.receiveDataCallback(deviceId, this.onDataCallback);
          callback([...this.devices]);
        },
        () => {
          const newDevices = this.devices.filter((d) => d.deviceId !== deviceId);
          this.devices = newDevices;
          callback([...this.devices]);
        }
      );
    } catch (error) {
      console.error("ble.connect", error);
    }

    // const device = this.devices.find((d) => d.deviceId === deviceId);
    // device.isConnected = true;
    // this.receiveDataCallback(deviceId, this.onDataCallback);
    // callback([...this.devices]);
  }

  disconnect({ deviceId, id, callback }) {
    let device;
    if (deviceId !== undefined) {
      device = this.devices.find((d) => d.deviceId === deviceId);
    } else if (id !== undefined) {
      device = this.devices.find((d) => Number(d.id) === Number(id));
    } else return;

    if (device === undefined) return;
    id = device.id;
    deviceId = device.deviceId;

    ble.disconnect(
      deviceId,
      () => {
        const currentDevice = this.devices.find((d) => d.deviceId === deviceId);
        currentDevice.isConnected = false;
        // console.log("this.devices", JSON.stringify(this.devices));
        callback([...this.devices]);
      },
      (err) => {
        console.error(`Disconnected device ${deviceId} error`, err);
      }
    );

    // const currentDevice = this.devices.find((d) => d.deviceId === deviceId);
    // currentDevice.isConnected = false;
    // DataManagerIST.callbackSensorDisconnected([id, BLE_TYPE]);
    // callback([...this.devices]);
  }

  async sendData(deviceId, data) {
    try {
      const encoder = new TextEncoder();
      const encodedAll = encoder.encode(`${data}\r`);
      if (encodedAll.length > LIMIT_BYTE_BLE) {
        const chunkSize = Math.round(data.length / Math.ceil(encodedAll.length / LIMIT_BYTE_BLE));
        const chunks = data.match(new RegExp(".{1," + chunkSize + "}", "g"));
        for (const item of chunks) {
          await sendBleData(deviceId, encoder.encode(item));
        }
        await sendBleData(deviceId, encoder.encode("\r"));
      } else {
        await sendBleData(deviceId, encoder.encode(`${data}\r`));
      }
    } catch (err) {
      console.error("sendData error", err);
      throw new Error("sendData error");
    }
  }

  // ============================== Utils functions =============================
  handleStopScan(callback) {
    try {
      ble.stopScan(callback, (err) => {
        console.error("handleStopScan", err);
        callback();
      });
    } catch (error) {
      console.error("ble.stopScan", error);
    }
  }

  receiveDataCallback(deviceId, callback) {
    try {
      ble.startNotification(
        deviceId,
        BLE_SERVICE_ID,
        BLE_TX_ID,
        (buffer) => {
          const data = new TextDecoder("utf-8").decode(new Uint8Array(buffer));
          callback(data);
        },
        (err) => {
          console.error(`receiveBleNotification error`, err);
        }
      );
    } catch (error) {
      console.error("ble.startNotification", error);
    }

    // callback("@,9,5.33,*");
  }

  onDataCallback(data) {
    if (data === undefined) return;

    data = data.trim();

    const dataSplit = data.split(",");
    const dataSplitLength = dataSplit.length;

    if (dataSplitLength < 4 || dataSplit[0] !== "@" || dataSplit[dataSplitLength - 1] !== "*") return;

    // [sensorId, usbPort, dataLength, datas]
    const dataParsed = [dataSplit[1], BLE_TYPE, dataSplitLength - 3, ...dataSplit.slice(2, dataSplitLength - 1)];
    DataManagerIST.callbackReadSensor(dataParsed);
  }

  sendBleData(deviceId, data) {
    return new Promise((resolve, reject) => {
      ble.write(
        deviceId,
        BLE_SERVICE_ID,
        BLE_RX_ID,
        data.buffer,
        (res) => {
          resolve(res);
        },
        (err) => {
          console.error(`sendDataToDevice ${deviceId} error`, err);
          reject(err);
        }
      );
    });
  }

  startCheckingConnection() {
    setInterval(() => {
      for (const device of this.devices) {
        ble.isConnected(
          device.deviceId,
          () => {},
          () => {
            const buffer = DataManagerIST.getBuffer();
            if (Object.keys(buffer).includes(String(device.id))) {
              DataManagerIST.callbackSensorDisconnected([device.id, BLE_TYPE]);
              const currentDevice = this.devices.find((d) => d.deviceId === device.deviceId);
              currentDevice.isConnected = false;
            }
          }
        );
      }
    }, CHECKING_CONNECTION_INTERVAL);
  }
}

export default DeviceManager.getInstance();
