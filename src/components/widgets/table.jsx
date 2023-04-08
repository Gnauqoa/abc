import React, { forwardRef, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

import "./table_chart.scss";
import SensorSelector from "../sensor-selector";
import sensors, { getUnit } from "../../services/sensor-service";
import DataManagerIST, { SAMPLING_AUTO, SAMPLING_MANUAL } from "../../services/data-manager";

import { LAYOUT_TABLE, LAYOUT_TABLE_CHART, LAYOUT_NUMBER_TABLE } from "../../js/constants";
import { DEFAULT_SENSOR_ID } from "../../pages/activity";

const DEFAULT_ROWS = 15;
const NUM_ROWS_FIT_TABLE = 7;
const FIRST_COLUMN_DEFAULT_OPT = "time";
const FIRST_COLUMN_CUSTOM_OPT = "custom";

const PAGE_SETTINGS = {
  [LAYOUT_TABLE]: {
    "table-chart-body": {
      width: "96%",
      margin: "3% 7%", // 3% top and bottom, 7% left and right
    },
    "custom-select": {
      width: "70%",
      fontSize: "16px",
    },
  },
  [LAYOUT_TABLE_CHART]: {
    "table-chart-body": {
      width: "98%",
      margin: "3% 2%", // 3% top and bottom, 7% left and right
    },
    "custom-select": {
      width: "97%",
      fontSize: "16px",
    },
  },
  [LAYOUT_NUMBER_TABLE]: {
    "table-chart-body": {
      width: "90%",
      margin: "3% 5%", // 3% top and bottom, 7% left and right
    },
    "custom-select": {
      width: "76%",
      fontSize: "18px",
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
    name: "Người dùng nhập",
    unit: <input id={FIRST_COLUMN_CUSTOM_OPT} className="header-unit__input" type="text" placeholder="--------" />,
  },
];

const emptyRow = { colum1: "", colum2: "" };
const defaultRows = Array.from({ length: DEFAULT_ROWS }, () => emptyRow);

const TableWidget = ({ data, currentValue, widget, handleSensorChange, chartLayout, isRunning, samplingMode }) => {
  const [rows, setRows] = useState(defaultRows);
  const [numRows, setNumRows] = useState(0);
  const [userInputs, setUserInputs] = useState({});
  const [selectedRow, setSelectedRow] = useState(0);
  const [firstColumnOption, setFirstColumnOption] = useState(FIRST_COLUMN_DEFAULT_OPT);

  const headerRowRef = useRef(null);
  const lastRowRef = useRef(null);

  const sensorUnit = widget.sensor.id === DEFAULT_SENSOR_ID ? "" : getUnit(widget.sensor.id, widget.sensor.index);

  useEffect(() => {
    setFirstColumnOption(samplingMode === SAMPLING_AUTO ? FIRST_COLUMN_DEFAULT_OPT : FIRST_COLUMN_CUSTOM_OPT);
  }, [samplingMode]);

  useEffect(() => {
    // reset table before
    setRows(defaultRows);

    let transformedRows = data.map((item, index) => ({
      colum1: firstColumnOption === FIRST_COLUMN_DEFAULT_OPT ? item.time : userInputs[index] || "",
      colum2: item.value,
    }));
    setNumRows(transformedRows.length);

    if (!isRunning || samplingMode === SAMPLING_MANUAL) {
      const { time, value } = currentValue;
      if (!time || time === "" || !value || value === "") return;

      const newRow = {
        colum1: firstColumnOption === FIRST_COLUMN_DEFAULT_OPT ? (isRunning ? time : "") : userInputs[numRows] || "",
        colum2: value,
      };
      const lastRow = {
        colum1: firstColumnOption === FIRST_COLUMN_DEFAULT_OPT ? (isRunning ? time : "") : userInputs[numRows] || "",
        colum2: "---",
      };

      if (!isRunning) {
        transformedRows.push(newRow);
      } else {
        let curSelectedRow = selectedRow;
        if (data.length > numRows) {
          if (numRows === 0 || selectedRow === transformedRows.length - 1) {
            curSelectedRow = transformedRows.length;
            setSelectedRow(curSelectedRow);
          }
        }
        // Check if is running and the data.length > numRows => had sampling manual
        //   if (data.length > numRows) {
        //     if (numRows === 0 || selectedRow === transformedRows.length - 1) {
        //       transformedRows.push(newRow);
        //       setSelectedRow(transformedRows.length - 1);
        //     } else {
        //       DataManagerIST.updateDataManualAtIndex(widget.sensor.id, selectedRow, currentValue.value);
        //       transformedRows = [
        //         ...transformedRows.slice(0, selectedRow),
        //         newRow,
        //         ...transformedRows.slice(selectedRow + 1, numRows),
        //       ];
        //     }
        //   } else {
        //   }

        transformedRows = [
          ...transformedRows.slice(0, curSelectedRow),
          newRow,
          ...transformedRows.slice(curSelectedRow + 1),
          curSelectedRow < numRows && lastRow,
        ];
      }
    }

    setRows(
      transformedRows.length < DEFAULT_ROWS
        ? [...transformedRows, ...defaultRows.slice(transformedRows.length, DEFAULT_ROWS)]
        : transformedRows
    );

    if (samplingMode === SAMPLING_AUTO || !isRunning) {
      setSelectedRow(numRows);
    }

    numRows !== 0 && scrollToRef(lastRowRef);
  }, [data, firstColumnOption, selectedRow]);

  const handleFirstColumSelector = ({ target: { value } }) => {
    setFirstColumnOption(value);
  };

  const handleChangeSelectedColumn = (event) => {
    const selectedRow = event.currentTarget.id;
    isRunning &&
      samplingMode === SAMPLING_MANUAL &&
      selectedRow &&
      parseInt(selectedRow) <= numRows &&
      setSelectedRow(parseInt(selectedRow));
  };

  const scrollToRef = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  const userInputHandler = (event) => {
    const inputRow = event.target.id;
    const inputValue = event.target.value;
    setUserInputs((prev) => {
      return { ...prev, [inputRow]: inputValue };
    });
  };

  return (
    <div className="wapper">
      <div className="wapper__chart">
        <table className="wapper__chart__table">
          <tbody className="wapper__chart__table__body" style={{ ...PAGE_SETTINGS[chartLayout]["table-chart-body"] }}>
            <tr className="header" ref={headerRowRef}>
              <td>
                <div className="header-name">
                  <select
                    disabled={isRunning}
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
                  <div className="sensor-select-container-table-chart">
                    <SensorSelector
                      disabled={isRunning}
                      selectedSensor={widget.sensor}
                      hideDisplayUnit={true}
                      onChange={(sensor) => handleSensorChange(widget.id, sensor)}
                    ></SensorSelector>
                  </div>
                </div>

                {sensorUnit !== "" && <div className="header-unit">({sensorUnit})</div>}
              </td>
            </tr>
            {[...rows, emptyRow].map((row, index) => {
              let ref;
              if (!isRunning) ref = null;
              else if (samplingMode === SAMPLING_AUTO) {
                ref = index === numRows ? lastRowRef : null;
              } else {
                ref = index === data.length ? lastRowRef : null;
              }

              return (
                <tr key={index} ref={ref}>
                  <td>
                    {firstColumnOption === FIRST_COLUMN_DEFAULT_OPT ? (
                      <span className="span-input">{row.colum1}</span>
                    ) : (
                      <input
                        id={index}
                        type="text"
                        value={userInputs[index] || ""}
                        onChange={userInputHandler}
                        disabled={firstColumnOption === FIRST_COLUMN_DEFAULT_OPT}
                      />
                    )}
                  </td>
                  <td id={index} onClick={handleChangeSelectedColumn}>
                    <span className="span-value" style={index === selectedRow ? { color: "#11b444" } : {}}>
                      {row.colum2}{" "}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableWidget;
