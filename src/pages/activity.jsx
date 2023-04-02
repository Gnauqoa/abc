import React, { useState, useRef, useEffect } from "react";
import { Page, Navbar, NavLeft, NavRight } from "framework7-react";
import { v4 as uuidv4 } from "uuid";
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
import storeService from "../services/store-service";
import ActivityNav from "../components/activity-nav";
import Timer from "../components/timer";
import LineChart from "../components/widgets/line_chart";
import NumberWidget from "../components/widgets/number";
import TableWidget from "../components/widgets/table";
import SamplingSetting from "../components/sampling-settings";

const activityService = new storeService("activity");

export default ({ f7route, f7router }) => {
  const selectedLayout = f7route.params.layout;
  const selectedId = f7route.params.id;

  let defaultWidgets = [{ id: 0, sensor: { id: 1, index: 0 } }];
  if ([LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(selectedLayout)) {
    defaultWidgets = [
      { id: 0, sensor: { id: 1, index: 0 } },
      { id: 1, sensor: { id: 2, index: 0 } },
    ];
  }

  const activity = {
    id: selectedId || uuidv4(),
    name: "",
    layout: selectedLayout,
    frequency: 1,
    widgets: defaultWidgets,
    dataRuns: [],
  };

  const [activityId, setActivityId] = useState(activity.id);
  const [name, setName] = useState(activity.name);
  const [layout, setLayout] = useState(activity.layout);
  const [frequency, setFrequency] = useState(activity.frequency);
  const [widgets, setWidgets] = useState(activity.widgets);
  const [dataRun, setDataRun] = useState([]);

  const [isRunning, setIsRunning] = useState(false);
  const [initialDataRun, setInitialDataRun] = useState([]);
  const [, setForceUpdate] = useState(0);
  const lineChartRef = useRef();

  useEffect(() => {
    if (!activityId) return;

    const savedActivity = activityService.find(activityId);
    if (!savedActivity) {
      f7router.navigate("/");
      return;
    }

    const oldActivity = { ...activity, ...savedActivity };

    DataManagerIST.importActivityDataRun(oldActivity.dataRuns);
    const dataRunPreviews = DataManagerIST.getActivityDataRunPreview();
    if (dataRunPreviews.length > 0) {
      const firstDataRunId = dataRunPreviews[0].id;
      const dataRun = DataManagerIST.getDataRunData(firstDataRunId);
      console.log("dataRun", dataRun);
      const parsedDataRun = DataManagerIST.parseActivityDataRun(dataRun);
      const result = DataManagerIST.setCurrentDataRun(firstDataRunId);
      result && setInitialDataRun(parsedDataRun);
    }

    setName(oldActivity.name);
    setLayout(oldActivity.layout);
    setActivityId(oldActivity.id);
    setFrequency(oldActivity.frequency);
    setWidgets(oldActivity.widgets);
  }, [selectedId, f7router, activityService]);

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

  function handleActivityDelete(e) {
    dialog.question(
      "Xác nhận",
      `Bạn có chắc chắn muốn xóa hoạt động này không?`,
      () => {
        activityService.delete(activityId);
        f7router.navigate("/");
      },
      () => {}
    );
  }

  function handleActivitySave() {
    // Collecting data from dataRuns
    const dataRuns = DataManagerIST.getActivityDataRun();
    const updatedActivity = { ...activity, layout, name, frequency, widgets, dataRuns: dataRuns };

    if (name.length) {
      activityService.save(updatedActivity);
      setForceUpdate((n) => n + 1);
    } else {
      dialog.prompt(
        "Bạn có muốn lưu lại những thay đổi này không?",
        "Tên hoạt động",
        (name) => {
          setName(name);
          activityService.save({ ...updatedActivity, name });
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
      setInitialDataRun(() => []);
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

  function getDataForTable(sensor, isInitial = false) {
    const sensorData = (isInitial ? initialDataRun : dataRun).filter((d) => d.sensorId === sensor.id);
    const tableData = sensorData.map((d) => ({ time: d.time, value: d.values[sensor.index] })) || [];
    return tableData;
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

  return (
    <Page className="bg-color-regal-blue activity">
      <Navbar>
        <NavLeft>
          <BackButton link="/" />
          <RoundButton disabled={isRunning} icon="add" color="#42C63F" onClick={() => f7router.navigate("/layout")} />
          <RoundButton disabled={isRunning} icon="close" color="#FF0000" onClick={handleActivityDelete} />
        </NavLeft>
        <input value={name} type="text" name="name" onChange={handleActivityNameChange} className="activity-name" />
        <NavRight>
          <RoundButton disabled={isRunning} icon="save" onClick={handleActivitySave} />
          <RoundButton
            disabled={isRunning}
            icon="settings"
            onClick={() => {
              DataManagerIST.init();
            }}
          />
        </NavRight>
      </Navbar>
      <div className="full-height display-flex flex-direction-column justify-content-space-between">
        <div className="activity-layout">
          {[LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(layout) && (
            <>
              <div className="__card __card-left">
                {layout === LAYOUT_TABLE_CHART && (
                  <TableWidget
                    data={getDataForTable(widgets[0].sensor)}
                    initialData={getDataForTable(widgets[0].sensor, true)}
                    widget={widgets[0]}
                    handleSensorChange={handleSensorChange}
                    chartLayout={LAYOUT_TABLE_CHART}
                    isRunning={isRunning}
                    samplingMode={DataManagerIST.getSamplingMode()}
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
                    initialData={getDataForTable(widgets[0].sensor, true)}
                    widget={widgets[0]}
                    handleSensorChange={handleSensorChange}
                    chartLayout={LAYOUT_NUMBER_TABLE}
                    isRunning={isRunning}
                    samplingMode={DataManagerIST.getSamplingMode()}
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
                  initialData={getDataForTable(widgets[0].sensor, true)}
                  widget={widgets[0]}
                  handleSensorChange={handleSensorChange}
                  chartLayout={LAYOUT_TABLE}
                  isRunning={isRunning}
                  samplingMode={DataManagerIST.getSamplingMode()}
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
            <ActivityNav currentId={activityId} isRunning={isRunning} />
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
