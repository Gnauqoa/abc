import React, { useEffect, useRef, useState } from "react";
import "./table_chart.scss";
import SensorSelector from "../sensor-selector";
import sensors from "../../services/sensor-service";
import { Button } from "framework7-react";

import { LAYOUT_TABLE, LAYOUT_TABLE_CHART, LAYOUT_NUMBER_TABLE } from "../../js/constants";

const DEFAULT_ROWS = 8;
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

const emptyRow = { colum1: "", colum2: "" };
const defaultRows = Array.from({ length: DEFAULT_ROWS }, () => emptyRow);

const TableChart = (props) => {
  const { data, widget, handleSensorChange, chartLayout, isRunning } = props;
  const [unit, setUnit] = useState();
  const [firstColumnOption, setFirstColumnOption] = useState(FIRST_COLUMN_DEFAULT_OPT);
  const [rows, setRows] = useState(defaultRows);
  const [numRows, setNumRows] = useState(0);
  const lastRowRef = useRef(null);

  useEffect(() => {
    const sensor = sensors.find((sensorId) => sensorId.id === widget.sensor.id);
    const sensorDetail = sensor.data[widget.sensor.index];
    setUnit(sensorDetail.unit);
  }, [widget]);

  const updateRows = (newRow) => {
    let newRows;
    if (numRows < DEFAULT_ROWS) {
      newRows = [...rows.slice(0, numRows), newRow, ...rows.slice(numRows + 1, DEFAULT_ROWS)];
    } else {
      newRows = isRunning ? [...rows, newRow] : [...rows.slice(0, numRows - 1), newRow];
    }
    setRows(newRows);
  };

  useEffect(() => {
    if (data.length === 0) return;
    const newData = data[data.length - 1];
    const { time, value } = newData;

    if (isRunning) {
      const newRow = {
        colum1: firstColumnOption === FIRST_COLUMN_DEFAULT_OPT ? time : rows[numRows]["colum1"],
        colum2: value,
      };

      updateRows(newRow);
      setNumRows((prevNumRows) => prevNumRows + 1);
    } else {
      const newRow = {
        colum1:
          numRows === 0
            ? firstColumnOption === FIRST_COLUMN_DEFAULT_OPT
              ? "0"
              : rows[numRows]["colum1"]
            : rows[numRows - 1]["colum1"],
        colum2: value,
      };
      updateRows(newRow);
    }

    if (lastRowRef.current) {
      lastRowRef.current.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
    }
  }, [data]);

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
            {[...rows, emptyRow].map((row, index) => (
              <tr key={index} ref={numRows < DEFAULT_ROWS ? null : index === rows.length ? lastRowRef : null}>
                <td>
                  <input type="text" defaultValue={row.colum1} />
                </td>
                <td>
                  <span>{row.colum2}</span>
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
