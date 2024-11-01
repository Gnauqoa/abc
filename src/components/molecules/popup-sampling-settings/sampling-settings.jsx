import React, { useEffect, useState } from "react";
import { Button, Page, Navbar, Popover, List, f7 } from "framework7-react";
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

const SamplingSettingPopup = ({ defaultFrequency, defaultTimer, onClosePopup }) => {
  const { t, i18n } = useTranslation();

  const [frequency, setFrequency] = useState(defaultFrequency);
  const [timer, setTimer] = useState(defaultTimer);

  const onChangeTimer = (e) => {
    const value = e.target.value;
    setTimer(value);
  };

  const onChangeFrequency = (frequency) => {
    setFrequency(frequency);
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
            <Button className="select-frequency-button" raised popoverOpen=".popover-frequency-advanced">
              <span id="input-sampling-frequency-data">
                {frequency === SAMPLING_MANUAL_FREQUENCY
                  ? t(SAMPLING_MANUAL_NAME)
                  : frequency >= 1
                  ? `${frequency} ${t(FREQUENCY_UNIT)}`
                  : `${parseInt(1 / frequency)} ${t(INVERSE_FREQUENCY_UNIT)}`}
              </span>
            </Button>
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

      <Popover className="popover-frequency-advanced">
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
                  key={f}
                  textColor="black"
                  onClick={() => {
                    onChangeFrequency(f);
                    f7.popover.close();
                  }}
                >
                  <span style={{ textTransform: "none" }}>{displayedFrequency}</span>
                </Button>
              );
            })}
        </List>
      </Popover>
    </Page>
  );
};

export default SamplingSettingPopup;
