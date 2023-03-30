import React, { useState, useEffect } from "react";
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

const defaultSensorSelectedValue = "";
export default function SensorSelector({ selectedSensor, onChange = () => {} }) {
  const [selectedSensorState, setSelectedSensorState] = useState("");
  const [sensorSelectPopupOpened, setSensorSelectPopupOpened] = useState(false);

  let sensorListForDislpay = sensorList;

  useEffect(() => {
    appendSensorStatusKey();
  }, [""]);

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

        setSelectedSensorState(`${sensorDetailData.name} (${sensorDetailData.unit})`);
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
    sensorListForDislpay = sensorList.sort((a) => {
      if (a.sensorStatus === 'online') {
        return -1;
      }
    });
  };

  const updateSensorStatus = () => {
    sensorListForDislpay.forEach((item) => {
      const sample = DataManagerIST.getIndividualSample(item["id"]);
      console.log(sample.slice(3).length === 0);
      const isSensorOffline = sample.slice(3).length === 0;
      item.sensorStatus = isSensorOffline ? "offline" : "online";
    });
    sortSensorList();
  };

  return (
    <div>
      <Button fill round popupOpen=".sensor-selector-popup" onClick={() => updateSensorStatus()}>
        {selectedSensorState === "" ? "----- Chọn một cảm biến bất kì -----" : selectedSensorState}
      </Button>
      <Popup
        className="sensor-selector-popup"
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
