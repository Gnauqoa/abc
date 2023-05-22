import React from "react";

import Timer from "../../atoms/timer";
import RoundButton from "../../atoms/round-button";
import SamplingSetting from "../../molecules/popup-sampling-settings";
import ActivityPageNav from "../../molecules/activity-page-nav";
import { useActivityContext } from "../../../context/ActivityContext";

const ActivityFooter = ({
  handlePageNext,
  handlePagePrev,
  handleFrequencySelect,
  handleGetManualSample,
  handleSampleClick,
}) => {
  const { isRunning, frequency, timerStopCollecting, setTimerStopCollecting } = useActivityContext();
  return (
    <div className="activity-footer display-flex justify-content-space-between">
      <div className="__toolbar-left">
        <SamplingSetting
          isRunning={isRunning}
          frequency={frequency}
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
        <Timer isRunning={isRunning} />
        <div className="sample">
          {isRunning ? (
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
