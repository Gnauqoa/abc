import React, { useContext, useState, useRef } from "react";
import { DEFAULT_SENSOR_DATA, LAYOUT_NUMBER, TIMER_NO_STOP } from "../js/constants";

import DataManagerIST from "../services/data-manager";
import { X_AXIS_TIME_UNIT } from "../utils/widget-table-chart/commons";

const defaultWidgets = [{ id: 0, sensors: [DEFAULT_SENSOR_DATA] }];
const defaultXAxises = [X_AXIS_TIME_UNIT];
const defaultPages = [
  {
    layout: LAYOUT_NUMBER,
    widgets: defaultWidgets,
    xAxises: defaultXAxises,
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
  isSelectSensor: () => {},
  extraYAxises: [],
  handleToggleExtraYAxis: () => {},
  handleAddExtraCollectingSensor: () => {},
  handleDeleteExtraCollectingSensor: () => {},
  handleSensorChange: () => {},
  handleTextChange: () => {},
  handleXAxisChange: () => {},
});

export const ActivityContextProvider = ({ children }) => {
  const [pages, setPages] = useState(defaultPages);
  const [frequency, setFrequency] = useState(1);
  const [timerStopCollecting, setTimerStopCollecting] = useState(TIMER_NO_STOP);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [currentDataRunId, setCurrentDataRunId] = useState(defaultPages[0].lastDataRunId);
  let prevChartDataRef = useRef({ data: [], dataRunIds: [], sensors: [], customXAxisData: [], unitId: null });

  // Support multiple Y-Axises
  const [extraYAxises, setExtraYAxises] = useState([]);

  // ======================= Pages functions =======================
  const handleNavigatePage = (newPageIndex) => {
    prevChartDataRef.current.unitId = null;
    prevChartDataRef.current.data[currentPageIndex] = [];
    prevChartDataRef.current.dataRunIds[currentPageIndex] = [];
    prevChartDataRef.current.sensors[currentPageIndex] = [];
    prevChartDataRef.current.customXAxisData[currentPageIndex] = [];

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

    prevChartDataRef.current.unitId = null;
    prevChartDataRef.current.data[currentPageIndex] = [];
    prevChartDataRef.current.dataRunIds[currentPageIndex] = [];
    prevChartDataRef.current.sensors[currentPageIndex] = [];
    prevChartDataRef.current.customXAxisData[currentPageIndex] = [];
  };

  const handleNewPage = (newPages) => {
    const newPageIndex = newPages.length - 1;
    prevChartDataRef.current.unitId = null;
    prevChartDataRef.current.data[currentPageIndex] = [];
    prevChartDataRef.current.dataRunIds[currentPageIndex] = [];
    prevChartDataRef.current.sensors[currentPageIndex] = [];
    prevChartDataRef.current.customXAxisData[currentPageIndex] = [];

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

  const isSelectSensor = (sensorId) => {
    for (const widget of pages[currentPageIndex].widgets) {
      const sensors = widget.sensors;
      for (const sensor of sensors) {
        if (sensor.id === sensorId) {
          return true;
        }
      }
    }
    return false;
  };

  const handleToggleExtraYAxis = ({ sensorInfo }) => {
    console.log("handleToggleExtraYAxis: ", extraYAxises);
    if (sensorInfo.id === undefined || sensorInfo.index === undefined) return;

    const newExtraYAxises = [...extraYAxises];
    for (const extraAxis of newExtraYAxises) {
      if (extraAxis.id === sensorInfo.id && extraAxis.index === sensorInfo.index) {
        const index = newExtraYAxises.indexOf(extraAxis);
        newExtraYAxises.splice(index, 1);
        setExtraYAxises(newExtraYAxises);
        return;
      }
    }

    newExtraYAxises.push(sensorInfo);
    setExtraYAxises(newExtraYAxises);
  };

  // =========================== Functions associate with Table ===========================
  const handleAddExtraCollectingSensor = (widgetId) => {
    const currentWidget = pages[currentPageIndex].widgets[widgetId];
    if (!currentWidget) return;

    const updatedWidgets = pages[currentPageIndex].widgets.map((w) => {
      if (w.id !== widgetId) {
        return w;
      }

      const newSensors = [...w.sensors, DEFAULT_SENSOR_DATA];
      return { ...w, sensors: newSensors };
    });

    const updatePages = pages.map((page, index) => {
      if (index === currentPageIndex) {
        return { ...page, widgets: updatedWidgets };
      }
      return page;
    });

    setPages(updatePages);
  };

  const handleDeleteExtraCollectingSensor = (widgetId, sensorIndex) => {
    const updatedWidgets = pages[currentPageIndex].widgets.map((w) => {
      if (w.id !== widgetId) {
        return w;
      }

      const newSensors = w.sensors.filter((s, i) => i !== sensorIndex);
      return { ...w, sensors: newSensors };
    });

    const updatePages = pages.map((page, index) => {
      if (index === currentPageIndex) {
        return { ...page, widgets: updatedWidgets };
      }
      return page;
    });

    setPages(updatePages);
  };

  // =========================== Functions associate with Axises ===========================
  function handleSensorChange({ widgetId, sensorIndex, sensor }) {
    const updatedWidgets = pages[currentPageIndex].widgets.map((w) => {
      if (w.id !== widgetId) {
        return w;
      }

      const newSensors = [...w.sensors];
      newSensors[sensorIndex] = { ...sensor };
      return { ...w, sensors: newSensors };
    });

    const updatePages = pages.map((page, index) => {
      if (index === currentPageIndex) {
        return { ...page, widgets: updatedWidgets };
      }
      return page;
    });

    setPages(updatePages);
  }

  function handleTextChange({ widgetId, text }) {
    const updatedWidgets = pages[currentPageIndex].widgets.map((w) => {
      if (w.id !== widgetId) {
        return w;
      }

      return { ...w, text };
    });

    const updatePages = pages.map((page, index) => {
      if (index === currentPageIndex) {
        return { ...page, widgets: updatedWidgets };
      }
      return page;
    });

    setPages(updatePages);
  }

  function handleXAxisChange({ xAxisId, option }) {
    const updatedXAxises = pages[currentPageIndex].xAxises.map((xAxis) => {
      if (xAxis.id !== xAxisId) {
        return xAxis;
      }

      return { ...option };
    });

    const updatePages = pages.map((page, index) => {
      if (index === currentPageIndex) {
        return { ...page, xAxises: updatedXAxises };
      }
      return page;
    });

    setPages(updatePages);
  }

  const initContext = () => {
    setPages(defaultPages);
    setFrequency(1);
    setTimerStopCollecting(TIMER_NO_STOP);
    setIsRunning(false);
    setCurrentPageIndex(0);
    setCurrentDataRunId(defaultPages[0].lastDataRunId);
    prevChartDataRef.current.unitId = null;
    prevChartDataRef.current.data[currentPageIndex] = [];
    prevChartDataRef.current.dataRunIds[currentPageIndex] = [];
    prevChartDataRef.current.sensors[currentPageIndex] = [];
    prevChartDataRef.current.customXAxisData[currentPageIndex] = [];
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
        initContext,
        isSelectSensor,
        extraYAxises,
        handleToggleExtraYAxis,
        handleAddExtraCollectingSensor,
        handleDeleteExtraCollectingSensor,
        handleSensorChange,
        handleTextChange,
        handleXAxisChange,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivityContext = () => useContext(ActivityContext);
