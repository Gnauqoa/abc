import { f7 } from "framework7-react";

import {
  BLE_SERVICE_ID,
  BLE_TX_ID,
  USB_TYPE,
  BLE_TYPE,
  DEVICE_PREFIX,
  BLE_RX_ID,
  DEVICE_YINMIK_PREFIX,
} from "../js/constants";

import DataManagerIST from "./data-manager";
import SensorServices from "./sensor-service";
import { WebBle } from "./electron-ble";
import MobileSerialManagerIST from "./mobile-serial-manager";

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

  getBleDevices() {
    return this.devices;
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
    } catch (error) {
      console.error("scan error", error.message);
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

            if (f7.device.android) {
              ble.requestMtu(
                deviceId,
                517,
                () => {
                  console.log("MTU set to: " + mtu);
                },
                () => {
                  console.error("Failed to request MTU.");
                }
              );
            }

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
      } else if (f7.device.electron) {
        webBle.cancelScanning();
      }
    } catch (error) {
      console.error("ble.stopScan", error);
    }
  }

  receiveDataCallback(deviceId, callback) {
    const currentDevice = this.devices.find((d) => d.deviceId === deviceId);
    if (currentDevice === undefined) {
      return;
    }
    try {
      if (currentDevice.code.includes("BLE-9909") || currentDevice.code.includes("BLE-C600")) {
        ble.startNotification(
          deviceId,
          "FF01",
          "FF02",
          (buffer) => {
            callback(new Uint8Array(buffer), BLE_TYPE, currentDevice);
          },
          (err) => {
            console.error(`BLE-9909 startNotification error`, err);
            console.log(err.message);
          }
        );

        let intervalId = setInterval(() => {
          ble.isConnected(
            deviceId,
            () => {
              ble.read(
                deviceId,
                "FF01",
                "FF02",
                (buffer) => {
                  callback(new Uint8Array(buffer), BLE_TYPE, currentDevice);
                },
                (err) => {
                  console.error("Read BLE-9909 sensor data error", JSON.stringify(err));
                }
              );
            },
            () => {
              console.log("Sensor already disconnected. Stop reading");
              clearInterval(intervalId);
            }
          );
        }, 505);
      } else if (currentDevice.code.includes("BLE-9100")) {
        ble.startNotification(
          deviceId,
          "FF01",
          "FF02",
          (buffer) => {
            callback(new Uint8Array(buffer), BLE_TYPE, currentDevice);
          },
          (err) => {
            console.error("BLE-9100 startNotification error", err);
          }
        );

        let intervalId = setInterval(() => {
          ble.isConnected(
            deviceId,
            () => {
              ble.read(
                deviceId,
                "FF01",
                "FF02",
                (buffer) => {
                  callback(new Uint8Array(buffer), BLE_TYPE, currentDevice);
                },
                (err) => {
                  console.error("Read BLE-9100 sensor data error", JSON.stringify(err));
                }
              );
            },
            () => {
              console.log("Sensor already disconnected. Stop reading");
              clearInterval(intervalId);
            }
          );
        }, 505);
      } else {
        ble.startNotification(
          deviceId,
          BLE_SERVICE_ID,
          BLE_TX_ID,
          (buffer) => {
            callback(new Uint8Array(buffer), BLE_TYPE, currentDevice);
          },
          (err) => {
            console.error(`receiveBleNotification error`, err);
          }
        );
      }
    } catch (error) {
      console.error("ble.startNotification", error);
    }
  }

  onDataCallback(data, source, device) {
    DataManagerIST.onDataCallback(data, source, device);
  }

  writeBleData(deviceId, data) {
    try {
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
    } catch (error) {
      console.error(`WriteBleData device ${deviceId} error`, error);
    }
  }

  async writeUsbData(port, data) {
    try {
      await window._cdvElectronIpc.writeDeviceData(port, data);
      console.log(`writeUsbData port ${port} success`, data);
    } catch (error) {
      console.error(`writeUsbData port ${port} error`, error);
    }
  }

  startCheckingConnection() {
    setInterval(async () => {
      for (const device of this.devices) {
        if (device.isConnected) {
          // TODO >>> Clean up. Just a demo for writing data to device.
          /*
          try {
            const encodedData = Uint8Array.of(1);
            await this.writeBleData(device.deviceId, encodedData);
            console.log("Write BLE success to device", device.deviceId);
          } catch (error) {
            console.error("Write BLE error", error);
          }
          */
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

  sendCmdDTO(sensorId, cmd) {
    console.log("sendCmdDTO:", cmd);
    const parsedSensorId = parseInt(sensorId);
    const uartConnections = DataManagerIST.getUartConnections();
    const type = uartConnections.has(parsedSensorId) ? USB_TYPE : BLE_TYPE;
    if (type === BLE_TYPE) {
      const bleDevices = this.getBleDevices();
      const bleDevice = bleDevices.find((device) => device.id === parsedSensorId);
      let textEncoder = new TextEncoder();

      let uint8Array = textEncoder.encode(cmd);
      this.writeBleData(bleDevice.deviceId, uint8Array);
    } else if (type === USB_TYPE) {
      const usbDevices = DataManagerIST.getUsbDevices();
      const usbDevice = usbDevices.find((device) => device.sensorId === parsedSensorId);

      if (f7.device.android) {
        MobileSerialManagerIST.writeUsbData(usbDevice.deviceId, cmd);
      } else this.writeUsbData(usbDevice.deviceId, cmd);
    }
  }
}

export default DeviceManager.getInstance();
