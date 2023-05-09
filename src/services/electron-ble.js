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

  connect = async (deviceId, connectedCallback, disconnectedCallback, dataCallback) => {
    window._cdvElectronIpc.selectBleDevice(deviceId);

    await core.sleep(100);

    this.chosenDevices[deviceId] = this.currentChosenDevice;
    this.currentChosenDevice.addEventListener("gattserverdisconnected", disconnectedCallback);
    this.servers[deviceId] = await this.currentChosenDevice.gatt.connect();
    const currentDevice = this.devices.find((d) => d.deviceId === deviceId);
    currentDevice.isConnected = true;

    connectedCallback([...this.devices]);
    this.receiveDataCallback(deviceId, dataCallback);
  };

  disconnect = async (deviceId, callback) => {
    console.log('Disconnect: ', deviceId);
    if (this.servers[deviceId]) {
      this.servers[deviceId] = await this.servers[deviceId].disconnect();

      const device = this.devices.find((d) => d.deviceId === deviceId);
      device.isConnected = false;
      callback([...this.devices]);
    }
  };

  receiveDataCallback(deviceId, callback) {
    console.log(deviceId);
    console.log(this.servers);
    if (!this.servers[deviceId]) {
      return;
    }

    this.servers[deviceId]
      .getPrimaryService(BLE_SERVICE_ID)
      .then((service) => service.getCharacteristic(BLE_TX_ID))
      .then((characteristic) => characteristic.startNotifications())
      .then((characteristic) => {
        characteristic.removeEventListener("characteristicvaluechanged", () => {});
        //characteristic.addEventListener("characteristicvaluechanged", handleSensorDataChanged);
        characteristic.addEventListener("characteristicvaluechanged", (event) => {
          /* Each sensor data record has following structure
            0xAA - start byte
            Sensor ID - 1 byte
            Sensor Serial ID - 1 byte
            Data length - 1 byte
            Sensor data [0..len] - 4 byte per data
            Checksum - 1 byte xor(start byte, sensor id, sensor serial ... data[len])
            0xBB - stop byte (already cut off by serial delimiter parser)
          */
            let data = event.target.value;

            if (data.getUint8(0) != 0xAA) {
              // Invalid data, ignore
              return;
            }

            var sensorId = data.getUint8(1);
            var sensorSerial = data.getUint8(2); // TODO: Will use later
            var battery = data.getUint8(3);
            var dataLength = data.getUint8(4);
            var checksum = data.getUint8(5 + dataLength);
            var calculatedChecksum = 0xFF;
            for (var i=0; i<(dataLength+5); i++) {
              calculatedChecksum = calculatedChecksum ^ data.getUint8(i);
            }

            if (calculatedChecksum != checksum) {
              console.log('Invalid data received');
              return;
            }

            var dataRead = 0;
            var sensorData = [];

            while (dataRead < dataLength) {
              // read next 4 bytes
              var rawBytes = [data.getUint8(dataRead+5), data.getUint8(dataRead+6),
                data.getUint8(dataRead+7), data.getUint8(dataRead+8)];

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

            //console.log(dataArray);

            callback(dataArray);
        });
      })
      .catch((err) => {
        console.log("receiveDataCallback error", err.message);
      });
  }
}
