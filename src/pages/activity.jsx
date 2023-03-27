import React, { useState, useRef, useEffect } from "react";
import { Page, Navbar, NavLeft, NavRight } from "framework7-react";
import { v4 as uuidv4 } from "uuid";
import DataManagerIST from "../services/data-manager";
import {
  SAMPLING_AUTO,
  SAMPLING_MANUAL,
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
import Number from "../components/widgets/number";
import Table from "../components/widgets/table";
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
    sampleMode: SAMPLING_AUTO,
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
    if (sampleMode === SAMPLING_MANUAL) {
      if (isRunning) {
        DataManagerIST.startCollectingData(SAMPLING_MANUAL);
      } else {
        DataManagerIST.stopCollectingData();
      }
    } else if (sampleMode === SAMPLING_AUTO) {
      if (isRunning) {
        setDataRun(() => []);
        DataManagerIST.setCollectingDataFrequency(frequency);

        console.log(">>>>> Start DataManagerIST");
        widgets.forEach((w) => {
          const subscriberId = DataManagerIST.subscribe(handleDataManagerCallback, w.sensor.id);
          subscriberIds.push(subscriberId);
        });
      } else {
        if (subscriberIds.length) {
          subscriberIds.forEach((id) => DataManagerIST.unsubscribe(id));
          subscriberIds = [];
        }
      }
    }

    return () => {
      subscriberIds.forEach((id) => DataManagerIST.unsubscribe(id));
    };
  }, [isRunning, widgets]);

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
    });
    setWidgets(updatedWidgets);
  }

  function handleSampleClick() {
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

  function handleSamplingManual() {
    widgets.map((w) => {
      const sensorId = w.sensor.id;
      const data = DataManagerIST.getIndividualSample(sensorId);
      const time = data[1];
      const values = data.slice(3);
      if (values.length) {
        setDataRun((dataRun) => [...dataRun, { time, sensorId, values }]);
      }
      console.log(">>>>> MANUAL - data manager:", values);
    });
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
        <input value={name} type="text" name="name" onChange={handleActivityNameChange} className="activity-name" />
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
                    data={getDataForTable(widgets[0].sensor)}
                    widget={widgets[0]}
                    handleSensorChange={handleSensorChange}
                  />
                )}
                {[LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(activity.layout) && (
                  <Number
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
                  <Table
                    data={getDataForTable(widgets[1].sensor)}
                    widget={widgets[0]}
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
                  data={getDataForChart(widgets[0].sensor)}
                  ref={lineChartRef}
                  widget={widgets[0]}
                  handleSensorChange={handleSensorChange}
                />
              )}
              {activity.layout === LAYOUT_TABLE && (
                <Table
                  data={getDataForTable(widgets[0].sensor)}
                  widget={widgets[0]}
                  handleSensorChange={handleSensorChange}
                />
              )}
              {activity.layout === LAYOUT_NUMBER && (
                <Number
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
              handleSamplingManual={handleSamplingManual}
              handleFrequencySelect={handleFrequencySelect}
              handleChangeSamplingMode={handleChangeSamplingMode}
            />
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
