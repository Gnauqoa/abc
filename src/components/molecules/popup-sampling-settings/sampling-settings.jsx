import React, { useEffect, useState } from "react";
import { Button, Page, Navbar, f7, NavLeft, NavTitle, List } from "framework7-react";
import { useTranslation } from "react-i18next";

import "./sampling-settings.scss";
import {
  FREQUENCIES,
  FREQUENCY_UNIT,
  INVERSE_FREQUENCY_UNIT,
  SAMPLING_MANUAL_FREQUENCY,
  SAMPLING_MANUAL_NAME,
  TIMER_NO_STOP,
} from "../../../js/constants";
import StartSampleSettings from "./start-sample-settings";
import StopSampleSettings from "./stop-sample-settings";
import PopoverButton from "./popover-button";

const SamplingSettingPopup = ({
  defaultStartSampleCondition,
  defaultStopSampleCondition,
  defaultFrequency,
  defaultTimer,
  onClosePopup,
}) => {
  const { t, i18n } = useTranslation();
  const [startSampleCondition, setStartSampleCondition] = useState(defaultStartSampleCondition);
  const [stopSampleCondition, setStopSampleCondition] = useState({
    ...defaultStopSampleCondition,
    timer: defaultTimer,
  });
  const [frequency, setFrequency] = useState(defaultFrequency);

  const onChangeStartCondition = (name, value) => setStartSampleCondition((prev) => ({ ...prev, [name]: value }));
  const onChangeStopCondition = (name, value) => setStopSampleCondition((prev) => ({ ...prev, [name]: value }));

  const onSubmit = () => {
    let parsedTimer = Number(stopSampleCondition.timer);
    const isOffTimer = stopSampleCondition.timer === "" || stopSampleCondition.timer === "--";
    if (isNaN(parsedTimer) && !isOffTimer) {
      f7.dialog.alert(t("modules.time_must_be_a_number"));
      return;
    }

    if (![...FREQUENCIES, SAMPLING_MANUAL_FREQUENCY].includes(frequency)) {
      f7.dialog.alert(t("modules.invalid_cycle"));
      return;
    }

    onClosePopup({
      startSampleCondition,
      stopSampleCondition,
      timer: isOffTimer ? TIMER_NO_STOP : parsedTimer,
      frequency: frequency,
    });
  };

  const onClose = () => {
    onClosePopup({
      timer: defaultTimer,
      frequency: defaultFrequency,
      startSampleCondition: defaultStartSampleCondition,
      stopSampleCondition: defaultStopSampleCondition,
    });
  };

  useEffect(() => {
    setFrequency(defaultFrequency);
    setStartSampleCondition(defaultStartSampleCondition);
    setStopSampleCondition({ ...defaultStopSampleCondition, timer: defaultTimer });
  }, [defaultFrequency, defaultTimer, defaultStartSampleCondition, defaultStopSampleCondition]);

  return (
    <Page className="sampling-settings">
      <Navbar className="sampling-settings-header">
        <NavLeft>
          <Button
            iconIos="material:arrow_back"
            iconMd="material:arrow_back"
            iconAurora="material:arrow_back"
            className="back-icon margin-right"
            popupClose
          ></Button>
        </NavLeft>
        <NavTitle style={{ color: "#0086ff" }}>{t("modules.sampling_options")}</NavTitle>
      </Navbar>
      <div className="__content">
        <div className="__setting-content">
          <List className="__setting" form noHairlinesMd inlineLabels>
            <PopoverButton
              label={t("modules.cycle")}
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
            <StartSampleSettings onChange={onChangeStartCondition} startSampleCondition={startSampleCondition} />
            <StopSampleSettings onChange={onChangeStopCondition} stopSampleCondition={stopSampleCondition} />
          </List>

          <div className="sampling-settings-buttons">
            <Button className="cancel-button" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button className="ok-button" onClick={onSubmit}>
              {t("common.ok")}
            </Button>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default SamplingSettingPopup;
