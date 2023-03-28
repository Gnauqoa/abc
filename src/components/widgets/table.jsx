import React, { useRef } from "react";
import "./table_chart.scss";
import SensorSelector from "../sensor-selector";

import {
  LAYOUT_CHART,
  LAYOUT_TABLE,
  LAYOUT_NUMBER,
  LAYOUT_TABLE_CHART,
  LAYOUT_NUMBER_CHART,
  LAYOUT_NUMBER_TABLE,
  SAMPLING_MANUAL_FREQUENCY,
} from "../../js/constants";

const DEFAULT_ROWS = 7;

const PAGE_SETTINGS = {
  [LAYOUT_TABLE]: {
    "table-chart-body": {
      width: "86%",
      margin: "3% 7%", // 3% top and bottom, 7% left and right
    },
  },
  [LAYOUT_TABLE_CHART]: {
    "table-chart-body": {
      width: "96%",
      margin: "3% 2%", // 3% top and bottom, 7% left and right
    },
  },
  [LAYOUT_NUMBER_TABLE]: {
    "table-chart-body": {
      width: "90%",
      margin: "3% 5%", // 3% top and bottom, 7% left and right
    },
  },
};

const TableChart = (props) => {
  const { widget, handleSensorChange, chartLayout } = props;
  const emptyData = Array.from({ length: 10 }, () => ({ colum1: "", colum2: "" }));

  return (
    <div className="table-chart-wapper">
      <div className="table-chart">
        <table>
          <tbody className="table-chart-body" style={{ ...PAGE_SETTINGS[chartLayout]["table-chart-body"] }}>
            <tr className="table-chart-header">
              <td>
                <div className="header-name">Thời gian</div>
                <div className="header-unit">(Giây)</div>
              </td>
              <td>
                <div className="header-name">
                  <SensorSelector
                    selectedSensor={widget.sensor}
                    onChange={(sensor) => handleSensorChange(widget.id, sensor)}
                  ></SensorSelector>
                </div>
                <div className="header-unit">(giay)</div>
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
