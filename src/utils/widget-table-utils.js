import { LAYOUT_TABLE, LAYOUT_TABLE_CHART, LAYOUT_NUMBER_TABLE } from "../js/constants";

import addColumnIcon from "../img/expandable-options/add-column.png";
import deleteColumnIcon from "../img/expandable-options/delete-column.png";
import summarizeTableIcon from "../img/expandable-options/summarize-table.png";

export const DEFAULT_ROWS = 15;
export const FIRST_COLUMN_DEFAULT_OPT = "time";
export const FIRST_COLUMN_CUSTOM_OPT = "custom";

export const PAGE_SETTINGS = {
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

export const emptyRow = { colum1: "", colum2: "" };
export const defaultRows = Array.from({ length: DEFAULT_ROWS }, () => emptyRow);

export const ADD_COLUMN_OPTION = 0;
export const DELETE_COLUMN_OPTION = 1;
export const SUMMARIZE_OPTION = 2;

export const expandableOptions = [
  {
    id: ADD_COLUMN_OPTION,
    icon: addColumnIcon,
  },
  {
    id: DELETE_COLUMN_OPTION,
    icon: deleteColumnIcon,
  },
  {
    id: SUMMARIZE_OPTION,
    icon: summarizeTableIcon,
  },
];
