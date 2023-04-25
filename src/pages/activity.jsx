import React, { useState, useRef, useEffect } from "react";
import { Page, Navbar, NavLeft, NavRight, Popover, List, ListItem, Popup, f7 } from "framework7-react";
import _ from "lodash";
import DataManagerIST from "../services/data-manager";
import SensorServices, { defaultSensors } from "../services/sensor-service";
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
} from "../js/constants";

import BackButton from "../components/atoms/back-button";
import RoundButton from "../components/atoms/round-button";
import dialog from "../components/molecules/dialog/dialog";
import ActivityPageNav from "../components/molecules/activity-page-nav";
import Timer from "../components/atoms/timer";
import LineChart from "../components/molecules/widget-line-chart";
import NumberWidget from "../components/molecules/widget-number-chart/number";
import TableWidget from "../components/molecules/widget-table-chart";
import SamplingSetting from "../components/molecules/popup-sampling-settings";
// import DataDisplaySetting from "../components/molecules/data-display-setting";
import { saveFile } from "../services/file-service";
import storeService from "../services/store-service";
import NewPagePopup from "../components/molecules/popup-new-page";
import DataRunManagementPopup from "../components/molecules/popup-data-run-management";
import WirelessSensorContainer from "../components/molecules/widget-wireless-sensor";

const recentFilesService = new storeService("recent-files");

export default ({ f7route, f7router, filePath, content }) => {
  const selectedLayout = f7route.params.layout;
  let activity;

  if (selectedLayout) {
    let defaultWidgets = [{ id: 0, sensors: [DEFAULT_SENSOR_DATA] }];
    if ([LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(selectedLayout)) {
      defaultWidgets = [
        { id: 0, sensors: [DEFAULT_SENSOR_DATA] },
        { id: 1, sensors: [DEFAULT_SENSOR_DATA] },
      ];
    }

    activity = {
      name: "",
      pages: [
        {
          layout: selectedLayout,
          widgets: defaultWidgets,
          lastDataRunId: null,
        },
      ],
      frequency: 1,
      dataRuns: [],
      sensorSettings: [],
      sensors: defaultSensors,
      customSensors: [],
    };
  } else if (content) {
    activity = content;
  } else {
    f7router.navigate("/");
    return;
  }

  // Belong to Activity
  const [name, setName] = useState(activity.name);
  const [pages, setPages] = useState(activity.pages);
  // const [sensorSettings, setSensorSettings] = useState(activity.sensorSettings);
  const [frequency, setFrequency] = useState(activity.frequency);
  const [timerStopTime, setTimerStopTime] = useState(TIMER_NO_STOP);
  const [samplingMode, setSamplingMode] = useState(SAMPLING_AUTO);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Belong to Page
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const currentPage = pages[currentPageIndex];
  const layout = currentPage.layout;
  const [widgets, setWidgets] = useState(currentPage.widgets);

  const [isRunning, setIsRunning] = useState(false);
  const [currentDataRunId, setCurrentDataRunId] = useState(currentPage.lastDataRunId);
  const [currentSensorValues, setCurrentSensorValues] = useState({});

  // const displaySettingPopup = useRef();
  const newPagePopup = useRef();
  const dataRunManagementPopup = useRef();
  const lineChartRef = useRef([]);
  let prevChartDataRef = useRef([]);
  const tableRef = useRef();

  useEffect(() => {
    DataManagerIST.init();
    DataManagerIST.importActivityDataRun(activity.dataRuns);
    SensorServices.importSensors(activity.sensors, activity.customSensors);
  }, []);

  useEffect(() => {
    let subscriberId = null;
    subscriberId && DataManagerIST.unsubscribe(subscriberId);

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
  }, [widgets]);

  // =========================== Functions associate with Activity ===========================
  function handleActivityNameChange(e) {
    setName(e.target.value);
  }

  // function handleSensorSettingSubmit(setting) {
  //   let sensorSettingsCpy = [...sensorSettings];
  //   if (sensorSettingsCpy.filter((e) => e.sensorDetailId == setting.sensorDetailId).length === 0) {
  //     sensorSettingsCpy.push({ ...setting });
  //   } else {
  //     var foundIndex = sensorSettingsCpy.findIndex((e) => e.sensorDetailId == setting.sensorDetailId);
  //     sensorSettingsCpy[foundIndex] = setting;
  //   }

  //   setSensorSettings(sensorSettingsCpy);
  //   displaySettingPopup.current.f7Popup().close();
  // }

  function handleFrequencySelect(frequency) {
    setSamplingMode(frequency === SAMPLING_MANUAL_FREQUENCY ? SAMPLING_MANUAL : SAMPLING_AUTO);
    const result = DataManagerIST.setCollectingDataFrequency(frequency);
    result && setFrequency(frequency);
  }

  function handleSetTimerInMs(timerNumber) {
    setTimerStopTime(timerNumber);
  }

  const saveActivity = () => {
    // Collecting data from dataRuns
    const updatedDataRuns = DataManagerIST.exportActivityDataRun();
    const updatedPage = pages.map((page, index) => {
      if (index === currentPageIndex) {
        return { ...page, widgets };
      } else {
        return page;
      }
    });
    // Get modify sensors and custom sensors
    const { sensors, customSensors } = SensorServices.exportSensors();
    const updatedActivity = {
      ...activity,
      name,
      pages: updatedPage,
      dataRuns: updatedDataRuns,
      frequency: frequency,
      sensors: sensors,
      customSensors: customSensors,
    };

    return updatedActivity;
  };
  async function handleActivitySave() {
    const updatedActivity = saveActivity();

    if (name.length) {
      const savedFilePath = await saveFile(filePath, JSON.stringify(updatedActivity));
      savedFilePath && recentFilesService.save({ id: savedFilePath, activityName: name });
    } else {
      dialog.prompt(
        "Bạn có muốn lưu lại những thay đổi này không?",
        "Tên hoạt động",
        async (name) => {
          setName(name);
          const savedFilePath = await saveFile(filePath, JSON.stringify({ ...updatedActivity, name }));
          savedFilePath && recentFilesService.save({ id: savedFilePath, activityName: name });
        },
        () => {},
        name
      );
    }
  }

  async function handleActivityBack() {
    const updatedActivity = saveActivity();

    dialog.prompt(
      "Bạn có muốn lưu lại những thay đổi này không?",
      "Tên hoạt động",
      async (name) => {
        setName(name);
        const savedFilePath = await saveFile(filePath, JSON.stringify({ ...updatedActivity, name }));
        savedFilePath && recentFilesService.save({ id: savedFilePath, activityName: name });
        f7router.navigate("/");
      },
      () => {
        f7router.navigate("/");
      },
      name
    );
  }

  function handleFullScreen() {
    try {
      if (f7.device.electron) {
        window._cdvElectronIpc.setFullscreen(!isFullScreen);
        setIsFullScreen(!isFullScreen);
      } else if (f7.device.desktop) {
        if (!document.fullscreenEnabled) {
          setIsFullScreen(false);
          return;
        }

        if (isFullScreen) {
          document.exitFullscreen();
        } else {
          const appEl = f7.el;
          appEl.requestFullscreen();
        }
        setIsFullScreen(!isFullScreen);
      }
    } catch (e) {
      console.log(e);
      setIsFullScreen(false);
    }
  }

  // =========================== Functions associate with Page ===========================
  function handleNewPage(chartType) {
    if (!chartType) return;
    let defaultWidgets = [{ id: 0, sensors: [DEFAULT_SENSOR_DATA] }];
    if ([LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(chartType)) {
      defaultWidgets = [
        { id: 0, sensors: [DEFAULT_SENSOR_DATA] },
        { id: 1, sensors: [DEFAULT_SENSOR_DATA] },
      ];
    }

    const newPage = {
      layout: chartType,
      widgets: defaultWidgets,
      lastDataRunId: null,
    };
    const newPages = [...pages, newPage];
    prevChartDataRef.current[currentPageIndex] = null;

    setPages(newPages);
    setWidgets(defaultWidgets);
    setCurrentPageIndex(newPages.length - 1);
    setCurrentDataRunId(null);
  }

  function handlePageDelete() {
    dialog.question(
      "Xác nhận",
      `Bạn có chắc chắn muốn xóa trang này không?`,
      () => {
        const numPages = pages.length;
        const deletedPageIndex = currentPageIndex;
        const newPages = pages.filter((page, index) => index !== deletedPageIndex);
        const newPageIndex = currentPageIndex + 1 === numPages ? currentPageIndex - 1 : currentPageIndex;
        setPages(newPages);
        setCurrentPageIndex(newPageIndex);
        setWidgets(newPages[newPageIndex].widgets);
        setCurrentDataRunId(newPages[newPageIndex].lastDataRunId);
        prevChartDataRef.current[currentPageIndex] = null;
      },
      () => {}
    );
  }

  function handlePagePrev() {
    if (currentPageIndex === 0) return;
    const prevPageIndex = currentPageIndex - 1;
    setWidgets(pages[prevPageIndex].widgets);
    setCurrentPageIndex(prevPageIndex);
    setCurrentDataRunId(pages[prevPageIndex].lastDataRunId);
    prevChartDataRef.current[currentPageIndex] = null;
  }

  function handlePageNext() {
    if (currentPageIndex === pages.length - 1) return;
    const nextPageIndex = currentPageIndex + 1;
    setWidgets(pages[nextPageIndex].widgets);
    setCurrentPageIndex(nextPageIndex);
    setCurrentDataRunId(pages[nextPageIndex].lastDataRunId);
    prevChartDataRef.current[currentPageIndex] = null;
  }

  function handleSensorChange(widgetId, sensorIndex, sensor) {
    const updatedWidgets = widgets.map((w) => {
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

    setWidgets(updatedWidgets);
    setPages(updatePages);
  }

  // =========================== Functions associate with DataRun ===========================
  function handleExportExcel() {
    DataManagerIST.exportDataRunExcel();
  }

  function setLastDataRunIdForCurrentPage(dataRunId) {
    let updatedPages = _.cloneDeep(pages);
    updatedPages[currentPageIndex].lastDataRunId = dataRunId;
    setPages(() => updatedPages);
  }

  function handleChangeDataRun() {
    console.log("handleChangeDataRun");
  }

  function handleStopCollecting() {
    DataManagerIST.stopCollectingData();
    setIsRunning(false);
  }

  function handleGetManualSample() {
    if ([LAYOUT_TABLE, LAYOUT_TABLE_CHART, LAYOUT_NUMBER_TABLE].includes(layout)) {
      tableRef.current.handleSamplingManual();
    } else {
      DataManagerIST.appendManualSample();
    }
  }

  function handleSampleClick() {
    // TODO: check if user select one or more sensors
    if (!isRunning) {
      const dataRunId = DataManagerIST.startCollectingData();
      timerStopTime !== TIMER_NO_STOP && DataManagerIST.subscribeTimer(handleStopCollecting, timerStopTime);
      setCurrentDataRunId(dataRunId);
      setLastDataRunIdForCurrentPage(dataRunId);
    } else {
      DataManagerIST.unsubscribeTimer();
      DataManagerIST.stopCollectingData();
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

  // =========================== Functions associate with retrieving data ===========================
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

  function getDataForChart(sensors) {
    if (!lineChartRef.current[currentPageIndex]) return;
    const defaultSensorIndex = 0;
    const sensor = sensors[defaultSensorIndex] || DEFAULT_SENSOR_DATA;

    const chartDatas = DataManagerIST.getWidgetDatasRunData(currentDataRunId, [sensor.id]);
    const chartData = chartDatas[defaultSensorIndex] || [];
    const data = chartData.map((d) => ({ x: d.time, y: d.values[sensor.index] || "" })) || [];

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

    if (data.length > 0) {
      if (_.isEqual(data, prevChartDataRef.current[currentPageIndex])) return;
      prevChartDataRef.current[currentPageIndex] = data;
      lineChartRef.current[currentPageIndex].setChartData({
        chartData: [
          {
            name: `Lần ${DataManagerIST.dataRunsSize()}`,
            data: data,
          },
        ],
        xUnit: "ms",
        yUnit: "",
        maxHz: 10,
        curSensor: sensor,
      });
    }
  }

  // =========================== Functions associate with Table ===========================
  const onAddTableColumnHandler = (widgetId) => {
    const currentWidget = widgets[widgetId];
    if (!currentWidget) return;

    const updatedWidgets = widgets.map((w) => {
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

    setWidgets(updatedWidgets);
    setPages(updatePages);
  };

  const onDeleteTableColumnHandler = (widgetId, sensorIndex) => {
    const updatedWidgets = widgets.map((w) => {
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

    setWidgets(updatedWidgets);
    setPages(updatePages);
  };

  return (
    <Page className="bg-color-regal-blue activity">
      <Navbar>
        <NavLeft>
          <BackButton disabled={isRunning} onClick={handleActivityBack} />
          <RoundButton
            disabled={isRunning}
            icon="add_chart"
            popupOpen=".new-page-popup"
            popoverClose
            title="Cài đặt dữ liệu hiển thị"
          />
          <RoundButton disabled={isRunning || pages?.length === 1} icon="delete_forever" onClick={handlePageDelete} />
        </NavLeft>
        <input value={name} type="text" name="name" onChange={handleActivityNameChange} className="activity-name" />
        <NavRight>
          <RoundButton disabled={isRunning} icon="save" onClick={handleActivitySave} />
          <RoundButton disabled={isRunning} icon="settings" popoverOpen=".setting-popover-menu" />
          <RoundButton
            disabled={isRunning}
            icon={isFullScreen ? "fullscreen_exit" : "fullscreen"}
            onClick={handleFullScreen}
          />
        </NavRight>
      </Navbar>
      <Popover className="setting-popover-menu">
        <List>
          <ListItem link="#" popupOpen=".data-run-management-popup" popoverClose title="Quản lý dữ liệu" />
          <ListItem link="#" popoverClose title="Xuất ra Excel" onClick={handleExportExcel} />
          {/* <ListItem link="#" popoverClose title="Chia sẻ" /> */}
        </List>
      </Popover>
      <NewPagePopup handleNewPage={handleNewPage} ref={newPagePopup} />
      <DataRunManagementPopup handleChangeDataRun={handleChangeDataRun} ref={dataRunManagementPopup} />

      <div className="full-height display-flex flex-direction-column justify-content-space-between">
        <div className="activity-layout">
          <WirelessSensorContainer></WirelessSensorContainer>
          {[LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(layout) && (
            <>
              <div className="__card-widget __card-left">
                {layout === LAYOUT_TABLE_CHART && (
                  <TableWidget
                    ref={tableRef}
                    key={`${currentPageIndex}_table`}
                    datas={getDatasForTable(widgets[0].sensors)}
                    currentValues={getCurrentValues(widgets[0].sensors, true)}
                    widget={widgets[0]}
                    handleSensorChange={handleSensorChange}
                    chartLayout={LAYOUT_TABLE_CHART}
                    isRunning={isRunning}
                    samplingMode={samplingMode}
                    onAddTableColumnHandler={onAddTableColumnHandler}
                    onDeleteTableColumnHandler={onDeleteTableColumnHandler}
                  />
                )}
                {[LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(layout) && (
                  <NumberWidget
                    key={`${currentPageIndex}_number`}
                    value={getCurrentValues(widgets[0].sensors)}
                    widget={widgets[0]}
                    handleSensorChange={handleSensorChange}
                  />
                )}
              </div>
              <div className="__card-widget __card-right">
                {[LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART].includes(layout) && (
                  <LineChart
                    key={`${currentPageIndex}_chart`}
                    data={getDataForChart(widgets[1].sensors)}
                    ref={(el) => (lineChartRef.current[currentPageIndex] = el)}
                    widget={widgets[1]}
                    handleSensorChange={handleSensorChange}
                  />
                )}
                {layout === LAYOUT_NUMBER_TABLE && (
                  <TableWidget
                    ref={tableRef}
                    key={`${currentPageIndex}_table`}
                    datas={getDatasForTable(widgets[1].sensors)}
                    currentValues={getCurrentValues(widgets[1].sensors, true)}
                    widget={widgets[1]}
                    handleSensorChange={handleSensorChange}
                    chartLayout={LAYOUT_NUMBER_TABLE}
                    isRunning={isRunning}
                    samplingMode={samplingMode}
                    onAddTableColumnHandler={onAddTableColumnHandler}
                    onDeleteTableColumnHandler={onDeleteTableColumnHandler}
                  />
                )}
              </div>
            </>
          )}
          {[LAYOUT_CHART, LAYOUT_TABLE, LAYOUT_NUMBER].includes(layout) && (
            <div className="__card-widget">
              {layout === LAYOUT_CHART && (
                <LineChart
                  key={`${currentPageIndex}_chart`}
                  data={getDataForChart(widgets[0].sensors)}
                  ref={(el) => (lineChartRef.current[currentPageIndex] = el)}
                  widget={widgets[0]}
                  handleSensorChange={handleSensorChange}
                />
              )}
              {layout === LAYOUT_TABLE && (
                <TableWidget
                  ref={tableRef}
                  key={`${currentPageIndex}_table`}
                  datas={getDatasForTable(widgets[0].sensors)}
                  currentValues={getCurrentValues(widgets[0].sensors, true)}
                  widget={widgets[0]}
                  handleSensorChange={handleSensorChange}
                  chartLayout={LAYOUT_TABLE}
                  isRunning={isRunning}
                  samplingMode={samplingMode}
                  onAddTableColumnHandler={onAddTableColumnHandler}
                  onDeleteTableColumnHandler={onDeleteTableColumnHandler}
                />
              )}
              {layout === LAYOUT_NUMBER && (
                <NumberWidget
                  key={`${currentPageIndex}_number`}
                  value={getCurrentValues(widgets[0].sensors)}
                  widget={widgets[0]}
                  handleSensorChange={handleSensorChange}
                />
              )}
            </div>
          )}
        </div>
        <div className="activity-footer display-flex justify-content-space-between">
          <div className="__toolbar-left">
            <SamplingSetting
              isRunning={isRunning}
              frequency={frequency}
              handleFrequencySelect={handleFrequencySelect}
              handleSetTimerInMs={handleSetTimerInMs}
              handleGetManualSample={handleGetManualSample}
            />
          </div>
          <div className="__toolbar-center">
            <ActivityPageNav
              navOrder={`${currentPageIndex + 1}/${pages.length}`}
              isDisabled={isRunning}
              onNextPage={handlePageNext}
              onPrevPage={handlePagePrev}
            />
          </div>
          <div className="__toolbar-right">
            <Timer isRunning={isRunning} />
            <div className="sample">
              {isRunning ? (
                <RoundButton icon="stop" color="#FF0000" onClick={handleSampleClick} />
              ) : (
                <RoundButton icon="play_arrow" color="#45A3DB" onClick={handleSampleClick} />
              )}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};
