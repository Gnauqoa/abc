import React, { useEffect, useState } from "react";
import { Button, Page, Navbar, Popover, List, f7 } from "framework7-react";

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
      f7.dialog.alert("Thời gian phải là số");
      return;
    }

    if (![...FREQUENCIES, SAMPLING_MANUAL_FREQUENCY].includes(frequency)) {
      f7.dialog.alert("Chu kỳ không hợp lệ");
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
      <Navbar className="sampling-settings-header" title="Tùy chọn lấy mẫu"></Navbar>
      <div className="sampling-settings-content">
        <div className="items">
          <div className="item">
            <div className="text">Chu kỳ: </div>
            <Button className="select-frequency-button" raised popoverOpen=".popover-frequency-advanced">
              <span id="input-sampling-frequency-data">
                {frequency === SAMPLING_MANUAL_FREQUENCY
                  ? SAMPLING_MANUAL_NAME
                  : frequency >= 1
                  ? `${frequency} ${FREQUENCY_UNIT}`
                  : `${parseInt(1 / frequency)} ${INVERSE_FREQUENCY_UNIT}`}
              </span>
            </Button>
          </div>

          <div className="item">
            <div className="text">Thời gian (giây): </div>
            <input
              className="input-sampling-time"
              type="text"
              // placeholder={timer === TIMER_NO_STOP ? "--" : timer}
              value={timer === TIMER_NO_STOP ? "--" : timer}
              onChange={onChangeTimer}
            />
          </div>
        </div>

        <div className="buttons">
          <Button className="cancel-button" onClick={onClose}>
            Bỏ qua
          </Button>
          <Button className="ok-button" onClick={onSubmit}>
            OK
          </Button>
        </div>
      </div>

      <Popover className="popover-frequency-advanced">
        <List className="list-frequency">
          {[...FREQUENCIES, SAMPLING_MANUAL_FREQUENCY].map((f) => {
            const displayedFrequency =
              f === SAMPLING_MANUAL_FREQUENCY
                ? SAMPLING_MANUAL_NAME
                : f >= 1
                ? `${f} ${FREQUENCY_UNIT}`
                : `${parseInt(1 / f)} ${INVERSE_FREQUENCY_UNIT}`;
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
