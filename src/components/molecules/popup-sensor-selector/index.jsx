import React, { useState, useEffect, useRef } from "react";
import { Button, Popup, Page, Navbar, NavRight, NavLeft } from "framework7-react";
import _ from "lodash";
import SensorServices from "../../../services/sensor-service";
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
export default function SensorSelector({
  disabled,
  selectedSensor,
  hideDisplayUnit,
  onChange = () => {},
  onSelectUserInit = () => {},
  style,
  definedSensors,
}) {
  const [selectedSensorState, setSelectedSensorState] = useState();
  const [sensorListForDisplay, setSensorListForDisplay] = useState([]);
  const [sensorSelectPopupOpened, setSensorSelectPopupOpened] = useState(false);
  const [tab, setTab] = useState(SENSOR_SELECTOR_SENSOR_TAB);

  useEffect(() => {
    const sensorList = getSensorList();
    if (Object.keys(selectedSensor).length != 0) {
      const sensorId = parseInt(selectedSensor.id),
        sensorIndex = parseInt(selectedSensor.index),
        existingSensorData = sensorList.find((s) => s.id == sensorId),
        sensorDetailData = existingSensorData?.data[sensorIndex];

      if (sensorDetailData) {
        const { name, unit } = sensorDetailData;
        setSelectedSensorState(hideDisplayUnit ? name : `${name}${unit !== "" ? ` (${unit})` : ""}`);
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

        if (sensorDetailData) {
          const { name, unit } = sensorDetailData;
          setSelectedSensorState(hideDisplayUnit ? name : `${name}${unit !== "" ? ` (${unit})` : ""}`);
        }
        onChange({
          id: sensorId,
          index: sensorIndex,
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

    let activeSensors;
    if (!definedSensors) activeSensors = DataManagerIST.getListActiveSensor();
    else activeSensors = definedSensors;

    const sensorListForDisplay = sensorList.map((sensor) => {
      const sensorStatus = activeSensors.includes(sensor.id.toString()) ? SENSOR_STATUS_ONLINE : SENSOR_STATUS_OFFLINE;
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
    <div className="sensor-selector " style={style}>
      <Button disabled={disabled} fill round onClick={handleOpenPopup}>
        {selectedSensor.id === DEFAULT_SENSOR_ID ? "----- Chọn cảm biến -----" : selectedSensorState}
      </Button>
      <Popup
        className="edl-popup"
        ref={sensorPopup}
        opened={sensorSelectPopupOpened}
        onPopupClosed={() => setSensorSelectPopupOpened(false)}
      >
        <Page>
          <Navbar className="sensor-select-title">
            <NavLeft className={`${tab === SENSOR_SELECTOR_SENSOR_TAB ? "selected" : ""}`}>
              <Button onClick={() => handleChangeTab(SENSOR_SELECTOR_SENSOR_TAB)}>Cảm biến</Button>
            </NavLeft>
            <NavRight className={`${tab === SENSOR_SELECTOR_USER_TAB ? "selected" : ""}`}>
              <Button onClick={() => handleChangeTab(SENSOR_SELECTOR_USER_TAB)}>Người dùng nhập</Button>
            </NavRight>
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
