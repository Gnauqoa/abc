import React from "react";

import "./sampling-settings.scss";
import { CONDITION, CONDITION_TYPE, SENSOR_NONE_VALUE, TIMER_NO_STOP } from "../../../js/constants";
import PopoverButton from "./popover-button";
import { useTranslation } from "react-i18next";
import { useActivityContext } from "../../../context/ActivityContext";
import SensorSelector from "../popup-sensor-selector";
import { ListInput } from "framework7-react";

const StopSampleSettings = ({ stopSampleCondition, onChange }) => {
  const { t } = useTranslation();
  const { isRunning, isDelay, isCheckingSensor } = useActivityContext();
  return (
    <>
      <div className="item">
        <div className="text item-first">{t("modules.stop_condition")}:</div>
        <div className="item-second">
          <label class="checkbox">
            <input
              type="checkbox"
              checked={stopSampleCondition.active}
              onChange={(e) => onChange("active", e.target.checked)}
            />
            <i class="icon-checkbox"></i>
          </label>
        </div>
      </div>

      {stopSampleCondition.active && (
        <div className="sub-item-list">
          <PopoverButton
            label={`${t("modules.condition_type")}:`}
            name={"stop-conditionType"}
            display={t(`modules.${stopSampleCondition.conditionType}_condition_type`)}
            onChange={(value) => onChange("conditionType", value)}
            options={Object.values(CONDITION_TYPE).map((val) => ({
              display: t(`modules.${val}_condition_type`),
              value: val,
            }))}
          />

          {stopSampleCondition.conditionType === CONDITION_TYPE.SENSOR_VALUE ? (
            <>
              <PopoverButton
                name={"stop-condition"}
                label={`${t("modules.condition")}:`}
                display={t(`modules.${stopSampleCondition.condition}_condition`)}
                onChange={(value) => onChange("condition", value)}
                options={Object.values(CONDITION).map((val) => ({
                  display: t(`modules.${val}_condition`),
                  value: val,
                }))}
              />

              <div className="sub-item">
                <div className="text item-first">{`${t("modules.input_value")} (${t("modules.sensor")}):`}</div>
                <div className="item-second">
                  <SensorSelector
                    disabled={isRunning || isDelay || isCheckingSensor}
                    selectedSensor={stopSampleCondition.sensor}
                    onChange={(sensor) => onChange("sensor", sensor)}
                  />
                </div>
              </div>

              <ListInput
                className="display-setting-input label-color-black"
                outline
                size={5}
                name="stopSampleCdt.cdtValue"
                label={`${t("modules.condition_value")}:`}
                type="text"
                value={
                  stopSampleCondition.conditionValue === SENSOR_NONE_VALUE ? "" : stopSampleCondition.conditionValue
                }
                onChange={(e) => onChange("conditionValue", e.target.value)}
              />
            </>
          ) : stopSampleCondition.conditionType === CONDITION_TYPE.TIME ? (
            <ListInput
              className="display-setting-input label-color-black"
              outline
              size={5}
              name="stopSampleCdt.timer"
              label={`${t("common.time")} (${t("common.second")}):`}
              type="text"
              value={stopSampleCondition.timer === TIMER_NO_STOP ? "" : stopSampleCondition.timer}
              onChange={(e) => onChange("timer", e.target.value)}
            />
          ) : (
            <></>
          )}
        </div>
      )}
    </>
  );
};

export default StopSampleSettings;
