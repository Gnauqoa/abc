import React, { useEffect, useState } from "react";
import { Popup, Page, Navbar, Button } from "framework7-react";

import "./index.scss";

const PromptPopup = ({ title, defaultValue, isShow, onClosePopup }) => {
  const [input, setInput] = useState(defaultValue);
  const promptPopupRef = React.useRef(null);

  const onChangeInput = (e) => {
    setInput(e.target.value.trimStart());
  };

  const onClose = (newInput) => {
    onClosePopup(newInput);
    setInput(defaultValue);
  };

  useEffect(() => {
    setInput(defaultValue);
  }, [defaultValue]);

  return (
    <Popup
      ref={promptPopupRef}
      className="use-prompt-dialog-popup"
      opened={isShow}
      onPopupClose={() => onClose(defaultValue)}
    >
      <Page className="use-prompt-dialog">
        <Navbar className="use-prompt-dialog-header" title={title}></Navbar>
        <div className="use-prompt-dialog-content">
          <div className="items">
            <div className="item">
              <div className="text">Chú giải: </div>
              <input type="text" className="input" value={input} onChange={onChangeInput} />
            </div>
          </div>
          <div className="buttons">
            <Button className="cancel-button" onClick={() => onClose(defaultValue)}>
              Bỏ qua
            </Button>
            <Button className="ok-button" onClick={() => onClose(input)}>
              OK
            </Button>
          </div>
        </div>
      </Page>
    </Popup>
  );
};

export default PromptPopup;
