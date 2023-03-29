import React from "react";
import { getUnit } from "../../services/sensor-service";
import SensorSelector from "../sensor-selector";
import "./number.scss";
import SensorSelectorEnhanched from "../sensor-selector-enhanched";

export default ({ value, widget, handleSensorChange }) => {
  const sensor = widget.sensor;
  return (
    <div className="number-widget">
      <div className="__value">
        {value} <span className="__unit">{value.length && getUnit(sensor.id, sensor.index)}</span>
      </div>
      <div className="sensor-select-container">
        <SensorSelectorEnhanched
          selectedSensor={widget.sensor}
          onChange={(sensor) => handleSensorChange(widget.id, sensor)}
        ></SensorSelectorEnhanched>
      </div>
    </div>
  );
};
