import React, { useEffect, useState } from "react";
import $ from "jquery";
import SensorServices from "../../../services/sensor-service";
import "./index.scss";
import SensorSelector from "../../molecules/popup-sensor-selector";
import { useActivityContext } from "../../../context/ActivityContext";

const NumberWidget = ({ value, widget }) => {
  const defaultSensorIndex = 0;
  const sensor = widget.sensors[defaultSensorIndex];
  const [currentValue, setCurrentData] = useState(value);
  const { isRunning, handleSensorChange } = useActivityContext();

  useEffect(() => {
    function handleResize() {
      $(".__value").css("font-size", $(".number-widget").width() / 7 + "px");
      $(".__unit").css("font-size", $(".number-widget").width() / 10 + "px");
    }
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isRunning) setCurrentData(value);
  }, [value, isRunning]);

  return (
    <div className="number-widget">
      <div className="__value">
        {currentValue}
        <span className="__unit">{currentValue.length && SensorServices.getUnit(sensor.id, sensor.index)}</span>
      </div>
      <div className="sensor-select-container">
        <SensorSelector
          selectedSensor={sensor}
          onChange={(sensor) =>
            handleSensorChange({ widgetId: widget.id, sensorIndex: defaultSensorIndex, sensor: sensor })
          }
        ></SensorSelector>
      </div>
    </div>
  );
};

export default NumberWidget;
