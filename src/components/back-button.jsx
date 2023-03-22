import React from "react";
import { Link } from "framework7-react";

export default ({ link }) => {
  return (
    <Link
      reloadDetail
      href={link}
      iconIos="material:arrow_back"
      iconMd="material:arrow_back"
      className="back-icon margin-right"
    />
  );
};
