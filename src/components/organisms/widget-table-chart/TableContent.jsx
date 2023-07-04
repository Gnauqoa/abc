import React from "react";
import { FIRST_COLUMN_DEFAULT_OPT } from "../../../utils/widget-table-chart/commons";
import { SAMPLING_AUTO, SAMPLING_MANUAL } from "../../../js/constants";
import { useTableContext } from "../../../context/TableContext";
import DataManagerIST from "../../../services/data-manager";
import { createInputIdCustomUnit } from "../../../utils/core";

const TableContent = ({
  tableId,
  isRunning,
  samplingMode,
  rows,
  numRows,
  lastRowRef,
  selectedElement,
  numColumns,
  handleChangeSelectedColumn,
}) => {
  const emptyRow = { column0: "" };
  const { getUserInputValue, getFirstColumnOption, setUserInputs } = useTableContext();
  const firstColumnOption = getFirstColumnOption({ tableId: tableId });

  const userInputHandler = (event) => {
    const inputSelectedRow = event.target.id;
    const inputValue = event.target.value;
    const inputRow = inputSelectedRow.split("_")[0];
    const inputId = createInputIdCustomUnit({ unitId: firstColumnOption.id, index: inputRow });

    DataManagerIST.addUseInputCustomUnit({ unitId: firstColumnOption.id, input: inputValue, index: inputRow });
    setUserInputs((prev) => {
      return { ...prev, [inputId]: inputValue };
    });
  };

  return (
    <div>
      {[...rows, emptyRow, emptyRow].map((row, rowIndex) => {
        const { selectedRow, selectedColumn } = selectedElement;

        let ref;
        if (!isRunning) ref = null;
        else if (samplingMode === SAMPLING_AUTO) {
          ref = rowIndex === numRows + 1 ? lastRowRef : null;
        } else if (samplingMode === SAMPLING_MANUAL) {
          ref = rowIndex === selectedRow + 1 ? lastRowRef : null;
        }

        // Create N number of columns
        const dynamicColumns = [];
        for (let columnIndex = 0; columnIndex < numColumns; columnIndex++) {
          const style = {};

          // set the style for data selected only when is running and current row = selected row
          if (isRunning && rowIndex === selectedRow) style["color"] = "#11b444";

          // set the style for column selected
          if (columnIndex + 1 === selectedColumn) style["background"] = "#F2ECEC";

          dynamicColumns.push(
            <td
              key={`data-row-${rowIndex}-${columnIndex}`}
              id={`${rowIndex}_${columnIndex + 1}`}
              onClick={handleChangeSelectedColumn}
            >
              <span className="span-value " style={style}>
                {row[`column${columnIndex + 1}`]}
              </span>
            </td>
          );
        }
        return (
          <tr key={`data-row-${rowIndex}`} ref={ref}>
            {/* ========================== FIXED FIRST COLUMN ========================== */}
            <td key={`fixed-data-row-${rowIndex}`}>
              {firstColumnOption.id === FIRST_COLUMN_DEFAULT_OPT ? (
                <span className="span-input">{row.column0}</span>
              ) : (
                <input
                  id={`${rowIndex}_0`}
                  type="text"
                  value={getUserInputValue({ unitId: firstColumnOption.id, inputRow: rowIndex })}
                  onChange={userInputHandler}
                  disabled={firstColumnOption.id === FIRST_COLUMN_DEFAULT_OPT}
                />
              )}
            </td>

            {/* ========================== SECOND COLUMN ========================== */}
            {dynamicColumns}
          </tr>
        );
      })}
    </div>
  );
};

export default TableContent;
