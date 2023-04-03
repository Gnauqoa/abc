import React, { forwardRef, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

import "./table_chart.scss";
import SensorSelector from "../sensor-selector";
import sensors from "../../services/sensor-service";
import DataManagerIST, { SAMPLING_AUTO, SAMPLING_MANUAL } from "../../services/data-manager";

import { LAYOUT_TABLE, LAYOUT_TABLE_CHART, LAYOUT_NUMBER_TABLE } from "../../js/constants";

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
      fontSize: "24px",
    },
  },
  [LAYOUT_TABLE_CHART]: {
    "table-chart-body": {
      width: "98%",
      margin: "3% 2%", // 3% top and bottom, 7% left and right
    },
    "custom-select": {
      width: "97%",
      fontSize: "18px",
    },
  },
  [LAYOUT_NUMBER_TABLE]: {
    "table-chart-body": {
      width: "90%",
      margin: "3% 5%", // 3% top and bottom, 7% left and right
    },
    "custom-select": {
      width: "76%",
      fontSize: "24px",
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

const TableWidget = ({ data, widget, handleSensorChange, chartLayout, isRunning }) => {
  const [unit, setUnit] = useState();
  const [isCollectingDataPressed, setIsCollectingDataPressed] = useState(false);
  const [firstColumnOption, setFirstColumnOption] = useState(FIRST_COLUMN_DEFAULT_OPT);
  const [rows, setRows] = useState(defaultRows);
  const [numRows, setNumRows] = useState(0);
  const [isInitialWithData, setIsInitialWithData] = useState(false);

  const headerRowRef = useRef(null);
  const lastRowRef = useRef(null);

  const samplingMode = DataManagerIST.getSamplingMode();

  useEffect(() => {
    const handleClick = () => {
      setIsCollectingDataPressed(true);
    };

    console.log(`TABLE_WIDGET-INIT-initialData_${data.length}`, data);
    document.addEventListener("getIndividualSample", handleClick);
    if (data?.length !== 0) {
      parseInitialDataRun(data);
    }
    setIsInitialWithData(true);
    return () => {
      document.removeEventListener("getIndividualSample", handleClick);
    };
  }, []);

  useEffect(() => {
    const sensor = sensors.find((sensorId) => sensorId.id === widget.sensor.id);
    const sensorDetail = sensor.data[widget.sensor.index];
    setUnit(sensorDetail.unit);
  }, [widget]);

  useEffect(() => {
    if (!isInitialWithData) return;

    if (data.length === 0) {
      if (numRows !== 0) {
        setNumRows(0);
        setRows(defaultRows);
        scrollToRef(headerRowRef);
      }
      return;
    }

    if (isRunning && samplingMode === SAMPLING_AUTO) {
      const newRows = data.map((item) => ({
        colum1:
          firstColumnOption === FIRST_COLUMN_DEFAULT_OPT ? item.time : rows[numRows] ? rows[numRows]["colum1"] : "",
        colum2: item.value,
      }));
      setRows(
        newRows.length < DEFAULT_ROWS ? [...newRows, ...defaultRows.slice(newRows.length, DEFAULT_ROWS)] : newRows
      );
      setNumRows(newRows.length);
    } else {
      // TODO: Handle parse all data when first load and change data run
      // For change dataRun, unsubscribe, set new data run, notify widget and subscribe again
      let newData;
      if (isCollectingDataPressed) {
        newData = DataManagerIST.getManualSample(widget?.sensor?.id);
        setNumRows((prev) => prev + 1);
        setIsCollectingDataPressed(false);
      } else {
        newData = data[data.length - 1];
      }

      const { time, value } = newData;
      if (!time || time === "" || !value || value === "") return;

      const newRow = {
        colum1:
          numRows === 0
            ? firstColumnOption === FIRST_COLUMN_DEFAULT_OPT || isRunning
              ? time
              : rows[numRows]["colum1"]
            : isRunning
            ? time
            : "",
        colum2: value,
      };

      const oldRows = rows.slice(0, numRows);
      oldRows.push(newRow);
      setRows([...oldRows, ...defaultRows.slice(oldRows.length, DEFAULT_ROWS)]);
    }

    numRows !== 0 && scrollToRef(lastRowRef);
  }, [data, isCollectingDataPressed]);

  const handleFirstColumSelector = ({ target: { value } }) => {
    setFirstColumnOption(value);
  };

  const scrollToRef = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  const parseInitialDataRun = (dataRun) => {
    const parsedRows = dataRun.map((data) => {
      return {
        colum1: data["time"],
        colum2: data["value"],
      };
    });
    const dataLength = dataRun.length;
    setNumRows(dataLength);
    console.log("dataRun in parseInitialDataRun: ", parsedRows);
    setRows(dataLength < DEFAULT_ROWS ? [...parsedRows, ...rows.slice(dataLength, DEFAULT_ROWS)] : parsedRows);
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
                      selectedSensor={widget.sensor}
                      hideDisplayUnit={true}
                      onChange={(sensor) => handleSensorChange(widget.id, sensor)}
                    ></SensorSelector>
                  </div>
                </div>
                <div className="header-unit">({unit})</div>
              </td>
            </tr>
            {[...rows, emptyRow].map((row, index) => {
              const ref = !isRunning
                ? index === numRows
                  ? lastRowRef
                  : null
                : numRows < NUM_ROWS_FIT_TABLE || !isRunning
                ? null
                : numRows < DEFAULT_ROWS
                ? index === numRows
                  ? lastRowRef
                  : null
                : index === rows.length
                ? lastRowRef
                : null;

              return (
                <tr key={index} ref={ref}>
                  <td>
                    <input
                      type="text"
                      defaultValue={row.colum1}
                      disabled={firstColumnOption === FIRST_COLUMN_DEFAULT_OPT}
                    />
                  </td>
                  <td>
                    <span>{row.colum2}</span>
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
