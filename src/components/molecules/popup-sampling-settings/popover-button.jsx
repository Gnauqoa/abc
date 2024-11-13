import React from "react";
import { Button, Popover, List, f7 } from "framework7-react";

import "./sampling-settings.scss";
import CustomDropdownInput from "../popup-sensor-setting/custom-list-input";

const PopoverButton = ({ options, onChange, display, label, name }) => {
  return (
    <CustomDropdownInput labelName={label} buttonName={display} popOverName={`sample-setting-popover-${name}`}>
      {options.map((option) => {
        return (
          <Button
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
    </CustomDropdownInput>
  );
};

export default PopoverButton;
