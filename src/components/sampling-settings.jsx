import React, { useState } from "react";
import clockFreImg from "../img/activity/clock-frequency.png";
import { Popover, List, Button, f7 } from "framework7-react";
import { FREQUENCIES, SAMPLING_MANUAL_FREQUENCY, SAMPLING_MANUAL_NAME } from "../js/constants";
import DataManagerIST from "../services/data-manager";
import dialog from "./dialog";

export default ({ isRunning, frequency, handleFrequencySelect }) => {
  const isManualMode = frequency === SAMPLING_MANUAL_FREQUENCY;

  const handleGetSampleSettings = (samplingSettings) => {
    try {
      const { frequency, time } = samplingSettings;
      // TODO: Handle time stop and check if it is not valid, notify user
      const timeNumber = Number(time);

      if (frequency === SAMPLING_MANUAL_NAME) {
        handleFrequencySelect(SAMPLING_MANUAL_FREQUENCY);
      } else {
        const frequencyNormalized = String(frequency).replace("HZ", "").trim();
        const frequencyNumber = Number(frequencyNormalized);

        handleFrequencySelect(frequencyNumber);
      }
    } catch (error) {
      console.log("Sampling-settings: ", error);
    }
  };

  const handleOpenSamplingSettings = () => {
    if (!isRunning) {
      dialog.samplingSettings("Tùy chọn lấy mẫu", handleGetSampleSettings);
    }
  };

  const handleManualButtonClick = () => {
    console.log(">>>>> MANUAL - data manager:");
    DataManagerIST.getManualSample();
  };

  const onSelectFrequency = (frequency) => {
    if (frequency === SAMPLING_MANUAL_NAME) {
      handleFrequencySelect(SAMPLING_MANUAL_FREQUENCY);
    } else {
      const frequencyNormalized = String(frequency).replace("HZ", "").trim();
      const frequencyNumber = Number(frequencyNormalized);
      handleFrequencySelect(frequencyNumber);
    }
    f7.popover.close();
  };

  return (
    <div className="frequency">
      <div className={`image ${isRunning ? "disabled" : ""}`} onClick={handleOpenSamplingSettings}>
        <img src={clockFreImg} alt="frequency" />
      </div>

      <Button
        disabled={isRunning}
        className="button"
        textColor="black"
        bgColor="white"
        style={{
          width: "120px",
          height: "44px",
          ...(isManualMode ? { borderRadius: "0px" } : { borderRadius: "0 10px 10px 0" }),
        }}
        raised
        popoverOpen=".popover-frequency"
      >
        {isManualMode ? SAMPLING_MANUAL_NAME : `Định kỳ: ${frequency}Hz`}
      </Button>
      <Popover className="popover-frequency" style={{ borderRadius: "10px", width: "120px" }}>
        <List className="test">
          {[...FREQUENCIES, SAMPLING_MANUAL_FREQUENCY].map((f) => {
            const frequency = f === SAMPLING_MANUAL_FREQUENCY ? SAMPLING_MANUAL_NAME : `${f}HZ`;
            return (
              <Button
                key={frequency}
                textColor="black"
                onClick={() => {
                  onSelectFrequency(frequency);
                }}
              >
                {frequency}
              </Button>
            );
          })}
        </List>
      </Popover>
      {isManualMode && (
        <Button
          disabled={!isRunning}
          onClick={handleManualButtonClick}
          iconIos={"material:done"}
          iconMd={"material:done"}
          iconAurora={"material:done"}
          iconSize={30}
          iconColor="white"
          style={{
            width: "80px",
            height: "44px",
            borderRadius: "0 10px 10px 0",
            ...(isRunning ? { background: "#42C63F" } : { background: "#666666" }),
          }}
        ></Button>
      )}
    </div>
  );
};
