import React, { createContext, useContext, useState } from "react";
import {
  FIRST_COLUMN_DEFAULT_OPT,
  TABLE_TIME_COLUMN,
  getFirstColumnOptions,
} from "../utils/widget-table-chart/commons";
import { createInputIdCustomUnit } from "../utils/core";

export const TableContext = createContext({
  userInputs: {},
  setUserInputs: () => {},
  firstColumnOptions: {},
  setFirstColumnOptions: () => {},
  getUserInputValue: () => {},
  getFirstColumnOption: () => {},
  initTableContext: () => {},
});

export const TableContextProvider = ({ children }) => {
  const [userInputs, setUserInputs] = useState({});
  const [firstColumnOptions, setFirstColumnOptions] = useState({});

  const getUserInputValue = ({ unitId, inputRow }) => {
    const inputId = createInputIdCustomUnit({ unitId, index: inputRow });
    return userInputs[inputId] || "";
  };

  const getFirstColumnOption = ({ tableId }) => {
    const option = firstColumnOptions[tableId];
    if (!option) return TABLE_TIME_COLUMN;
    else return option;
  };

  const initTableContext = ({ customUnits }) => {
    const initUserInput = {};
    for (const customUnit of customUnits) {
      const unitId = customUnit.id;
      const userInput = customUnit.userInput || [];
      for (let index = 0; index < userInput.length; index++) {
        const inputId = createInputIdCustomUnit({ unitId, index });
        initUserInput[inputId] = userInput[index];
      }
    }
    setUserInputs({ ...initUserInput });
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
        initTableContext,
      }}
    >
      {children}
    </TableContext.Provider>
  );
};

export const useTableContext = () => useContext(TableContext);
