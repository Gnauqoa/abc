import React from "react";
import clsx from "clsx";
import { AccordionContent, Block, List, ListItem, PageContent } from "framework7-react";
import { SENSOR_STATUS_OFFLINE, SENSOR_STATUS_ONLINE } from "../../../js/constants";
import { useTranslation } from "react-i18next";

import "./index.scss";
const SensorTab = ({ sensorListForDisplay, changeHandler }) => {
  const { t, i18n } = useTranslation();

  return (
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
              title={t(name)}
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
                      title={`${t(s.name)} ${s.unit === "" ? "" : ` (${s.unit})`}`}
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
  );
};
export default SensorTab;
