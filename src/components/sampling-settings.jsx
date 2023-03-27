import React, { useState } from "react";
import clockFreImg from "../img/activity/clock-frequency.png";
import { Popover, List, Button, f7 } from "framework7-react";
import { FREQUENCIES, SAMPLING_MANUAL } from "../js/constants";
import dialog from "./dialog";

export default ({ frequency, handleFrequencySelect }) => {
  const handleGetSampleSettings = (samplingSettings) => {
    try {
      const { frequency, time } = samplingSettings;
      // TODO: Handle time stop and check if it is not valid, notify user
      const timeNumber = Number(time);
      if (frequency === SAMPLING_MANUAL) {
        // TODO: Handle sampling manual
        console.log("Sampling-settings: Set Sampling Manual");
      } else {
        const frequencyNormalized = String(frequency).replace("HZ", "").trim();
        const frequencyNumber = Number(frequencyNormalized);
        handleFrequencySelect(frequencyNumber);
      }
      console.log("samplingSettings: ", samplingSettings);
    } catch (error) {
      console.log("Sampling-settings: ", error);
    }
  };

  const handleOpenSamplingSettings = () => {
    dialog.samplingSettings("Tùy chọn lấy mẫu", handleGetSampleSettings);
  };

  const onSelectFrequency = (frequency) => {
    handleFrequencySelect(frequency);
    f7.popover.close();
  };

  return (
    <div className="frequency">
      <div className="image" onClick={handleOpenSamplingSettings}>
        <img src={clockFreImg} alt="frequency" />
      </div>

      <Button
        className="button"
        textColor="black"
        bgColor="white"
        style={{ minWidth: "250", height: "44px", borderRadius: "0 10px 10px 0" }}
        raised
        popoverOpen=".popover-frequency"
      >
        Định kỳ: {frequency}Hz
      </Button>

      <Popover className="popover-frequency" style={{ borderRadius: "10px", width: "120px" }}>
        <List className="test">
          {FREQUENCIES.map((frequency) => (
            <Button
              key={frequency}
              textColor="black"
              onClick={() => {
                onSelectFrequency(frequency);
              }}
            >
              {frequency}HZ
            </Button>
          ))}
        </List>
      </Popover>
    </div>
  );
};
