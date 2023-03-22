import React, { useState } from "react";
import { Page, Navbar, Button, NavLeft, NavRight } from "framework7-react";
import { v4 as uuidv4 } from "uuid";

import BackButton from "../components/back-button";
import RoundButton from "../components/round-button";
import dialog from "../components/dialog";
import storeService from "../services/store-service";

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
      f7router.navigate("/", { reloadDetail: true });
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
    activityService.delete(activity.id);
    f7router.navigate("/", { reloadDetail: true });
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
    <Page className="bg-color-regal-blue">
      <Navbar className="custom-dashboards-navbar">
        <NavLeft>
          <BackButton link="/layout" />
          <RoundButton
            icon="add"
            color="#42C63F"
            onClick={() => f7router.navigate("/layout", { reloadDetail: true })}
          />
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
      <div className="page-content display-flex justify-content-center align-items-center">
        <RoundButton icon="play_arrow" color="#45A3DB" onClick={handleRun} />
      </div>
    </Page>
  );
};
