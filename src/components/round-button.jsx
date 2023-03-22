import React from "react";
import { Button } from "framework7-react";

export default ({ color, icon, onClick }) => {
  return (
    <Button
      onClick={onClick}
      iconIos={`material:${icon}`}
      iconMd={`material:${icon}`}
      className={"button--round"}
      style={{ background: color }}
    ></Button>
  );
};
