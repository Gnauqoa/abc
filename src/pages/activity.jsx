import React, { useState, useRef, useEffect } from "react";
import { Page, Navbar, NavLeft, NavRight, Popover, List, ListItem, Popup } from "framework7-react";
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

const recentFilesService = new storeService("recent-files");

export default ({ f7route, f7router, filePath, content }) => {
  const selectedLayout = f7route.params.layout;
  let activity;

  if (selectedLayout) {
    let defaultWidgets = [{ id: 0, sensor: { id: 1, index: 0 } }];
    if ([LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(selectedLayout)) {
      defaultWidgets = [
        { id: 0, sensor: { id: 1, index: 0 } },
        { id: 1, sensor: { id: 2, index: 0 } },
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

  const [dataRun, setDataRun] = useState([]);
  const [, setForceUpdate] = useState(0);
  const displaySettingPopup = useRef();
  const lineChartRef = useRef();

  useEffect(() => {
    DataManagerIST.importActivityDataRun(activity.dataRuns);
    const dataRunPreviews = DataManagerIST.getActivityDataRunPreview();
    if (dataRunPreviews.length > 0) {
      const lastDataRunId = dataRunPreviews[dataRunPreviews.length - 1].id;
      const dataRun = DataManagerIST.getDataRunData(lastDataRunId);
      const parsedDataRun = DataManagerIST.parseActivityDataRun(dataRun);
      const result = DataManagerIST.setCurrentDataRun(lastDataRunId);
      result && setDataRun(parsedDataRun);
    }
  }, []);

  useEffect(() => {
    let subscriberIds = [];
    DataManagerIST.setCollectingDataFrequency(frequency);

    if (subscriberIds.length) {
      subscriberIds.forEach((id) => DataManagerIST.unsubscribe(id));
    }
    widgets.forEach((w) => {
      const subscriberId = DataManagerIST.subscribe(handleDataManagerCallback, w.sensor.id);
      subscriberIds.push(subscriberId);
    });

    return () => {
      subscriberIds.forEach((id) => DataManagerIST.unsubscribe(id));
    };
  }, [widgets, isRunning]);

  function handleActivityNameChange(e) {
    setName(e.target.value);
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
    if (!isRunning) {
      DataManagerIST.setCollectingDataFrequency(frequency);
      DataManagerIST.startCollectingData();
      setDataRun(() => []);
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
    if (values.length) {
      setDataRun((dataRun) => [...dataRun, { time, sensorId, values }]);
    }
  }

  function getValueForNumber(sensor) {
    const sensorData = dataRun.filter((d) => d.sensorId === sensor.id);
    return sensorData.slice(-1)[0]?.values[sensor.index] || "";
  }

  function getDataForTable(sensor) {
    const sensorData = dataRun.filter((d) => d.sensorId === sensor.id);
    return sensorData.map((d) => ({ time: d.time, value: d.values[sensor.index] })) || [];
  }

  function getDataForChart(sensor) {
    const sensorData = dataRun.filter((d) => d.sensorId === sensor.id);
    const data = sensorData.map((d) => ({ x: d.time, y: d.values[sensor.index] })) || [];
    if (lineChartRef.current && Object.keys(data).length !== 0) {
      let currentData = data.slice(-1)[0];
      if (!isRunning) {
        currentData = { ...currentData, x: 0 };
      }
      lineChartRef.current.setCurrentData({
        data: currentData,
      });

      if (isRunning) {
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
  }

  function handleSensorSettingSubmit(setting) {
    let sensorSettingsCpy = [ ...sensorSettings ];
    if (sensorSettingsCpy.filter((e) => e.sensorDetailId == setting.sensorDetailId).length === 0) {
      sensorSettingsCpy.push({ ...setting });
      console.log("New data pushed");
    } else {
      var foundIndex = sensorSettingsCpy.findIndex((e) => e.sensorDetailId == setting.sensorDetailId);
      sensorSettingsCpy[foundIndex] = setting;
      console.log(`setting of sensor ${setting.sensorDetailId} had been updated`);
    }

    console.log(sensorSettings);
    setSensorSettings(sensorSettingsCpy);
    displaySettingPopup.current.f7Popup().close();
  }

  function handlePagePrev() {
    console.log("TODO: handlePrevPage");
  }

  function handlePageNext() {
    console.log("TODO: handleNextPage");
  }

  function handlePageDelete() {
    dialog.question(
      "Xác nhận",
      `Bạn có chắc chắn muốn xóa hoạt động này không?`,
      () => {
        console.log("TODO: delete page");
      },
      () => {}
    );
  }

  return (
    <Page className="bg-color-regal-blue activity">
      <Navbar>
        <NavLeft>
          <BackButton link="/" />
          <RoundButton disabled={isRunning} icon="add" color="#42C63F" onClick={() => f7router.navigate("/layout")} />
          <RoundButton disabled={isRunning} icon="close" color="#FF0000" onClick={handlePageDelete} />
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
      <Popup
        className="display-setting-popup"
        ref={displaySettingPopup}
      >
        <DataDisplaySetting
          sensorSettings={sensorSettings}
          onSubmit={(setting) => handleSensorSettingSubmit(setting)}
        />
      </Popup>
      <div className="full-height display-flex flex-direction-column justify-content-space-between">
        <div className="activity-layout">
          {[LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(layout) && (
            <>
              <div className="__card __card-left">
                {layout === LAYOUT_TABLE_CHART && (
                  <TableWidget
                    data={getDataForTable(widgets[0].sensor)}
                    widget={widgets[0]}
                    handleSensorChange={handleSensorChange}
                    chartLayout={LAYOUT_TABLE_CHART}
                    isRunning={isRunning}
                  />
                )}
                {[LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(layout) && (
                  <NumberWidget
                    value={getValueForNumber(widgets[0].sensor)}
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
                  widget={widgets[0]}
                  handleSensorChange={handleSensorChange}
                  chartLayout={LAYOUT_TABLE}
                  isRunning={isRunning}
                />
              )}
              {layout === LAYOUT_NUMBER && (
                <NumberWidget
                  value={getValueForNumber(widgets[0].sensor)}
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
              navOrder={"1/1"}
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
