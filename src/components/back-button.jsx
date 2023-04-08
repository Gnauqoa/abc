import React from "react";
import { Link } from "framework7-react";

export default ({ link, disabled, onClick }) => {
  return (
    <Link
      iconIos="material:arrow_back"
      iconMd="material:arrow_back"
      iconAurora="material:arrow_back"
      className="back-icon margin-right"
      {...(disabled ? {} : { href: link })}
      onClick={onClick}
    />
  );
};
