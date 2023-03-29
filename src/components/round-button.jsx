import React from "react";
import { Button } from "framework7-react";
import clsx from "clsx";

export default ({ color, icon, onClick, disabled, popupClose }) => {
  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      iconIos={`material:${icon}`}
      iconMd={`material:${icon}`}
      iconAurora={`material:${icon}`}
      className={clsx("button--round", color && "-icon-white")}
      popupClose={popupClose}
      style={{ background: color }}
    ></Button>
  );
};
