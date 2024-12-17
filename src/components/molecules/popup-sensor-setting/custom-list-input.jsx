import React from "react";
import { Button, Icon, Popover, List } from "framework7-react";

import "./index.scss";
const CustomDropdownInput = ({ disabled, labelName, buttonName, children, popOverName }) => {
  return (
    <div className="display-setting-input label-color-black input-color-blue">
      <div className="item-content item-input item-input-outline item-input-with-value">
        <div className="item-inner">
          <div className="item-title item-label">{labelName}</div>

          <div className="item-input-wrap">
            <Button
              disabled={disabled}
              className="button"
              textColor="black"
              bgColor="white"
              text={buttonName}
              popoverOpen={`.${popOverName}`}
            >
              <Icon material="arrow_drop_down" size={36}></Icon>
            </Button>
            <Popover className={`popover-choose-sensor-unit ${popOverName}`}>
              <List className="list-frequency">{children}</List>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomDropdownInput;
