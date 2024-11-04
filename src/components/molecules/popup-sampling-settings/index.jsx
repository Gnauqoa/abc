import React from "react";
import clockFreImg from "../../../img/activity/clock-frequency.png";
import { Popover, List, Button, f7 } from "framework7-react";
import {
  FREQUENCIES,
  SAMPLING_MANUAL_FREQUENCY,
  SAMPLING_MANUAL_NAME,
  FREQUENCY_UNIT,
  INVERSE_FREQUENCY_UNIT,
} from "../../../js/constants";

import "./index.scss";
import usePrompt from "../../../hooks/useModal";
import SamplingSettingPopup from "./sampling-settings";
import { useTranslation } from "react-i18next";

const SamplingSetting = ({
  isRunning,
  frequency,
  startSampleCondition,
  handleStartSampleConditionChange,
  handleStopSampleConditionChange,
  stopSampleCondition,
  handleFrequencySelect,
  timerStopCollecting,
  handleSetTimer,
  handleGetManualSample,
}) => {
  const { t, i18n } = useTranslation();
  const isManualMode = frequency === SAMPLING_MANUAL_FREQUENCY;
  const displayedFrequency = isManualMode
    ? t(SAMPLING_MANUAL_NAME)
    : frequency >= 1
    ? `${t("modules.periodic")} ${frequency} ${t(FREQUENCY_UNIT)}`
    : `${t("modules.periodic")} ${parseInt(1 / frequency)} ${t(INVERSE_FREQUENCY_UNIT)}`;

  const handleGetSampleSettings = (samplingSettings) => {
    try {
      console.log("Sampling-settings: ", samplingSettings);
      const {
        frequency: newFrequency,
        timer: newTimer,
        startSampleCondition: newStartSampleCondition,
        stopSampleCondition: newStopSampleCondition,
      } = samplingSettings;
      if (newFrequency !== frequency) handleFrequencySelect(newFrequency);
      if (newTimer !== timerStopCollecting) handleSetTimer(newTimer);
      if (newStartSampleCondition !== startSampleCondition) handleStartSampleConditionChange(newStartSampleCondition);
      if (newStopSampleCondition !== stopSampleCondition) handleStopSampleConditionChange(newStopSampleCondition);
    } catch (error) {
      console.log("Sampling-settings: ", error);
    }

    f7.popover.close();
  };

  const { prompt, showModal } = usePrompt({
    className: "sampling-settings-popup",
    callbackFn: handleGetSampleSettings,
  });
  const handleOpenSamplingSettings = () => {
    if (!isRunning) {
      showModal((onClose) => (
        <SamplingSettingPopup
          defaultStartSampleCondition={startSampleCondition}
          defaultStopSampleCondition={stopSampleCondition}
          defaultFrequency={frequency}
          defaultTimer={timerStopCollecting}
          onClosePopup={onClose}
        />
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
          {[...FREQUENCIES, SAMPLING_MANUAL_FREQUENCY]
            .sort((x, y) => {
              if (x === 0) return 1; // Đưa x (0) về cuối
              if (y === 0) return -1; // Đưa y (0) về cuối
              return Number.isInteger(y) - Number.isInteger(x) || y - x;
            })
            .map((f) => {
              const displayedFrequency =
                f === SAMPLING_MANUAL_FREQUENCY
                  ? t(SAMPLING_MANUAL_NAME)
                  : f >= 1
                  ? `${f} ${t(FREQUENCY_UNIT)}`
                  : `${parseInt(1 / f)} ${t(INVERSE_FREQUENCY_UNIT)}`;

              return (
                <Button
                  className={`button-frequency ${
                    f === SAMPLING_MANUAL_FREQUENCY || f >= 1 ? "frequency" : "inverse-frequency"
                  }`}
                  key={displayedFrequency}
                  textColor="black"
                  onClick={() => handleGetSampleSettings({ frequency: f, timer: timerStopCollecting })}
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
