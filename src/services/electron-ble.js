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
    this.devices = [];
    this.scanCallback = callback;
    // Make the request for devices
    let options = {
      optionalServices: [BLE_SERVICE_ID, 0xFF01],
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
    console.log('Disconnect: ', deviceId);
    if (this.servers[deviceId]) {
      this.servers[deviceId] = await this.servers[deviceId].disconnect();

      const device = this.devices.find((d) => d.deviceId === deviceId);
      device.isConnected = false;
      callback([...this.devices]);
    }
  };

  receiveDataCallback(device, callback) {
    if (!this.servers[device.deviceId]) {
      return;
    }

    if (device.code.includes ('BLE-9909')) {
      this.ble9909SensorReceiveDataCallback(device, callback);
    } else if (device.code.includes ('BLE-9100')) {
      this.ble9100SensorReceiveDataCallback(device, callback);
    } else {
      //this.innoLabSensorReceiveDataCallback(device, callback);
      this.servers[device.deviceId]
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
  };

  innoLabSensorReceiveDataCallback(device, callback) { //InnoLab type sensors
    this.servers[device.deviceId]
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

  ble9909SensorReceiveDataCallback(device, callback) { //YINMIK BLE-9909 type sensors
    this.servers[device.deviceId]
    .getPrimaryService(0xFF01)
    .then((service) => service.getCharacteristic(0xFF02))
    .then((characteristic) => characteristic.startNotifications())
    .then((characteristic) => {
      characteristic.removeEventListener("characteristicvaluechanged", () => {});
      //characteristic.addEventListener("characteristicvaluechanged", handleSensorDataChanged);
      characteristic.addEventListener("characteristicvaluechanged", (event) => {
        /* Each sensor data record has following structure
          serial    number            data    significance                                    
          0         1                 data                                    
                    2                 Calibration data                                    
          1         fixed at 2                                        
          2         0                 BLE-None,    Product name code                                
                    12                BLE-9100,                                    
                    BLE-9100                                        
          3         DO(mg/L)Value high 8 bits                                        
          4         DO(mg/L)lower 8 bits of value                                        
          5         DO(%)Value high 8 bits                                        
          6         DO(%)lower 8 bits of value                                        
          7                                            
          8                                            
          9                                            
          10                                            
          11                                            
          12                                            
          13        8-bit high temperature value                                        
          14        Temperature value lower 8 bits                                        
          15        Battery voltage value high 8 bits                                        
          16        Battery voltage value lower 8 bits                                        
          17        flag bit        0b 0000 0000    7    6    5    4    3    2    1    0
                        hold reading    Backlight status            
          18                                            
          19                                            
          20                                            
          21                                            
          22                                            
          23    Check Digit    Please refer to the CheckSum form    
        */
          
        const value = event.target.value;
        // ### DECODING ###
        let tmp = 0;
        let hibit = 0;
        let lobit = 0;
        let hibit1 = 0;
        let lobit1 = 0;
        let message = new Uint8Array(value.buffer);
        
        for (let i = message.length-1 ; i > 0; i--) {
          tmp=message[i];
          hibit1=(tmp&0x55)<<1;
          lobit1=(tmp&0xAA)>>1;
          tmp=message[i-1];    
          hibit=(tmp&0x55)<<1;
          lobit=(tmp&0xAA)>>1;
          
          message[i]=~(hibit1|lobit);
          message[i-1]=~(hibit|lobit1);

        }

        let hold_reading = message[17] >> 4;

        let backlight = (message[17] & 0x0F) >> 3

        let ec = ((message[5] << 8) + message[6]);

        let tds = ((message[7] << 8) + message[8]);

        let salt_tds = ((message[9] << 8) + message[10]);

        let salt_sg = ((message[11] << 8) + message[12])/100;

        let ph = ((message[3] << 8) + message[4])/100;

        let temp = ((message[13] << 8) + message[14])/10;

        let batt = parseInt(((message[15] << 8) + message[16])/32);

        var sensorData = [];

        sensorData.push(ph);
        sensorData.push(ec);
        sensorData.push(tds);
        sensorData.push(salt_sg);
        sensorData.push(salt_tds);
        sensorData.push(temp);

        var dataArray = [device.id, batt, BLE_TYPE, 24]
        sensorData.forEach(function (d, i) {
          dataArray.push(d);
        });

        callback(dataArray);
      });

      let intervalId = setInterval(function () {
        characteristic.readValue().catch((error) => {
          console.error(error);
          if (error.message.includes('GATT Server is disconnected')) {
            console.log('Sensor just disconnected');
            clearInterval(intervalId);
          }
          
        });
      }, 500);
    })
    .catch((err) => {
      console.log("receiveDataCallback error", err.message);
    });
  };

  ble9100SensorReceiveDataCallback(device, callback) { //YINMIK BLE-9909 type sensors
    this.servers[device.deviceId]
    .getPrimaryService(0xFF01)
    .then((service) => service.getCharacteristic(0xFF02))
    .then((characteristic) => characteristic.startNotifications())
    .then((characteristic) => {
      characteristic.removeEventListener("characteristicvaluechanged", () => {});
      //characteristic.addEventListener("characteristicvaluechanged", handleSensorDataChanged);
      characteristic.addEventListener("characteristicvaluechanged", (event) => {
        /* Each sensor data record has following structure
          serial    number            data    significance                                    
          0         1                 data                                    
                    2                 Calibration data                                    
          1         fixed at 2                                        
          2         0                 BLE-None,    Product name code                                
                    12                BLE-9100,                                    
                    BLE-9100                                        
          3         DO(mg/L)Value high 8 bits                                        
          4         DO(mg/L)lower 8 bits of value                                        
          5         DO(%)Value high 8 bits                                        
          6         DO(%)lower 8 bits of value                                        
          7                                            
          8                                            
          9                                            
          10                                            
          11                                            
          12                                            
          13        8-bit high temperature value                                        
          14        Temperature value lower 8 bits                                        
          15        Battery voltage value high 8 bits                                        
          16        Battery voltage value lower 8 bits                                        
          17        flag bit        0b 0000 0000    7    6    5    4    3    2    1    0
                        hold reading    Backlight status            
          18                                            
          19                                            
          20                                            
          21                                            
          22                                            
          23    Check Digit    Please refer to the CheckSum form    
        */
          
        const value = event.target.value;
        // ### DECODING ###
        let tmp = 0;
        let hibit = 0;
        let lobit = 0;
        let hibit1 = 0;
        let lobit1 = 0;
        let message = new Uint8Array(value.buffer);
        
        for (let i = message.length-1 ; i > 0; i--) {
          tmp=message[i];
          hibit1=(tmp&0x55)<<1;
          lobit1=(tmp&0xAA)>>1;
          tmp=message[i-1];    
          hibit=(tmp&0x55)<<1;
          lobit=(tmp&0xAA)>>1;
          
          message[i]=~(hibit1|lobit);
          message[i-1]=~(hibit|lobit1);

        }
        
        let do_mg = ((message[3] << 8) + message[4])/100;
        //console.log('DO (mg/L) = ' + do_mg);
        let do_percent = ((message[5] << 8) + message[6])/10;
        //console.log('DO (%) = ' + do_percent);
        let temp = ((message[13] << 8) + message[14])/10;
        //console.log('Temp (*C) = ' + (((temp/10.0) * (9.0/5.0)) + 32.0));
        let batt = parseInt(((message[15] << 8) + message[16])/32);
        //console.log('Battery (%) = ' + batt);

        var sensorData = [];

        sensorData.push(do_mg);
        sensorData.push(do_percent);
        sensorData.push(temp);

        var dataArray = [device.id, batt, BLE_TYPE, 12]
        sensorData.forEach(function (d, i) {
          dataArray.push(d);
        });

        callback(dataArray);
      });
  }
}
