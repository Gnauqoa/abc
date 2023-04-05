import React, { useState, useRef, useEffect } from "react";
import { Page, Navbar, NavLeft, NavRight, Popover, List, ListItem, Popup } from "framework7-react";
import _ from "lodash";
import DataManagerIST from "../services/data-manager";
import {
  LAYOUT_CHART,
  LAYOUT_TABLE,
  LAYOUT_NUMBER,
  LAYOUT_TABLE_CHART,
  LAYOUT_NUMBER_CHART,
  LAYOUT_NUMBER_TABLE,
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

const DEFAULT_SENSOR_ID = -1;
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
          frequency: 1,
        },
      ],
      dataRuns: [],
      sensorSettings: [],
    };
  } else if (content) {
    activity = content;
  } else {
    f7router.navigate("/");
    return;
  }

  const [name, setName] = useState(activity.name);
  const [pages, setPages] = useState(activity.pages);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const currentPage = pages[currentPageIndex];
  const [sensorSettings, setSensorSettings] = useState(activity.sensorSettings);

  const layout = currentPage.layout;
  const [widgets, setWidgets] = useState(currentPage.widgets);
  const [frequency, setFrequency] = useState(currentPage.frequency);
  const [isRunning, setIsRunning] = useState(false);
  const [currentDataRunId, setCurrentDataRunId] = useState(null);
  const [currentSensorValues, setCurrentSensorValues] = useState({});
  const dataRun = getDataRun(currentDataRunId);
  const displaySettingPopup = useRef();
  const newPagePopup = useRef();
  const lineChartRef = useRef();
  let prevChartDataRef = useRef();

  useEffect(() => {
    DataManagerIST.importActivityDataRun(activity.dataRuns);
    const dataRunPreviews = DataManagerIST.getActivityDataRunPreview();
    if (dataRunPreviews.length > 0) {
      const lastDataRunId = dataRunPreviews[dataRunPreviews.length - 1].id;
      const result = DataManagerIST.setCurrentDataRun(lastDataRunId);
      result && setCurrentDataRunId(lastDataRunId);
    }
  }, []);

  useEffect(() => {
    let subscriberIds = [];
    DataManagerIST.setCollectingDataFrequency(frequency);

    if (subscriberIds.length) {
      subscriberIds.forEach((id) => DataManagerIST.unsubscribe(id));
    }
    widgets.forEach((w) => {
      if (w.sensor.id === DEFAULT_SENSOR_ID) return;
      const subscriberId = DataManagerIST.subscribe(handleDataManagerCallback, w.sensor.id);
      subscriberIds.push(subscriberId);
    });

    return () => {
      subscriberIds.forEach((id) => DataManagerIST.unsubscribe(id));
    };
  }, [widgets]);

  function handleActivityNameChange(e) {
    setName(e.target.value);
  }

  function getDataRun(dataRunId) {
    const dataRunPreviews = DataManagerIST.getActivityDataRunPreview();
    if (dataRunPreviews.length > 0) {
      const dataRun = DataManagerIST.getDataRunData(dataRunId);
      return DataManagerIST.parseActivityDataRun(dataRun);
    }
    return [];
  }

  async function handleActivitySave() {
    // Collecting data from dataRuns
    const updatedDataRuns = DataManagerIST.getActivityDataRun();
    const updatedPage = pages.map((page, index) => {
      if (index === currentPageIndex) {
        return { ...page, frequency, widgets };
      } else {
        return page;
      }
    });
    const updatedActivity = { ...activity, name, pages: updatedPage, dataRuns: updatedDataRuns };

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

  function handleFrequencySelect(frequency) {
    const result = DataManagerIST.setCollectingDataFrequency(frequency);
    result && setFrequency(frequency);
  }

  function handleSensorChange(widgetId, sensor) {
    const updatedWidgets = widgets.map((w) => {
      if (w.id === widgetId) {
        return { ...w, sensor };
      }
      return w;
    });
    setWidgets(updatedWidgets);
  }

  function handleSampleClick() {
    // TODO: check if user select one or more sensors
    if (!isRunning) {
      const dataRunId = DataManagerIST.startCollectingData();
      setCurrentDataRunId(dataRunId);
    } else {
      DataManagerIST.stopCollectingData();
    }
    setIsRunning(!isRunning);
  }

  function handleDataManagerCallback(data) {
    console.log(">>>>> AUTO - data manager:", data);
    const time = data[1];
    const sensorId = data[2];
    const values = data.slice(3);
    const updatedSensorValues = { ...currentSensorValues };
    updatedSensorValues[sensorId] = { time, sensorId, values };
    if (values.length) {
      setCurrentSensorValues((sensorValues) => Object.assign({}, sensorValues, updatedSensorValues));
    }
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
    if (!lineChartRef.current) return;

    const sensorData = dataRun.filter((d) => d.sensorId === sensor.id);
    const data = sensorData.map((d) => ({ x: d.time, y: d.values[sensor.index] })) || [];
    const sensorValue = currentSensorValues[sensor.id];
    if (sensorValue) {
      let currentData = { x: sensorValue.time, y: sensorValue.values[sensor.index] };
      if (!isRunning) {
        currentData = { ...currentData, x: 0 };
      }
      lineChartRef.current.setCurrentData({
        data: currentData,
      });
    }

    if (data.length > 0) {
      if (_.isEqual(data, prevChartDataRef.current)) return;
      prevChartDataRef.current = data;
      lineChartRef.current.setChartData({
        chartData: [
          {
            name: "run1",
            data: data,
          },
        ],
        xUnit: "ms",
        yUnit: "",
        maxHz: 10,
      });
    }
  }

  function handlePagePrev() {
    const numPages = pages.length;
    const nextPageIndex = (currentPageIndex - 1 + numPages) % numPages;
    setCurrentPageIndex(nextPageIndex);
  }

  function handlePageNext() {
    const numPages = pages.length;
    const nextPageIndex = (currentPageIndex + 1) % numPages;
    setCurrentPageIndex(nextPageIndex);
  }

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
      frequency: 1,
    };

    setWidgets(defaultWidgets);
    setPages((prev) => [...prev, newPage]);
    setCurrentPageIndex((prev) => prev + 1);
  }

  function handlePageDelete() {
    dialog.question(
      "Xác nhận",
      `Bạn có chắc chắn muốn xóa hoạt động này không?`,
      () => {
        const numPages = pages.length;
        const deletedPageIndex = currentPageIndex;
        const newPages = pages.filter((page, index) => index !== deletedPageIndex);
        const newPageIndex = currentPageIndex + 1 === numPages ? currentPageIndex - 1 : currentPageIndex;
        setPages(newPages);
        setCurrentPageIndex(newPageIndex);
      },
      () => {}
    );
  }

  function handleSensorSettingSubmit(setting) {
    let sensorSettingsCpy = [...sensorSettings];
    if (sensorSettingsCpy.filter((e) => e.sensorDetailId == setting.sensorDetailId).length === 0) {
      sensorSettingsCpy.push({ ...setting });
      console.log("New data pushed");
    } else {
      var foundIndex = sensorSettingsCpy.findIndex((e) => e.sensorDetailId == setting.sensorDetailId);
      sensorSettingsCpy[foundIndex] = setting;
      console.log(`setting of sensor ${setting.sensorDetailId} had been updated`);
    }

    setSensorSettings(sensorSettingsCpy);
    displaySettingPopup.current.f7Popup().close();
  }

  return (
    <Page className="bg-color-regal-blue activity">
      <Navbar>
        <NavLeft>
          <BackButton disabled={isRunning} link="/" />
          <RoundButton
            disabled={isRunning}
            icon="add"
            color="#42C63F"
            popupOpen=".new-page-popup"
            popoverClose
            title="Cài đặt dữ liệu hiển thị"
          />
          <RoundButton
            disabled={isRunning || pages?.length === 1}
            icon="close"
            color="#FF0000"
            onClick={handlePageDelete}
          />
        </NavLeft>
        <input value={name} type="text" name="name" onChange={handleActivityNameChange} className="activity-name" />
        <NavRight>
          <RoundButton disabled={isRunning} icon="save" onClick={handleActivitySave} />
          <RoundButton disabled={isRunning} icon="settings" popoverOpen=".setting-popover-menu" />
        </NavRight>
      </Navbar>
      <Popover className="setting-popover-menu">
        <List>
          <ListItem link="#" popoverClose title="Quản lý dữ liệu" />
          <ListItem link="#" popupOpen=".display-setting-popup" popoverClose title="Cài đặt dữ liệu hiển thị" />
          <ListItem link="#" popoverClose title="Xuất ra Excel" />
          <ListItem link="#" popoverClose title="Chia sẻ" />
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
                    data={getDataForTable(widgets[0].sensor)}
                    currentValue={getCurrentValue(widgets[0].sensor, true)}
                    widget={widgets[0]}
                    handleSensorChange={handleSensorChange}
                    chartLayout={LAYOUT_TABLE_CHART}
                    isRunning={isRunning}
                  />
                )}
                {[LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(layout) && (
                  <NumberWidget
                    value={getCurrentValue(widgets[0].sensor)}
                    widget={widgets[0]}
                    handleSensorChange={handleSensorChange}
                  />
                )}
              </div>
              <div className="__card __card-right">
                {[LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART].includes(layout) && (
                  <LineChart
                    data={getDataForChart(widgets[1].sensor)}
                    ref={lineChartRef}
                    widget={widgets[1]}
                    handleSensorChange={handleSensorChange}
                  />
                )}
                {layout === LAYOUT_NUMBER_TABLE && (
                  <TableWidget
                    data={getDataForTable(widgets[1].sensor)}
                    currentValue={getCurrentValue(widgets[0].sensor, true)}
                    widget={widgets[1]}
                    handleSensorChange={handleSensorChange}
                    chartLayout={LAYOUT_NUMBER_TABLE}
                    isRunning={isRunning}
                  />
                )}
              </div>
            </>
          )}
          {[LAYOUT_CHART, LAYOUT_TABLE, LAYOUT_NUMBER].includes(layout) && (
            <div className="__card">
              {layout === LAYOUT_CHART && (
                <LineChart
                  data={getDataForChart(widgets[0].sensor)}
                  ref={lineChartRef}
                  widget={widgets[0]}
                  handleSensorChange={handleSensorChange}
                />
              )}
              {layout === LAYOUT_TABLE && (
                <TableWidget
                  data={getDataForTable(widgets[0].sensor)}
                  currentValue={getCurrentValue(widgets[0].sensor, true)}
                  widget={widgets[0]}
                  handleSensorChange={handleSensorChange}
                  chartLayout={LAYOUT_TABLE}
                  isRunning={isRunning}
                />
              )}
              {layout === LAYOUT_NUMBER && (
                <NumberWidget
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
