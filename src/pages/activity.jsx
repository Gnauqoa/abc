import React, { useState, useRef, useEffect } from "react";
import { Page } from "framework7-react";
import _ from "lodash";

import {
  LAYOUT_CHART,
  LAYOUT_TABLE,
  LAYOUT_NUMBER,
  LAYOUT_TABLE_CHART,
  LAYOUT_NUMBER_CHART,
  LAYOUT_NUMBER_TABLE,
  SAMPLING_MANUAL_FREQUENCY,
  SAMPLING_AUTO,
  SAMPLING_MANUAL,
  TIMER_NO_STOP,
  DEFAULT_SENSOR_ID,
  DEFAULT_SENSOR_DATA,
  LAYOUT_TEXT,
  LAYOUT_SCOPE,
  LINE_CHART_STATISTIC_NOTE_TABLE,
  LINE_CHART_LABEL_NOTE_TABLE,
  LINE_CHART_RANGE_SELECTION_TABLE,
  LAYOUT_BAR,
} from "../js/constants";

// Import Molecules Components
import SensorContainer from "../components/molecules/widget-sensor-container";
import dialog from "../components/molecules/dialog/dialog";
import useDeviceManager from "../components/molecules/popup-scan-devices";

// Import Organisms Components
import ActivityHeader from "../components/organisms/activity-page-header";
import ActivityFooter from "../components/organisms/activity-page-footer";
import LineChart from "../components/organisms/widget-line-chart";
import NumberWidget from "../components/organisms/widget-number-chart";
import TableWidget from "../components/organisms/widget-table-chart";
import TextViewWidget from "../components/organisms/widget-text-view";
import BarCharWidget from "../components/organisms/widget-bar-chart";
import ScopeViewWidget from "../components/organisms/widget-scope-view";

// Services
import { saveFile } from "../services/file-service";
import storeService from "../services/store-service";
import DataManagerIST from "../services/data-manager";
import MicrophoneServicesIST from "../services/microphone-service";
import SensorServicesIST, { BUILTIN_DECIBELS_SENSOR_ID, defaultSensors } from "../services/sensor-service";

// Context
import { useActivityContext } from "../context/ActivityContext";
import { useTableContext } from "../context/TableContext";

// Utils
import { getPageName } from "../utils/core";
import { FIRST_COLUMN_DEFAULT_OPT, X_AXIS_TIME_UNIT } from "../utils/widget-table-chart/commons";
import { createChartDataAndParseXAxis, getChartDatas } from "../utils/widget-line-chart/commons";
import { getBarChartDatas } from "../utils/widget-bar-chart/common";

const recentFilesService = new storeService("recent-files");
const statisticNotesStorage = new storeService(LINE_CHART_STATISTIC_NOTE_TABLE);
const labelNotesStorage = new storeService(LINE_CHART_LABEL_NOTE_TABLE);
const rangeSelectionStorage = new storeService(LINE_CHART_RANGE_SELECTION_TABLE);

export default ({ f7route, f7router, filePath, content }) => {
  const selectedLayout = f7route.params.layout;
  let activity;
  if (selectedLayout) {
    let defaultWidgets = [{ id: 0, sensors: [DEFAULT_SENSOR_DATA] }];
    let defaultXAxises = [X_AXIS_TIME_UNIT];
    if ([LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(selectedLayout)) {
      defaultWidgets = [
        { id: 0, sensors: [DEFAULT_SENSOR_DATA] },
        { id: 1, sensors: [DEFAULT_SENSOR_DATA] },
      ];
      defaultXAxises = [X_AXIS_TIME_UNIT, X_AXIS_TIME_UNIT];
    }

    activity = {
      name: "",
      pages: [
        {
          layout: selectedLayout,
          widgets: defaultWidgets,
          xAxises: defaultXAxises,
          lastDataRunId: null,
          name: "1",
        },
      ],
      frequency: 1,
      dataRuns: [],
      customXAxis: [],
      sensors: defaultSensors,
      customSensors: [],
      allLabelNotes: [],
      allStatisticNotes: [],
      rangeSelections: [],
    };
  } else if (content) {
    activity = content;
  } else {
    f7router.navigate("/");
    return;
  }

  const {
    name,
    setName,
    pages,
    setPages,
    timerStopCollecting,
    setFrequency,
    isRunning,
    setIsRunning,
    currentPageIndex,
    currentDataRunId,
    setCurrentDataRunId,
    prevChartDataRef,
    handleNavigatePage,
    handleDeletePage,
    handleNewPage,
    initContext,
    isSelectSensor,
    isChangePage,
    setIsChangePage,
    handleExportActivity,
    handleClearLocalStorage,
  } = useActivityContext();

  const { initTableContext, getFirstColumnOption } = useTableContext();

  // Belong to Activity
  const [samplingMode, setSamplingMode] = useState(SAMPLING_AUTO);
  const [previousActivity, setPreviousActivity] = useState({});

  // Belong to Page
  const [currentSensorValues, setCurrentSensorValues] = useState({});

  const tableRef = useRef();
  const lineChartRef = useRef([]);
  const deviceManager = useDeviceManager();

  /* This effect is used to:
    1. initContext(): init all context states for the activity
    2. DataManagerIST.init(): init variables for DataManager and start emit data scheduler
    3. MicrophoneServicesIST.init():
    4. Import all dataRuns from files
    5. Import saved setting sensors
   */
  useEffect(() => {
    onInitHandler();
    DataManagerIST.importActivityDataRun(activity.dataRuns);
    DataManagerIST.importCustomUnit(activity.customXAxis);

    SensorServicesIST.importSensors(activity.sensors, activity.customSensors);
    if (content) {
      setPreviousActivity(_.cloneDeep(activity));

      // Update all annotations into local storage
      for (const labelNote of activity.allLabelNotes) labelNotesStorage.save(labelNote);
      for (const statisticNote of activity.allStatisticNotes) statisticNotesStorage.save(statisticNote);
      for (const rangeSelection of activity.rangeSelections) rangeSelectionStorage.save(rangeSelection);
    }

    // Init activity states
    setName(activity.name);
    setPages(activity.pages);
    handleFrequencySelect(activity.frequency);
    setCurrentDataRunId(activity.pages[0].lastDataRunId);
  }, []);

  /* This effect is called when the users change the widgets of current activity
    1. Unsubscribe all sensors of current widgets
    1. Subscribe to all sensors of all widgets
  */
  useEffect(() => {
    let subscriberId = null;
    subscriberId && DataManagerIST.unsubscribe(subscriberId);

    const widgets = pages[currentPageIndex]?.widgets;
    if (!widgets) return;

    const subscribedSensorIds = [
      ...new Set(
        widgets.flatMap((widget) =>
          widget.sensors
            .map((sensor) => (sensor.id !== DEFAULT_SENSOR_ID ? parseInt(sensor.id) : false))
            .filter(Boolean)
        )
      ),
    ];

    subscriberId = DataManagerIST.subscribe(handleDataManagerCallback, subscribedSensorIds);
    return () => {
      subscriberId && DataManagerIST.unsubscribe(subscriberId);
    };
  }, [pages[currentPageIndex]?.widgets]);

  // =========================================================================================
  // =========================== Functions associate with Activity ===========================
  // =========================================================================================
  const onBackHandler = () => {
    // MicrophoneServicesIST.stop();
    DataManagerIST.stopEmitSubscribersScheduler();
  };

  const onInitHandler = () => {
    initContext();
    initTableContext({ customUnits: activity.customXAxis });
    DataManagerIST.init();
    // MicrophoneServicesIST.init();
  };

  async function handleActivitySave() {
    const updatedActivity = handleExportActivity();
    const isEqual = _.isEqual(updatedActivity, previousActivity);
    if (isEqual) return;

    if (name.length) {
      const savedFilePath = await saveFile(filePath, JSON.stringify(updatedActivity));
      savedFilePath && recentFilesService.save({ id: savedFilePath, activityName: name });
      setPreviousActivity(_.cloneDeep(updatedActivity));
    } else {
      dialog.prompt(
        "Bạn có muốn lưu lại những thay đổi này không?",
        "Tên hoạt động",
        async (name) => {
          setName(name);
          const updatedActivityWithName = { ...updatedActivity, name };
          const savedFilePath = await saveFile(filePath, JSON.stringify(updatedActivityWithName));
          savedFilePath && recentFilesService.save({ id: savedFilePath, activityName: name });
          setPreviousActivity(_.cloneDeep(updatedActivityWithName));
        },
        () => {},
        name
      );
    }
  }

  async function handleActivityBack() {
    const updatedActivity = handleExportActivity();
    const isEqual = _.isEqual(updatedActivity, previousActivity);

    if (isEqual) {
      f7router.navigate("/");
      handleClearLocalStorage();
    } else {
      dialog.prompt(
        "Bạn có muốn lưu lại những thay đổi này không?",
        "Tên hoạt động",
        async (name) => {
          setName(name);
          const updatedActivityWithName = { ...updatedActivity, name };
          const savedFilePath = await saveFile(filePath, JSON.stringify(updatedActivityWithName));
          savedFilePath && recentFilesService.save({ id: savedFilePath, activityName: name });
          setPreviousActivity(_.cloneDeep(updatedActivityWithName));
          handleClearLocalStorage();
        },
        () => {
          onBackHandler();
          handleClearLocalStorage();
          f7router.navigate("/");
        },
        name
      );
    }
  }

  function handleActivityNameChange(e) {
    setName(e.target.value);
  }

  function handleFrequencySelect(frequency) {
    setSamplingMode(frequency === SAMPLING_MANUAL_FREQUENCY ? SAMPLING_MANUAL : SAMPLING_AUTO);
    const result = DataManagerIST.setCollectingDataFrequency(frequency);
    result && setFrequency(frequency);
  }

  // =====================================================================================
  // =========================== Functions associate with Page ===========================
  // =====================================================================================
  function handlePageNew(chartType) {
    if (!chartType) return;
    let defaultWidgets = [{ id: 0, sensors: [DEFAULT_SENSOR_DATA] }];
    let defaultXAxises = [X_AXIS_TIME_UNIT];
    if ([LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(chartType)) {
      defaultWidgets = [
        { id: 0, sensors: [DEFAULT_SENSOR_DATA] },
        { id: 1, sensors: [DEFAULT_SENSOR_DATA] },
      ];
      defaultXAxises = [X_AXIS_TIME_UNIT, X_AXIS_TIME_UNIT];
    }

    const listPageNames = pages.map((page) => page.name);
    const newFileName = getPageName(listPageNames);
    const newPage = {
      layout: chartType,
      widgets: defaultWidgets,
      xAxises: defaultXAxises,
      lastDataRunId: null,
      name: newFileName,
    };
    const newPages = [...pages, newPage];
    handleNewPage(newPages);
  }

  function handlePageDelete() {
    dialog.question(
      "Xác nhận",
      `Bạn có chắc chắn muốn xóa trang này không?`,
      () => handleDeletePage(),
      () => {}
    );
  }

  function handlePagePrev() {
    if (currentPageIndex === 0) return;
    const prevPageIndex = currentPageIndex - 1;
    handleNavigatePage(prevPageIndex);
  }

  function handlePageNext() {
    if (currentPageIndex === pages.length - 1) return;
    const nextPageIndex = currentPageIndex + 1;
    handleNavigatePage(nextPageIndex);
  }

  // ========================================================================================
  // =========================== Functions associate with DataRun ===========================
  // ========================================================================================
  function setLastDataRunIdForCurrentPage(dataRunId) {
    let updatedPages = _.cloneDeep(pages);
    updatedPages[currentPageIndex].lastDataRunId = dataRunId;
    setPages(() => updatedPages);
  }

  function handleStopCollecting() {
    DataManagerIST.stopCollectingData();
    setIsRunning(false);
  }

  function handleGetManualSample() {
    if ([LAYOUT_TABLE, LAYOUT_TABLE_CHART, LAYOUT_NUMBER_TABLE].includes(pages[currentPageIndex].layout)) {
      tableRef.current.handleSamplingManual();
    } else {
      DataManagerIST.appendManualSample();
    }
  }

  function handleSampleClick() {
    // TODO: check if user select one or more sensors
    if (!isRunning) {
      /* For user input collecting data
        - Check if the current page is table of not.
        - If yes, clear Custom X Axis Datas with use input id
      */
      let unitId = FIRST_COLUMN_DEFAULT_OPT;
      if ([LAYOUT_TABLE, LAYOUT_TABLE_CHART, LAYOUT_NUMBER_TABLE].includes(pages[currentPageIndex].layout)) {
        const tableId = `${currentPageIndex}_table`;
        unitId = getFirstColumnOption({ tableId }).id;
      }

      // MicrophoneServicesIST.init() if the current widget is scope view
      const isContainBuiltinMic = isSelectSensor(BUILTIN_DECIBELS_SENSOR_ID);
      if (pages[currentPageIndex].layout === LAYOUT_SCOPE || isContainBuiltinMic) {
        MicrophoneServicesIST.init();
      }

      const dataRunId = DataManagerIST.startCollectingData({ unitId });
      timerStopCollecting !== TIMER_NO_STOP && DataManagerIST.subscribeTimer(handleStopCollecting, timerStopCollecting);
      setCurrentDataRunId(dataRunId);
      setLastDataRunIdForCurrentPage(dataRunId);
    } else {
      DataManagerIST.unsubscribeTimer();
      DataManagerIST.stopCollectingData();

      const isContainBuiltinMic = isSelectSensor(BUILTIN_DECIBELS_SENSOR_ID);
      if (pages[currentPageIndex].layout === LAYOUT_SCOPE || isContainBuiltinMic) {
        MicrophoneServicesIST.stop();
      }
    }
    setIsRunning(!isRunning);
  }

  function handleDataManagerCallback(emittedDatas) {
    // console.log(">>>>> AUTO - data manager:", emittedDatas);
    const updatedSensorValues = { ...currentSensorValues };

    for (const [key, data] of Object.entries(emittedDatas)) {
      const time = data[1];
      const sensorId = data[2];
      const values = data.slice(3);
      const sensorValues = { time, sensorId, values };

      updatedSensorValues[key] = sensorValues;
    }

    setCurrentSensorValues((sensorValues) => Object.assign({}, sensorValues, updatedSensorValues));
  }

  // ================================================================================================
  // =========================== Functions associate with retrieving data ===========================
  // ================================================================================================
  function getCurrentValues(sensors, isTable = false) {
    const defaultNumberSensorIndex = 0;
    const numberSensor = sensors[defaultNumberSensorIndex] || DEFAULT_SENSOR_DATA;
    if (!isTable) return currentSensorValues[numberSensor.id]?.values[numberSensor.index] || "";

    const tableDatas = [];
    sensors.forEach((sensor) => {
      const currentSensorValue = currentSensorValues[sensor.id];
      const tableData = currentSensorValue ? { time: currentSensorValue.time, values: currentSensorValue.values } : {};
      tableDatas.push(tableData);
    });

    return tableDatas;
  }

  function getDatasForTable(sensors) {
    const sensorIds = [];
    for (const sensor of sensors) {
      sensorIds.push(sensor.id);
    }

    const tableDatas = DataManagerIST.getWidgetDatasRunData(currentDataRunId, sensorIds);
    return tableDatas;
  }

  function getDataForBarChart({ sensors, unitId }) {
    const defaultSensorIndex = 0;
    const sensor = sensors[defaultSensorIndex] || DEFAULT_SENSOR_DATA;
    const data = getBarChartDatas({ sensor, unitId });
    return data;
  }

  function getDataForChart({ sensors, unitId }) {
    if (!lineChartRef.current[currentPageIndex]) return;
    const defaultSensorIndex = 0;
    const sensor = sensors[defaultSensorIndex] || DEFAULT_SENSOR_DATA;

    // Update current value for Line Chart
    if (isRunning) {
      const sensorValue = currentSensorValues[sensor.id];
      if (sensorValue) {
        let currentData = { x: sensorValue.time, y: sensorValue.values[sensor.index] || "" };
        if (!isRunning) {
          currentData = { ...currentData, x: 0 };
        }
        lineChartRef.current[currentPageIndex].setCurrentData({
          data: currentData,
        });
      }
    }

    let isDefaultXAxis = [FIRST_COLUMN_DEFAULT_OPT].includes(unitId);
    const { chartDatas, dataRunIds } = getChartDatas({ sensors, unitId });
    const parsedChartDatas = isDefaultXAxis ? createChartDataAndParseXAxis({ chartDatas }) : chartDatas;

    // Check the condition for re-render chart. The chart is re-render whenever:
    // 1. isModifyData: The data off all chart is modifying by running collecting data
    // 2. isModifyDataRunIds: User add or remove dataRunId
    // 3. isModifySensors: User add or delete number of Y-Axis
    // 4. isChangeUnit: User change the unit for displaying
    // 5. isChangePage: User navigate between page
    const isModifyData = !_.isEqual(parsedChartDatas, prevChartDataRef.current.data[currentPageIndex]);
    const isModifyDataRunIds = !_.isEqual(dataRunIds, prevChartDataRef.current.dataRunIds[currentPageIndex]);
    const isModifySensors = !_.isEqual(sensors, prevChartDataRef.current.sensors[currentPageIndex]);
    const isChangeUnit = prevChartDataRef.current.unitId !== unitId;

    // Call this function to clear hiddenDataLineIds in the LineChart
    if (isModifyDataRunIds) lineChartRef.current[currentPageIndex].modifyDataRunIds({ dataRunIds });
    if (isModifySensors) lineChartRef.current[currentPageIndex].modifySensors({ sensors });

    if (isModifyData || isModifyDataRunIds || isModifySensors || isChangeUnit || isChangePage) {
      lineChartRef.current[currentPageIndex].setChartData({
        chartDatas: parsedChartDatas,
        sensors,
        isDefaultXAxis: isDefaultXAxis,
      });

      if (isModifyData) prevChartDataRef.current.data[currentPageIndex] = parsedChartDatas;
      if (isModifyDataRunIds) prevChartDataRef.current.dataRunIds[currentPageIndex] = dataRunIds;
      if (isModifySensors) prevChartDataRef.current.sensors[currentPageIndex] = sensors;
      if (isChangeUnit) prevChartDataRef.current.unitId = unitId;
      if (isChangePage) setIsChangePage(false);
    }
  }

  return (
    <Page className="bg-color-regal-blue activity">
      <div className="full-height display-flex flex-direction-column justify-content-space-between">
        <ActivityHeader
          name={name}
          pageLength={pages?.length}
          isRunning={isRunning}
          handleActivityNameChange={handleActivityNameChange}
          handleActivityBack={handleActivityBack}
          handleActivitySave={handleActivitySave}
          handleNewPage={handlePageNew}
          handlePageDelete={handlePageDelete}
          deviceManager={deviceManager}
        />
        <div className="activity-layout">
          <SensorContainer deviceManager={deviceManager} />
          {[LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(pages[currentPageIndex]?.layout) && (
            <>
              <div className="__card-widget __card-left">
                {pages[currentPageIndex].layout === LAYOUT_TABLE_CHART && (
                  <TableWidget
                    ref={tableRef}
                    key={`${currentPageIndex}_table`}
                    id={`${currentPageIndex}_table`}
                    datas={getDatasForTable(pages[currentPageIndex].widgets[0].sensors)}
                    currentValues={getCurrentValues(pages[currentPageIndex].widgets[0].sensors, true)}
                    widget={pages[currentPageIndex].widgets[0]}
                    chartLayout={LAYOUT_TABLE_CHART}
                    samplingMode={samplingMode}
                  />
                )}
                {[LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(pages[currentPageIndex].layout) && (
                  <NumberWidget
                    key={`${currentPageIndex}_number`}
                    value={getCurrentValues(pages[currentPageIndex].widgets[0].sensors)}
                    widget={pages[currentPageIndex].widgets[0]}
                  />
                )}
              </div>
              <div className="__card-widget __card-right">
                {[LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART].includes(pages[currentPageIndex].layout) && (
                  <LineChart
                    key={`${currentPageIndex}_chart`}
                    pageId={`${currentPageIndex}_chart`}
                    isRunning={isRunning}
                    data={getDataForChart({
                      sensors: pages[currentPageIndex].widgets[1].sensors,
                      unitId: pages[currentPageIndex].xAxises[1].id,
                    })}
                    ref={(el) => (lineChartRef.current[currentPageIndex] = el)}
                    widget={pages[currentPageIndex].widgets[1]}
                    xAxis={pages[currentPageIndex].xAxises[1]}
                  />
                )}
                {pages[currentPageIndex].layout === LAYOUT_NUMBER_TABLE && (
                  <TableWidget
                    ref={tableRef}
                    key={`${currentPageIndex}_table`}
                    id={`${currentPageIndex}_table`}
                    datas={getDatasForTable(pages[currentPageIndex].widgets[1].sensors)}
                    currentValues={getCurrentValues(pages[currentPageIndex].widgets[1].sensors, true)}
                    widget={pages[currentPageIndex].widgets[1]}
                    chartLayout={LAYOUT_NUMBER_TABLE}
                    samplingMode={samplingMode}
                  />
                )}
              </div>
            </>
          )}
          {[LAYOUT_CHART, LAYOUT_TABLE, LAYOUT_NUMBER, LAYOUT_TEXT, LAYOUT_SCOPE, LAYOUT_BAR].includes(
            pages[currentPageIndex]?.layout
          ) && (
            <div className="__card-widget">
              {pages[currentPageIndex].layout === LAYOUT_CHART && (
                <LineChart
                  key={`${currentPageIndex}_chart`}
                  pageId={`${currentPageIndex}_chart`}
                  data={getDataForChart({
                    sensors: pages[currentPageIndex].widgets[0].sensors,
                    unitId: pages[currentPageIndex].xAxises[0].id,
                  })}
                  ref={(el) => (lineChartRef.current[currentPageIndex] = el)}
                  widget={pages[currentPageIndex].widgets[0]}
                  xAxis={pages[currentPageIndex].xAxises[0]}
                />
              )}
              {pages[currentPageIndex].layout === LAYOUT_TABLE && (
                <TableWidget
                  ref={tableRef}
                  key={`${currentPageIndex}_table`}
                  id={`${currentPageIndex}_table`}
                  datas={getDatasForTable(pages[currentPageIndex].widgets[0].sensors)}
                  currentValues={getCurrentValues(pages[currentPageIndex].widgets[0].sensors, true)}
                  widget={pages[currentPageIndex].widgets[0]}
                  chartLayout={LAYOUT_TABLE}
                  samplingMode={samplingMode}
                />
              )}
              {pages[currentPageIndex].layout === LAYOUT_NUMBER && (
                <NumberWidget
                  key={`${currentPageIndex}_number`}
                  value={getCurrentValues(pages[currentPageIndex].widgets[0].sensors)}
                  widget={pages[currentPageIndex].widgets[0]}
                />
              )}
              {pages[currentPageIndex].layout === LAYOUT_TEXT && <TextViewWidget />}
              {pages[currentPageIndex].layout === LAYOUT_SCOPE && (
                <ScopeViewWidget key={`${currentPageIndex}_scope`} widget={pages[currentPageIndex].widgets[0]} />
              )}
              {pages[currentPageIndex].layout === LAYOUT_BAR && (
                <BarCharWidget
                  key={`${currentPageIndex}_number`}
                  widget={pages[currentPageIndex].widgets[0]}
                  datas={getDataForBarChart({
                    sensors: pages[currentPageIndex].widgets[0].sensors,
                    unitId: pages[currentPageIndex].xAxises[0].id,
                  })}
                  xAxis={pages[currentPageIndex].xAxises[0]}
                />
              )}
            </div>
          )}
        </div>
        <ActivityFooter
          handlePageNext={handlePageNext}
          handlePagePrev={handlePagePrev}
          handleFrequencySelect={handleFrequencySelect}
          handleGetManualSample={handleGetManualSample}
          handleSampleClick={handleSampleClick}
        />
      </div>
    </Page>
  );
};
