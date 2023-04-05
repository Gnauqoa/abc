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
  f7,
} from "framework7-react";
import _ from "lodash";
import sensorList from "../services/sensor-service";
import clsx from "clsx";
import DataManagerIST from "../services/data-manager";
import { SENSOR_STATUS_OFFLINE, SENSOR_STATUS_ONLINE } from "../js/constants";

export default function SensorSelector({ disabled, selectedSensor, hideDisplayUnit, onChange = () => {} }) {
  const [selectedSensorState, setSelectedSensorState] = useState("");
  const [sensorSelectPopupOpened, setSensorSelectPopupOpened] = useState(false);
  const [sensorListForDisplay, setSensorListForDisplay] = useState([]);

  useEffect(() => {
    appendSensorStatusKey();
    setInitSelectedSensor();
  }, [""]);

  const setInitSelectedSensor = () => {
    if (Object.keys(selectedSensor).length != 0) {
      const sensorId = parseInt(selectedSensor.id),
        sensorIndex = parseInt(selectedSensor.index),
        existingSensorData = sensorList.find((s) => s.id == sensorId),
        sensorDetailData = existingSensorData?.data[sensorIndex];

      sensorDetailData &&
        setSelectedSensorState(
          hideDisplayUnit ? sensorDetailData.name : `${sensorDetailData.name} (${sensorDetailData.unit})`
        );
    }
  };

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

        setSelectedSensorState(
          hideDisplayUnit ? sensorDetailData.name : `${sensorDetailData.name} (${sensorDetailData.unit})`
        );
        onChange({
          id: sensorId,
          index: sensorIndex,
        });
      }
    }
  };

  const appendSensorStatusKey = () => {
    const sensorListForDisplay = sensorList.map((sensor) => ({ ...sensor, sensorStatus: SENSOR_STATUS_OFFLINE }));
    setSensorListForDisplay(sensorListForDisplay);
  };

  const sortSensorList = (sensors) => {
    const sortedSensors = sensors.sort((a, b) => {
      // if (a.id === selectedSensorIdState) {
      //   return -1;
      // }

      // if (b.id === selectedSensorIdState) {
      //   return 1;
      // }

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

  const updateSensorStatus = () => {
    const activeSensors = DataManagerIST.getListActiveSensor();
    const updatedStatusSensors = sensorListForDisplay.map((item) => {
      const sensorStatus = activeSensors.includes(item.id.toString()) ? SENSOR_STATUS_ONLINE : SENSOR_STATUS_OFFLINE;
      return { ...item, sensorStatus };
    });
    const sortedSensors = sortSensorList(updatedStatusSensors);
    setSensorListForDisplay(sortedSensors);
  };

  const sensorPopup = useRef(null);

  return (
    <div>
      <Button
        disabled={disabled}
        fill
        round
        onClick={() => {
          updateSensorStatus();
          sensorPopup.current.f7Popup().open();
        }}
      >
        {selectedSensorState === "" ? "----- Chọn một cảm biến bất kì -----" : selectedSensorState}
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
