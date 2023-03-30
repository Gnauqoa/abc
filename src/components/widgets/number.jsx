import React from "react";
import { getUnit } from "../../services/sensor-service";
import "./number.scss";
import SensorSelector from "../sensor-selector";

export default ({ value, widget, handleSensorChange }) => {
  const sensor = widget.sensor;
  return (
    <div className="number-widget">
      <div className="__value">
        {value} <span className="__unit">{value.length && getUnit(sensor.id, sensor.index)}</span>
      </div>
      <div className="sensor-select-container">
        <SensorSelector
          selectedSensor={widget.sensor}
          onChange={(sensor) => handleSensorChange(widget.id, sensor)}
        ></SensorSelector>
      </div>
    </div>
  );
};
