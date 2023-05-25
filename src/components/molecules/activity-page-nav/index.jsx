import React from "react";
import { Link, Button } from "framework7-react";
import nextImg from "../../../img/activity/next.png";
import prevImg from "../../../img/activity/prev.png";
import PageManagement from "../../atoms/popover-page-management";
import { useActivityContext } from "../../../context/ActivityContext";

const ActivityPageNav = ({ onNextPage, onPrevPage }) => {
  const { pages, currentPageIndex, isRunning } = useActivityContext();
  const prevStatus = isRunning || pages.length === 1 || currentPageIndex === 0;
  const nextStatus = isRunning || pages.length === 1 || currentPageIndex === pages.length - 1;

  return (
    <div className="activity-nav >">
      <Link onClick={onPrevPage} className={`prev ${prevStatus ? "disabled" : ""}`} href="#">
        <img src={prevImg} />
      </Link>
      <Button className="order" popoverOpen=".popover-page-management">
        {pages[currentPageIndex]?.name}
      </Button>

      <Link onClick={onNextPage} className={`next ${nextStatus ? "disabled" : ""}`} href="#">
        <img src={nextImg} />
      </Link>
      <PageManagement></PageManagement>
    </div>
  );
};

export default ActivityPageNav;
