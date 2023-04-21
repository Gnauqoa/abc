import React, { forwardRef, useEffect, useState } from "react";
import { Page, Navbar, Button, f7, Popup } from "framework7-react";

import SensorServices from "../../../services/sensor-service";
import _ from "lodash";

import SensorSettingTab from "./sensor-setting";
import SensorCalibratingTab from "./sensor-calibrating";
import "./index.scss";

const SENSOR_SETTING_TAB = 1;
const SENSOR_CALIBRATING_TAB = 2;

const defaultTab = 1;
const settingTabs = {
  [SENSOR_SETTING_TAB]: "Cài đặt hiển thị",
  [SENSOR_CALIBRATING_TAB]: "Hiệu chỉnh cảm biến",
};

const SensorSettingPopup = ({ sensorId }, ref) => {
  const [currentTab, setCurrentTab] = useState(defaultTab);
  const [sensorInfo, setSensorInfo] = useState({});

  useEffect(() => {
    getSensors();
    setCurrentTab(defaultTab);
  }, [sensorId]);

  const getSensors = () => {
    const sensorInfo = SensorServices.getSensorInfo(sensorId);
    setSensorInfo(sensorInfo);
  };

  const onSaveSensorSettingHandler = (newSensorUnitInfo) => {
    SensorServices.updateSensorSetting(sensorId, newSensorUnitInfo);
    getSensors();
    f7.popup.close();
  };

  const onSaveSensorCalibratingHandler = () => {
    f7.popup.close();
  };

  const onChangeTab = (event) => {
    const tabId = parseInt(event.target.id);
    setCurrentTab(tabId);
  };

  return (
    <Popup className="sensor-setting-popup" ref={ref}>
      <Page className="sensor-setting">
        <Navbar className="__header" title={sensorInfo?.name} />
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
              <SensorSettingTab sensorInfo={sensorInfo} onSaveHandler={onSaveSensorSettingHandler} />
            ) : (
              <SensorCalibratingTab sensorInfo={sensorInfo} onSaveHandler={onSaveSensorCalibratingHandler} />
            )}
          </div>
        </div>
      </Page>
    </Popup>
  );
};

export default forwardRef(SensorSettingPopup);