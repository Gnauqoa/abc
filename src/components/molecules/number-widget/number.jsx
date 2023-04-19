import React, { useEffect } from "react";
import $ from "jquery";
import { getUnit } from "../../../services/sensor-service";
import "./number.scss";
import SensorSelector from "../sensor-selector";

export default ({ value, widget, handleSensorChange }) => {
  const sensor = widget.sensor;
  useEffect(() => {
    function handleResize() {
      $(".__value").css("font-size", $(".number-widget").width() / 7 + "px");
      $(".__unit").css("font-size", $(".number-widget").width() / 10 + "px");
    }
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);
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
