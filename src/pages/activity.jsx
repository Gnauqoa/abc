import React, { useState, useRef, useEffect } from "react";
import { Page, Navbar, NavLeft, NavRight } from "framework7-react";
import { v4 as uuidv4 } from "uuid";
import DataManagerIST from "../services/data-manager";

import BackButton from "../components/back-button";
import RoundButton from "../components/round-button";
import dialog from "../components/dialog";
import storeService from "../services/store-service";
import {
  LAYOUT_CHART,
  LAYOUT_TABLE,
  LAYOUT_NUMBER,
  LAYOUT_TABLE_CHART,
  LAYOUT_NUMBER_CHART,
  LAYOUT_NUMBER_TABLE,
} from "../js/constants";
import ActivityNav from "../components/activity-nav";
import Timer from "../components/timer";
import LineChart from "../components/widgets/line_chart";
import Number from "../components/widgets/number";
import Table from "../components/widgets/table";
import SamplingSetting from "../components/sampling-settings";

const MANUAL = "manual";
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

  let initActivity = {
    id: uuidv4(),
    name: "",
    layout: layout,
    sampleMode: MANUAL,
    frequency: 1,
    widgets: defaultWidgets,
  };
  if (id) {
    console.log(">>>>> Load activity id:", id);
    const foundActivity = activityService.find(id);
    if (!foundActivity) {
      f7router.navigate("/");
      return;
    }

    initActivity = { ...initActivity, ...foundActivity };
  }

  const [activity, setActivity] = useState(initActivity);
  const [isRunning, setIsRunning] = useState(false);
  const [dataRun, setDataRun] = useState([]);
  const [, setForceUpdate] = useState(0);
  const lineChartRef = useRef();

  useEffect(() => {
    let subscriberIds = [];
    if (isRunning) {
      setDataRun(() => []);
      console.log(">>>>> Start DataManagerIST");
      activity.widgets.map((w) => {
        const subscriberId = DataManagerIST.subscribe(handleDataManagerCallback, w.sensor.id);
        subscriberIds.push(subscriberId);
      });

      DataManagerIST.setCollectingDataFrequency(activity.frequency);
    } else {
      if (subscriberIds.length) {
        subscriberIds.map((id) => DataManagerIST.unsubscribe(id));
        subscriberIds = [];
      }
    }

    return () => {
      if (subscriberIds.length) subscriberIds.map((id) => DataManagerIST.unsubscribe(id));
    };
  }, [isRunning]);

  function handleActivityNameChange(e) {
    setActivity({
      ...activity,
      name: e.target.value,
    });
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
    if (activity.name.length) {
      activityService.save(activity);
      setForceUpdate((n) => n + 1);
    } else {
      dialog.prompt(
        "Bạn có muốn lưu lại những thay đổi này không?",
        "Tên hoạt động",
        (name) => {
          const updatedActivity = {
            ...activity,
            name,
          };
          setActivity(updatedActivity);
          activityService.save(updatedActivity);
        },
        () => {},
        activity.name
      );
    }
  }

  function handleFrequencySelect(frequency) {
    const result = DataManagerIST.setCollectingDataFrequency(frequency);
    result &&
      setActivity({
        ...activity,
        frequency,
      });
  }

  function handleSensorChange(widgetId, sensor) {
    let widgets = [...activity.widgets];
    widgets = widgets.map((w) => {
      if (w.id === widgetId) {
        return { ...w, sensor };
      }
    });
    setActivity({
      ...activity,
      widgets,
    });
  }

  function handleSampleClick() {
    setIsRunning(!isRunning);
  }

  function handleDataManagerCallback(data) {
    console.log(">>>>> data manager:", data);
    const time = data[1];
    const sensorId = data[2];
    const values = data.slice(3);
    if (values.length) {
      setDataRun((dataRun) => [...dataRun, { time, sensorId, values }]);
    }
  }

  function getValueForNumber(sensor) {
    const sensorData = dataRun.filter((d) => d.sensorId === sensor.id);
    return sensorData.pop()?.values[sensor.index] || "";
  }

  function getDataForTable(sensor) {
    const sensorData = dataRun.filter((d) => d.sensorId === sensor.id);
    return sensorData.map((d) => ({ time: d.time, value: d.values[sensor.index] })) || [];
  }

  function getDataForChart(sensor) {
    const sensorData = dataRun.filter((d) => d.sensorId === sensor.id);
    const data = sensorData.map((d) => ({ x: d.time, y: d.values[sensor.index] })) || [];
    lineChartRef.current &&
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

  return (
    <Page className="bg-color-regal-blue activity">
      <Navbar>
        <NavLeft>
          <BackButton link="/" />
          <RoundButton icon="add" color="#42C63F" onClick={() => f7router.navigate("/layout")} />
          <RoundButton icon="close" color="#FF0000" onClick={handleActivityDelete} />
        </NavLeft>
        <input
          value={activity.name}
          type="text"
          name="name"
          onChange={handleActivityNameChange}
          className="activity-name"
        />
        <NavRight>
          <RoundButton icon="save" onClick={handleActivitySave} />
          <RoundButton icon="settings" />
        </NavRight>
      </Navbar>
      <div className="full-height display-flex flex-direction-column justify-content-space-between">
        <div className="activity-layout">
          {[LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(activity.layout) && (
            <>
              <div className="__card __card-left">
                {activity.layout === LAYOUT_TABLE_CHART && (
                  <Table
                    data={getDataForTable(activity.widgets[0].sensor)}
                    widget={activity.widgets[0]}
                    handleSensorChange={handleSensorChange}
                  />
                )}
                {[LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(activity.layout) && (
                  <Number
                    value={getValueForNumber(activity.widgets[0].sensor)}
                    widget={activity.widgets[0]}
                    handleSensorChange={handleSensorChange}
                  />
                )}
              </div>
              <div className="__card __card-right">
                {[LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART].includes(activity.layout) && (
                  <LineChart
                    data={getDataForChart(activity.widgets[1].sensor)}
                    ref={lineChartRef}
                    widget={activity.widgets[1]}
                    handleSensorChange={handleSensorChange}
                  />
                )}
                {activity.layout === LAYOUT_NUMBER_TABLE && (
                  <Table
                    data={getDataForTable(activity.widgets[1].sensor)}
                    widget={activity.widgets[0]}
                    handleSensorChange={handleSensorChange}
                  />
                )}
              </div>
            </>
          )}
          {[LAYOUT_CHART, LAYOUT_TABLE, LAYOUT_NUMBER].includes(activity.layout) && (
            <div className="__card">
              {activity.layout === LAYOUT_CHART && (
                <LineChart
                  data={getDataForChart(activity.widgets[0].sensor)}
                  ref={lineChartRef}
                  widget={activity.widgets[0]}
                  handleSensorChange={handleSensorChange}
                />
              )}
              {activity.layout === LAYOUT_TABLE && (
                <Table
                  data={getDataForTable(activity.widgets[0].sensor)}
                  widget={activity.widgets[0]}
                  handleSensorChange={handleSensorChange}
                />
              )}
              {activity.layout === LAYOUT_NUMBER && (
                <Number
                  value={getValueForNumber(activity.widgets[0].sensor)}
                  widget={activity.widgets[0]}
                  handleSensorChange={handleSensorChange}
                />
              )}
            </div>
          )}
        </div>
        <div className="activity-footer display-flex justify-content-space-between">
          <div className="__toolbar-left">
            <SamplingSetting frequency={activity.frequency} handleFrequencySelect={handleFrequencySelect} />
          </div>
          <div className="__toolbar-center">
            <ActivityNav currentId={activity.id} />
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
