import React from "react";
import { Link } from "framework7-react";
import nextImg from "../img/activity/next.png";
import prevImg from "../img/activity/prev.png";
import storeService from "../services/store-service";

const activityService = new storeService("activity");

export default ({ currentId }) => {
  const order = activityService.findOrder(currentId);
  return (
    <div className="activity-nav">
      <Link disabled={order === "1/1"} className="prev" href={`/edl/${activityService.findPrevId(currentId)}`}>
        <img src={prevImg} />
      </Link>
      <div className="order">{order}</div>
      <Link disabled={order === "1/1"} className="next" href={`/edl/${activityService.findNextId(currentId)}`}>
        <img src={nextImg} />
      </Link>
    </div>
  );
};
