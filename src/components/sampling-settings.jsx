import React, { useState } from "react";
import clockFreImg from "../img/activity/clock-frequency.png";
import { Popover, List, Button, f7 } from "framework7-react";
import { FREQUENCIES, SAMPLING_MANUAL, SAMPLING_AUTO } from "../js/constants";
import dialog from "./dialog";

export default ({ isRunning, frequency, handleSamplingManual, handleFrequencySelect, handleChangeSamplingMode }) => {
  const [isManualMode, setIsManualMode] = useState(false);

  const setModeSamplingAuto = (frequency) => {
    setIsManualMode(false);
    handleFrequencySelect(frequency);
    handleChangeSamplingMode(SAMPLING_AUTO);
  };

  const setModeSamplingManual = () => {
    setIsManualMode(true);
    handleChangeSamplingMode(SAMPLING_MANUAL);
  };

  const handleGetSampleSettings = (samplingSettings) => {
    try {
      const { frequency, time } = samplingSettings;
      // TODO: Handle time stop and check if it is not valid, notify user
      const timeNumber = Number(time);

      if (frequency === SAMPLING_MANUAL) {
        setModeSamplingManual();
      } else {
        const frequencyNormalized = String(frequency).replace("HZ", "").trim();
        const frequencyNumber = Number(frequencyNormalized);

        setModeSamplingAuto(frequencyNumber);
      }
    } catch (error) {
      console.log("Sampling-settings: ", error);
    }
  };

  const handleOpenSamplingSettings = () => {
    if (isRunning) return;
    dialog.samplingSettings("Tùy chọn lấy mẫu", handleGetSampleSettings);
  };

  const onSelectFrequency = (frequency) => {
    setModeSamplingAuto(frequency);
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
        style={{
          width: "120px",
          height: "44px",
          ...(isManualMode ? { borderRadius: "0px" } : { borderRadius: "0 10px 10px 0" }),
        }}
        raised
        popoverOpen=".popover-frequency"
      >
        {isManualMode ? SAMPLING_MANUAL : `Định kỳ: ${frequency}Hz`}
      </Button>

      {isManualMode && (
        <Button
          disabled={!isRunning}
          onClick={() => {
            handleSamplingManual();
          }}
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
