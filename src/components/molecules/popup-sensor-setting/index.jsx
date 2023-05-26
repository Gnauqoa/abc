import React, { useRef, useEffect, useState } from "react";
import { Page, Navbar, Button, f7, Popup, NavLeft, NavTitle } from "framework7-react";

import _ from "lodash";

import SensorSettingTab from "./sensor-setting";
import SensorCalibratingTab from "./sensor-calibrating";
import "./index.scss";

import SensorServicesIST from "../../../services/sensor-service";
import DeviceManagerIST from "../../../services/device-manager";
import DataManagerIST from "../../../services/data-manager";
import { BLE_TYPE, USB_TYPE } from "../../../js/constants";

const SENSOR_SETTING_TAB = 1;
const SENSOR_CALIBRATING_TAB = 2;

const defaultTab = 1;
const settingTabs = {
  [SENSOR_SETTING_TAB]: "Cài đặt hiển thị",
  [SENSOR_CALIBRATING_TAB]: "Hiệu chỉnh cảm biến",
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

    if (type === BLE_TYPE) {
      const bleDevices = DeviceManagerIST.getBleDevices();
      const bleDevice = bleDevices.find((device) => device.id === parsedSensorId);
      const value = [k, offset];
      DeviceManagerIST.writeBleData(bleDevice.deviceId, value);
    }
    onClosePopup();
  };

  const onChangeTab = (event) => {
    const tabId = parseInt(event.target.id);
    setCurrentTab(tabId);
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
            {currentTab === SENSOR_SETTING_TAB ? (
              <SensorSettingTab
                sensorInfo={sensorInfo}
                sensorDataIndex={sensorDataIndex}
                onSaveHandler={onSaveSensorSettingHandler}
              />
            ) : (
              <SensorCalibratingTab
                sensorInfo={sensorInfo}
                sensorDataIndex={sensorDataIndex}
                onSaveHandler={onSaveSensorCalibratingHandler}
              />
            )}
          </div>
        </div>
      </Page>
    </Popup>
  );
};

export default SensorSettingPopup;
