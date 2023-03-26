import React, { useState, useRef } from "react";
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
import Frequency from "../components/frequency";
import DataManagerIST from "../services/data-manager";

const MANUAL = "manual";
const activityService = new storeService("activity");

export default ({ f7route, f7router }) => {
  const layout = f7route.params.layout;
  const id = f7route.params.id;
  let initActivity = {
    id: uuidv4(),
    name: "",
    layout: layout,
    sampleMode: MANUAL,
    frequency: 1,
    widgets: [
      { id: 0, sensorId: 0 },
      { id: 1, sensorId: 0 },
    ],
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
  const [, setForceUpdate] = useState(0);
  const lineChartRef = useRef();

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

  function handleSensorChange(widgetId, sensorId) {
    let widgets = { ...activity.widgets };
    widgets = widgets.map((w) => {
      if (w.id === widgetId) {
        return { ...w, sensorId };
      }

      setActivity({
        ...activity,
        widgets,
      });
    });
  }

  function handleSampleClick() {
    setIsRunning(!isRunning);
  }

  function handleDataManagerCallback(data) {
    const newData = data.join(" ");
    console.log(">>>>> data:", newData);
  }

  if (isRunning) {
    console.log(">>>>> Start DataManagerIST");
    const sensorId = 0;
    DataManagerIST.subscribe(handleDataManagerCallback, sensorId);
    DataManagerIST.setCollectingDataFrequency(activity.frequency);
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
                    data={[
                      { time: 0, value: 0 },
                      { time: 100, value: 2 },
                    ]}
                    widget={activity.widgets[0]}
                    handleSensorChange={handleSensorChange}
                  />
                )}
                {[LAYOUT_NUMBER_CHART, LAYOUT_NUMBER_TABLE].includes(activity.layout) && (
                  <Number value={50} widget={activity.widgets[0]} handleSensorChange={handleSensorChange} />
                )}
              </div>
              <div className="__card __card-right">
                {[LAYOUT_TABLE_CHART, LAYOUT_NUMBER_CHART].includes(activity.layout) && (
                  <LineChart ref={lineChartRef} widget={activity.widgets[1]} handleSensorChange={handleSensorChange} />
                )}
                {activity.layout === LAYOUT_NUMBER_TABLE && (
                  <Table
                    data={[
                      { time: 0, value: 0 },
                      { time: 100, value: 2 },
                    ]}
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
                <LineChart ref={lineChartRef} widget={activity.widgets[0]} handleSensorChange={handleSensorChange} />
              )}
              {activity.layout === LAYOUT_TABLE && (
                <Table
                  data={[
                    { time: 0, value: 0 },
                    { time: 100, value: 2 },
                  ]}
                  widget={activity.widgets[0]}
                  handleSensorChange={handleSensorChange}
                />
              )}
              {activity.layout === LAYOUT_NUMBER && (
                <Number value={50} widget={activity.widgets[0]} handleSensorChange={handleSensorChange} />
              )}
            </div>
          )}
        </div>
        <div className="activity-footer display-flex justify-content-space-between">
          <div className="__toolbar-left">
            <Frequency frequency={activity.frequency} handleFrequencySelect={handleFrequencySelect} />
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
