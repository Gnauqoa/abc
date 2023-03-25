import React, { useState } from "react";
import { Page, Navbar, NavLeft, NavRight } from "framework7-react";
import { v4 as uuidv4 } from "uuid";

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
import freImg from "../img/activity/freq.png";
import ActivityNav from "../components/activity-nav";
import Timer from "../components/timer";

const MANUAL = "manual";
const activityService = new storeService("activity");

export default ({ f7route, f7router }) => {
  const layout = f7route.params.layout;
  let initActivity;
  if (layout) {
    initActivity = {
      id: uuidv4(),
      name: "",
      layout: layout,
      sampleMode: MANUAL,
    };
  } else {
    const id = f7route.params.id;
    initActivity = activityService.find(id);
    if (!initActivity) {
      f7router.navigate("/");
    }
  }

  const [activity, setActivity] = useState(initActivity);
  const [isRunning, setIsRunning] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

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

  function handleSampleClick() {
    setIsRunning(!isRunning);
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
              <div className="__card __card-left">Card Left</div>
              <div className="__card __card-right">Card Right</div>
            </>
          )}
          {[LAYOUT_CHART, LAYOUT_TABLE, LAYOUT_NUMBER].includes(activity.layout) && (
            <div className="__card">Single Card</div>
          )}
        </div>
        <div className="activity-footer display-flex justify-content-space-between">
          <div className="__toolbar-left">
            <div className="freq">
              <img src={freImg} />
            </div>
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
