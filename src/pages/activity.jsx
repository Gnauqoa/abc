import React, { useState, useRef, useEffect } from "react";
import { Page, Navbar, NavLeft, NavRight, Popover, List, ListItem, Popup, f7ready, f7 } from "framework7-react";
import _ from "lodash";
import DataManagerIST from "../services/data-manager";
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
} from "../js/constants";

import BackButton from "../components/back-button";
import RoundButton from "../components/round-button";
import dialog from "../components/dialog";
import ActivityPageNav from "../components/activity-page-nav";
import Timer from "../components/timer";
import LineChart from "../components/widgets/line_chart";
import NumberWidget from "../components/widgets/number";
import TableWidget from "../components/widgets/table";
import SamplingSetting from "../components/sampling-settings";
import DataDisplaySetting from "../components/data-display-setting";
import { saveFile } from "../services/file-service";
import storeService from "../services/store-service";
import NewPagePopup from "../components/new-page";

export const DEFAULT_SENSOR_ID = -1;
const recentFilesService = new storeService("recent-files");

export default ({ f7route, f7router, filePath, content }) => {
  const selectedLayout = f7route.params.layout;
  let activity;

  if (selectedLayout) {
    let defaultWidgets = [{ id: 0, sensor: { id: DEFAULT_SENSOR_ID, index: 0 } }];
    if ([LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(selectedLayout)) {
      defaultWidgets = [
        { id: 0, sensor: { id: DEFAULT_SENSOR_ID, index: 0 } },
        { id: 1, sensor: { id: DEFAULT_SENSOR_ID, index: 0 } },
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
  const [sensorSettings, setSensorSettings] = useState(activity.sensorSettings);
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
  const dataRun = getDataRun(currentDataRunId);

  const displaySettingPopup = useRef();
  const newPagePopup = useRef();
  const lineChartRef = useRef([]);
  let prevChartDataRef = useRef([]);

  useEffect(() => {
    DataManagerIST.init();
    DataManagerIST.importActivityDataRun(activity.dataRuns);
  }, []);

  useEffect(() => {
    let subscriberId = null;
    subscriberId && DataManagerIST.unsubscribe(subscriberId);

    const subscribedSensorIds = widgets
      .map((widget) => (widget.sensor.id !== DEFAULT_SENSOR_ID ? parseInt(widget.sensor.id) : false))
      .filter(Boolean);

    subscriberId = DataManagerIST.subscribe(handleDataManagerCallback, subscribedSensorIds);

    return () => {
      subscriberId && DataManagerIST.unsubscribe(subscriberId);
    };
  }, [widgets]);

  // =========================== Functions associate with Activity ===========================
  function handleActivityNameChange(e) {
    setName(e.target.value);
  }

  function handleSensorSettingSubmit(setting) {
    let sensorSettingsCpy = [...sensorSettings];
    if (sensorSettingsCpy.filter((e) => e.sensorDetailId == setting.sensorDetailId).length === 0) {
      sensorSettingsCpy.push({ ...setting });
    } else {
      var foundIndex = sensorSettingsCpy.findIndex((e) => e.sensorDetailId == setting.sensorDetailId);
      sensorSettingsCpy[foundIndex] = setting;
    }

    setSensorSettings(sensorSettingsCpy);
    displaySettingPopup.current.f7Popup().close();
  }

  function handleFrequencySelect(frequency) {
    setSamplingMode(frequency === SAMPLING_MANUAL_FREQUENCY ? SAMPLING_MANUAL : SAMPLING_AUTO);
    const result = DataManagerIST.setCollectingDataFrequency(frequency);
    result && setFrequency(frequency);
  }

  function handleSetTimerInMs(timerNumber) {
    setTimerStopTime(timerNumber);
  }

  async function handleActivitySave() {
    // Collecting data from dataRuns
    const updatedDataRuns = DataManagerIST.getActivityDataRun();
    const updatedPage = pages.map((page, index) => {
      if (index === currentPageIndex) {
        return { ...page, widgets };
      } else {
        return page;
      }
    });
    const updatedActivity = { ...activity, name, pages: updatedPage, dataRuns: updatedDataRuns, frequency: frequency };

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
    // Collecting data from dataRuns
    const updatedDataRuns = DataManagerIST.getActivityDataRun();
    const updatedPage = pages.map((page, index) => {
      if (index === currentPageIndex) {
        return { ...page, widgets };
      } else {
        return page;
      }
    });
    const updatedActivity = { ...activity, name, pages: updatedPage, dataRuns: updatedDataRuns, frequency: frequency };

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
    let defaultWidgets = [{ id: 0, sensor: { id: DEFAULT_SENSOR_ID, index: 0 } }];
    if ([LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(chartType)) {
      defaultWidgets = [
        { id: 0, sensor: { id: DEFAULT_SENSOR_ID, index: 0 } },
        { id: 1, sensor: { id: DEFAULT_SENSOR_ID, index: 0 } },
      ];
    }
    const newPage = {
      layout: chartType,
      widgets: defaultWidgets,
      lastDataRunId: null,
    };
    const newPages = [...pages, newPage];

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

  function handleSensorChange(widgetId, sensor) {
    const updatedWidgets = widgets.map((w) => {
      if (w.id === widgetId) {
        return { ...w, sensor };
      }
      return w;
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
  function getDataRun(dataRunId) {
    const dataRun = DataManagerIST.getDataRunData(dataRunId);
    return DataManagerIST.parseActivityDataRun(dataRun);
  }

  function handleExportExcel() {
    DataManagerIST.exportDataRunExcel();
  }

  function setLastDataRunIdForCurrentPage(dataRunId) {
    let updatedPages = _.cloneDeep(pages);
    updatedPages[currentPageIndex].lastDataRunId = dataRunId;
    setPages(() => updatedPages);
  }

  function handleStopCollecting() {
    DataManagerIST.stopCollectingData();
    setIsRunning(false);
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
    emittedDatas.forEach((data) => {
      const time = data[1];
      const sensorId = data[2];
      const values = data.slice(3);
      const sensorValues = { time, sensorId, values };
      updatedSensorValues[sensorId] = sensorValues;
    });
    setCurrentSensorValues((sensorValues) => Object.assign({}, sensorValues, updatedSensorValues));
  }

  function getCurrentValue(sensor, isTable = false) {
    if (!isTable) return currentSensorValues[sensor.id]?.values[sensor.index] || "";
    const data = currentSensorValues[sensor.id];
    return data ? { time: data.time, value: data.values[sensor.index] } : {};
  }

  function getDataForTable(sensor) {
    const sensorData = dataRun.filter((d) => d.sensorId === sensor.id);
    return sensorData.map((d) => ({ time: d.time, value: d.values[sensor.index] })) || [];
  }

  function getDataForChart(sensor) {
    if (!lineChartRef.current[currentPageIndex]) return;

    const sensorData = dataRun.filter((d) => d.sensorId === sensor.id);
    const data = sensorData.map((d) => ({ x: d.time, y: d.values[sensor.index] || "" })) || [];
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
      });
    }
  }

  return (
    <Page className="bg-color-regal-blue activity">
      <Navbar>
        <NavLeft>
          <BackButton disabled={isRunning} onClick={handleActivityBack} />
          <RoundButton
            disabled={isRunning}
            customIcon="page_add"
            popupOpen=".new-page-popup"
            popoverClose
            title="Cài đặt dữ liệu hiển thị"
          />
          <RoundButton
            disabled={isRunning || pages?.length === 1}
            customIcon="page_delete"
            onClick={handlePageDelete}
          />
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
          {/* <ListItem link="#" popoverClose title="Quản lý dữ liệu" /> */}
          {/* <ListItem link="#" popupOpen=".display-setting-popup" popoverClose title="Cài đặt dữ liệu hiển thị" /> */}
          <ListItem link="#" popoverClose title="Xuất ra Excel" onClick={handleExportExcel} />
          {/* <ListItem link="#" popoverClose title="Chia sẻ" /> */}
        </List>
      </Popover>
      <Popup className="display-setting-popup" ref={displaySettingPopup}>
        <DataDisplaySetting
          sensorSettings={sensorSettings}
          onSubmit={(setting) => handleSensorSettingSubmit(setting)}
        />
      </Popup>
      <Popup className="new-page-popup" ref={newPagePopup}>
        <NewPagePopup handleNewPage={handleNewPage}></NewPagePopup>
      </Popup>

      <div className="full-height display-flex flex-direction-column justify-content-space-between">
        <div className="activity-layout">
          {[LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(layout) && (
            <>
              <div className="__card __card-left">
                {layout === LAYOUT_TABLE_CHART && (
                  <TableWidget
                    key={`${currentPageIndex}_table`}
                    data={getDataForTable(widgets[0].sensor)}
                    currentValue={getCurrentValue(widgets[0].sensor, true)}
                    widget={widgets[0]}
                    handleSensorChange={handleSensorChange}
                    chartLayout={LAYOUT_TABLE_CHART}
                    isRunning={isRunning}
                    samplingMode={samplingMode}
                  />
                )}
                {[LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(layout) && (
                  <NumberWidget
                    key={`${currentPageIndex}_number`}
                    value={getCurrentValue(widgets[0].sensor)}
                    widget={widgets[0]}
                    handleSensorChange={handleSensorChange}
                  />
                )}
              </div>
              <div className="__card __card-right">
                {[LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART].includes(layout) && (
                  <LineChart
                    key={`${currentPageIndex}_chart`}
                    data={getDataForChart(widgets[1].sensor)}
                    ref={(el) => (lineChartRef.current[currentPageIndex] = el)}
                    widget={widgets[1]}
                    handleSensorChange={handleSensorChange}
                  />
                )}
                {layout === LAYOUT_NUMBER_TABLE && (
                  <TableWidget
                    key={`${currentPageIndex}_table`}
                    data={getDataForTable(widgets[1].sensor)}
                    currentValue={getCurrentValue(widgets[1].sensor, true)}
                    widget={widgets[1]}
                    handleSensorChange={handleSensorChange}
                    chartLayout={LAYOUT_NUMBER_TABLE}
                    isRunning={isRunning}
                    samplingMode={samplingMode}
                  />
                )}
              </div>
            </>
          )}
          {[LAYOUT_CHART, LAYOUT_TABLE, LAYOUT_NUMBER].includes(layout) && (
            <div className="__card">
              {layout === LAYOUT_CHART && (
                <LineChart
                  key={`${currentPageIndex}_chart`}
                  data={getDataForChart(widgets[0].sensor)}
                  ref={(el) => (lineChartRef.current[currentPageIndex] = el)}
                  widget={widgets[0]}
                  handleSensorChange={handleSensorChange}
                />
              )}
              {layout === LAYOUT_TABLE && (
                <TableWidget
                  key={`${currentPageIndex}_table`}
                  data={getDataForTable(widgets[0].sensor)}
                  currentValue={getCurrentValue(widgets[0].sensor, true)}
                  widget={widgets[0]}
                  handleSensorChange={handleSensorChange}
                  chartLayout={LAYOUT_TABLE}
                  isRunning={isRunning}
                  samplingMode={samplingMode}
                />
              )}
              {layout === LAYOUT_NUMBER && (
                <NumberWidget
                  key={`${currentPageIndex}_number`}
                  value={getCurrentValue(widgets[0].sensor)}
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
