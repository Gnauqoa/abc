import React from "react";

import { LAYOUT_TABLE, LAYOUT_TABLE_CHART, LAYOUT_NUMBER_TABLE, DEFAULT_SENSOR_ID } from "../../js/constants";

import addColumnIcon from "../../img/expandable-options/add-column.png";
import deleteColumnIcon from "../../img/expandable-options/delete-column.png";
import summarizeTableIcon from "../../img/expandable-options/summarize-table.png";
import summarizeTableSelectedIcon from "../../img/expandable-options/summarize-table-selected.png";
import DataManagerIST from "../../services/data-manager";

export const DEFAULT_ROWS = 18;
export const FIRST_COLUMN_DEFAULT_OPT = "time";
// export const FIRST_COLUMN_CUSTOM_OPT = "custom";

export const ADD_COLUMN_OPTION = `${LAYOUT_TABLE}-expandable-options-0`;
export const DELETE_COLUMN_OPTION = `${LAYOUT_TABLE}-expandable-options-1`;
export const SUMMARIZE_OPTION = `${LAYOUT_TABLE}-expandable-options-2`;

export const expandableOptions = [
  {
    id: ADD_COLUMN_OPTION,
    icon: addColumnIcon,
    selected: false,
  },
  {
    id: DELETE_COLUMN_OPTION,
    icon: deleteColumnIcon,
    selected: false,
  },
  {
    id: SUMMARIZE_OPTION,
    icon: summarizeTableIcon,
    selectedIcon: summarizeTableSelectedIcon,
    selected: false,
  },
];

// export const TABLE_TIME_COLUMN = {
//   id: FIRST_COLUMN_DEFAULT_OPT,
//   name: "Thời gian",
//   unit: <span className="header-unit">(giây)</span>,
// };

export const TABLE_TIME_COLUMN = (t) => {
  return {
    id: FIRST_COLUMN_DEFAULT_OPT,
    name: t("common.time"),
    unit: <span className="header-unit">{"(" + t("common.second") + ")"}</span>,
  };
};

// export const TABLE_CUSTOM_COLUMN = {
//   id: FIRST_COLUMN_CUSTOM_OPT,
//   name: "Người dùng nhập",
//   unit: <span className="header-unit__input">--------</span>,
// };

export const X_AXIS_TIME_UNIT = {
  id: FIRST_COLUMN_DEFAULT_OPT,
  name: "common.time",
  unit: "s",
};

export const getFirstColumnOptions = (t) => {
  const customMeasurements = DataManagerIST.getCustomUnits();
  const result = [TABLE_TIME_COLUMN(t), ...customMeasurements];
  return result;
};

// This function is used for manual collecting data
export const createLastRow = ({ firstColumnValue, numColumns, widget }) => {
  const row = { column0: firstColumnValue };
  for (let columnIndex = 0; columnIndex < numColumns; columnIndex++) {
    let cellValue = "---";
    if (widget.sensors[columnIndex]?.id === DEFAULT_SENSOR_ID) cellValue = "";
    row[`column${columnIndex + 1}`] = cellValue;
  }
  return row;
};

export const getMaxDataSize = (datas) => {
  return datas.reduce((maxSize, data) => Math.max(maxSize, data.length), 0);
};
