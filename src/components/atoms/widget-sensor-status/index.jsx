import React from "react";
import { Button, Icon } from "framework7-react";

import batteryIcon from "../../../img/sensor-info/battery/100.png";
import uartIcon from "../../../img/sensor-info/connections/uart.png";
import bleIcon from "../../../img/sensor-info/connections/ble.png";
import { BLE_TYPE, WIDGET_SENSOR_INACTIVE } from "../../../js/constants";
import "./index.scss";

const SensorStatus = ({ sensorId, sensorData, sensorIcon, onDisconnect, type, status }) => {
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
          <div className="__text">Chưa kết nối cảm biến</div>
        </div>
      ) : (
        <div className="__active">
          <div className="__icon">
            <div className="__sensor-icon">
              <img src={sensorIcon?.icon || ""} alt={sensorIcon?.label} />
            </div>
            <div className="__sensor-name">
              <span>{sensorIcon?.label}</span>
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
                  iconSize={30}
                ></Button>
              )}
            </div>
            <div className="__sensor-value">
              <span>{sensorData}</span>
            </div>
            <div className="__sensor-unit">
              <span>{sensorIcon?.unit}</span>
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
