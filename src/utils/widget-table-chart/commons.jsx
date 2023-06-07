import React from "react";

import { LAYOUT_TABLE, LAYOUT_TABLE_CHART, LAYOUT_NUMBER_TABLE } from "../../js/constants";

import addColumnIcon from "../../img/expandable-options/add-column.png";
import deleteColumnIcon from "../../img/expandable-options/delete-column.png";
import summarizeTableIcon from "../../img/expandable-options/summarize-table.png";
import summarizeTableSelectedIcon from "../../img/expandable-options/summarize-table-selected.png";
import DataManagerIST from "../../services/data-manager";

export const DEFAULT_ROWS = 18;
export const FIRST_COLUMN_DEFAULT_OPT = "time";
export const FIRST_COLUMN_CUSTOM_OPT = "custom";

export const ADD_COLUMN_OPTION = 0;
export const DELETE_COLUMN_OPTION = 1;
export const SUMMARIZE_OPTION = 2;

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

const FIRST_COLUMN_OPTIONS = [
  {
    id: FIRST_COLUMN_DEFAULT_OPT,
    type: FIRST_COLUMN_DEFAULT_OPT,
    name: "Thời gian",
    unit: <span className="header-unit__input">(giây)</span>,
  },
  {
    id: FIRST_COLUMN_CUSTOM_OPT,
    type: FIRST_COLUMN_CUSTOM_OPT,
    name: "Người dùng nhập",
    unit: <span className="header-unit__input">--------</span>,
  },
];

export const getFirstColumnOptions = () => {
  const customMeasurements = DataManagerIST.getCustomMeasurements();
  const result = [...FIRST_COLUMN_OPTIONS, ...customMeasurements];
  return result;
};
