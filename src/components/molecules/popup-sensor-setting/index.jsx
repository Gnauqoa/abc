import React, { forwardRef, useEffect, useState } from "react";
import { Page, Navbar, List, ListInput, Button, f7, Popup, Popover } from "framework7-react";

import SensorServices from "../../../services/sensor-service";
import _ from "lodash";

import SensorSettingTab from "./sensor-setting";
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

  const getSensors = () => {
    const sensorInfo = SensorServices.getSensorInfo(sensorId);
    setSensorInfo(sensorInfo);
  };
  useEffect(() => {
    getSensors();
  }, [sensorId]);

  const onSaveSensorSettingHandler = (newSensorUnitInfo) => {
    SensorServices.updateSensorSetting(sensorId, newSensorUnitInfo);
    getSensors();
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
                  className={`nav-button ${parseInt(tabId) === currentTab ? "active" : "inactive"}`}
                  id={tabId}
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
              <></>
            )}
          </div>
        </div>
      </Page>
    </Popup>
  );
};

export default forwardRef(SensorSettingPopup);
