import React, { useState, useEffect } from "react";
import moment from "moment";
import DataManagerIST, { TIMER_INTERVAL } from "./../services/data-manager";
export default ({ isRunning }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let id;
    if (isRunning) {
      setCount(0);
      id = setInterval(() => {
        setCount(DataManagerIST.getTimerCollectingTime());
      }, TIMER_INTERVAL);
    } else {
      clearInterval(id);
    }

    return () => clearInterval(id);
  }, [isRunning]);

  return <div className="timer">{moment.utc(count).format("HH:mm:ss.S")}</div>;
};
