import { BLE_SERVICE_ID, BLE_TX_ID, BLE_RX_ID, BLE_TYPE } from "../js/constants";
import SensorServices from "./sensor-service";
import * as core from "../utils/core";

const CMD_PROG_START_PREFIX = 0x12;
const CMD_PROG_END_PREFIX = 0x13;
export class WebBle {
  constructor() {
    this.devices = [];
    this.chosenDevices = {};
    this.currentChosenDevice = null;
    this.servers = {};
    this.scanCallback = null;
    try {
      window._cdvElectronIpc.onScanBleResults((event, devices) => {
        this.scanCallback(this.getAvailableDevices(devices));
      });
    } catch (error) {
      console.log(error);
    }
  }

  getAvailableDevices(scannedDevices) {
    scannedDevices.forEach((d) => this.handleScannedDevice(d));
    return this.devices.filter((localDevice) => {
      return (
        localDevice.isConnected === true ||
        scannedDevices.some((scannedDevice) => {
          return scannedDevice.deviceId === localDevice.deviceId;
        })
      );
    });
  }

  handleScannedDevice(device) {
    const existingDevice = this.devices.find((d) => d.deviceId === device.deviceId);
    if (!existingDevice) {
      const newDevice = {
        deviceId: device.deviceId,
        code: device.deviceName,
        type: BLE_TYPE,
        isConnected: false,
      };

      const sensor = SensorServices.getSensorByCode(newDevice.code);
      sensor !== null && this.devices.push({ ...sensor, ...newDevice });
    }
  }

  startScanning = async (callback) => {
    this.scanCallback = callback;
    // Make the request for devices
    let options = {
      optionalServices: [BLE_SERVICE_ID, 0xff01],
      acceptAllDevices: true,
      /*
      filters: [
        {
          namePrefix: DEVICE_PREFIX,
        },
      ],
      */
    };

    this.currentChosenDevice = await navigator.bluetooth.requestDevice(options);
  };

  cancelScanning = async () => {
    window._cdvElectronIpc.selectBleDevice("");
    await core.sleep(200);
  };

  removeUnavailableDevices(scannedDevices) {
    const devideIdsToBeRemoved = this.devices
      .filter((d) => !d.isConnected)
      .filter((d) => {
        return scannedDevices.every((scannedDevice) => {
          return scannedDevice.deviceId !== d.deviceId;
        });
      })
      .map((d) => d.deviceId);

    this.devices = this.devices.filter((d) => !devideIdsToBeRemoved.includes(d.deviceId));
  }

  connect = async (deviceId, successCallback, errorCallback, dataCallback) => {
    try {
      window._cdvElectronIpc.selectBleDevice(deviceId);

      await core.sleep(100);

      this.chosenDevices[deviceId] = this.currentChosenDevice;
      this.servers[deviceId] = await this.currentChosenDevice.gatt.connect();
      this.currentChosenDevice.addEventListener("gattserverdisconnected", errorCallback);
      const currentDevice = this.devices.find((d) => d.deviceId === deviceId);
      currentDevice.isConnected = true;

      successCallback([...this.devices]);
      this.receiveDataCallback(currentDevice, dataCallback);
    } catch (error) {
      console.error("connect error", error);
      errorCallback();
    }
  };

  disconnect = async (deviceId, callback) => {
    console.log("Disconnect: ", deviceId);
    if (this.servers[deviceId]) {
      this.servers[deviceId] = await this.servers[deviceId].disconnect();

      const device = this.devices.find((d) => d.deviceId === deviceId);
      device.isConnected = false;
      callback([...this.devices]);
    }
  };

  writeData = (deviceId, data) => {
    return new Promise((resolve, reject) => {
      const server = this.servers[deviceId];
      if (server) {
        server
          .getPrimaryService(BLE_SERVICE_ID)
          .then((service) => service.getCharacteristic(BLE_RX_ID))
          .then((characteristic) => {
            const buffer = new Uint8Array([CMD_PROG_START_PREFIX, ...data, CMD_PROG_END_PREFIX]);
            const dataView = new DataView(buffer.buffer);
            return characteristic.writeValue(dataView);
          })
          .then(() => resolve())
          .catch((err) => {
            reject(err);
          });
      } else {
        reject("BLE server not found");
      }
    });
  };

  receiveDataCallback(device, callback) {
    if (!this.servers[device.deviceId]) {
      return;
    }

    if (device.code.includes("BLE-9909") || device.code.includes("BLE-C600")) {
      this.ble9909SensorReceiveDataCallback(device, callback);
    } else if (device.code.includes("BLE-9100")) {
      this.ble9100SensorReceiveDataCallback(device, callback);
    } else {
      this.innoLabSensorReceiveDataCallback(device, callback);
    }
  }

  innoLabSensorReceiveDataCallback(device, callback) {
    //InnoLab type sensors
    this.servers[device.deviceId]
      .getPrimaryService(BLE_SERVICE_ID)
      .then((service) => service.getCharacteristic(BLE_TX_ID))
      .then((characteristic) => characteristic.startNotifications())
      .then((characteristic) => {
        characteristic.removeEventListener("characteristicvaluechanged", () => {});
        characteristic.addEventListener("characteristicvaluechanged", (event) => {
          const data = event.target.value;
          let dataArray = [];
          for (let i = 0; i < data.byteLength; i++) {
            dataArray.push(data.getUint8(i));
          }
          callback(Uint8Array.from(dataArray), BLE_TYPE, device);
        });
      })
      .catch((err) => {
        console.log("receiveDataCallback error", err.message);
      });
  }

  ble9909SensorReceiveDataCallback(device, callback) {
    //YINMIK BLE-9909 type sensors
    this.servers[device.deviceId]
      .getPrimaryService(0xff01)
      .then((service) => service.getCharacteristic(0xff02))
      .then((characteristic) => characteristic.startNotifications())
      .then((characteristic) => {
        characteristic.removeEventListener("characteristicvaluechanged", () => {});
        characteristic.addEventListener("characteristicvaluechanged", (event) => {
          const value = event.target.value;
          callback(Uint8Array.from(value.buffer), BLE_TYPE, device);
        });

        let intervalId = setInterval(function () {
          characteristic.readValue().catch((error) => {
            console.error(error);
            if (error.message.includes("GATT Server is disconnected")) {
              console.log("Sensor just disconnected");
              clearInterval(intervalId);
            }
          });
        }, 1001);
      })
      .catch((err) => {
        console.log("receiveDataCallback error", err.message);
      });
  }

  ble9100SensorReceiveDataCallback(device, callback) {
    //YINMIK BLE-9909 type sensors
    this.servers[device.deviceId]
      .getPrimaryService(0xff01)
      .then((service) => service.getCharacteristic(0xff02))
      .then((characteristic) => characteristic.startNotifications())
      .then((characteristic) => {
        characteristic.removeEventListener("characteristicvaluechanged", () => {});
        characteristic.addEventListener("characteristicvaluechanged", (event) => {
          const value = event.target.value;
          callback(Uint8Array.from(value.buffer), BLE_TYPE, device);
        });

        let intervalId = setInterval(function () {
          characteristic.readValue().catch((error) => {
            console.error(error);
            if (error.message.includes("GATT Server is disconnected")) {
              console.log("Sensor just disconnected");
              clearInterval(intervalId);
            }
          });
        }, 1001);
      });
  }
}
