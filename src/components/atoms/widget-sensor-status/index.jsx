import React from "react";
import { Button, Icon } from "framework7-react";

import batteryIcon100 from "../../../img/sensor-info/battery/100.png";
import batteryIcon75 from "../../../img/sensor-info/battery/75.png";
import batteryIcon50 from "../../../img/sensor-info/battery/50.png";
import batteryIcon25 from "../../../img/sensor-info/battery/25.png";

import uartIcon from "../../../img/sensor-info/connections/uart.png";
import bleIcon from "../../../img/sensor-info/connections/ble.png";
import { BLE_TYPE, WIDGET_SENSOR_INACTIVE } from "../../../js/constants";
import "./index.scss";
import { useTranslation } from "react-i18next";

const SensorStatus = ({ sensorId, sensorData, sensorBattery, displayInfo, onDisconnect, type, status }) => {
  const { t, i18n } = useTranslation();
  let batteryIcon = batteryIcon25;
  if (sensorBattery > 75) {
    batteryIcon = batteryIcon100;
  } else if (sensorBattery > 50) {
    batteryIcon = batteryIcon75;
  } else if (sensorBattery > 25) {
    batteryIcon = batteryIcon50;
  }

  const onDisconnectHandler = () => {
    onDisconnect(sensorId);
  };
  return (
    <>
      {status === WIDGET_SENSOR_INACTIVE ? (
        <div className="__inactive">
          <div className="__icon">
            <Icon material="error"></Icon>
          </div>
          <div className="__text">{t("atoms.sensor_not_connected")}</div>
        </div>
      ) : (
        <div className="__active">
          <div className="__icon">
            <div className="__sensor-icon">
              <img src={displayInfo?.icon || ""} alt={t(displayInfo?.label)} />
            </div>
            <div className="__sensor-name">
              <span>{t(displayInfo?.label)}</span>
            </div>
          </div>
          <div className="__sensor-info">
            <div className="__close-button">
              {type === BLE_TYPE && (
                <Button
                  onClick={onDisconnectHandler}
                  iconIos={"material:highlight_off"}
                  iconMd={"material:highlight_off"}
                  iconAurora={"material:highlight_off"}
                ></Button>
              )}
            </div>
            <div className="__sensor-value">
              <span>{sensorData}</span>
            </div>
            <div className="__sensor-unit">
              <span>{displayInfo?.unit}</span>
            </div>
            <div className="__signal-battery">
              <div className="battery">
                <img src={batteryIcon} alt="battery" />
              </div>
              <div className="connection">
                {type === BLE_TYPE ? <img src={bleIcon} alt="bleIcon" /> : <img src={uartIcon} alt="uartIcon" />}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SensorStatus;
