import React, { useState, useEffect } from "react";
import moment from "moment";

export default ({ isRunning }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log("Handle Sample Click");

    let id;
    if (isRunning) {
      setCount(0);
      id = setInterval(() => {
        setCount((c) => c + 100);
      }, 100);
    } else {
      clearInterval(id);
    }

    return () => clearInterval(id);
  }, [isRunning]);

  return <div className="timer">{moment.utc(count).format("HH:mm:ss.S")}</div>;
};
