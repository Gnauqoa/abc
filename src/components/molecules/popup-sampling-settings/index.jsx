import React from "react";
import clockFreImg from "../../../img/activity/clock-frequency.png";
import { Popover, List, Button, f7 } from "framework7-react";
import {
  FREQUENCIES,
  SAMPLING_MANUAL_FREQUENCY,
  SAMPLING_MANUAL_NAME,
  TIMER_NO_STOP,
  FREQUENCY_UNIT,
  INVERSE_FREQUENCY_UNIT,
} from "../../../js/constants";

import "./index.scss";
import usePrompt from "../../../hooks/useModal";
import SamplingSettingPopup from "./sampling-settings";

const SamplingSetting = ({
  isRunning,
  frequency,
  handleFrequencySelect,
  timerStopCollecting,
  handleSetTimerInMs,
  handleGetManualSample,
}) => {
  const isManualMode = frequency === SAMPLING_MANUAL_FREQUENCY;
  const displayedFrequency = isManualMode
    ? SAMPLING_MANUAL_NAME
    : frequency >= 1
    ? `Định kỳ: ${frequency} ${FREQUENCY_UNIT}`
    : `Định kỳ: ${parseInt(1 / frequency)} ${INVERSE_FREQUENCY_UNIT}`;

  const handleGetSampleSettings = (samplingSettings) => {
    try {
      const { frequency: newFrequency, timer: newTimer } = samplingSettings;
      if (newFrequency !== frequency) handleFrequencySelect(newFrequency);
      if (newTimer !== timerStopCollecting) handleSetTimerInMs(newTimer);
    } catch (error) {
      console.log("Sampling-settings: ", error);
    }

    f7.popover.close();
  };

  const { prompt, showModal } = usePrompt({ callbackFn: handleGetSampleSettings });
  const handleOpenSamplingSettings = () => {
    if (!isRunning) {
      showModal((onClose) => (
        <SamplingSettingPopup defaultFrequency={frequency} defaultTimer={timerStopCollecting} onClosePopup={onClose} />
      ));
    }
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
          ...(isManualMode ? { borderRadius: "0px" } : { borderRadius: "0 10px 10px 0" }),
        }}
        raised
        popoverOpen=".popover-frequency"
      >
        {displayedFrequency}
      </Button>
      <Popover className="popover-frequency">
        <List className="list-frequency">
          {[...FREQUENCIES, SAMPLING_MANUAL_FREQUENCY].map((f) => {
            const displayedFrequency =
              f === SAMPLING_MANUAL_FREQUENCY
                ? SAMPLING_MANUAL_NAME
                : f >= 1
                ? `${f} ${FREQUENCY_UNIT}`
                : `${parseInt(1 / f)} ${INVERSE_FREQUENCY_UNIT}`;

            return (
              <Button
                className={`button-frequency ${
                  f === SAMPLING_MANUAL_FREQUENCY || f >= 1 ? "frequency" : "inverse-frequency"
                }`}
                key={displayedFrequency}
                textColor="black"
                onClick={() => handleFrequencySelect(f)}
              >
                <span style={{ textTransform: "none" }}>{displayedFrequency}</span>
              </Button>
            );
          })}
        </List>
      </Popover>
      {isManualMode && (
        <Button
          id="samplingManualButton"
          disabled={!isRunning}
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
          onClick={handleGetManualSample}
        ></Button>
      )}
      {prompt}
    </div>
  );
};

export default SamplingSetting;
