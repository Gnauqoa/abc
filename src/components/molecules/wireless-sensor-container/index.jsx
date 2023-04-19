import React from "react";
import WirelessSensorInactive from "../../atoms/wireless-sensor-inactive";
import WirelessSensorActive from "../../atoms/wireless-sensor-active";

import "./index.scss";

const WirelessSensorContainer = () => {
  return (
    <div className="__card-sensors">
      <div className="wireless-sensor-info">
        <WirelessSensorInactive></WirelessSensorInactive>
      </div>
      <div className="wireless-sensor-info">
        <WirelessSensorActive></WirelessSensorActive>
      </div>
    </div>
  );
};

export default WirelessSensorContainer;
