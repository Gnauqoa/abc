import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Popup,
  Page,
  Navbar,
  NavRight,
  Block,
  Link,
  List,
  ListItem,
  AccordionContent,
  PageContent,
} from "framework7-react";
import _ from "lodash";
import sensorList from "../services/sensor-service";
import clsx from "clsx";
import DataManagerIST from "../services/data-manager";
import { DEFAULT_SENSOR_ID, SENSOR_STATUS_OFFLINE, SENSOR_STATUS_ONLINE } from "../js/constants";

export default function SensorSelector({ disabled, selectedSensor, hideDisplayUnit, onChange = () => {} }) {
  const [selectedSensorState, setSelectedSensorState] = useState();
  const [sensorListForDisplay, setSensorListForDisplay] = useState([]);
  const [sensorSelectPopupOpened, setSensorSelectPopupOpened] = useState(false);

  useEffect(() => {
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
  }, []);

  const changeHandler = (value) => {
    const selectedValueString = value;
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

  const handleOpenPopup = () => {
    const activeSensors = DataManagerIST.getListActiveSensor();
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

  return (
    <div className="sensor-selector ">
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
          <Navbar className="sensor-select-title" title="Chọn thông tin">
            <NavRight>
              <Link iconIos="material:close" iconMd="material:close" popupClose />
            </NavRight>
          </Navbar>
          <PageContent className="invisible-scrollbar zero-padding">
            <Block>
              <List>
                {sensorListForDisplay.map(({ id, name, data, sensorStatus }) => (
                  <ListItem
                    className={clsx("sensor-select-device", {
                      __activeDevice: sensorStatus === SENSOR_STATUS_ONLINE,
                      __default: sensorStatus === SENSOR_STATUS_OFFLINE,
                    })}
                    accordionItem
                    key={id}
                    title={name}
                    accordionItemOpened={sensorStatus === SENSOR_STATUS_ONLINE ? true : false}
                  >
                    <AccordionContent>
                      <List>
                        {data.map((s) => (
                          <ListItem
                            link="#"
                            popupClose
                            key={id + "|" + s.id}
                            className={clsx("sensor-select-measurement", {
                              __activeDevice: sensorStatus === SENSOR_STATUS_ONLINE,
                              __default: sensorStatus === SENSOR_STATUS_OFFLINE,
                            })}
                            title={`${s.name} ${s.unit === "" ? "" : ` (${s.unit})`}`}
                            onClick={() => {
                              changeHandler(id + "|" + s.id);
                            }}
                          ></ListItem>
                        ))}
                      </List>
                    </AccordionContent>
                  </ListItem>
                ))}
              </List>
            </Block>
          </PageContent>
        </Page>
      </Popup>
    </div>
  );
}
