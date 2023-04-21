import React from "react";
import { Link } from "framework7-react";
import nextImg from "../../../img/activity/next.png";
import prevImg from "../../../img/activity/prev.png";

export default ({ onNextPage, onPrevPage, isDisabled, navOrder }) => {
  return (
    <div className="activity-nav >">
      <Link onClick={onPrevPage} className={`prev ${isDisabled ? "disabled" : ""}`} href="#">
        <img src={prevImg} />
      </Link>
      <div className="order">{navOrder}</div>
      <Link onClick={onNextPage} className={`next ${isDisabled ? "disabled" : ""}`} href="#">
        <img src={nextImg} />
      </Link>
    </div>
  );
};
