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
import {
  OFF,
  MQTT,
  FLASH,
  DOWNLOAD_LOG_ACTION,
  DELETE_LOG_ACTION,
  SET_LOG_SETTING,
  EVERY_STARTUP,
} from "../../../js/constants";
import useToast from "../../atoms/toast";
import DataManagerIST from "../../../services/data-manager";
import { useTranslation } from "react-i18next";

const SENSOR_SETTING_TAB = 1;
const SENSOR_CALIBRATING_TAB = 2;
const REMOTE_LOGGING_TAB = 3;
const OTHER_SETTINGS_TAB = 4;

const defaultTab = 1;
const defaultSettingTabs = {
  [SENSOR_SETTING_TAB]: "Cài đặt hiển thị",
  [SENSOR_CALIBRATING_TAB]: "Hiệu chỉnh cảm biến",
  [REMOTE_LOGGING_TAB]: "Lấy mẫu từ xa",
  [OTHER_SETTINGS_TAB]: "Chức năng khác",
};

const SensorSettingPopup = ({ openedPopup, onClosePopup, sensorId, sensorDataIndex, onSaveSetting }) => {
  const { t, i18n } = useTranslation();

  const sensorSettingPopupRef = useRef();
  const [currentTab, setCurrentTab] = useState(defaultTab);
  const [remoteLoggingInfo, setRemoteLoggingInfo] = useState([0, 0, 0, 0]);
  const sensorInfo = sensorId === undefined ? {} : SensorServicesIST.getSensorInfo(sensorId);
  const settingTabs = getSettingTabs();
  const toast = useToast();

  useEffect(() => {
    setCurrentTab(defaultTab);
  }, [sensorId]);

  function getSettingTabs() {
    return Object.keys(defaultSettingTabs)
      .filter((key) => {
        if (
          (Number(key) === REMOTE_LOGGING_TAB && sensorInfo.remote_logging === false) ||
          (Number(key) === SENSOR_CALIBRATING_TAB && sensorInfo.support_calib === false)
        ) {
          return false;
        }
        return true;
      })
      .reduce((cur, key) => {
        return Object.assign(cur, { [key]: defaultSettingTabs[key] });
      }, {});
  }

  const onSaveSensorSettingHandler = (newSensorUnitInfo) => {
    SensorServicesIST.updateSensorSetting(sensorId, newSensorUnitInfo);
    onSaveSetting(sensorId, newSensorUnitInfo);
    onClosePopup();
  };

  const onSaveSensorCalibratingHandler = (calculatedValues) => {
    const { k, offset, sensorId } = calculatedValues;
    let strCalib = "$$$cal,set," + k + "," + offset + "###";

    DeviceManagerIST.sendCmdDTO(sensorId, strCalib);
    toast.notifyCmdDTO();
    onClosePopup();
  };

  const onSaveOtherSettingsHandler = ({ sensorId, action, data }) => {
    if (action == "zero") {
      const cmdZero = "$$$zer###";

      DeviceManagerIST.sendCmdDTO(sensorId, cmdZero);
      toast.notifyCmdDTO();
    }
  };

  const onSaveRemoteLoggingHandler = async ({ sensorId, action, data }) => {
    switch (action) {
      case DOWNLOAD_LOG_ACTION: {
        try {
          const interval = data[2];
          const size = data[3];
          const sensorLog = await SensorServicesIST.remoteLoggingData(sensorId, size);
          let dataRunData = {};
          dataRunData[sensorId] = [];
          sensorLog.forEach((log, index) => {
            const sensorData = {
              time: (interval * index).toFixed(3),
              values: log.slice(2),
            };
            dataRunData[sensorId].push(sensorData);
          });

          const dataRun = {
            data: dataRunData,
            interval,
          };
          DataManagerIST.addRemoteLoggingDataRun(dataRun);
          toast.show(t("modules.download_data_successfully"));
        } catch (err) {
          console.error("Download remote logging error", err);
          err !== "cancel" && toast.show(t("modules.downloading_data_had_a_timeout_error"), "error");
        }
        break;
      }
      case DELETE_LOG_ACTION: {
        DeviceManagerIST.sendCmdDTO(sensorId, "$$$log,del###");
        toast.notifyCmdDTO();
        break;
      }
      case SET_LOG_SETTING: {
        let {
          loggingMode,
          duration,
          interval,
          wifiSSID,
          wifiPassword,
          mqttUri,
          mqttUsername,
          mqttPassword,
          topics,
          startMode,
        } = data;
        let cmdRemoteLogging = "";
        if (loggingMode === FLASH) {
          cmdRemoteLogging = `$$$log,set,${startMode},${loggingMode},${duration},${interval}###`;
        } else if (loggingMode === MQTT) {
          if (startMode === EVERY_STARTUP) duration = 0;
          cmdRemoteLogging = `$$$log,set,${startMode},${loggingMode},${duration},${interval},${wifiSSID},${wifiPassword},${mqttUri},${mqttUsername},${mqttPassword},{${topics.join(
            ";"
          )}}###`;
        } else if (loggingMode === OFF) {
          cmdRemoteLogging = "$$$log,set,0,0###";
        }

        DeviceManagerIST.sendCmdDTO(sensorId, cmdRemoteLogging);
        toast.notifyCmdDTO();
        break;
      }
    }
  };

  async function checkRemoteLogging() {
    try {
      const logInfo = SensorServicesIST.remoteLoggingInfo(sensorId);
      toast.notifyCmdDTO(t("modules.check_log"));
      setRemoteLoggingInfo(await logInfo);
    } catch {
      setRemoteLoggingInfo([0, 0, 0, 0]);
    }
  }

  const onChangeTab = async (event) => {
    const tabId = parseInt(event.target.id);
    setCurrentTab(tabId);
    if (tabId === REMOTE_LOGGING_TAB) {
      checkRemoteLogging();
    }
  };

  const onOpenPopup = async () => {
    if (currentTab === REMOTE_LOGGING_TAB) {
      checkRemoteLogging();
    }
  };

  return (
    <Popup
      opened={openedPopup}
      onPopupClosed={onClosePopup}
      onPopupOpened={onOpenPopup}
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
                remoteLoggingInfo={remoteLoggingInfo}
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
