import React from "react";
import { Button } from "framework7-react";
import clsx from "clsx";

export default ({ color, icon, customIcon, onClick, disabled, popoverOpen, popupOpen }) => {
  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      iconIos={icon && `material:${icon}`}
      iconMd={icon && `material:${icon}`}
      iconAurora={icon && `material:${icon}`}
      icon={customIcon}
      popoverOpen={popoverOpen}
      popupOpen={popupOpen}
      className={clsx("button--round", color && "-icon-white")}
      style={{ background: color }}
    ></Button>
  );
};
