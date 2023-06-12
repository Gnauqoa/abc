import React, { useRef, useEffect, useState } from "react";
import { Page, Navbar, Button, f7, Popup, NavLeft, NavTitle } from "framework7-react";

import _ from "lodash";

import SensorSettingTab from "./sensor-setting";
import SensorCalibratingTab from "./sensor-calibrating";
import RemoteLoggingTab from "./remote-logging";
import OtherSettingsTab from "./other-settings";
import "./index.scss";

import SensorServicesIST from "../../../services/sensor-service";
import DeviceManagerIST from "../../../services/device-manager";
import DataManagerIST from "../../../services/data-manager";
import { BLE_TYPE, USB_TYPE } from "../../../js/constants";
import { saveFile } from "../../../services/file-service";
import { getCurrentTime } from "../../../utils/core";

const SENSOR_SETTING_TAB = 1;
const SENSOR_CALIBRATING_TAB = 2;
const REMOTE_LOGGING_TAB = 3;
const OTHER_SETTINGS_TAB = 4;

const defaultTab = 1;
const settingTabs = {
  [SENSOR_SETTING_TAB]: "Cài đặt hiển thị",
  [SENSOR_CALIBRATING_TAB]: "Hiệu chỉnh cảm biến",
  [REMOTE_LOGGING_TAB]: "Remote logging",
  [OTHER_SETTINGS_TAB]: "Chức năng khác",
};

const SensorSettingPopup = ({ openedPopup, onClosePopup, sensorId, sensorDataIndex, onSaveSetting }) => {
  const sensorSettingPopupRef = useRef();
  const [currentTab, setCurrentTab] = useState(defaultTab);
  const [sensorInfo, setSensorInfo] = useState({});

  useEffect(() => {
    getSensors();
    setCurrentTab(defaultTab);
  }, [sensorId]);

  const getSensors = () => {
    const sensorInfo = SensorServicesIST.getSensorInfo(sensorId);
    sensorInfo !== null && setSensorInfo(sensorInfo);
  };

  const onSaveSensorSettingHandler = (newSensorUnitInfo) => {
    SensorServicesIST.updateSensorSetting(sensorId, newSensorUnitInfo);
    onSaveSetting(sensorId, newSensorUnitInfo);
    getSensors();
    onClosePopup();
  };

  const onSaveSensorCalibratingHandler = (calculatedValues) => {
    const { k, offset, sensorId } = calculatedValues;

    const parsedSensorId = parseInt(sensorId);
    const uartConnections = DataManagerIST.getUartConnections();
    const type = uartConnections.has(parsedSensorId) ? USB_TYPE : BLE_TYPE;

    console.log(`${parsedSensorId}-${type}: y = ax + b => `, `y = ${k}x + ${offset}`);
    // calib command: $$$cal,set,k,offset###
    let strCalib = "$$$cal,set," + k + "," + offset + "###";

    if (type === BLE_TYPE) {
      const bleDevices = DeviceManagerIST.getBleDevices();
      const bleDevice = bleDevices.find((device) => device.id === parsedSensorId);
      let textEncoder = new TextEncoder();
      
      let uint8Array = textEncoder.encode(strCalib);
      DeviceManagerIST.writeBleData(bleDevice.deviceId, uint8Array);
    } else if (type === USB_TYPE) {
      const usbDevices = DataManagerIST.getUsbDevices();
      const usbDevice = usbDevices.find((device) => device.sensorId === parsedSensorId);

      DeviceManagerIST.writeUsbData(usbDevice.deviceId, strCalib);
    }
    onClosePopup();
  };

  const onSaveOtherSettingsHandler = ({ sensorId, action, data }) => {
    const parsedSensorId = parseInt(sensorId);
    const uartConnections = DataManagerIST.getUartConnections();
    const type = uartConnections.has(parsedSensorId) ? USB_TYPE : BLE_TYPE;

    if (action == "zero") {
      // zero command: $$$zer###
      let cmdZero = "$$$zer###";

      if (type === BLE_TYPE) {
        const bleDevices = DeviceManagerIST.getBleDevices();
        const bleDevice = bleDevices.find((device) => device.id === parsedSensorId);
        let textEncoder = new TextEncoder();
        
        let uint8Array = textEncoder.encode(cmdZero);
        DeviceManagerIST.writeBleData(bleDevice.deviceId, uint8Array);
      } else if (type === USB_TYPE) {
        const usbDevices = DataManagerIST.getUsbDevices();
        const usbDevice = usbDevices.find((device) => device.sensorId === parsedSensorId);

        DeviceManagerIST.writeUsbData(usbDevice.deviceId, cmdZero);
      }
    }
  };

  const onSaveRemoteLoggingHandler = async ({ sensorId, action, data }) => {
    console.log(sensorId, action, data);
    switch (action) {
      case "download-log": {
        const sensorLog = await SensorServicesIST.getSensorLog(sensorId);
        const name = `${sensorInfo.name}-${getCurrentTime()}.log`;
        saveFile("", sensorLog, {
          ext: "log",
          name,
        });
        break;
      }
    }
  };

  const onChangeTab = async (event) => {
    const tabId = parseInt(event.target.id);
    setCurrentTab(tabId);
    if (tabId === REMOTE_LOGGING_TAB) {
      const isSensorLogAvailable = await SensorServicesIST.isSensorLogAvailable(sensorId);
      const updatedSensorInfo = { ...sensorInfo, isSensorLogAvailable };
      setSensorInfo(updatedSensorInfo);
    }
  };

  return (
    <Popup
      opened={openedPopup}
      onPopupClosed={onClosePopup}
      className="sensor-setting-popup"
      ref={sensorSettingPopupRef}
    >
      <Page className="sensor-setting">
        <Navbar>
          <NavLeft>
            <Button
              iconIos="material:arrow_back"
              iconMd="material:arrow_back"
              iconAurora="material:arrow_back"
              className="back-icon margin-right"
              popupClose
            ></Button>
          </NavLeft>
          <NavTitle style={{ color: "#0086ff" }}>{sensorInfo?.name}</NavTitle>
        </Navbar>
        <div className="__content">
          <div className="__navbar">
            {Object.keys(settingTabs).map((tabId) => {
              return (
                <Button
                  key={tabId}
                  id={tabId}
                  className={`nav-button ${parseInt(tabId) === currentTab ? "active" : "inactive"}`}
                  raised
                  fill
                  onClick={onChangeTab}
                >
                  {settingTabs[tabId]}
                </Button>
              );
            })}
          </div>

          <div className="__setting-content">
            {currentTab === SENSOR_SETTING_TAB && (
              <SensorSettingTab
                sensorInfo={sensorInfo}
                sensorDataIndex={sensorDataIndex}
                onSaveHandler={onSaveSensorSettingHandler}
              />
            )}
            {currentTab === SENSOR_CALIBRATING_TAB && (
              <SensorCalibratingTab
                sensorInfo={sensorInfo}
                sensorDataIndex={sensorDataIndex}
                onSaveHandler={onSaveSensorCalibratingHandler}
              />
            )}
            {currentTab === REMOTE_LOGGING_TAB && (
              <RemoteLoggingTab
                sensorInfo={sensorInfo}
                sensorDataIndex={sensorDataIndex}
                onSaveHandler={onSaveRemoteLoggingHandler}
              />
            )}
            {currentTab === OTHER_SETTINGS_TAB && (
              <OtherSettingsTab
                sensorInfo={sensorInfo}
                sensorDataIndex={sensorDataIndex}
                onSaveHandler={onSaveOtherSettingsHandler}
              />
            )}
          </div>
        </div>
      </Page>
    </Popup>
  );
};

export default SensorSettingPopup;
