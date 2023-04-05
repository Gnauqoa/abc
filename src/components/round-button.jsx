import React from "react";
import { Button } from "framework7-react";
import clsx from "clsx";

export default ({ color, icon, onClick, disabled, popoverOpen }) => {
  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      iconIos={`material:${icon}`}
      iconMd={`material:${icon}`}
      iconAurora={`material:${icon}`}
      popoverOpen={popoverOpen}
      className={clsx("button--round", color && "-icon-white")}
      style={{ background: color }}
    ></Button>
  );
};
