import { LAYOUT_TABLE, LAYOUT_TABLE_CHART, LAYOUT_NUMBER_TABLE } from "../js/constants";

import addColumnIcon from "../img/expandable-options/add-column.png";
import deleteColumnIcon from "../img/expandable-options/delete-column.png";
import summarizeTableIcon from "../img/expandable-options/summarize-table.png";

export const DEFAULT_ROWS = 15;
export const FIRST_COLUMN_DEFAULT_OPT = "time";
export const FIRST_COLUMN_CUSTOM_OPT = "custom";

export const PAGE_SETTINGS = {
  [LAYOUT_TABLE]: {
    "header-name-selector": {
      width: "300px",
      fontSize: "16px",
    },
    td: {
      minWidth: "320px",
    },
  },
  [LAYOUT_NUMBER_TABLE]: {
    "header-name-selector": {
      width: "200px",
      fontSize: "18px",
    },
    td: {
      minWidth: "260px",
    },
  },
  [LAYOUT_TABLE_CHART]: {
    "header-name-selector": {
      width: "160px",
      fontSize: "16px",
    },
    td: {
      minWidth: "210px",
    },
  },
};

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
