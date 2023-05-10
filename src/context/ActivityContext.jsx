import React, { useContext, useState, useRef } from "react";
import { DEFAULT_SENSOR_DATA, LAYOUT_NUMBER } from "../js/constants";

import DataManagerIST from "../services/data-manager";

const defaultWidgets = [{ id: 0, sensors: [DEFAULT_SENSOR_DATA] }];
const defaultPages = [
  {
    layout: LAYOUT_NUMBER,
    widgets: defaultWidgets,
    lastDataRunId: null,
    name: "1",
  },
];

export const ActivityContext = React.createContext({
  pages: [],
  setPages: () => {},
  frequency: null,
  setFrequency: () => {},
  isRunning: false,
  setIsRunning: () => {},
  currentPageIndex: 0,
  setCurrentPageIndex: () => {},
  currentDataRunId: null,
  setCurrentDataRunId: () => {},
  prevChartDataRef: [],
  handleNavigatePage: () => {},
  handleDeletePage: () => {},
  handleNewPage: () => {},
  changePageName: () => {},
});

export const ActivityContextProvider = ({ children }) => {
  const [pages, setPages] = useState(defaultPages);
  const [frequency, setFrequency] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [currentDataRunId, setCurrentDataRunId] = useState(pages[currentPageIndex].lastDataRunId);
  let prevChartDataRef = useRef({ data: [], dataRunIds: [] });

  // ======================= Pages functions =======================
  const handleNavigatePage = (newPageIndex) => {
    prevChartDataRef.current.data[currentPageIndex] = [];
    prevChartDataRef.current.dataRunIds[currentPageIndex] = [];

    let newCurDataRunId;
    if (DataManagerIST.isDataRunIdExist(pages[newPageIndex].lastDataRunId)) {
      newCurDataRunId = pages[newPageIndex].lastDataRunId;
    } else {
      newCurDataRunId = DataManagerIST.getCurrentDataRunId();
    }

    setCurrentPageIndex(newPageIndex);
    setCurrentDataRunId(newCurDataRunId);
  };

  const handleDeletePage = () => {
    const numPages = pages.length;
    const deletedPageIndex = currentPageIndex;
    const newPages = pages.filter((page, index) => index !== deletedPageIndex);
    const newPageIndex = currentPageIndex + 1 === numPages ? currentPageIndex - 1 : currentPageIndex;

    let newCurDataRunId;
    if (DataManagerIST.isDataRunIdExist(newPages[newPageIndex].lastDataRunId)) {
      newCurDataRunId = newPages[newPageIndex].lastDataRunId;
    } else {
      newCurDataRunId = DataManagerIST.getCurrentDataRunId();
    }

    setPages(newPages);
    setCurrentPageIndex(newPageIndex);
    setCurrentDataRunId(newCurDataRunId);

    prevChartDataRef.current.data[currentPageIndex] = [];
    prevChartDataRef.current.dataRunIds[currentPageIndex] = [];
  };

  const handleNewPage = (newPages) => {
    const newPageIndex = newPages.length - 1;
    prevChartDataRef.current.data[currentPageIndex] = [];
    prevChartDataRef.current.dataRunIds[currentPageIndex] = [];

    const newCurDataRunId = DataManagerIST.getCurrentDataRunId();

    setPages(newPages);
    setCurrentPageIndex(newPageIndex);
    setCurrentDataRunId(newCurDataRunId);
  };

  const changePageName = (pageIndex, newPageName) => {
    if (newPageName !== pages[pageIndex].name) {
      const newPages = pages.map((page, index) => {
        if (index === currentPageIndex) {
          return { ...page, name: newPageName };
        }
        return page;
      });
      setPages(newPages);
    }
  };

  // ======================= Datarun functions =======================
  return (
    <ActivityContext.Provider
      value={{
        pages,
        setPages,
        frequency,
        setFrequency,
        isRunning,
        setIsRunning,
        currentPageIndex,
        setCurrentPageIndex,
        currentDataRunId,
        setCurrentDataRunId,
        prevChartDataRef,
        handleNavigatePage,
        handleDeletePage,
        handleNewPage,
        changePageName,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivityContext = () => useContext(ActivityContext);
