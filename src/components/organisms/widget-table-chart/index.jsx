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
  const { getUserInputValue, getFirstColumnOption } = useTableContext();

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

      // Parameter for custom user unit
      const isCustomUnit = ![FIRST_COLUMN_DEFAULT_OPT].includes(firstColumnOption.id);

      // If the current first column is the custom unit, then we need to add the data
      if (isCustomUnit) {
        const unitId = firstColumnOption.id;
        const datas = {};

        if (Array.isArray(currentValues)) {
          currentValues.forEach((currentValue, index) => {
            const sensorId = parseInt(widget.sensors?.[index]?.id);
            if (sensorId === DEFAULT_SENSOR_ID) return;

            const currentValues = currentValue.values;
            const sensorValue = {
              values: currentValues,
              label: getUserInputValue({ tableId: tableId, inputRow: selectedRow }),
            };
            datas[sensorId] = sensorValue;
          });
        }

        if (selectedRow === transformedRows.length) {
          DataManagerIST.addCustomUnitDatas({ sensorIds: sensorIds, unitId, datas: datas });
        } else {
          DataManagerIST.addCustomUnitDatas({ sensorIds: sensorIds, unitId, datas: datas, index: selectedRow });
        }
      }

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

        const lastRow = createLastRow({
          firstColumnValue: getUserInputValue({ tableId: tableId, inputRow: numRows }),
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
              tableId={tableId}
              isRunning={isRunning}
              widget={widget}
              sensorsUnit={sensorsUnit}
              handleSensorChange={handleSensorChange}
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
