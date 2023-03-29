import React, { useEffect, useRef, useState } from "react";
import "./table_chart.scss";
import SensorSelector from "../sensor-selector";
import sensors from "../../services/sensor-service";
import { Button } from "framework7-react";

import { LAYOUT_TABLE, LAYOUT_TABLE_CHART, LAYOUT_NUMBER_TABLE } from "../../js/constants";

const DEFAULT_ROWS = 10;
const FIRST_COLUMN_DEFAULT_OPT = "time";
const FIRST_COLUMN_CUSTOM_OPT = "custom";

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

const FIRST_COLUMN_OPTIONS = [
  {
    id: FIRST_COLUMN_DEFAULT_OPT,
    name: "Thời gian",
    unit: "(giây)",
  },
  {
    id: FIRST_COLUMN_CUSTOM_OPT,
    name: "Custom",
    unit: <input id={FIRST_COLUMN_CUSTOM_OPT} className="header-unit__input" type="text" placeholder="--------" />,
  },
];
const emptyData = Array.from({ length: DEFAULT_ROWS }, () => ({ colum1: "", colum2: "" }));

const TableChart = (props) => {
  const { widget, handleSensorChange, chartLayout } = props;
  const [unit, setUnit] = useState();
  const [firstColumnOption, setFirstColumnOption] = useState(FIRST_COLUMN_DEFAULT_OPT);

  useEffect(() => {
    const sensor = sensors.find((sensorId) => sensorId.id === widget.sensor.id);
    const sensorDetail = sensor.data[widget.sensor.index];
    setUnit(sensorDetail.unit);
  }, [widget]);

  const handleFirstColumSelector = (evt) => {
    const optionId = evt.target.value;
    setFirstColumnOption(optionId);
  };

  return (
    <div className="wapper">
      <div className="wapper__chart">
        <table className="wapper__chart__table">
          <tbody className="wapper__chart__table__body" style={{ ...PAGE_SETTINGS[chartLayout]["table-chart-body"] }}>
            <tr className="header">
              <td>
                <div className="header-name">
                  <select
                    value={firstColumnOption}
                    className="custom-select"
                    onChange={handleFirstColumSelector}
                    style={PAGE_SETTINGS[chartLayout]["custom-select"]}
                  >
                    <option value={"defaultSensorSelectedValue"} disabled>
                      Chọn thông tin
                    </option>
                    {FIRST_COLUMN_OPTIONS.map((option) => {
                      return (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="header-unit">
                  {FIRST_COLUMN_OPTIONS.find((option) => option.id === firstColumnOption)?.unit}
                </div>
              </td>
              <td>
                <div className="header-name">
                  <SensorSelector
                    selectedSensor={widget.sensor}
                    onChange={(sensor) => handleSensorChange(widget.id, sensor)}
                    customStyle={PAGE_SETTINGS[chartLayout]["custom-select"]}
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
