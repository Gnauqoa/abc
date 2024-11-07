import React from "react";

import Timer from "../../atoms/timer";
import RoundButton from "../../atoms/round-button";
import SamplingSetting from "../../molecules/popup-sampling-settings";
import ActivityPageNav from "../../molecules/activity-page-nav";
import { useActivityContext } from "../../../context/ActivityContext";
import DataManagerIST from "../../../services/data-manager";

const ActivityFooter = ({
  handlePageNext,
  handlePagePrev,
  handleFrequencySelect,
  handleGetManualSample,
  handleSampleClick,
}) => {
  const {
    isDelay,
    isRunning,
    isCheckingSensor,
    frequency,
    startSampleCondition,
    stopSampleCondition,
    timerStopCollecting,
    setStartSampleCondition,
    setStopSampleCondition,
    setTimerStopCollecting,
  } = useActivityContext();
  return (
    <div className="activity-footer display-flex justify-content-space-between">
      <div className="__toolbar-left">
        <SamplingSetting
          isRunning={isRunning || isDelay || isCheckingSensor}
          frequency={frequency}
          startSampleCondition={startSampleCondition}
          handleStartSampleConditionChange={setStartSampleCondition}
          stopSampleCondition={stopSampleCondition}
          handleStopSampleConditionChange={setStopSampleCondition}
          handleFrequencySelect={handleFrequencySelect}
          timerStopCollecting={timerStopCollecting}
          handleSetTimer={setTimerStopCollecting}
          handleGetManualSample={handleGetManualSample}
        />
      </div>
      <div className="__toolbar-center">
        <ActivityPageNav onNextPage={handlePageNext} onPrevPage={handlePagePrev} />
      </div>
      <div className="__toolbar-right">
        {isDelay ? <Timer isRunning={isDelay} type={"delayTimer"} /> : <></>}
        {!isDelay ? <Timer isRunning={isRunning} /> : <></>}
        <div className="sample">
          {isRunning || isDelay || isCheckingSensor ? (
            <RoundButton icon="stop" color="#FF0000" onClick={handleSampleClick} />
          ) : (
            <RoundButton icon="play_arrow" color="#45A3DB" onClick={handleSampleClick} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityFooter;
