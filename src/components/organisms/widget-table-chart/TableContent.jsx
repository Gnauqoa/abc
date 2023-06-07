import React from "react";
import { FIRST_COLUMN_DEFAULT_OPT } from "../../../utils/widget-table-chart/commons";
import { SAMPLING_AUTO, SAMPLING_MANUAL } from "../../../js/constants";

const TableContent = ({
  isRunning,
  samplingMode,
  firstColumnOption,
  userInputs,
  userInputHandler,
  rows,
  numRows,
  lastRowRef,
  selectedElement,
  numColumns,
  handleChangeSelectedColumn,
}) => {
  const emptyRow = { column0: "" };

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
          if (rowIndex === selectedRow) style["color"] = "#11b444";
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
              {firstColumnOption === FIRST_COLUMN_DEFAULT_OPT ? (
                <span className="span-input">{row.column0}</span>
              ) : (
                <input
                  id={`${rowIndex}_0`}
                  type="text"
                  value={userInputs[rowIndex] || ""}
                  onChange={userInputHandler}
                  disabled={firstColumnOption === FIRST_COLUMN_DEFAULT_OPT}
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
