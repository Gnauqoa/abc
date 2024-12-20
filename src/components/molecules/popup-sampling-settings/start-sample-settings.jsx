import React, { useState } from "react";

import "./sampling-settings.scss";
import { CONDITION, CONDITION_TYPE, SENSOR_NONE_VALUE, TIMER_NO_STOP } from "../../../js/constants";
import PopoverButton from "./popover-button";
import { useTranslation } from "react-i18next";
import SensorSelector from "../popup-sensor-selector";
import { useActivityContext } from "../../../context/ActivityContext";
import { ListInput } from "framework7-react";

const StartSampleSettings = ({ startSampleCondition, onChange }) => {
  const { t } = useTranslation();
  const { isRunning } = useActivityContext();

  return (
    <>
      <div className="item">
        <div className="text item-first">{t("modules.start_condition")}:</div>
        <div className="item-second">
          <label class="checkbox">
            <input
              type="checkbox"
              checked={startSampleCondition.active}
              onChange={(e) => onChange("active", e.target.checked)}
            />
            <i class="icon-checkbox"></i>
          </label>
        </div>
      </div>
      {startSampleCondition.active && (
        <div className="sub-item-list">
          <PopoverButton
            label={`${t("modules.condition_type")}:`}
            name={"start-conditionType"}
            display={`${t(`modules.${startSampleCondition.conditionType}_condition_type`)}`}
            onChange={(value) => onChange("conditionType", value)}
            options={Object.values(CONDITION_TYPE)
              .filter((val) => val !== CONDITION_TYPE.TIME)
              .map((val) => ({
                display: t(`modules.${val}_condition_type`),
                value: val,
              }))}
          />

          {startSampleCondition.conditionType === CONDITION_TYPE.SENSOR_VALUE ? (
            <>
              <div className="sub-item">
                <div className="text item-first">{`${t("modules.input_value")} (${t("modules.sensor")}):`}</div>
                <div className="item-second">
                  <SensorSelector
                    disabled={isRunning}
                    selectedSensor={startSampleCondition.sensor}
                    onChange={(sensor) => onChange("sensor", sensor)}
                  />
                </div>
              </div>

              <PopoverButton
                label={`${t("modules.condition")}:`}
                name={"start-condition"}
                display={`${t(`modules.${startSampleCondition.condition}_condition`)}`}
                onChange={(value) => onChange("condition", value)}
                options={Object.values(CONDITION).map((val) => ({
                  display: t(`modules.${val}_condition`),
                  value: val,
                }))}
              />

              <ListInput
                className="display-setting-input label-color-black"
                outline
                size={5}
                name="startSampleCdt.cdtValue"
                label={`${t("modules.condition_value")}:`}
                type="number"
                value={startSampleCondition.conditionValue}
                onChange={(e) => onChange("conditionValue", e.target.value)}
              />
            </>
          ) : (
            <></>
          )}

          <ListInput
            className="display-setting-input label-color-black"
            outline
            size={5}
            name="startSampleCdt.delayTime"
            label={`${t("modules.delay_time")} (${t("common.second")}):`}
            type="number"
            value={startSampleCondition.delayTime === TIMER_NO_STOP ? "" : startSampleCondition.delayTime}
            onChange={(e) => onChange("delayTime", e.target.value)}
          ></ListInput>
        </div>
      )}
    </>
  );
};

export default StartSampleSettings;
