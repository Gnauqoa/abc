import { f7 } from "framework7-react";

import { BLE_SERVICE_ID, BLE_TX_ID, BLE_TYPE, DEVICE_PREFIX, BLE_RX_ID, DEVICE_YINMIK_PREFIX } from "../js/constants";

import DataManagerIST from "./data-manager";
import SensorServices from "./sensor-service";
import { WebBle } from "./electron-ble";
import * as core from "../utils/core";

const CHECKING_CONNECTION_INTERVAL = 1000;
const webBle = new WebBle();

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
  async scan({ callback }) {
    try {
      if (f7.device.electron) {
        webBle.cancelScanning();
        webBle.startScanning((devices) => {
          this.devices = devices;
          callback(devices);
        });
      } else if (f7.device.android || f7.device.ios) {
        ble.startScan(
          [],
          (device) => {
            if (
              device?.name?.includes(DEVICE_PREFIX) ||
              device?.advertising?.kCBAdvDataLocalName?.includes(DEVICE_PREFIX) ||
              device?.name?.includes(DEVICE_YINMIK_PREFIX) ||
              device?.advertising?.kCBAdvDataLocalName?.includes(DEVICE_YINMIK_PREFIX)
            ) {
              const existingDevice = this.devices.find((d) => d.deviceId === device.id);
              if (existingDevice) {
                existingDevice.isConnected = false;
              } else {
                let deviceName = device.name || device.id;
                if (deviceName === "ESP32" && device?.advertising?.kCBAdvDataLocalName) {
                  deviceName = device.advertising.kCBAdvDataLocalName;
                }
                const newDevice = {
                  deviceId: device.id,
                  code: deviceName,
                  rssi: device.rssi,
                  type: BLE_TYPE,
                  isConnected: false,
                };

                const sensor = SensorServices.getSensorByCode(newDevice.code);
                sensor !== null && this.devices.push({ ...sensor, ...newDevice });
              }
              callback([...this.devices]);
            }
          },
          (err) => {
            console.error("ble.startScan", err);
          }
        );
      }
    } catch (err) {
      console.error("scan error", err.message);
    }
  }

  connect({ deviceId, successCallback, errorCallback }) {
    const currentDevice = this.devices.find((d) => d.deviceId === deviceId);
    try {
      if (f7.device.electron) {
        webBle.connect(
          deviceId,
          (devices) => {
            this.devices = devices;
            successCallback([]); // Electron should return empty to start new scan
          },
          (event) => {
            if (event) {
              console.log(`Device ${deviceId} is disconnected.`);
              webBle.disconnect(deviceId, (devices) => {
                this.devices = devices;
                errorCallback(); // Empty param for no error popup
              });
            } else {
              console.error(`Connecting to device ${deviceId} is error.`);
              errorCallback(currentDevice);
            }
          },
          this.onDataCallback
        );
      } else if (f7.device.android || f7.device.ios) {
        ble.connect(
          deviceId,
          () => {
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
            successCallback([...this.devices]);
          },
          () => {
            const device = this.devices.find((d) => d.deviceId === deviceId);
            device.isConnected = false;
            errorCallback();
          }
        );
      }
    } catch (error) {
      console.error("ble.connect", error);
      errorCallback(currentDevice);
    }
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

    if (f7.device.electron) {
      webBle.disconnect(deviceId, (devices) => {
        this.devices = devices;
        callback([]); // Electron should return empty to start new scan
      });
    } else if (f7.device.android || f7.device.ios) {
      ble.disconnect(
        deviceId,
        () => {
          const currentDevice = this.devices.find((d) => d.deviceId === deviceId);
          currentDevice.isConnected = false;
          callback([...this.devices]);
        },
        (err) => {
          console.error(`Disconnected device ${deviceId} error`, err);
        }
      );
    }
  }

  // ============================== Utils functions =============================
  handleStopScan(callback) {
    try {
      if (f7.device.android || f7.device.ios) {
        ble.stopScan(callback, (err) => {
          console.error("handleStopScan", err);
          callback();
        });
      }
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
          //const data = new TextDecoder("utf-8").decode(new Uint8Array(buffer));
          let data = new Uint8Array(buffer);

          if (data[0] != 0xAA) {
            // Invalid data, ignore
            return;
          }

          var sensorId = data[1];
          var sensorSerial = data[2]; // TODO: Will use later
          var battery = data[3];
          var dataLength = data[4];
          var checksum = data[5 + dataLength];
          var calculatedChecksum = 0xFF;
          for (var i=0; i<(dataLength+5); i++) {
            calculatedChecksum = calculatedChecksum ^ data[i];
          }

          if (calculatedChecksum != checksum) {
            console.log('Invalid data received');
            return;
          }

          var dataRead = 0;
          var sensorData = [];

          while (dataRead < dataLength) {
            // read next 4 bytes
            var rawBytes = [data[dataRead+5], data[dataRead+6],
            data[dataRead+7], data[dataRead+8]];

            var view = new DataView(new ArrayBuffer(4));

            rawBytes.forEach(function (b, i) {
                view.setUint8(3-i, b);
            });

            sensorData.push(view.getFloat32(0));
            dataRead += 4;
          }

          var dataArray = [sensorId, battery, BLE_TYPE, dataLength]
          sensorData.forEach(function (d, i) {
            dataArray.push(d);
          });

          callback(dataArray);
        },
        (err) => {
          console.error(`receiveBleNotification error`, err);
        }
      );
    } catch (error) {
      console.error("ble.startNotification", error);
    }
  }

  onDataCallback(data) {
    if (data === undefined) return;

    DataManagerIST.callbackReadSensor(data);
  }

  writeBleData(deviceId, data) {
    if (f7.device.electron) {
      return webBle.writeData(deviceId, data);
    }

    // For mobile
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
          reject(err);
        }
      );
    });
  }

  startCheckingConnection() {
    setInterval(async () => {
      for (const device of this.devices) {
        if (device.isConnected) {
          // TODO >>> Clean up. Just a demo for writing data to device.
          try {
            const encodedData = Uint8Array.of(1);
            await this.writeBleData(device.deviceId, encodedData);
            console.log("Write BLE success to device", device.deviceId);
          } catch (error) {
            console.error("Write BLE error", error);
          }
          // <<< End TODO

          continue;
        }

        const buffer = DataManagerIST.getBuffer();
        if (Object.keys(buffer).includes(String(device.id))) {
          DataManagerIST.callbackSensorDisconnected([device.id, BLE_TYPE]);
        }
      }
    }, CHECKING_CONNECTION_INTERVAL);
  }
}

export default DeviceManager.getInstance();
