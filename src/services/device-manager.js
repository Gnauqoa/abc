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
    const currentDevice = this.devices.find((d) => d.deviceId === deviceId);
    if (currentDevice === undefined)  {
      return;
    }
    try {
      console.log(currentDevice.code);
      if (currentDevice.code.includes('BLE-9909')) {
        ble.startNotification(
          deviceId,
          'FF01',
          'FF02',
          (buffer) => {
            this.decodeDataFromBLE9909Sensor(buffer, callback);
          },
          (err) => {
            console.error(`BLE-9909 startNotification error`, err);
            console.log(err.message);
          }
        );

        let intervalId = setInterval(function () {
          ble.isConnected(
            deviceId,
            function() {
              ble.read(
                deviceId,
                'FF01',
                'FF02',
                //'180A', //battery service
                //'2A25', // battery characteristics
                (buffer) => {
                  console.log('Got BLE-9909 data');
                  this.decodeDataFromBLE9909Sensor(buffer, callback);
                },
                (err) => {
                  console.error('Read BLE-9909 sensor data error', JSON.stringify(err));
                }
              );
            },
            function() {
                console.log("Sensor already disconnected. Stop reading");
                clearInterval(intervalId);
            }
          );
        }, 505);

      } else if (currentDevice.code.includes('BLE-9100')) {
        ble.startNotification(
          deviceId,
          '0000ff01-0000-1000-8000-00805f9b34fb',
          '0000ff02-0000-1000-8000-00805f9b34fb',
          (buffer) => {
            this.decodeDataFromBLE9100Sensor(buffer, callback);
          },
          (err) => {
            console.error('BLE-9100 startNotification error', err);
          }
        );

        let intervalId = setInterval(function () {
          ble.isConnected(
            deviceId,
            function() {
              ble.read(
                deviceId,
                'FF01',
                'FF02',
                (buffer) => {
                  this.decodeDataFromBLE9100Sensor(buffer, callback);
                },
                (err) => {
                  console.error('Read BLE-9100 sensor data error', JSON.stringify(err));
                }
              );
            },
            function() {
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
            this.decodeDataFromInnoLabSensor(buffer, callback);
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

  decodeDataFromInnoLabSensor(buffer, callback) {
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
  }

  decodeDataFromBLE9909Sensor(buffer, callback) { //YINMIK BLE-9909 type sensors
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
    // ### DECODING ###
    let tmp = 0;
    let hibit = 0;
    let lobit = 0;
    let hibit1 = 0;
    let lobit1 = 0;
    let message = new Uint8Array(buffer);
    
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
  }

  decodeDataFromBLE9100Sensor(buffer, callback) { //YINMIK BLE-9100 DO type sensors
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

    // ### DECODING ###
    let tmp = 0;
    let hibit = 0;
    let lobit = 0;
    let hibit1 = 0;
    let lobit1 = 0;
    let message = new Uint8Array(buffer);
    
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
            //await this.writeBleData(device.deviceId, encodedData);
            //console.log("Write BLE success to device", device.deviceId);
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
