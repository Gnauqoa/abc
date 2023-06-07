import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle } from "react";
import "./index.scss";
import SensorServices from "../../../services/sensor-service";
import DataManagerIST from "../../../services/data-manager";
import StoreService from "../../../services/store-service";

import { SAMPLING_AUTO, SAMPLING_MANUAL, DEFAULT_SENSOR_ID, USER_INPUTS_TABLE } from "../../../js/constants";

import tableChartIcon from "../../../img/expandable-options/table.png";
import {
  expandableOptions,
  DEFAULT_ROWS,
  FIRST_COLUMN_DEFAULT_OPT,
  FIRST_COLUMN_CUSTOM_OPT,
  ADD_COLUMN_OPTION,
  DELETE_COLUMN_OPTION,
  SUMMARIZE_OPTION,
} from "../../../utils/widget-table-chart/commons.jsx";

import ExpandableOptions from "../../molecules/expandable-options";
import SummarizedTable from "./TableSummary";
import useDebounce from "../../../hooks/useDebounce";
import TableHeader from "./TableHeader";
import TableContent from "./TableContent";

const userInputsStorage = new StoreService(USER_INPUTS_TABLE);

const TableWidget = (
  {
    id: tableId,
    datas,
    currentValues,
    widget,
    handleSensorChange,
    chartLayout,
    isRunning,
    samplingMode,
    handleTableAddColumn,
    handleTableDeleteColumn,
  },
  ref
) => {
  // ========================== Create variables depending on number of columns ==========================
  const numColumns = widget.sensors.length;
  const emptyRow = { column0: "" };
  for (let i = 0; i < numColumns; i++) {
    emptyRow[`column${i + 1}`] = "";
  }
  const defaultRows = Array.from({ length: DEFAULT_ROWS }, () => emptyRow);

  // ========================== Declare variables ==========================
  const [rows, setRows] = useState(defaultRows);
  const [numRows, setNumRows] = useState(0);
  const [userInputs, setUserInputs] = useState({});
  const debounceUserInputs = useDebounce(userInputs, 500);
  const [selectedElement, setSelectedElement] = useState({
    selectedRow: 0,
    selectedColumn: 0,
  });

  const [isShowSummarizedData, setIsShowSummarizedData] = useState(false);
  const expandOptions = expandableOptions.map((option) => {
    if (option.id !== SUMMARIZE_OPTION) return option;
    return { ...option, selected: isShowSummarizedData };
  });

  const [firstColumnOption, setFirstColumnOption] = useState(FIRST_COLUMN_DEFAULT_OPT);
  const lastRowRef = useRef(null);
  const sensorsUnit = widget.sensors.map((sensor) => {
    return sensor.id === DEFAULT_SENSOR_ID ? "" : SensorServices.getUnit(sensor.id, sensor.index);
  });

  // ========================== useImperativeHandle and useEffect Functions ==========================
  useImperativeHandle(ref, () => ({
    handleSamplingManual() {
      let transformedRows = convertDataToTableRows(datas);
      const newRow = convertCurrentsValueToTableRow(currentValues);
      if (!newRow) {
        // if the user is not select sensor and manually
        // sampling, just put the current buffer to dataRuns
        DataManagerIST.appendManualSample();
        return;
      }

      const { selectedRow } = selectedElement;

      setNumRows(transformedRows.length);
      let curSelectedRow = selectedRow;
      let displayedSelectedRow = selectedRow;
      const sensorIds = widget.sensors.map((sensor) => parseInt(sensor.id));

      if (selectedRow === transformedRows.length) {
        DataManagerIST.appendManualSample(sensorIds, currentValues);
        curSelectedRow = transformedRows.length + 1;

        // set the displayedSelectedRow = next current selected row
        displayedSelectedRow = curSelectedRow;
      } else {
        DataManagerIST.updateDataRunDataAtIndex(selectedRow, sensorIds, currentValues);
        curSelectedRow = selectedRow + 1 >= transformedRows.length ? transformedRows.length : selectedRow + 1;

        // We set the displayedSelectedRow = the current selected row
        displayedSelectedRow = selectedRow;
      }

      setSelectedElement({
        ...selectedElement,
        selectedRow: curSelectedRow,
      });

      transformedRows = [
        ...transformedRows.slice(0, displayedSelectedRow),
        newRow,
        ...transformedRows.slice(displayedSelectedRow + 1),
        displayedSelectedRow < numRows && createLastRow(userInputs[numRows]),
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
    const prevUserInputs = userInputsStorage.find(tableId);
    if (prevUserInputs) setUserInputs({ ...prevUserInputs.userInputs });
  }, []);

  useEffect(() => {
    if (samplingMode === SAMPLING_AUTO && firstColumnOption === FIRST_COLUMN_CUSTOM_OPT) {
      setFirstColumnOption(FIRST_COLUMN_DEFAULT_OPT);
    } else if (samplingMode === SAMPLING_MANUAL && firstColumnOption === FIRST_COLUMN_DEFAULT_OPT) {
      setFirstColumnOption(FIRST_COLUMN_CUSTOM_OPT);
    }
  }, [samplingMode]);

  useEffect(() => {
    userInputsStorage.save({ id: tableId, userInputs: debounceUserInputs });
  }, [debounceUserInputs]);

  useEffect(() => {
    let transformedRows = convertDataToTableRows(datas);
    setNumRows(transformedRows.length);

    const { selectedRow } = selectedElement;

    if (!isRunning || samplingMode === SAMPLING_MANUAL) {
      const newRow = convertCurrentsValueToTableRow(currentValues);

      if (!isRunning) {
        // TODO: comment this out to not display when not isRunning
        // transformedRows.push(newRow);
      } else {
        // Preventing loosing selection row when move from auto to manual.
        // As the the selected rows is still the last row from auto
        const isHasData = datas.reduce((acc, data) => acc || data.length > 0, false);
        if (!isHasData) {
          setSelectedElement({
            ...selectedElement,
            selectedRow: 0,
          });
        }

        transformedRows = [
          ...transformedRows.slice(0, selectedRow),
          newRow,
          ...transformedRows.slice(selectedRow + 1),
          selectedRow < numRows && createLastRow(userInputs[numRows]),
        ];
      }
    }

    setRows(
      transformedRows.length < DEFAULT_ROWS
        ? [...transformedRows, ...defaultRows.slice(transformedRows.length, DEFAULT_ROWS)]
        : transformedRows
    );

    if (samplingMode === SAMPLING_AUTO || !isRunning) {
      if (transformedRows.length === 0) return;
      setSelectedElement({
        ...selectedElement,
        selectedRow: transformedRows.length - 1,
      });
    }

    // TODO: comment this out to not display when not isRunning
    isRunning && samplingMode === SAMPLING_AUTO && scrollToRef(lastRowRef);
  }, [datas, firstColumnOption]);

  // ========================== Utils functions ==========================
  const convertDataToTableRows = (datas) => {
    if (datas.length === 0) return [];
    const dataLength = getMaxDataSize(datas);

    const transformedRows = [];
    for (let rowIndex = 0; rowIndex < dataLength; rowIndex++) {
      const transformedRow = {};

      for (let columnIndex = 0; columnIndex < numColumns; columnIndex++) {
        const cellData = datas[columnIndex][rowIndex] || {};
        const { time, values } = cellData;

        const firstColumnValue = firstColumnOption === FIRST_COLUMN_DEFAULT_OPT ? time : userInputs[columnIndex] || "";

        transformedRow["column0"] = firstColumnValue || transformedRow["column0"];
        transformedRow[`column${columnIndex + 1}`] = values?.[widget.sensors[columnIndex].index] ?? "";
      }

      transformedRows.push(transformedRow);
    }

    return transformedRows;
  };

  const convertCurrentsValueToTableRow = (currentValues) => {
    const newRow = {};

    for (let columnIndex = 0; columnIndex < numColumns; columnIndex++) {
      const { time, values } = currentValues[columnIndex];
      const widgetSensor = widget.sensors[columnIndex];
      const firstColumnValue =
        firstColumnOption === FIRST_COLUMN_DEFAULT_OPT ? (isRunning ? time || "" : "") : userInputs[numRows] || "";

      newRow["column0"] = firstColumnValue;
      newRow[`column${columnIndex + 1}`] = values?.[widgetSensor?.index] ?? "";
    }

    return newRow;
  };

  const getMaxDataSize = (datas) => {
    return datas.reduce((maxSize, data) => Math.max(maxSize, data.length), 0);
  };

  const createLastRow = (firstColumnValue) => {
    const row = { column0: firstColumnValue };
    for (let columnIndex = 0; columnIndex < numColumns; columnIndex++) {
      let cellValue = "---";
      if (widget.sensors[columnIndex]?.id === DEFAULT_SENSOR_ID) cellValue = "";
      row[`column${columnIndex + 1}`] = cellValue;
    }
    return row;
  };

  const scrollToRef = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  // ========================== Handler functions ==========================
  const handleFirstColumSelector = ({ target: { value } }) => {
    setFirstColumnOption(value);
  };

  const handleChangeSelectedColumn = (event) => {
    const cellId = event.currentTarget.id;
    const [cellRow, cellColumn] = cellId.split("_");
    const { selectedRow, selectedColumn } = selectedElement;

    let newCellRow = selectedRow;
    let newCellColumn = selectedColumn;

    if (isRunning && samplingMode === SAMPLING_MANUAL && cellRow && parseInt(cellRow) <= numRows) {
      newCellRow = parseInt(cellRow);
    }

    if (newCellColumn !== parseInt(cellColumn)) {
      newCellColumn = parseInt(cellColumn);
    } else {
      newCellColumn = 0;
    }

    setSelectedElement({
      selectedRow: newCellRow,
      selectedColumn: newCellColumn,
    });
  };

  const userInputHandler = (event) => {
    const inputSelectedRow = event.target.id;
    const inputValue = event.target.value;
    const inputRow = inputSelectedRow.split("_")[0];

    setUserInputs((prev) => {
      return { ...prev, [inputRow]: inputValue };
    });
  };

  const deleteColumnHandler = () => {
    const { selectedColumn } = selectedElement;
    if (!selectedColumn || numColumns <= 1) return;

    const deleteSensorIndex = selectedColumn - 1;
    handleTableDeleteColumn(widget.id, deleteSensorIndex);
  };

  const summarizeTableHandler = () => {
    setIsShowSummarizedData(!isShowSummarizedData);
  };

  const onChooseOptionHandler = (optionId) => {
    switch (optionId) {
      case ADD_COLUMN_OPTION:
        handleTableAddColumn(widget.id);
        break;
      case DELETE_COLUMN_OPTION:
        deleteColumnHandler();
        break;
      case SUMMARIZE_OPTION:
        summarizeTableHandler();
        break;
      default:
        break;
    }
  };

  return (
    <div className="wapper">
      <div className="wapper__chart">
        <table className="wapper__chart__table">
          {/* ========================== TABLE BODY ========================== */}
          <tbody className="wapper__chart__table__body">
            {/* ========================== TABLE HEADER ========================== */}
            <TableHeader
              isRunning={isRunning}
              firstColumnOption={firstColumnOption}
              widget={widget}
              sensorsUnit={sensorsUnit}
              handleSensorChange={handleSensorChange}
              handleFirstColumSelector={handleFirstColumSelector}
            />
            {/* ========================== TABLE CONTENT ========================== */}
            <TableContent
              isRunning={isRunning}
              samplingMode={samplingMode}
              firstColumnOption={firstColumnOption}
              userInputs={userInputs}
              rows={rows}
              numRows={numRows}
              lastRowRef={lastRowRef}
              selectedElement={selectedElement}
              numColumns={numColumns}
              userInputHandler={userInputHandler}
              handleChangeSelectedColumn={handleChangeSelectedColumn}
            />
            <div></div>
          </tbody>
        </table>
      </div>

      {isShowSummarizedData && (
        <SummarizedTable chartLayout={chartLayout} datas={datas} sensors={widget.sensors}></SummarizedTable>
      )}

      <div className="expandable-options">
        <ExpandableOptions expandIcon={tableChartIcon} options={expandOptions} onChooseOption={onChooseOptionHandler} />
      </div>
    </div>
  );
};

export default forwardRef(TableWidget);
