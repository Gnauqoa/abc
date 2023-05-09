import React, { useContext, useState, useRef } from "react";
import { DEFAULT_SENSOR_DATA, LAYOUT_NUMBER } from "../js/constants";

const defaultWidgets = [{ id: 0, sensors: [DEFAULT_SENSOR_DATA] }];
const defaultPages = [
  {
    layout: LAYOUT_NUMBER,
    widgets: defaultWidgets,
    lastDataRunId: null,
    name: "Trang 1",
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
  currentDataRunId: false,
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
  let prevChartDataRef = useRef([]);

  // Pages functions
  const handleNavigatePage = (newPageIndex) => {
    prevChartDataRef.current[currentPageIndex] = null;
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
    prevChartDataRef.current[currentPageIndex] = null;
  };

  const handleNewPage = (newPages) => {
    const newPageIndex = newPages.length - 1;
    prevChartDataRef.current[currentPageIndex] = null;

    setPages(newPages);
    setCurrentPageIndex(newPageIndex);
    setCurrentDataRunId(null);
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
