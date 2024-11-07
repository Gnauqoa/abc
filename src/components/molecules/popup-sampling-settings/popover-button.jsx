import React from "react";
import { Button, Popover, List, f7 } from "framework7-react";

import "./sampling-settings.scss";

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

export default PopoverButton
