import React from "react";
import { Button, Popover, List, f7 } from "framework7-react";

import "./sampling-settings.scss";
import CustomDropdownInput from "../popup-sensor-setting/custom-list-input";

const PopoverButton = ({ options, onChange, display, label, name, disabled }) => {
  return (
    <CustomDropdownInput
      disabled={disabled}
      labelName={label}
      buttonName={display}
      popOverName={`sample-setting-popover-${name}`}
    >
      <div className="popover-content">
        {options.map((option) => {
          return (
            <Button
              disabled={disabled}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                f7.popover.close();
              }}
            >
              <span style={{ textTransform: "none" }}>{option.display}</span>
            </Button>
          );
        })}
      </div>
    </CustomDropdownInput>
  );
};

export default PopoverButton;
