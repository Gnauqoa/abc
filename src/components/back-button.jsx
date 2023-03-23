import React from "react";
import { Link } from "framework7-react";

export default ({ link }) => {
  return (
    <Link
      href={link}
      iconIos="material:arrow_back"
      iconMd="material:arrow_back"
      iconAurora="material:arrow_back"
      className="back-icon margin-right"
    />
  );
};
