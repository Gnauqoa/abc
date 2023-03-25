import React from "react";
import freImg from "../img/activity/freq.png";

export default ({ frequency, handleFrequencySelect }) => {
  return (
    <div className="frequency">
      <img src={freImg} />
    </div>
  );
};
