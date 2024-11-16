import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle } from "react";
import "./index.scss";
import SensorServices from "../../../services/sensor-service";
import DataManagerIST from "../../../services/data-manager";

import { SAMPLING_AUTO, SAMPLING_MANUAL, DEFAULT_SENSOR_ID } from "../../../js/constants";

import tableChartIcon from "../../../img/expandable-options/table.png";
import {
  expandableOptions,
  DEFAULT_ROWS,
  FIRST_COLUMN_DEFAULT_OPT,
  ADD_COLUMN_OPTION,
  DELETE_COLUMN_OPTION,
  SUMMARIZE_OPTION,
  createLastRow,
  getMaxDataSize,
} from "../../../utils/widget-table-chart/commons.jsx";

import ExpandableOptions from "../../molecules/expandable-options";
import SummarizedTable from "./TableSummary";
import TableHeader from "./TableHeader";
import TableContent from "./TableContent";
import { useTableContext } from "../../../context/TableContext";
import { useActivityContext } from "../../../context/ActivityContext";
import _ from "lodash";

const TableWidget = ({ id: tableId, datas, dataRuns, currentValues, widget, chartLayout, samplingMode }, ref) => {
  const { getUserInputValue, getFirstColumnOption } = useTableContext();
  const {
    isRunning,
    handleDeleteExtraCollectingSensor,
    handleAddExtraCollectingSensor,
    handleSensorChange,
    setCurrentDataRunId,
    currentDataRunId,
  } = useActivityContext();

  // ========================== Create variables depending on number of columns ==========================
  const numColumns = widget.sensors.length;
  const emptyRow = { column0: "" };
  for (let i = 0; i < numColumns; i++) {
    emptyRow[`column${i + 1}`] = "";
  }
  const defaultRows = Array.from({ length: DEFAULT_ROWS }, () => emptyRow);
  const firstColumnOption = getFirstColumnOption({ tableId: tableId });

  // ========================== Declare variables ==========================
  const lastRowRef = useRef(null);
  const [numRows, setNumRows] = useState(0);
  const [rows, setRows] = useState(defaultRows);
  const [selectedElement, setSelectedElement] = useState({
    selectedRow: 0,
    selectedColumn: 0,
  });
  const [isShowSummarizedData, setIsShowSummarizedData] = useState(false);
  const [dataRunName, setDataRunName] = useState("");

  const expandOptions = expandableOptions.map((option) => {
    if (option.id !== SUMMARIZE_OPTION) return option;
    return { ...option, selected: isShowSummarizedData };
  });

  const sensorsUnit = widget.sensors.map((sensor) => {
    return sensor.id === DEFAULT_SENSOR_ID ? "" : SensorServices.getUnit(sensor.id, sensor.index);
  });

  // ========================== useImperativeHandle and useEffect Functions ==========================
  useImperativeHandle(ref, () => ({
    handleSamplingManual() {
      // Render all current rows and the new current row of table
      // If the newRow is undefined, the user is not select sensor
      // and manually sampling, just put the current buffer to dataRuns
      let transformedRows = convertDataToTableRows(datas);
      const newRow = convertCurrentsValueToTableRow(currentValues);
      if (!newRow) {
        DataManagerIST.appendManualSample();
        return;
      }

      setNumRows(transformedRows.length);

      const { selectedRow } = selectedElement;
      let curSelectedRow = selectedRow;
      let displayedSelectedRow = selectedRow;
      const sensorIds = widget.sensors.map((sensor) => parseInt(sensor.id));
      const sensorValues = currentValues;

      if (selectedRow === transformedRows.length) {
        DataManagerIST.appendManualSample(sensorIds, sensorValues);
        curSelectedRow = transformedRows.length + 1;

        // set the displayedSelectedRow = next current selected row
        displayedSelectedRow = curSelectedRow;
      } else {
        DataManagerIST.updateDataRunDataAtIndex(selectedRow, sensorIds, sensorValues);
        curSelectedRow = selectedRow + 1 >= transformedRows.length ? transformedRows.length : selectedRow + 1;

        // We set the displayedSelectedRow = the current selected row
        displayedSelectedRow = selectedRow;
      }

      // Set the selected element to the new selected row
      setSelectedElement({
        ...selectedElement,
        selectedRow: curSelectedRow,
      });

      /* Create last row and push to the transformedRows
        If the displayedSelectedRow < numRows, it means that
        we are selecting the row in the middle of the table,
        and we need to create the last row to push to the table
      */
      const lastRow = createLastRow({
        firstColumnValue: getUserInputValue({ tableId: tableId, inputRow: numRows }),
        numColumns: numColumns,
        widget: widget,
      });

      transformedRows = [
        ...transformedRows.slice(0, displayedSelectedRow),
        newRow,
        ...transformedRows.slice(displayedSelectedRow + 1),
        displayedSelectedRow < numRows && lastRow,
      ];

      setRows(
        transformedRows.length < DEFAULT_ROWS
          ? [...transformedRows, ...defaultRows.slice(transformedRows.length, DEFAULT_ROWS)]
          : transformedRows
      );

      scrollToRef(lastRowRef);
    },
  }));

  // useEffect(() => {
  //   if (samplingMode === SAMPLING_AUTO && firstColumnOption.id === FIRST_COLUMN_CUSTOM_OPT) {
  //     setFirstColumnOptions((prev) => {
  //       return { ...prev, [tableId]: { ...TABLE_TIME_COLUMN } };
  //     });
  //   } else if (samplingMode === SAMPLING_MANUAL && firstColumnOption.id === FIRST_COLUMN_DEFAULT_OPT) {
  //     setFirstColumnOptions((prev) => {
  //       return { ...prev, [tableId]: { ...TABLE_CUSTOM_COLUMN } };
  //     });
  //   }
  // }, [samplingMode]);

  useEffect(() => {
    const { selectedRow } = selectedElement;
    let transformedRows = convertDataToTableRows(datas);
    setNumRows(transformedRows.length);

    if (!isRunning || samplingMode === SAMPLING_MANUAL) {
      const newRow = convertCurrentsValueToTableRow(currentValues);

      if (isRunning) {
        const isHasData = datas.some((data) => data.length > 0);
        if (!isHasData) {
          if (selectedElement.selectedRow !== 0) {
            setSelectedElement({ ...selectedElement, selectedRow: 0 });
          }
        }

        const lastRow = createLastRow({
          firstColumnValue: getUserInputValue({ tableId, inputRow: numRows }),
          numColumns: numColumns,
          widget: widget,
        });

        transformedRows = [
          ...transformedRows.slice(0, selectedRow),
          newRow,
          ...transformedRows.slice(selectedRow + 1),
          selectedRow < numRows && lastRow,
        ];
      }
    }

    const newRows =
      transformedRows.length < DEFAULT_ROWS
        ? [...transformedRows, ...defaultRows.slice(transformedRows.length, DEFAULT_ROWS)]
        : transformedRows;

    if (JSON.stringify(newRows) !== JSON.stringify(rows)) {
      setRows(newRows);
    }
    // if (_.isEqual(rows, newRows)) setRows(newRows);
    if (samplingMode === SAMPLING_AUTO || !isRunning) {
      if (transformedRows.length === 0) return;
      const newSelectedRow = transformedRows.length - 1;
      if (selectedElement.selectedRow !== newSelectedRow) {
        setSelectedElement({ ...selectedElement, selectedRow: newSelectedRow });
      }
    }

    if (isRunning && samplingMode === SAMPLING_AUTO) {
      scrollToRef(lastRowRef);
    }
  }, [datas, firstColumnOption, isRunning, samplingMode, currentValues, selectedElement]);

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

        const firstColumnValue =
          firstColumnOption.id === FIRST_COLUMN_DEFAULT_OPT
            ? time
            : getUserInputValue({ tableId: tableId, inputRow: columnIndex });

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
        firstColumnOption.id === FIRST_COLUMN_DEFAULT_OPT
          ? isRunning
            ? time || ""
            : ""
          : getUserInputValue({ tableId: tableId, inputRow: numRows });

      newRow["column0"] = firstColumnValue;
      newRow[`column${columnIndex + 1}`] = values?.[widgetSensor?.index] ?? "";
    }

    return newRow;
  };

  const scrollToRef = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  // ========================== Handler functions ==========================

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

  const deleteColumnHandler = () => {
    const { selectedColumn } = selectedElement;
    if (!selectedColumn || numColumns <= 1) return;

    const deleteSensorIndex = selectedColumn - 1;
    handleDeleteExtraCollectingSensor(widget.id, deleteSensorIndex);
  };

  const summarizeTableHandler = () => {
    setIsShowSummarizedData(!isShowSummarizedData);
  };

  const onChooseOptionHandler = ({ optionId }) => {
    switch (optionId) {
      case ADD_COLUMN_OPTION:
        handleAddExtraCollectingSensor({ widgetId: widget.id });
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

  const handleChangeDataRun = (dataRun) => {
    setCurrentDataRunId(dataRun.id);
    setDataRunName(dataRun.name);
  };

  const findIdDataRun = () => {
    if (dataRuns.length < 1) return;
    else {
      const currentData = dataRuns.filter((data) => data.id === currentDataRunId);
      setDataRunName(currentData[0].name);
    }
  };

  useEffect(() => {
    findIdDataRun();
  }, []);

  return (
    <div className="wapper">
      <div className="wapper__chart">
        <table className="wapper__chart__table">
          {/* ========================== TABLE BODY ========================== */}
          <tbody className="wapper__chart__table__body">
            {/* ========================== TABLE HEADER ========================== */}
            <TableHeader
              tableId={tableId}
              isRunning={isRunning}
              widget={widget}
              sensorsUnit={sensorsUnit}
              handleSensorChange={handleSensorChange}
              dataRuns={dataRuns}
              handleChangeDataRun={handleChangeDataRun}
              dataRunName={dataRunName}
            />
            {/* ========================== TABLE CONTENT ========================== */}
            <TableContent
              tableId={tableId}
              isRunning={isRunning}
              samplingMode={samplingMode}
              rows={rows}
              numRows={numRows}
              lastRowRef={lastRowRef}
              selectedElement={selectedElement}
              numColumns={numColumns}
              handleChangeSelectedColumn={handleChangeSelectedColumn}
              dataRunName={dataRunName}
            />
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
