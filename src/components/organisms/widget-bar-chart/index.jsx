import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

import "./index.scss";
import SensorSelector from "../../molecules/popup-sensor-selector";
import { useActivityContext } from "../../../context/ActivityContext";
import { SENSOR_SELECTOR_USER_TAB } from "../../../js/constants";
import _ from "lodash";

const updateChart = ({ chartInstance, datas }) => {
  if (!chartInstance) return;
  chartInstance.data = datas;
  chartInstance.options.animation = false;
  chartInstance.update();
};

const BarCharWidget = ({ widget, datas, xAxis }) => {
  const { isRunning, handleSensorChange, handleXAxisChange } = useActivityContext();

  const canvasRef = useRef();
  const chartInstanceRef = useRef();

  const defaultSensorIndex = 0;
  const sensor = widget.sensors[defaultSensorIndex];

  const prevState = useRef({ datas: [], sensor: {} });

  useEffect(() => {
    const isChangeSensor = !_.isEqual(prevState.current.sensor, sensor);
    const isUpdateData = !_.isEqual(prevState.current.datas, datas);

    if (isUpdateData || isChangeSensor) {
      updateChart({
        chartInstance: chartInstanceRef.current,
        datas: datas,
      });
    }

    if (isChangeSensor) prevState.current.sensor = _.cloneDeep(sensor);
    if (isUpdateData) prevState.current.datas = datas;
  }, [datas]);

  useEffect(() => {
    try {
      chartInstanceRef.current = new Chart(canvasRef.current, {
        type: "bar",
        data: datas,
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "top",
            },
            scales: {
              y: {
                beginAtZero: true,
              },
              x: {
                offset: true,
                grid: {
                  offset: true,
                },
              },
            },
          },
        },
      });

      // prevState.current.datas = datas;
      // prevState.current.sensor = sensor;
    } catch (error) {
      console.log("useEffect: ", error);
    }
  }, []);

  //========================= CUSTOM X AXIS FUNCTION =========================
  const onSelectUserUnit = ({ option }) => {
    if (option.id === xAxis.id) return;

    let chartDatas = [];
    handleXAxisChange({ xAxisId: xAxis.id, option: option });
    updateChart({
      chartInstance: chartInstanceRef.current,
      data: chartDatas,
    });
  };

  const onSensorChange = (sensor) => {
    handleSensorChange({ widgetId: widget.id, sensorIndex: defaultSensorIndex, sensor: sensor });
  };

  return (
    <div className="bar-chart-widget">
      <div className="bar-chart">
        <div className="sensor-selector-wrapper">
          <div className="sensor-select-vertical-mount-container">
            <SensorSelector
              disabled={isRunning}
              selectedSensor={sensor}
              onChange={(sensor) => onSensorChange(sensor)}
            />
          </div>
        </div>

        <div className="canvas-container">
          <canvas ref={canvasRef} />
        </div>
      </div>

      <div className="expandable-options">
        <div className="sensor-selector-wrapper">
          <SensorSelector
            selectedSensor={sensor}
            selectedUnit={`${xAxis?.name} (${xAxis?.unit})`}
            onSelectUserInit={onSelectUserUnit}
            defaultTab={SENSOR_SELECTOR_USER_TAB}
          ></SensorSelector>
        </div>
      </div>
    </div>
  );
};

export default BarCharWidget;
