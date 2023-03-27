import React from "react";
import { Link } from "framework7-react";
import nextImg from "../img/activity/next.png";
import prevImg from "../img/activity/prev.png";
import storeService from "../services/store-service";

const activityService = new storeService("activity");

export default ({ currentId, isRunning }) => {
  const order = activityService.findOrder(currentId);
  const isDisableNav = order === "1/1" || isRunning;

  return (
    <div className="activity-nav >">
      <Link className={`prev ${isDisableNav ? "disabled" : ""}`} href={`/edl/${activityService.findPrevId(currentId)}`}>
        <img src={prevImg} />
      </Link>
      <div className="order">{order}</div>
      <Link className={`next ${isDisableNav ? "disabled" : ""}`} href={`/edl/${activityService.findNextId(currentId)}`}>
        <img src={nextImg} />
      </Link>
    </div>
  );
};
