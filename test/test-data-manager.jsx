import DataManagerIST from "../src/services/data-manager";
import React, { useRef, useState } from "react";

function TestDataManager() {
  const inputRef = useRef();
  const sensorIdRef = useRef();
  const [subscriberId, setSubscriberId] = useState(null);
  const [emitValue, setEmitValue] = useState("default");

  const subscribeHandler = () => {
    if (subscriberId) {
      DataManagerIST.unsubscribe(subscriberId);
    }

    let returnedId = DataManagerIST.subscribe(emitFunction, sensorIdRef.current.value);
    if (!returnedId) {
      console.log("cannot subscribe");
    }
    setSubscriberId(returnedId);
  };

  const unsubscribeHandler = () => {
    const isRemoved = DataManagerIST.unsubscribe(subscriberId);
    if (isRemoved) {
      setSubscriberId(null);
      setEmitValue("default");
    }
  };

  const emitFunction = (data) => {
    const newData = data.join(" ");
    setEmitValue(newData);
  };
  return (
    <div style={{ marginLeft: "20px", marginTop: "20px", color: "white" }}>
      <div style={{ marginBottom: "10px" }}>
        SensorId <input style={{ marginBottom: "5px", width: "130px" }} ref={sensorIdRef} />
        <button style={{ width: "100px", height: "50px" }} onClick={subscribeHandler}>
          Subscribe
        </button>
        <button
          style={{ width: "100px", height: "50px" }}
          onClick={() => {
            unsubscribeHandler();
          }}
        >
          Unsubscribe
        </button>
      </div>

      <div style={{ marginBottom: "10px" }}>
        Frequency (HZ) <input style={{ marginBottom: "5px", width: "85px" }} ref={inputRef} />
        <button
          style={{ width: "100px", height: "50px" }}
          onClick={() => {
            DataManagerIST.setCollectingDataFrequency(inputRef.current.value);
          }}
        >
          Set Frequency
        </button>
      </div>

      <div style={{ display: "flex" }}>
        <button
          style={{ width: "100px", height: "50px" }}
          onClick={() => {
            console.log(DataManagerIST.getDataRunData());
          }}
        >
          Test Button
        </button>
        <button
          style={{ width: "100px", height: "50px" }}
          onClick={() => {
            DataManagerIST.startCollectingData();
          }}
        >
          Start
        </button>
      </div>

      <div style={{ marginTop: "10px" }}>
        <text>Emit value: {emitValue}</text>
      </div>
      <div style={{ marginTop: "10px" }}>
        <text>Subscriber Id: {subscriberId}</text>
      </div>
    </div>
  );
}

export default TestDataManager;
