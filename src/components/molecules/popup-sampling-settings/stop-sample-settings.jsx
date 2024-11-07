import React from "react";

import "./sampling-settings.scss";
import { CONDITION, CONDITION_TYPE, SENSOR_NONE_VALUE, TIMER_NO_STOP } from "../../../js/constants";
import PopoverButton from "./popover-button";
import { useTranslation } from "react-i18next";
import { useActivityContext } from "../../../context/ActivityContext";
import SensorSelector from "../popup-sensor-selector";

const StopSampleSettings = ({ stopSampleCondition, onChange }) => {
  const { t } = useTranslation();
  const { isRunning, isDelay, isCheckingSensor } = useActivityContext();
  return (
    <>
      <div className="item">
        <div className="text">{t("modules.stop_condition")}</div>
        <label class="checkbox">
          <input
            type="checkbox"
            onChange={(e) => onChange("active", e.target.checked)}
            checked={stopSampleCondition.active}
          />
          <i class="icon-checkbox"></i>
        </label>
      </div>
      {stopSampleCondition.active && (
        <>
          <div className="sub-item">
            <div className="text">{t("modules.condition_type")}</div>
            <PopoverButton
              name={"stop-conditionType"}
              display={t(`modules.${stopSampleCondition.conditionType}_condition_type`)}
              onChange={(value) => onChange("conditionType", value)}
              options={Object.values(CONDITION_TYPE).map((val) => ({
                display: t(`modules.${val}_condition_type`),
                value: val,
              }))}
            />
          </div>
          {stopSampleCondition.conditionType === CONDITION_TYPE.SENSOR_VALUE ? (
            <>
              <div className="sub-item">
                <div className="text">{t("modules.condition")}</div>
                <PopoverButton
                  name={"stop-condition"}
                  display={t(`modules.${stopSampleCondition.condition}_condition`)}
                  onChange={(value) => onChange("condition", value)}
                  options={Object.values(CONDITION).map((val) => ({
                    display: t(`modules.${val}_condition`),
                    value: val,
                  }))}
                />
              </div>
              <div className="sub-item">
                <div className="text">{`${t("modules.input_value")} (${t("modules.sensor")})`}</div>
                <SensorSelector
                  disabled={isRunning || isDelay || isCheckingSensor}
                  selectedSensor={stopSampleCondition.sensor}
                  onChange={(sensor) => onChange("sensor", sensor)}
                />
              </div>
              <div className="sub-item">
                <div className="text">{`${t("modules.condition_value")}`}</div>
                <input
                  className="input-sampling-time"
                  type="number"
                  value={
                    stopSampleCondition.conditionValue === SENSOR_NONE_VALUE ? "" : stopSampleCondition.conditionValue
                  }
                  onChange={(e) => onChange("conditionValue", e.target.value)}
                />
              </div>
            </>
          ) : stopSampleCondition.conditionType === CONDITION_TYPE.TIME ? (
            <div className="sub-item">
              <div className="text">{`${t("common.time")} (${t("common.second")}):`}</div>
              <input
                className="input-sampling-time"
                type="number"
                // placeholder={timer === TIMER_NO_STOP ? "--" : timer}
                value={stopSampleCondition.timer === TIMER_NO_STOP ? "" : stopSampleCondition.timer}
                onChange={(e) => onChange("timer", e.target.value)}
              />
            </div>
          ) : (
            <></>
          )}
        </>
      )}
    </>
  );
};

export default StopSampleSettings;
