import React, { useRef } from "react";
import { useImmer } from "use-immer";
import { Popup, Page, Navbar, NavRight, Link, Block, Button, List, ListItem, NavTitle } from "framework7-react";
import "./index.scss";

import SensorServices from "../../../services/sensor-service";

const BLE_SERVICE_ID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const BLE_RX_ID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const BLE_TX_ID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
const DEVICE_PREFIX = "inno-";
const LIMIT_BYTE_BLE = 99;
import { USB_TYPE, BLE_TYPE } from "../../../js/constants";
import DataManagerIST from "../../../services/data-manager";

import signalStrengthIconFull from "../../../img/scan-devices/signal-strength-full.png";

export default function useDeviceManager() {
  const [devices, setDevices] = useImmer([]);
  const scanPopupRef = useRef(null);
  const timeoutScanRef = useRef(null);
  const connectedDevices = devices.filter((d) => d.isConnected === true);

  function openScanPopup() {
    scanPopupRef.current.f7Popup().open();
  }

  function scan() {
    try {
      ble.startScan(
        [],
        (device) => {
          console.log(JSON.stringify(device));
          if (
            device?.name?.includes(DEVICE_PREFIX) ||
            device?.advertising?.kCBAdvDataLocalName?.includes(DEVICE_PREFIX)
          ) {
            const deviceIndex = devices.findIndex((d) => d.deviceId === dummyDeviceId || d.isConnected === false);
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
              };
              const sensor = SensorServices.getSensorByCode(newFoundDevice.code);
              sensor && setDevices((draft) => [...draft, { ...sensor, ...newFoundDevice }]);
            }
          }
        },
        (err) => {
          console.error("ble.startScan", err);
        }
      );
      timeoutScanRef.current = setTimeout(handleStopScan, 30000);

      // const dummyDeviceIds = ["C6:A1:7A:4B:C1:EB"];
      // const dummyDeviceNames = ["inno-009-kpa"];
      // for (let i = 0; i < dummyDeviceIds.length; i++) {
      //   const dummyDeviceId = dummyDeviceIds[i];
      //   const dummyDeviceName = dummyDeviceNames[i];
      //   const deviceIndex = devices.findIndex((d) => d.deviceId === dummyDeviceId || d.isConnected === false);
      //   if (deviceIndex < 0) {
      //     let deviceName = dummyDeviceName || dummyDeviceId;
      //     const newFoundDevice = {
      //       deviceId: dummyDeviceId,
      //       code: deviceName,
      //       rssi: "-85",
      //       type: BLE_TYPE,
      //     };
      //     const sensor = SensorServices.getSensorByCode(newFoundDevice.code);
      //     sensor && setDevices((draft) => [...draft, { ...sensor, ...newFoundDevice }]);
      //   }
      // }
    } catch (err) {
      console.error("scan error", err.message);
    }
  }

  function handleStopScan(callback) {
    clearTimeout(timeoutScanRef.current);
    ble.stopScan(callback, (err) => {
      console.error("handleStopScan", err);
      callback();
    });
  }

  function toggleConnectDevice(deviceId) {
    const device = devices.find((d) => d.deviceId === deviceId);
    if (device.isConnected) {
      disconnect({ deviceId });
    } else {
      connect(deviceId);
    }
  }

  function disconnect({ deviceId, id }) {
    let device;
    if (deviceId !== undefined) {
      device = devices.find((d) => d.deviceId === deviceId);
    } else if (id !== undefined) {
      device = devices.find((d) => d.id === id);
    } else return;

    if (device === undefined) return;
    id = device.id;
    deviceId = device.deviceId;

    ble.disconnect(
      deviceId,
      () => {
        setDevices((draft) => {
          const device = draft.find((d) => d.deviceId === deviceId);
          device.isConnected = false;
        });

        DataManagerIST.callbackSensorDisconnected([id, BLE_TYPE]);
      },
      (err) => {
        console.error(`Disconnected device ${deviceId} error`, err);
      }
    );

    // setDevices((draft) => {
    //   const device = draft.find((d) => d.deviceId === deviceId);
    //   device.isConnected = false;
    // });
    // DataManagerIST.callbackSensorDisconnected([id, BLE_TYPE]);
  }

  function connect(deviceId) {
    ble.connect(
      deviceId,
      () => {
        setDevices((draft) => {
          const device = draft.find((d) => d.deviceId === deviceId);
          device.isConnected = true;
        });
        ble.requestConnectionPriority(
          deviceId,
          "high",
          () => {},
          () => {
            console.error(`Device ${deviceId} requestConnectionPriority error`);
          }
        );
        receiveDataCallback(deviceId, onDataCallback);
      },
      () => {
        setDevices((draft) => {
          const device = draft.find((d) => d.deviceId === deviceId);
          device.isConnected = false;
        });
      }
    );

    // setDevices((draft) => {
    //   const device = draft.find((d) => d.deviceId === deviceId);
    //   device.isConnected = true;
    // });
    // receiveDataCallback(deviceId, onDataCallback);
  }

  function onDataCallback(data) {
    console.log("onDataCallback: ", data);
    if (data === undefined) return;

    data = data.trim();

    const dataSplit = data.split(",");
    const dataSplitLength = dataSplit.length;

    if (dataSplitLength < 4 || dataSplit[0] !== "@" || dataSplit[dataSplitLength - 1] !== "*") return;

    // [sensorId, usbPort, dataLength, datas]
    const dataParsed = [dataSplit[1], BLE_TYPE, dataSplitLength - 3, ...dataSplit.slice(2, dataSplitLength - 1)];
    DataManagerIST.callbackReadSensor(dataParsed);
  }

  async function sendData(deviceId, data) {
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

  function sendBleData(deviceId, data) {
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

  function receiveDataCallback(deviceId, callback) {
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

    // callback("@,9,5.33,*");
  }

  function renderScanPopup() {
    return (
      <Popup ref={scanPopupRef} className="edl-popup scan-devices">
        <Page>
          <Navbar>
            <NavTitle style={{ color: "#0086ff" }}>Kết nối Cảm biến không dây</NavTitle>
            <NavRight>
              <Link iconIos="material:close" iconMd="material:close" iconAurora="material:close" popupClose></Link>
            </NavRight>
          </Navbar>
          <Block className="scan-block">
            <span>Tìm kiếm cảm biến</span>
            <Button
              className="scan-button"
              onClick={scan}
              iconIos="material:search"
              iconMd="material:search"
              iconAurora="material:search"
            ></Button>
          </Block>
          <Block className="devices-block">
            <List dividersIos outlineIos strongIos>
              {devices.map((d) => {
                if (!d.isConnected)
                  return (
                    <ListItem key={d.deviceId} link="#" title={d.name} onClick={() => toggleConnectDevice(d.deviceId)}>
                      <div className="item-after">
                        <img src={signalStrengthIconFull} alt={"signalStrengthIconFull"} />
                      </div>
                    </ListItem>
                  );
              })}
            </List>
          </Block>
        </Page>
      </Popup>
    );
  }

  return { connectedDevices, connect, disconnect, sendData, receiveDataCallback, openScanPopup, renderScanPopup };
}
