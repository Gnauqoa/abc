import React, { useEffect, useState } from "react";
import { Button, Page, Navbar, Popover, List, f7 } from "framework7-react";
import { useTranslation } from "react-i18next";

import "./sampling-settings.scss";
import {
  CONDITION,
  CONDITION_TYPE,
  FREQUENCIES,
  FREQUENCY_UNIT,
  INVERSE_FREQUENCY_UNIT,
  SAMPLING_MANUAL_FREQUENCY,
  SAMPLING_MANUAL_NAME,
  TIMER_NO_STOP,
} from "../../../js/constants";

const PopoverButton = ({ options, onChange, display, name }) => {
  return (
    <>
      <Button className="open-popover-button" raised popoverOpen={`.popover-${name}-advanced`}>
        <span id={`input-sampling-${name}-data`}>{display}</span>
      </Button>

      <Popover className={`popover-${name}-advanced popover-advanced`}>
        <List className={`popover-list`}>
          {options.map((option) => {
            return (
              <Button
                className={`popover-button ${option.className}`}
                key={option.value}
                textColor="black"
                onClick={() => {
                  onChange(option.value);
                  f7.popover.close();
                }}
              >
                <span style={{ textTransform: "none" }}>{option.display}</span>
              </Button>
            );
          })}
        </List>
      </Popover>
    </>
  );
};

const SamplingSettingPopup = ({
  defaultStartSampleCondition,
  defaultStopSampleCondition,
  defaultFrequency,
  defaultTimer,
  onClosePopup,
}) => {
  const { t, i18n } = useTranslation();
  const [startSampleCondition, setStartSampleCondition] = useState(defaultStartSampleCondition);
  const [stopSampleCondition, setStopSampleCondition] = useState(defaultStopSampleCondition);
  const [frequency, setFrequency] = useState(defaultFrequency);
  const [timer, setTimer] = useState(defaultTimer);

  const onChangeStartCondition = (name, value) => setStartSampleCondition((prev) => ({ ...prev, [name]: value }));
  const onChangeStopCondition = (name, value) => setStopSampleCondition((prev) => ({ ...prev, [name]: value }));

  const onChangeTimer = (e) => {
    const value = e.target.value;
    setTimer(value);
  };

  const onSubmit = () => {
    let parsedTimer = Number(timer);
    const isOffTimer = timer === "" || timer === "--";
    if (isNaN(parsedTimer) && !isOffTimer) {
      f7.dialog.alert(t("modules.time_must_be_a_number"));
      return;
    }

    if (![...FREQUENCIES, SAMPLING_MANUAL_FREQUENCY].includes(frequency)) {
      f7.dialog.alert(t("modules.invalid_cycle"));
      return;
    }

    onClosePopup({ timer: isOffTimer ? TIMER_NO_STOP : parsedTimer, frequency: frequency });
  };

  const onClose = () => {
    onClosePopup({ timer: defaultTimer, frequency: defaultFrequency });
  };

  useEffect(() => {
    setFrequency(defaultFrequency);
  }, [defaultFrequency]);

  return (
    <Page className="sampling-settings">
      <Navbar className="sampling-settings-header" title={t("modules.sampling_options")}></Navbar>
      <div className="sampling-settings-content">
        <div className="items">
          <div className="item">
            <div className="text">{t("modules.cycle")}</div>

            <PopoverButton
              name={"frequency"}
              display={
                frequency === SAMPLING_MANUAL_FREQUENCY
                  ? t(SAMPLING_MANUAL_NAME)
                  : frequency >= 1
                  ? `${frequency} ${t(FREQUENCY_UNIT)}`
                  : `${parseInt(1 / frequency)} ${t(INVERSE_FREQUENCY_UNIT)}`
              }
              onChange={setFrequency}
              options={[...FREQUENCIES, SAMPLING_MANUAL_FREQUENCY]
                .sort((x, y) => {
                  if (x === 0) return 1; // Đưa x (0) về cuối
                  if (y === 0) return -1; // Đưa y (0) về cuối
                  return Number.isInteger(y) - Number.isInteger(x) || y - x;
                })
                .map((f) => ({
                  display:
                    f === SAMPLING_MANUAL_FREQUENCY
                      ? t(SAMPLING_MANUAL_NAME)
                      : f >= 1
                      ? `${f} ${t(FREQUENCY_UNIT)}`
                      : `${parseInt(1 / f)} ${t(INVERSE_FREQUENCY_UNIT)}`,
                  value: f,
                  className: f === SAMPLING_MANUAL_FREQUENCY || f >= 1 ? "frequency" : "inverse-frequency",
                }))}
            />
          </div>

          <div className="item">
            <div className="text">{t("modules.start_condition")}</div>

            <label class="checkbox">
              <input
                type="checkbox"
                checked={startSampleCondition.active}
                onChange={(e) => onChangeStartCondition("active", e.target.checked)}
              />
              <i class="icon-checkbox"></i>
            </label>
          </div>

          {startSampleCondition.active && (
            <>
              <div className="sub-item">
                <div className="text">{t("modules.condition_type")}</div>
                <PopoverButton
                  name={"conditionType"}
                  display={t(`modules.${startSampleCondition.conditionType}_condition_type`)}
                  onChange={(value) => onChangeStartCondition("conditionType", value)}
                  options={Object.values(CONDITION_TYPE).map((val) => ({
                    display: t(`modules.${val}_condition_type`),
                    value: val,
                  }))}
                />
              </div>
              <div className="sub-item">
                {startSampleCondition.conditionType === CONDITION_TYPE.SENSOR_VALUE ? (
                  <>
                    <div className="text">{`${t("modules.input_value")} (${t("modules.sensor")})`}</div>
                  </>
                ) : (
                  <>
                    <div className="text">{`${t("modules.input_value")} (${t("modules.second")})`}</div>
                    <input
                      className="input-sampling-time"
                      type="number"
                      value={
                        startSampleCondition.conditionTime === TIMER_NO_STOP ? "" : startSampleCondition.conditionTime
                      }
                      onChange={(e) => onChangeStartCondition("conditionTime", e.target.value)}
                    />
                  </>
                )}
              </div>
              <div className="sub-item">
                <div className="text">{t("modules.condition")}</div>
                <PopoverButton
                  name={"condition"}
                  display={t(`modules.${startSampleCondition.condition}_condition`)}
                  onChange={(value) => onChangeStartCondition("condition", value)}
                  options={Object.values(CONDITION).map((val) => ({
                    display: t(`modules.${val}_condition`),
                    value: val,
                  }))}
                />
              </div>
              <div className="sub-item">
                <div className="text">{`${t("modules.delay_time")} (${t("common.second")}):`}</div>
                <input
                  className="input-sampling-time"
                  type="number"
                  value={startSampleCondition.delayTime === TIMER_NO_STOP ? "" : startSampleCondition.delayTime}
                  onChange={(e) => onChangeStartCondition("delayTime", e.target.value)}
                />
              </div>
            </>
          )}

          <div className="item">
            <div className="text">{t("modules.stop_condition")}</div>
            <label class="checkbox">
              <input
                type="checkbox"
                onChange={(e) => onChangeStopCondition("active", e.target.checked)}
                checked={startSampleCondition.active}
              />
              <i class="icon-checkbox"></i>
            </label>
          </div>

          <div className="item">
            <div className="text">{`${t("common.time")} (${t("common.second")}):`}</div>
            <input
              className="input-sampling-time"
              type="number"
              // placeholder={timer === TIMER_NO_STOP ? "--" : timer}
              value={timer === TIMER_NO_STOP ? "" : timer}
              onChange={onChangeTimer}
            />
          </div>
        </div>

        <div className="sampling-settings-buttons">
          <Button className="cancel-button" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button className="ok-button" onClick={onSubmit}>
            {t("common.ok")}
          </Button>
        </div>
      </div>
    </Page>
  );
};

export default SamplingSettingPopup;
