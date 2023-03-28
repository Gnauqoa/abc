import React, { useEffect, useRef, useState } from "react";
import "./table_chart.scss";
import SensorSelector from "../sensor-selector";
import sensors from "../../services/sensor-service";

import { LAYOUT_TABLE, LAYOUT_TABLE_CHART, LAYOUT_NUMBER_TABLE } from "../../js/constants";

const DEFAULT_ROWS = 10;
const PAGE_SETTINGS = {
  [LAYOUT_TABLE]: {
    "table-chart-body": {
      width: "86%",
      margin: "3% 7%", // 3% top and bottom, 7% left and right
    },
    "custom-select": {
      width: "70%",
      height: "60%",
    },
  },
  [LAYOUT_TABLE_CHART]: {
    "table-chart-body": {
      width: "96%",
      margin: "3% 2%", // 3% top and bottom, 7% left and right
    },
    "custom-select": {
      width: "90%",
      height: "70%",
    },
  },
  [LAYOUT_NUMBER_TABLE]: {
    "table-chart-body": {
      width: "90%",
      margin: "3% 5%", // 3% top and bottom, 7% left and right
    },
    "custom-select": {
      width: "70%",
      height: "60%",
    },
  },
};
const emptyData = Array.from({ length: DEFAULT_ROWS }, () => ({ colum1: "", colum2: "" }));

const TableChart = (props) => {
  const { widget, handleSensorChange, chartLayout } = props;
  const [unit, setUnit] = useState();
  const [displaySensorSelector, setDisplaySensorSelector] = useState();

  useEffect(() => {
    const sensor = sensors.find((sensorId) => sensorId.id === widget.sensor.id);
    const sensorDetail = sensor.data[widget.sensor.index];
    setUnit(sensorDetail.unit);
    setDisplaySensorSelector(sensorDetail.name);
  }, [widget]);

  return (
    <div className="wapper">
      <div className="wapper__chart">
        <table className="wapper__chart__table">
          <tbody className="wapper__chart__table__body" style={{ ...PAGE_SETTINGS[chartLayout]["table-chart-body"] }}>
            <tr className="header">
              <td>
                <div className="header-name">Thời gian</div>
                <div className="header-unit">(Giây)</div>
              </td>
              <td>
                <div className="header-name">
                  <SensorSelector
                    customStyle={PAGE_SETTINGS[chartLayout]["custom-select"]}
                    displaySensorSelector={displaySensorSelector}
                    selectedSensor={widget.sensor}
                    onChange={(sensor) => handleSensorChange(widget.id, sensor)}
                  ></SensorSelector>
                </div>
                <div className="header-unit">({unit})</div>
              </td>
            </tr>
            {emptyData.map((row, index) => (
              <tr key={index}>
                <td>
                  <input type="text" placeholder={row.colum2} />
                </td>
                <td>
                  <span>{row.colum1}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableChart;
