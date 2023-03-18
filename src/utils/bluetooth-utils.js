import { f7 } from "framework7-react";
// import store from "store";
import * as core from "./core";
import * as sharedDataUtils from "./shared-data-utils";
import dialog from "../components/dialog";

import {
  DEVICE_PREFIX,
  MIN_SCAN_TIME,
  MAX_SCAN_TIME,
  BLE_SERVICE_ID,
  BLE_RX_ID,
  BLE_TX_ID,
  YOLOBIT,
  MYROBOT,
} from "../js/constants";

let $bleDevice;
let $bleServer;
let $deviceId;
let $characteristics;
let $data_buffer = new Uint8Array();
let $tmp_buffer = new Uint8Array();
let scanTime = MIN_SCAN_TIME;
let timeoutScan;

export function autoConnectDeviceWeb(success, failure, disconnect) {
  const id = core.getConnectedDeviceId();
  if (!id) {
    console.log("No connected devices");
    failure();
    return;
  }
  let isFoundDevice = false;
  let isError = false;
  let isReceived = false;

  console.log("Getting existing permitted Bluetooth devices...");
  navigator.bluetooth
    .getDevices()
    .then((devices) => {
      console.log("> Got " + devices.length + " Bluetooth devices.");
      // These devices may not be powered on or in range, so scan for
      // advertisement packets from them before connecting.
      for (const device of devices) {
        if (device.id == id) {
          isFoundDevice = true;
          const abortController = new AbortController();
          device.addEventListener(
            "advertisementreceived",
            (event) => {
              console.log('> Received advertisement from "' + device.name + '"...');
              // Stop watching advertisements to conserve battery life.
              isReceived = true;
              abortController.abort();
              $bleDevice = device;
              $bleDevice.removeEventListener("gattserverdisconnected", () => disconnect());
              $bleDevice.addEventListener("gattserverdisconnected", () => disconnect());
              console.log('Connecting to GATT Server from "' + device.name + '"...');
              device.gatt
                .connect()
                .then((server) => {
                  console.log('> Bluetooth device "' + device.name + " connected.");
                  $bleServer = server;
                  success(device);
                })
                .catch((error) => {
                  console.log("Error: " + error);
                  if (!isError) {
                    isError = true;
                    failure();
                  }
                });
            },
            { once: true }
          );

          console.log('Watching advertisements from "' + device.name + '"...');
          device
            .watchAdvertisements({ signal: abortController.signal })
            .then(() => {
              setTimeout(() => {
                abortController.abort();
                if (!isReceived && !isError) {
                  isError = true;
                  failure();
                }
              }, 2000);
            })
            .catch((error) => {
              console.log("Error: " + error);
              if (!isError) {
                isError = true;
                failure();
              }
            });
        }
      }
      if (!isFoundDevice && !isError) {
        isError = true;
        failure();
      }
    })
    .catch((error) => {
      console.log("User need to enable experiment features first:" + error);
      if (!isError) {
        isError = true;
        failure();
      }
    });
}

export function autoConnectDeviceCordova(success, failure, disconnect) {
  const id = core.getConnectedDeviceId();
  if (!id) {
    console.log("No connected devices");
  }
}

export function scanDevicesWeb(success, disconnect) {
  if (!navigator.bluetooth) {
    dialog.alert(
      "Lỗi kết nối",
      "Trình duyệt hiện tại không hỗ trợ kết nối Bluetooth. Vui lòng sử dụng trình duyệt Chrome phiên bản mới nhất.",
      () => {}
    );
    return;
  }

  let options = {
    optionalServices: [BLE_SERVICE_ID],
  };

  const namePrefix = DEVICE_PREFIX;

  let characterArray = Array(26)
    .fill(97)
    .map((x, y) => String.fromCharCode(x + y));

  if ([YOLOBIT, MYROBOT].includes(core.selectedDevice())) {
    // options["acceptAllDevices"] = true;
    options["filters"] = characterArray.map((item) => ({
      namePrefix: item,
    }));
  } else {
    options["filters"] = [
      {
        namePrefix: namePrefix,
      },
    ];
  }

  navigator.bluetooth
    .requestDevice(options)
    .then((device) => {
      $bleDevice = device;
      $bleDevice.removeEventListener("gattserverdisconnected", () => disconnect());
      $bleDevice.addEventListener("gattserverdisconnected", () => disconnect());
      return device.gatt.connect().then((server) => {
        $bleServer = server;
        success(device);
        core.updateConnectedDeviceNameHistory(
          device.name && device.name.length > 0 && device.name.substring(0, DEVICE_PREFIX.length) === DEVICE_PREFIX
            ? device.name.substring(DEVICE_PREFIX.length)
            : device.name,
          device.id
        );
      });
    })
    .catch((err) => {
      console.log("Scan devices from web error", err.message);
    });
}

export function disconnectDeviceWeb() {
  if ($bleDevice && $bleDevice.gatt.connected) {
    $bleDevice.gatt.disconnect();
  }
}

export function scanDevicesCordova(scanDone, error, showDevice) {
  try {
    let devices = [];

    const namePrefix = DEVICE_PREFIX;

    console.log("Start scan");
    ble.startScan(
      [],
      (device) => {
        console.log("Found device", device.id);
        if (
          device?.name?.length > 0 &&
          (device.name.substring(0, namePrefix.length) === namePrefix ||
            device?.advertising?.kCBAdvDataLocalName?.substring(0, namePrefix.length) === namePrefix ||
            [YOLOBIT, MYROBOT].includes(core.selectedDevice()))
        ) {
          const deviceIndex = devices.findIndex((d) => d.id === device.id);
          if (deviceIndex < 0) {
            let deviceName = device.name || device.id;
            if (deviceName === "ESP32" && device?.advertising?.kCBAdvDataLocalName?.length > 0) {
              deviceName = device.advertising.kCBAdvDataLocalName;
            }
            const newFoundDevice = {
              id: device.id,
              name: deviceName,
              rssi: device.rssi,
            };
            devices.push(newFoundDevice);
            showDevice(newFoundDevice);
          }
        }
      },
      (err) => {
        console.log("Auto connect device scan error", err);
        stopScanCordova();
      }
    );

    timeoutScan = setTimeout(() => {
      stopScanCordova(() => {
        if (devices.length > 0) {
          console.log("Found devices");
          scanTime = MIN_SCAN_TIME;
          scanDone();
        } else {
          scanTime = MAX_SCAN_TIME;
          console.log("Device not found");
          error();
        }
      });
    }, scanTime);
  } catch (err) {
    console.log("Auto connect catch error", err.message);
  }
}

function stopScanCordova(callback) {
  ble.stopScan(
    () => {
      console.log("Stop scan success");
      callback();
    },
    (err) => {
      console.log("Stop scan error", err);
      callback();
    }
  );
}

export function connectDevice(device, success, disconnect, isAutoConnect) {
  const deviceId = device.id;
  clearTimeout(timeoutScan);
  stopScanCordova(() => {
    ble.connect(
      deviceId,
      () => {
        console.log(`Connected device ${deviceId} success`);
        $deviceId = deviceId;
        scanTime = MIN_SCAN_TIME;
        success(device);
        ble.requestConnectionPriority(
          deviceId,
          "high",
          () => {
            console.log("requestConnectionPriority success");
          },
          () => {
            console.log("requestConnectionPriority error");
          }
        );
      },
      () => {
        console.log(`Device ${deviceId} auto disconnected`);
        if (!isAutoConnect || f7.device.android) disconnectDeviceCordova(() => {});
        disconnect();
      }
    );
  });
}

export function disconnectDeviceCordova(callback) {
  if ($deviceId) {
    ble.disconnect(
      $deviceId,
      () => {
        console.log(`Disconnected device ${$deviceId} success`);
        callback();
      },
      (err) => {
        console.log(`Disconnected device ${$deviceId} error`, err);
        callback();
      }
    );
  } else {
    callback();
  }
}

export function receiveBleNotificationWeb() {
  if (!$bleServer) {
    return;
  }

  const decoder = new TextDecoder("utf-8");

  $bleServer
    .getPrimaryService(BLE_SERVICE_ID)
    .then((service) => service.getCharacteristic(BLE_TX_ID))
    .then((characteristic) => characteristic.startNotifications())
    .then((characteristic) => {
      characteristic.removeEventListener("characteristicvaluechanged", () => {});
      characteristic.addEventListener("characteristicvaluechanged", (event) => {
        sharedDataUtils.udpateDataFromDevice(event.target.value, true);
      });
      console.log("BLE Notifications have been started.");
    })
    .catch((err) => {
      console.log("BLE Notifications error", err.message);
    });
}

export function receiveBleNotificationCordova() {
  ble.startNotification(
    $deviceId,
    BLE_SERVICE_ID,
    BLE_TX_ID,
    (buffer) => {
      // Decode the ArrayBuffer into a typed Array based on the data you expect
      sharedDataUtils.udpateDataFromDevice(new Uint8Array(buffer), true);
    },
    (err) => {
      console.log(`receiveBleNotificationCordova error`, err);
    }
  );
}

export function sendCommandToDeviceCordova(data) {
  return new Promise((resolve, reject) => {
    console.log(`Send command to device ${$deviceId}`);

    const serviceId = BLE_SERVICE_ID;
    const characteristicId = BLE_RX_ID;
    ble.write(
      $deviceId,
      serviceId,
      characteristicId,
      data.buffer,
      (res) => {
        console.log("ble write response ====", res);
        resolve(res);
      },
      (err) => {
        console.log(`Send command to device ${$deviceId} error`, err);
        reject(err);

        // return Promise.resolve()
        //   .then(() => new Promise((resolve) => setTimeout(resolve, 500)))
        //   .then(() => {
        //     reject(err);
        //   });
      }
    );
  });
}

export async function sendCommandToDeviceWebTerminal(data) {
  if (!$bleServer) throw new Error("sendCommandToDeviceWeb Ble is not existing error");
  try {
    let service = await $bleServer.getPrimaryService(BLE_SERVICE_ID);
    $characteristics = await service.getCharacteristic(BLE_RX_ID);
    $tmp_buffer = new Uint8Array($data_buffer.length + data.length);
    $tmp_buffer.set($data_buffer);
    $tmp_buffer.set(data, $data_buffer.length);
    $data_buffer = new Uint8Array();
    await $characteristics.writeValue($tmp_buffer);
  } catch (err) {
    $data_buffer = $tmp_buffer;
    console.log("sendCommandToDeviceWebTerminal", err);
  }
}

export function sendCommandToDeviceWeb(data) {
  return new Promise((resolve, reject) => {
    if (!$bleServer) {
      reject();
      throw new Error("sendCommandToDeviceWeb Ble is not existing error");
    }
    let _characteristic;

    $bleServer
      .getPrimaryService(BLE_SERVICE_ID)
      .then((service) => service.getCharacteristic(BLE_RX_ID))
      .then((characteristic) => {
        _characteristic = characteristic;
        return characteristic.writeValue(data);
      })
      .then(() => resolve())
      .catch((err) => {
        console.log("sendCommandToDeviceWeb error", err.message);
        reject(err);
        // if (!_characteristic) {
        //   reject();
        //   throw new Error("characteristic is none now");
        // }
        // setTimeout(() => {
        //   _characteristic
        //     .writeValue(data)
        //     .then(() => resolve())
        //     .catch((err) => {
        //       reject();
        //       console.log("sendCommandToDeviceWeb try again affer 500ms error", err.message);
        //       throw new Error(err.message);
        //     });
        // }, 200);
      });
  });
}

export function sendCommandToDevice(data, isTerminal = false) {
  try {
    if (f7.device.cordova) {
      return sendCommandToDeviceCordova(data);
    } else {
      if (isTerminal) return sendCommandToDeviceWebTerminal(data);
      return sendCommandToDeviceWeb(data);
    }
  } catch (err) {
    console.log("sendCommandToDevice error", err);
    throw new Error(err.message);
  }
}
