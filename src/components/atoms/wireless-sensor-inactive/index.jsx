import React from "react";
import { Icon } from "framework7-react";

import "./index.scss";

const WirelessSensorInactive = () => {
  return (
    <div className="__inactive">
      <div className="__icon">
        <Icon material="error" size="60"></Icon>
      </div>
      <div className="__text">Chưa kết nối cảm biến</div>
    </div>
  );
};

export default WirelessSensorInactive;
