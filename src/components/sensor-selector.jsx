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

export default function SensorSelector({ selectedSensor, hideDisplayUnit, onChange = () => {} }) {
  const [selectedSensorState, setSelectedSensorState] = useState("");
  const [selectedSensorIdState, setSelectedSensorIdState] = useState("");
  const [sensorSelectPopupOpened, setSensorSelectPopupOpened] = useState(false);

  let sensorListForDislpay = sensorList;

  useEffect(() => {
    appendSensorStatusKey();
    setInitSelectedSensor();
  }, [""]);

  const setInitSelectedSensor = () => {
    if (Object.keys(selectedSensor).length != 0) {
      const sensorId = parseInt(selectedSensor.id),
        sensorIndex = parseInt(selectedSensor.index),
        existingSensorData = sensorList.find((s) => s.id == sensorId),
        sensorDetailData = existingSensorData.data[sensorIndex];
      setSelectedSensorState(
        hideDisplayUnit ? sensorDetailData.name : `${sensorDetailData.name} (${sensorDetailData.unit})`
      );
      setSelectedSensorIdState(sensorId);
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
        setSelectedSensorIdState(sensorId);
        onChange({
          id: sensorId,
          index: sensorIndex,
        });
      }
    }
    // console.log("Selected sensor with Id: 👉️", selectedValueString);
  };

  const appendSensorStatusKey = () => {
    Object.keys(sensorListForDislpay).forEach((key) => {
      Object.assign(sensorListForDislpay[key], { sensorStatus: "offline" });
    });
  };

  const sortSensorList = () => {
    sensorListForDislpay = sensorList.sort((a, b) => {
      if (a.id === selectedSensorIdState) {
        return -1;
      }

      if (b.id === selectedSensorIdState) {
        return 1;
      }

      if (a.sensorStatus === b.sensorStatus) {
        if (a.name < b.name) {
          return -1;
        }
        if (a.name > b.name) {
          return 1;
        }
        return 0;
      }

      if (a.sensorStatus === "online") {
        return -1;
      } else {
        return 1;
      }
    });
  };

  const updateSensorStatus = () => {
    const activeSensors = DataManagerIST.getListActiveSensor();
    sensorListForDislpay.forEach((item) => {
      item.sensorStatus = activeSensors.includes(item.id.toString()) ? "online" : "offline";
    });
    sortSensorList();
  };

  const sensorPopup = useRef(null);

  return (
    <div>
      <Button
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
                {sensorListForDislpay.map(({ id, name, data, sensorStatus }) => (
                  <ListItem
                    className={clsx("sensor-select-device", {
                      __activeDevice: sensorStatus === "online",
                      __default: sensorStatus === "offline",
                    })}
                    accordionItem
                    key={id}
                    title={name}
                    accordionItemOpened={sensorStatus === "online" ? true : false}
                  >
                    <AccordionContent>
                      <List>
                        {data.map((s) => (
                          <ListItem
                            link="#"
                            popupClose
                            key={id + "|" + s.id}
                            className={clsx("sensor-select-measurement", {
                              __activeDevice: sensorStatus === "online",
                              __default: sensorStatus === "offline",
                            })}
                            title={`${s.name} (${s.unit})`}
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
