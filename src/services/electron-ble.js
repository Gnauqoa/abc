import { BLE_SERVICE_ID, BLE_TX_ID, BLE_RX_ID, BLE_TYPE, DEVICE_PREFIX } from "../js/constants";
import SensorServices from "./sensor-service";
import * as core from "../utils/core";

export class WebBle {
  constructor() {
    this.devices = [];
    this.chosenDevices = {};
    this.currentChosenDevice = null;
    this.servers = {};
    this.scanCallback = null;
    window._cdvElectronIpc.onScanBleResults((event, devices) => {
      devices.forEach((d) => this.handleScannedDevice(d));
      this.scanCallback([...this.devices]);
    });
  }

  handleScannedDevice(device) {
    const deviceIndex = this.devices.findIndex((d) => d.deviceId === device.deviceId);
    if (deviceIndex < 0) {
      const newFoundDevice = {
        deviceId: device.deviceId,
        code: device.deviceName,
        type: BLE_TYPE,
        isConnected: false,
      };

      const sensor = SensorServices.getSensorByCode(newFoundDevice.code);
      sensor !== null && this.devices.push({ ...sensor, ...newFoundDevice });
    }
  }

  startScanning = async (callback) => {
    this.scanCallback = callback;
    // Make the request for devices
    let options = {
      optionalServices: [BLE_SERVICE_ID],
      filters: [
        {
          namePrefix: DEVICE_PREFIX,
        },
      ],
    };

    this.currentChosenDevice = await navigator.bluetooth.requestDevice(options);
  };

  cancelScanning = async () => {
    window._cdvElectronIpc.selectBleDevice("");
    await core.sleep(200);
  };

  connect = async (deviceId, connectedCallback, dataCallback) => {
    window._cdvElectronIpc.selectBleDevice(deviceId);

    await core.sleep(100);

    this.chosenDevices[deviceId] = this.currentChosenDevice;

    this.servers[deviceId] = await this.currentChosenDevice.gatt.connect();
    const currentDevice = this.devices.find((d) => d.deviceId === deviceId);
    currentDevice.isConnected = true;

    connectedCallback([...this.devices]);
    this.receiveDataCallback(deviceId, dataCallback);
  };

  disconnect = async (deviceId, callback) => {
    if (this.servers[deviceId]) {
      this.servers[deviceId] = await this.servers[deviceId].disconnect();

      const device = this.devices.find((d) => d.deviceId === deviceId);
      device.isConnected = false;
      callback([...this.devices]);
    }
  };

  receiveDataCallback(deviceId, callback) {
    if (!this.servers[deviceId]) {
      return;
    }

    this.servers[deviceId]
      .getPrimaryService(BLE_SERVICE_ID)
      .then((service) => service.getCharacteristic(BLE_TX_ID))
      .then((characteristic) => characteristic.startNotifications())
      .then((characteristic) => {
        characteristic.removeEventListener("characteristicvaluechanged", () => {});
        characteristic.addEventListener("characteristicvaluechanged", (event) => {
          const data = new TextDecoder("utf-8").decode(event.target.value);
          callback(data);
        });
      })
      .catch((err) => {
        console.log("receiveDataCallback error", err.message);
      });
  }
}
