import React, { useEffect, useState } from "react";
import { Popup, Page, Navbar, Button } from "framework7-react";
import { useTranslation } from "react-i18next";
import { f7 } from "framework7-react";

import "./index.scss";

const PromptPopup = ({ title, inputLabel, defaultValue, onClosePopup, extraData }) => {
  const { t, i18n } = useTranslation();
  const [input, setInput] = useState(defaultValue);

  const onChangeInput = (e) => {
    setInput(e.target.value.trimStart());
  };

  const onClose = (newInput) => {
    onClosePopup({ newInput, extraData });
    // setInput(defaultValue);
  };

  useEffect(() => {
    setInput(defaultValue);
  }, [defaultValue]);

  return (
    <Page className="use-prompt-dialog">
      <Navbar
        className="use-prompt-dialog-header"
        style={{ height: f7.device.android ? undefined : "25%" }}
        title={title}
      ></Navbar>
      <div className="use-prompt-dialog-content">
        <div className="items">
          <div className="item">
            <div className="text">{inputLabel}: </div>
            <input type="text" className="input" value={input} onChange={onChangeInput} />
          </div>
        </div>
        <div className="buttons">
          <Button className="cancel-button" onClick={() => onClose(defaultValue)}>
            {t("common.cancel")}
          </Button>
          <Button className="ok-button" onClick={() => onClose(input)}>
            {t("common.ok")}
          </Button>
        </div>
      </div>
    </Page>
  );
};

export default PromptPopup;
