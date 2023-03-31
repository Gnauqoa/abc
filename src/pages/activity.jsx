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
  SAMPLING_MANUAL_FREQUENCY,
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
  const layout = f7route.params.layout;
  const id = f7route.params.id;
  let defaultWidgets = [{ id: 0, sensor: { id: 1, index: 0 } }];
  if ([LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(layout)) {
    defaultWidgets = [
      { id: 0, sensor: { id: 1, index: 0 } },
      { id: 1, sensor: { id: 2, index: 0 } },
    ];
  }

  let activity = {
    id: uuidv4(),
    name: "",
    layout: layout,
    frequency: 1,
    widgets: defaultWidgets,
  };
  if (id) {
    const savedActivity = activityService.find(id);
    if (!savedActivity) {
      f7router.navigate("/");
      return;
    }

    activity = { ...activity, ...savedActivity };
  }

  const [name, setName] = useState(activity.name);
  const [sampleMode, setSampleMode] = useState(activity.sampleMode);
  const [frequency, setFrequency] = useState(activity.frequency);
  const [widgets, setWidgets] = useState(activity.widgets);

  const [isRunning, setIsRunning] = useState(false);
  const [dataRun, setDataRun] = useState([]);
  const [, setForceUpdate] = useState(0);
  const lineChartRef = useRef();

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
        activityService.delete(activity.id);
        f7router.navigate("/");
      },
      () => {}
    );
  }

  function handleActivitySave() {
    const updatedActivity = { ...activity, name, sampleMode, frequency, widgets };
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

  function handleChangeSamplingMode(mode) {
    setSampleMode(mode);
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
          <RoundButton disabled={isRunning} icon="settings" />
        </NavRight>
      </Navbar>
      <div className="full-height display-flex flex-direction-column justify-content-space-between">
        <div className="activity-layout">
          {[LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(activity.layout) && (
            <>
              <div className="__card __card-left">
                {activity.layout === LAYOUT_TABLE_CHART && (
                  <TableWidget
                    data={getDataForTable(widgets[0].sensor)}
                    widget={widgets[0]}
                    handleSensorChange={handleSensorChange}
                    chartLayout={LAYOUT_TABLE_CHART}
                    isRunning={isRunning}
                    samplingMode={DataManagerIST.getSamplingMode()}
                  />
                )}
                {[LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(activity.layout) && (
                  <NumberWidget
                    value={getValueForNumber(widgets[0].sensor)}
                    widget={widgets[0]}
                    handleSensorChange={handleSensorChange}
                  />
                )}
              </div>
              <div className="__card __card-right">
                {[LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART].includes(activity.layout) && (
                  <LineChart
                    data={getDataForChart(widgets[1].sensor)}
                    ref={lineChartRef}
                    widget={widgets[1]}
                    handleSensorChange={handleSensorChange}
                  />
                )}
                {activity.layout === LAYOUT_NUMBER_TABLE && (
                  <TableWidget
                    data={getDataForTable(widgets[1].sensor)}
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
          {[LAYOUT_CHART, LAYOUT_TABLE, LAYOUT_NUMBER].includes(activity.layout) && (
            <div className="__card">
              {activity.layout === LAYOUT_CHART && (
                <LineChart
                  data={getDataForChart(widgets[0].sensor)}
                  ref={lineChartRef}
                  widget={widgets[0]}
                  handleSensorChange={handleSensorChange}
                />
              )}
              {activity.layout === LAYOUT_TABLE && (
                <TableWidget
                  data={getDataForTable(widgets[0].sensor)}
                  widget={widgets[0]}
                  handleSensorChange={handleSensorChange}
                  chartLayout={LAYOUT_TABLE}
                  isRunning={isRunning}
                  samplingMode={DataManagerIST.getSamplingMode()}
                />
              )}
              {activity.layout === LAYOUT_NUMBER && (
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
              handleChangeSamplingMode={handleChangeSamplingMode}
            />
          </div>
          <div className="__toolbar-center">
            <ActivityNav currentId={activity.id} isRunning={isRunning} />
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
