import React from "react";
import { Button, Icon } from "framework7-react";

import batteryIcon from "../../../img/battery/100.png";
import SensorServices from "../../../services/sensor-service";
import "./index.scss";

const WirelessSensorActive = ({ sensorId }) => {
  const { icon, label, width, unit } = SensorServices.getSensorIcon(sensorId);

  return (
    <>
      {sensorId !== -1 ? (
        <div className="__active">
          <div className="__icon">
            <div className="__sensor-icon">
              <img src={icon || ""} alt={label} style={width ? { width: width } : {}} />
            </div>
            <div className="__sensor-name">{label}</div>
          </div>
          <div className="__sensor-info">
            <div className="__close-button">
              <Button
                iconIos={"f7:xmark_circle_fill"}
                iconMd={"f7:xmark_circle_fill"}
                iconAurora={"f7:xmark_circle_fill"}
                color="red"
                iconSize={30}
              ></Button>
            </div>
            <div className="__sensor-value">24</div>
            <div className="__sensor-unit">{unit}</div>
            <div className="__signal-strength">
              <img src={batteryIcon} alt="battery" />
            </div>
          </div>
        </div>
      ) : (
        <div className="__inactive">
          <div className="__icon">
            <Icon material="error" size="60"></Icon>
          </div>
          <div className="__text">Chưa kết nối cảm biến</div>
        </div>
      )}
    </>
  );
};

export default WirelessSensorActive;
