import React from "react";
import { Button, Icon } from "framework7-react";

import batteryIcon from "../../../img/battery/100.png";
import "./index.scss";

const WirelessSensorStatus = ({ sensorId, sensorData, sensorIcon, onDisconnect }) => {
  const onDisconnectHandler = () => {
    onDisconnect(sensorId);
  };
  return (
    <>
      {sensorId === undefined || sensorData === undefined || (sensorIcon === undefined || sensorId) === -1 ? (
        <div className="__inactive">
          <div className="__icon">
            <Icon material="error" size="60"></Icon>
          </div>
          <div className="__text">Chưa kết nối cảm biến</div>
        </div>
      ) : (
        <div className="__active">
          <div className="__icon">
            <div className="__sensor-icon">
              <img
                src={sensorIcon.icon || ""}
                alt={sensorIcon.label}
                style={sensorIcon.width ? { width: sensorIcon.width } : {}}
              />
            </div>
            <div className="__sensor-name">
              <span>{sensorIcon.label}</span>
            </div>
          </div>
          <div className="__sensor-info">
            <div className="__close-button">
              <Button
                onClick={onDisconnectHandler}
                iconIos={"material:highlight_off"}
                iconMd={"material:highlight_off"}
                iconAurora={"material:highlight_off"}
                iconSize={30}
              ></Button>
            </div>
            <div className="__sensor-value">
              <span>{sensorData}</span>
            </div>
            <div className="__sensor-unit">
              <span>{sensorIcon.unit}</span>
            </div>
            <div className="__signal-battery">
              <img src={batteryIcon} alt="battery" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WirelessSensorStatus;
