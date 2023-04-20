import React, { useRef } from "react";

import { f7 } from "framework7-react";
import WirelessSensorStatus from "../../atoms/wireless-sensor-status";
import SensorServices from "../../../services/sensor-service";
import SensorSettingSettingPopup from "../popup-sensor-setting";

import "./index.scss";

const WirelessSensorContainer = () => {
  const dummySensorIds = [-1, 2];
  const sensorSettingPopup = useRef(null);

  const onClick = (sensorId) => {
    console.log("onClick: ", sensorId);
    if (sensorId === -1) {
    } else {
      const sensorInfo = SensorServices.getSensorInfo(sensorId);
      console.log("sensorInfo: ", JSON.stringify(sensorInfo));

      if (sensorSettingPopup.current) {
        sensorSettingPopup.current = f7.popup.create({ el: ".display-setting-popup", animate: true });
        sensorSettingPopup.current.open();
      }
    }
  };
  return (
    <div className="__card-sensors">
      {dummySensorIds.map((sensorId) => (
        <div key={sensorId} className="wireless-sensor-info">
          <WirelessSensorStatus onClick={onClick} sensorId={sensorId}></WirelessSensorStatus>
        </div>
      ))}
      <SensorSettingSettingPopup ref={sensorSettingPopup} />
    </div>
  );
};

export default WirelessSensorContainer;
