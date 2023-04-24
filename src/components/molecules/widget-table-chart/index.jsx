import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle } from "react";
import { Button } from "framework7-react";
import "./index.scss";
import SensorSelector from "../popup-sensor-selector";
import SensorServices from "../../../services/sensor-service";
import DataManagerIST from "../../../services/data-manager";

import { SAMPLING_AUTO, SAMPLING_MANUAL, DEFAULT_SENSOR_ID } from "../../../js/constants";

import tableChartIcon from "../../../img/expandable-options/table.png";
import {
  expandableOptions,
  PAGE_SETTINGS,
  DEFAULT_ROWS,
  FIRST_COLUMN_DEFAULT_OPT,
  FIRST_COLUMN_CUSTOM_OPT,
  emptyRow,
  defaultRows,
  ADD_COLUMN_OPTION,
  DELETE_COLUMN_OPTION,
  SUMMARIZE_OPTION,
} from "../../../utils/widget-table-utils";

import ExpandableOptions from "../expandable-options";

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

const TableWidget = ({ data, currentValue, widget, handleSensorChange, chartLayout, isRunning, samplingMode }, ref) => {
  const [rows, setRows] = useState(defaultRows);
  const [numRows, setNumRows] = useState(0);
  const [userInputs, setUserInputs] = useState({});
  const [selectedRow, setSelectedRow] = useState(0);

  const [firstColumnOption, setFirstColumnOption] = useState(FIRST_COLUMN_DEFAULT_OPT);

  const headerRowRef = useRef(null);
  const lastRowRef = useRef(null);

  const sensorUnit =
    widget.sensor.id === DEFAULT_SENSOR_ID ? "" : SensorServices.getUnit(widget.sensor.id, widget.sensor.index);

  useImperativeHandle(ref, () => ({
    handleSamplingManual() {
      let transformedRows = convertDataToTableRows(data);
      const newRow = convertCurrentValueToTableRow(currentValue);
      if (!newRow) {
        // if the user is not select sensor and manually
        // sampling, just put the current buffer to dataRuns
        DataManagerIST.appendManualSample();
        return;
      }

      setNumRows(transformedRows.length);
      let curSelectedRow = selectedRow;
      let displayedSelectedRow = selectedRow;

      if (selectedRow === transformedRows.length) {
        DataManagerIST.appendManualSample(widget.sensor.id, currentValue.values);
        // transformedRows.push(newRow);
        curSelectedRow = transformedRows.length + 1;

        // set the displayedSelectedRow = next current selected row
        displayedSelectedRow = curSelectedRow;
      } else {
        DataManagerIST.updateDataRunDataAtIndex(selectedRow, widget.sensor.id, currentValue.values);
        curSelectedRow = selectedRow + 1 >= transformedRows.length ? transformedRows.length : selectedRow + 1;

        // We set the displayedSelectedRow = the current selected row
        displayedSelectedRow = selectedRow;
      }
      setSelectedRow(curSelectedRow);

      transformedRows = [
        ...transformedRows.slice(0, displayedSelectedRow),
        newRow,
        ...transformedRows.slice(displayedSelectedRow + 1),
        displayedSelectedRow < numRows && { colum1: userInputs[numRows] || "", colum2: "---" },
      ];

      setRows(
        transformedRows.length < DEFAULT_ROWS
          ? [...transformedRows, ...defaultRows.slice(transformedRows.length, DEFAULT_ROWS)]
          : transformedRows
      );

      scrollToRef(lastRowRef);
    },
  }));

  useEffect(() => {
    setFirstColumnOption(samplingMode === SAMPLING_AUTO ? FIRST_COLUMN_DEFAULT_OPT : FIRST_COLUMN_CUSTOM_OPT);
  }, [samplingMode]);

  useEffect(() => {
    let transformedRows = convertDataToTableRows(data);
    setNumRows(transformedRows.length);

    if (!isRunning || samplingMode === SAMPLING_MANUAL) {
      const newRow = convertCurrentValueToTableRow(currentValue);
      if (!newRow) return;

      if (!isRunning) {
        transformedRows.push(newRow);
      } else {
        // Preventing loosing selection row when move from auto to manual.
        // As the the selected rows is still the last row from auto
        if (data.length === 0) {
          setSelectedRow(0);
        }

        transformedRows = [
          ...transformedRows.slice(0, selectedRow),
          newRow,
          ...transformedRows.slice(selectedRow + 1),
          selectedRow < numRows && { colum1: userInputs[numRows] || "", colum2: "---" },
        ];
      }
    }

    setRows(
      transformedRows.length < DEFAULT_ROWS
        ? [...transformedRows, ...defaultRows.slice(transformedRows.length, DEFAULT_ROWS)]
        : transformedRows
    );

    if (samplingMode === SAMPLING_AUTO || !isRunning) {
      setSelectedRow(transformedRows.length - 1);
    }

    isRunning && samplingMode === SAMPLING_AUTO && scrollToRef(lastRowRef);
  }, [data, firstColumnOption]);

  const convertDataToTableRows = (data) => {
    const transformedRows = data.map((item, index) => ({
      colum1: firstColumnOption === FIRST_COLUMN_DEFAULT_OPT ? item.time : userInputs[index] || "",
      colum2: item.values[widget.sensor.index],
    }));
    return transformedRows;
  };

  const convertCurrentValueToTableRow = (currentValue) => {
    const { time, values } = currentValue;
    if (!time || !values) return false;

    const newRow = {
      colum1:
        firstColumnOption === FIRST_COLUMN_DEFAULT_OPT ? (isRunning ? time || "" : "") : userInputs[numRows] || "",
      colum2: values[widget.sensor.index] || "",
    };
    return newRow;
  };

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

  const onChooseOptionHandler = (optionId) => {
    switch (optionId) {
      case ADD_COLUMN_OPTION:
        break;
      case DELETE_COLUMN_OPTION:
        break;
      case SUMMARIZE_OPTION:
        break;
      default:
        break;
    }
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
                  {firstColumnOption === FIRST_COLUMN_CUSTOM_OPT && (
                    <Button
                      iconIos={`material:edit`}
                      iconMd={`material:edit`}
                      iconAurora={`material:edit`}
                      style={{ color: "#8C8C8C" }}
                    ></Button>
                  )}
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
            {[...rows, emptyRow, emptyRow].map((row, index) => {
              let ref;
              if (!isRunning) ref = null;
              else if (samplingMode === SAMPLING_AUTO) {
                ref = index === numRows + 1 ? lastRowRef : null;
              } else if (samplingMode === SAMPLING_MANUAL) {
                ref = index === selectedRow + 1 ? lastRowRef : null;
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
                    <span className="span-value " style={index === selectedRow ? { color: "#11b444" } : {}}>
                      {row.colum2}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="expandable-options">
        <ExpandableOptions
          expandIcon={tableChartIcon}
          options={expandableOptions}
          onChooseOption={onChooseOptionHandler}
        />
      </div>
    </div>
  );
};

export default forwardRef(TableWidget);
