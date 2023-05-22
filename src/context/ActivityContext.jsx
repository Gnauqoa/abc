import React, { useContext, useState, useRef } from "react";
import { DEFAULT_SENSOR_DATA, LAYOUT_NUMBER, TIMER_NO_STOP } from "../js/constants";

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
  timerStopCollecting: null,
  setTimerStopCollecting: () => {},
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
  handleDeleteDataRun: () => {},
});

export const ActivityContextProvider = ({ children }) => {
  const [pages, setPages] = useState(defaultPages);
  const [frequency, setFrequency] = useState(1);
  const [timerStopCollecting, setTimerStopCollecting] = useState(TIMER_NO_STOP);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [currentDataRunId, setCurrentDataRunId] = useState(pages[currentPageIndex]?.lastDataRunId);
  let prevChartDataRef = useRef({ data: [], dataRunIds: [] });

  // ======================= Pages functions =======================
  const handleNavigatePage = (newPageIndex) => {
    prevChartDataRef.current.data[currentPageIndex] = [];
    prevChartDataRef.current.dataRunIds[currentPageIndex] = [];

    setCurrentPageIndex(newPageIndex);
    setCurrentDataRunId(pages[newPageIndex].lastDataRunId);
  };

  const handleDeletePage = () => {
    const numPages = pages.length;
    const deletedPageIndex = currentPageIndex;
    const newPages = pages.filter((page, index) => index !== deletedPageIndex);
    const newPageIndex = currentPageIndex + 1 === numPages ? currentPageIndex - 1 : currentPageIndex;

    setPages(newPages);
    setCurrentPageIndex(newPageIndex);
    setCurrentDataRunId(newPages[newPageIndex].lastDataRunId);

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

  const handleDeleteDataRun = (oldDataRunId, newDataRunId) => {
    const newPages = pages.map((page) => {
      if (page.lastDataRunId === oldDataRunId) {
        return { ...page, lastDataRunId: newDataRunId };
      }
      return page;
    });

    setPages(newPages);
    setCurrentDataRunId(newDataRunId);
  };

  // ======================= Datarun functions =======================
  return (
    <ActivityContext.Provider
      value={{
        pages,
        setPages,
        frequency,
        setFrequency,
        timerStopCollecting,
        setTimerStopCollecting,
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
        handleDeleteDataRun,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivityContext = () => useContext(ActivityContext);
