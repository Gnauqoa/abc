import React, { useCallback, useRef, useState } from "react";

import { f7 } from "framework7-react";
import WirelessSensorStatus from "../../atoms/wireless-sensor-status";
import SensorServices from "../../../services/sensor-service";
import SensorSettingSettingPopup from "../popup-sensor-setting";

import "./index.scss";

const WirelessSensorContainer = () => {
  const dummySensorIds = [-1, 2, 5];
  const sensorSettingPopup = useRef();
  const [selectedSensorId, setSelectedSensorId] = useState();

  const onChooseSensorHandler = (event) => {
    const sensorId = parseInt(event.currentTarget.id);
    if (sensorId === -1) {
    } else if (sensorId >= 1) {
      setSelectedSensorId(sensorId);

      if (sensorSettingPopup.current) {
        sensorSettingPopup.current = f7.popup.create({ el: ".sensor-setting-popup", animate: true });
        sensorSettingPopup.current.open();
      }
    }
  };

  const onModifySensorHandler = useCallback((newSensorUnitInfo) => {
    SensorServices.updateSensorSetting(selectedSensorId, newSensorUnitInfo);
  });

  return (
    <div className="__card-sensors">
      {dummySensorIds.map((sensorId) => (
        <div key={sensorId} id={sensorId} className="wireless-sensor-info" onClick={onChooseSensorHandler}>
          <WirelessSensorStatus sensorId={sensorId}></WirelessSensorStatus>
        </div>
      ))}
      <SensorSettingSettingPopup
        sensorId={selectedSensorId}
        onModifySensor={onModifySensorHandler}
        ref={sensorSettingPopup}
      />
    </div>
  );
};

export default WirelessSensorContainer;
