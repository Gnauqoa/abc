import React from "react";
import { Link } from "framework7-react";
import nextImg from "../../../img/activity/next.png";
import prevImg from "../../../img/activity/prev.png";

const ActivityPageNav = ({ pageLength, currentPageIndex, isRunning, onNextPage, onPrevPage }) => {
  const prevStatus = isRunning || pageLength === 1 || currentPageIndex === 0;
  const nextStatus = isRunning || pageLength === 1 || currentPageIndex === pageLength - 1;
  return (
    <div className="activity-nav >">
      <Link onClick={onPrevPage} className={`prev ${prevStatus ? "disabled" : ""}`} href="#">
        <img src={prevImg} />
      </Link>
      <div className="order">{`${currentPageIndex + 1}/${pageLength}`}</div>
      <Link onClick={onNextPage} className={`next ${nextStatus ? "disabled" : ""}`} href="#">
        <img src={nextImg} />
      </Link>
    </div>
  );
};

export default ActivityPageNav;
