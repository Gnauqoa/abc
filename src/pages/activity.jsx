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
import navImg from "../img/activity/nav.png";
import timeImg from "../img/activity/time.png";

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

  function handleRun() {
    console.log("Run...");
  }

  return (
    <Page className="bg-color-regal-blue activity">
      <Navbar>
        <NavLeft>
          <BackButton link="/" />
          <RoundButton icon="add" color="#42C63F" onClick={() => f7router.navigate("/layout")} />
          <RoundButton icon="close" color="#FF0000" onClick={handleActivityDelete} />
        </NavLeft>
        <NavRight>
          <input
            value={activity.name}
            type="text"
            name="name"
            onChange={handleActivityNameChange}
            className="activity-name"
          />
          <RoundButton icon="save" onClick={handleActivitySave} />
          <RoundButton icon="settings" />
        </NavRight>
      </Navbar>
      <div className="full-height display-flex flex-direction-column justify-content-space-between">
        <div className="activity-layout">
          <div className="__card __card-left">Card Left</div>
          <div className="__card __card-right">Card Right</div>
          {/* <div className="__column">Single Column</div> */}
        </div>
        <div className="activity-footer display-flex justify-content-space-between">
          <div className="__toolbar-left">
            <div className="freq">
              <img src={freImg} />
            </div>
          </div>
          <div className="__toolbar-center">
            <div className="navi">
              <img src={navImg} />
            </div>
          </div>
          <div className="__toolbar-right">
            <div class="timer">
              <img src={timeImg} />
            </div>
            <div class="sample">
              <RoundButton className="play" icon="play_arrow" color="#45A3DB" onClick={handleRun} />
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};
