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
import { OFF, MQTT, FLASH, DOWNLOAD_LOG_ACTION, SET_LOG_SETTING } from "../../../js/constants";
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
    let strCalib = "$$$cal,set," + k + "," + offset + "###";

    DeviceManagerIST.sendCmdDTO(sensorId, strCalib);
    onClosePopup();
  };

  const onSaveOtherSettingsHandler = ({ sensorId, action, data }) => {
    if (action == "zero") {
      const cmdZero = "$$$zer###";

      DeviceManagerIST.sendCmdDTO(sensorId, cmdZero);
    }
  };

  const onSaveRemoteLoggingHandler = async ({ sensorId, action, data }) => {
    switch (action) {
      case DOWNLOAD_LOG_ACTION: {
        const sensorLog = await SensorServicesIST.remoteLoggingData(sensorId, data);
        var csvData = sensorLog
          .map(function (d) {
            return d.join();
          })
          .join("\n");
        const name = `${sensorInfo.name}-${getCurrentTime()}.log`;
        saveFile("", csvData, {
          ext: "log",
          name,
        });
        break;
      }
      case SET_LOG_SETTING: {
        const {
          loggingMode,
          duration,
          interval,
          wifiSSID,
          wifiPassword,
          mqttUri,
          mqttUsername,
          mqttPassword,
          channel,
          topics,
          startMode,
        } = data;
        let cmdRemoteLogging = "";
        if (loggingMode === FLASH) {
          cmdRemoteLogging = `$$$log,set,${startMode},${loggingMode},${duration},${interval}###`;
        } else if (loggingMode === MQTT) {
          cmdRemoteLogging = `$$$log,set,${startMode},${loggingMode},${duration},${interval},${wifiSSID},${wifiPassword},${mqttUri},${mqttUsername},${mqttPassword},${channel},{${topics.join(
            ";"
          )}}###`;
        } else if (loggingMode === OFF) {
          cmdRemoteLogging = "$$$log,set,0,0";
        }

        DeviceManagerIST.sendCmdDTO(sensorId, cmdRemoteLogging);
        break;
      }
    }
  };

  const onChangeTab = async (event) => {
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
