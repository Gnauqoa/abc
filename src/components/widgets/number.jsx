import React from "react";
import { getUnit } from "../../services/sensor-service";
import "./number.scss";

export default ({ value, widget }) => {
  const sensor = widget.sensor;
  return (
    <div className="number-widget">
      {value} <span>{value.length && getUnit(sensor.id, sensor.index)}</span>
    </div>
  );
};
