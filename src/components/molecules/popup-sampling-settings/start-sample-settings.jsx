import React, { useState } from "react";

import "./sampling-settings.scss";
import { CONDITION, CONDITION_TYPE, SENSOR_NONE_VALUE, TIMER_NO_STOP } from "../../../js/constants";
import PopoverButton from "./popover-button";
import { useTranslation } from "react-i18next";
import SensorSelector from "../popup-sensor-selector";
import { useActivityContext } from "../../../context/ActivityContext";

const StartSampleSettings = ({ startSampleCondition, onChange }) => {
  const { t } = useTranslation();
  const { isRunning, isDelay, isCheckingSensor } = useActivityContext();

  return (
    <>
      <div className="item">
        <div className="text">{t("modules.start_condition")}</div>
        <label class="checkbox">
          <input
            type="checkbox"
            checked={startSampleCondition.active}
            onChange={(e) => onChange("active", e.target.checked)}
          />
          <i class="icon-checkbox"></i>
        </label>
      </div>
      {startSampleCondition.active && (
        <>
          <div className="sub-item">
            <div className="text">{t("modules.condition_type")}</div>
            <PopoverButton
              name={"start-conditionType"}
              display={t(`modules.${startSampleCondition.conditionType}_condition_type`)}
              onChange={(value) => onChange("conditionType", value)}
              options={Object.values(CONDITION_TYPE)
                .filter((val) => val !== CONDITION_TYPE.TIME)
                .map((val) => ({
                  display: t(`modules.${val}_condition_type`),
                  value: val,
                }))}
            />
          </div>
          {startSampleCondition.conditionType === CONDITION_TYPE.SENSOR_VALUE ? (
            <>
              <div className="sub-item">
                <div className="text">{`${t("modules.input_value")} (${t("modules.sensor")})`}</div>
                <SensorSelector
                  disabled={isRunning || isDelay || isCheckingSensor}
                  selectedSensor={startSampleCondition.sensor}
                  onChange={(sensor) => onChange("sensor", sensor)}
                />
              </div>

              <div className="sub-item">
                <div className="text">{t("modules.condition")}</div>
                <PopoverButton
                  name={"start-condition"}
                  display={t(`modules.${startSampleCondition.condition}_condition`)}
                  onChange={(value) => onChange("condition", value)}
                  options={Object.values(CONDITION).map((val) => ({
                    display: t(`modules.${val}_condition`),
                    value: val,
                  }))}
                />
              </div>
              <div className="sub-item">
                <div className="text">{`${t("modules.condition_value")}`}</div>
                <input
                  className="input-sampling-time"
                  type="number"
                  value={
                    startSampleCondition.conditionValue === SENSOR_NONE_VALUE ? "" : startSampleCondition.conditionValue
                  }
                  onChange={(e) => onChange("conditionValue", e.target.value)}
                />
              </div>
            </>
          ) : startSampleCondition.conditionType === CONDITION_TYPE.TIME ? (
            <>
              <div className="sub-item">
                <div className="text">{`${t("modules.input_value")} (${t("common.second")})`}</div>
                <input
                  className="input-sampling-time"
                  type="number"
                  value={startSampleCondition.conditionTime === TIMER_NO_STOP ? "" : startSampleCondition.conditionTime}
                  onChange={(e) => onChange("conditionTime", e.target.value)}
                />
              </div>
            </>
          ) : (
            <></>
          )}

          <div className="sub-item">
            <div className="text">{`${t("modules.delay_time")} (${t("common.second")}):`}</div>
            <input
              className="input-sampling-time"
              type="number"
              value={startSampleCondition.delayTime === TIMER_NO_STOP ? "" : startSampleCondition.delayTime}
              onChange={(e) => onChange("delayTime", e.target.value)}
            />
          </div>
        </>
      )}
    </>
  );
};

export default StartSampleSettings;
