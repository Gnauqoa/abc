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
    setTimer(e.target.value.trimStart());
  };

  const onChangeFrequency = (frequency) => {
    setFrequency(frequency);
  };

  const onSubmit = () => {
    let parsedTimer = Number(timer);
    if (isNaN(parsedTimer)) {
      f7.dialog.alert("Thời gian phải là số");
      onClosePopup({ timer: defaultTimer, frequency: defaultFrequency });
      return;
    }

    if (![...FREQUENCIES, SAMPLING_MANUAL_FREQUENCY].includes(frequency)) {
      f7.dialog.alert("Chu kỳ không hợp lệ");
      onClosePopup({ timer: defaultTimer, frequency: defaultFrequency });
      return;
    }

    onClosePopup({ timer: parsedTimer <= 0 ? TIMER_NO_STOP : parsedTimer * 1000, frequency: frequency });
  };

  const onClose = () => {
    onClosePopup({ timer: defaultTimer, frequency: defaultFrequency });
  };

  useEffect(() => {
    setFrequency(defaultFrequency);
  }, [defaultFrequency]);

  return (
    <Page className="use-prompt-dialog">
      <Navbar className="use-prompt-dialog-header" title="Tùy chọn lấy mẫu"></Navbar>
      <div className="use-prompt-dialog-content">
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
              placeholder={timer === TIMER_NO_STOP ? "--" : timer / 1000}
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
        <List className="test">
          {[...FREQUENCIES, SAMPLING_MANUAL_FREQUENCY].map((f) => {
            const displayedFrequency =
              f === SAMPLING_MANUAL_FREQUENCY
                ? SAMPLING_MANUAL_NAME
                : f >= 1
                ? `${f} ${FREQUENCY_UNIT}`
                : `${parseInt(1 / f)} ${INVERSE_FREQUENCY_UNIT}`;
            return (
              <Button
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
