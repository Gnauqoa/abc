import React, { useState, useEffect } from "react";
import moment from "moment";
import DataManagerIST from "../../../services/data-manager";
import { TIMER_INTERVAL } from "../../../js/constants";

const Timer = ({ isRunning }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let id;
    if (isRunning) {
      setCount(0);
      id = setInterval(() => {
        setCount(DataManagerIST.getTimerCollectingTime());
      }, TIMER_INTERVAL);
    } else {
      setCount(DataManagerIST.getTimerCollectingTime());
      clearInterval(id);
    }

    return () => clearInterval(id);
  }, [isRunning]);

  return <div className="timer">{moment.utc(count).format("HH:mm:ss.S")}</div>;
};

export default Timer;
