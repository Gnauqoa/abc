import React, { useState, useEffect, useRef } from "react";
import { Button, Popup, Page, Navbar, NavRight, NavLeft } from "framework7-react";
import _ from "lodash";
import SensorServices, { BUILTIN_DECIBELS_SENSOR_ID } from "../../../services/sensor-service";
import DataManagerIST from "../../../services/data-manager";
import {
  DEFAULT_SENSOR_ID,
  SENSOR_SELECTOR_SENSOR_TAB,
  SENSOR_SELECTOR_USER_TAB,
  SENSOR_STATUS_OFFLINE,
  SENSOR_STATUS_ONLINE,
} from "../../../js/constants";

import "./index.scss";
import SensorTab from "./SensorTab";
import UserTab from "./UserTab";
import { useTranslation } from "react-i18next";
import MicrophoneServicesIST from "../../../services/microphone-service";

export default function SensorSelector({
  disabled,
  selectedSensor,
  selectedUnit,
  hideDisplayUnit,
  onChange = () => {},
  onSelectUserInit = () => {},
  style,
  definedSensors, // Array of int
  defaultTab = SENSOR_SELECTOR_SENSOR_TAB,
}) {
  const { t, i18n } = useTranslation();

  const [selectedSensorState, setSelectedSensorState] = useState();
  const [sensorListForDisplay, setSensorListForDisplay] = useState([]);
  const [sensorSelectPopupOpened, setSensorSelectPopupOpened] = useState(false);
  const [tab, setTab] = useState(defaultTab);
  const displayButton =
    tab === SENSOR_SELECTOR_SENSOR_TAB
      ? selectedSensor.id === DEFAULT_SENSOR_ID
        ? t("modules.select_sensor")
        : selectedSensorState
      : selectedUnit;

  useEffect(() => {
    const sensorList = getSensorList();
    if (Object.keys(selectedSensor).length != 0) {
      const sensorId = parseInt(selectedSensor.id),
        sensorIndex = parseInt(selectedSensor.index),
        existingSensorData = sensorList.find((s) => s.id == sensorId),
        sensorDetailData = existingSensorData?.data[sensorIndex];

      if (sensorDetailData) {
        const { name, unit } = sensorDetailData;
        setSelectedSensorState(hideDisplayUnit ? t(name) : `${t(name)}${unit !== "" ? ` (${unit})` : ""}`);
      }
    }
  }, [selectedSensor]);

  const changeHandler = (value) => {
    const selectedValueString = value;
    const sensorList = getSensorList();
    if (selectedValueString) {
      const arr = selectedValueString.split("|");
      if (arr.length > 1) {
        const sensorId = parseInt(arr[0]),
          sensorDetailId = arr[1],
          existingSensorData = sensorList.find((s) => s.id == sensorId),
          sensorDetailData = existingSensorData.data.find((s) => s.id == sensorDetailId),
          sensorIndex = _.findIndex(existingSensorData.data, (item) => item.id === sensorDetailId);
        if (sensorId === BUILTIN_DECIBELS_SENSOR_ID) {
          MicrophoneServicesIST.init();
        }
        if (sensorDetailData) {
          const { name, unit } = sensorDetailData;
          setSelectedSensorState(hideDisplayUnit ? t(name) : `${t(name)}${unit !== "" ? ` (${unit})` : ""}`);
        }
        onChange({
          id: sensorId,
          index: sensorIndex,
          unit: sensorDetailData?.unit,
          name: sensorDetailData?.name,
        });
      }
    }
  };

  const getSensorList = () => {
    if (!definedSensors) return SensorServices.getSensors();
    else return SensorServices.getDefinedSensors(definedSensors);
  };

  const handleOpenPopup = () => {
    const sensorList = getSensorList();

    let activeSensors = DataManagerIST.getListActiveSensor();
    // if (!definedSensors) activeSensors = DataManagerIST.getListActiveSensor();
    // else activeSensors = definedSensors;

    const sensorListForDisplay = sensorList.map((sensor) => {
      const sensorStatus = activeSensors.includes(sensor.id) ? SENSOR_STATUS_ONLINE : SENSOR_STATUS_OFFLINE;
      return { ...sensor, sensorStatus };
    });

    const sortedSensors = sortSensorList(sensorListForDisplay);
    setSensorListForDisplay(sortedSensors);
    sensorPopup.current.f7Popup().open();
  };

  const sortSensorList = (sensors) => {
    const sortedSensors = sensors.sort((a, b) => {
      if (a.sensorStatus === b.sensorStatus) {
        if (a.name < b.name) {
          return -1;
        }
        if (a.name > b.name) {
          return 1;
        }
        return 0;
      }

      if (a.sensorStatus === SENSOR_STATUS_ONLINE) {
        return -1;
      } else {
        return 1;
      }
    });
    return sortedSensors;
  };

  const sensorPopup = useRef(null);

  const handleChangeTab = (sensorTab) => {
    setTab(sensorTab);
  };

  return (
    <div className="sensor-selector" style={style}>
      <Button disabled={disabled} fill round onClick={handleOpenPopup}>
        {displayButton}
      </Button>
      <Popup
        className="sensor-selector-popup"
        ref={sensorPopup}
        opened={sensorSelectPopupOpened}
        onPopupClosed={() => setSensorSelectPopupOpened(false)}
      >
        <Page>
          <Navbar className="sensor-select-title">
            {defaultTab === SENSOR_SELECTOR_SENSOR_TAB ? (
              t("modules.sensor")
            ) : defaultTab === SENSOR_SELECTOR_USER_TAB ? (
              t("modules.user_input")
            ) : (
              <>
                <NavLeft className={`${tab === SENSOR_SELECTOR_SENSOR_TAB ? "selected" : ""}`}>
                  <Button onClick={() => handleChangeTab(SENSOR_SELECTOR_SENSOR_TAB)}>{t("modules.sensor")}</Button>
                </NavLeft>
                <NavRight className={`${tab === SENSOR_SELECTOR_USER_TAB ? "selected" : ""}`}>
                  <Button onClick={() => handleChangeTab(SENSOR_SELECTOR_USER_TAB)}>{t("modules.user_input")}</Button>
                </NavRight>
              </>
            )}
          </Navbar>
          {tab === SENSOR_SELECTOR_SENSOR_TAB ? (
            <SensorTab sensorListForDisplay={sensorListForDisplay} changeHandler={changeHandler}></SensorTab>
          ) : (
            <UserTab changeHandler={onSelectUserInit}></UserTab>
          )}
        </Page>
      </Popup>
    </div>
  );
}
