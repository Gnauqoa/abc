import React from "react";
import { Link, Button } from "framework7-react";
import nextImg from "../../../img/activity/next.png";
import prevImg from "../../../img/activity/prev.png";
import PageManagement from "../../atoms/popover-page-management";

const ActivityPageNav = ({ pageLength, currentPageIndex, isRunning, onNextPage, onPrevPage }) => {
  const prevStatus = isRunning || pageLength === 1 || currentPageIndex === 0;
  const nextStatus = isRunning || pageLength === 1 || currentPageIndex === pageLength - 1;

  return (
    <div className="activity-nav >">
      <Link onClick={onPrevPage} className={`prev ${prevStatus ? "disabled" : ""}`} href="#">
        <img src={prevImg} />
      </Link>
      <Button className="order" popoverOpen=".popover-page-management">{`${currentPageIndex + 1}`}</Button>

      <Link onClick={onNextPage} className={`next ${nextStatus ? "disabled" : ""}`} href="#">
        <img src={nextImg} />
      </Link>
      <PageManagement></PageManagement>
    </div>
  );
};

export default ActivityPageNav;
