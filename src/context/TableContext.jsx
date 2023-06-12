import React, { createContext, useContext, useState } from "react";
import {
  FIRST_COLUMN_DEFAULT_OPT,
  TABLE_TIME_COLUMN,
  getFirstColumnOptions,
} from "../utils/widget-table-chart/commons";

export const TableContext = createContext({
  userInputs: {},
  setUserInputs: () => {},
  firstColumnOptions: {},
  setFirstColumnOptions: () => {},
  getUserInputValue: () => {},
  getFirstColumnOption: () => {},
});

export const TableContextProvider = ({ children }) => {
  const [userInputs, setUserInputs] = useState({});
  const [firstColumnOptions, setFirstColumnOptions] = useState({});

  const getUserInputValue = ({ tableId, inputRow }) => {
    const inputId = `${tableId}_${inputRow}`;
    return userInputs[inputId] || "";
  };

  const getFirstColumnOption = ({ tableId }) => {
    const option = firstColumnOptions[tableId];
    if (!option) return TABLE_TIME_COLUMN;
    else return option;
  };

  return (
    <TableContext.Provider
      value={{
        userInputs,
        setUserInputs,
        firstColumnOptions,
        setFirstColumnOptions,
        getUserInputValue,
        getFirstColumnOption,
      }}
    >
      {children}
    </TableContext.Provider>
  );
};

export const useTableContext = () => useContext(TableContext);
