import React, { useState } from "react";

import "./index.scss";

import expandRowIcon from "../../../img/expandable-options/expand-row.png";

const ICON_SIZE = "50%";
const EXPAND_ICON_SIZE = "80%";

const ExpandableOptions = ({ expandIcon, options, onChooseOption }) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpand = () => {
    setExpanded(!expanded);
  };

  const onOptionClickedHandler = (event) => {
    const optionId = parseInt(event.currentTarget.id);
    onChooseOption(optionId);
  };

  return (
    <div className="row">
      <div className="container expand-button" onClick={handleExpand}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <img src={expandIcon} alt="expandIcon" style={{ width: EXPAND_ICON_SIZE }} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", paddingRight: "5px" }}>
          <img src={expandRowIcon} alt="expandRowIcon" style={{ width: "100%" }} />
        </div>
      </div>

      <div className={`container options ${expanded ? "expanded" : ""}`}>
        {Array.isArray(options) &&
          options.map((option) => {
            return (
              <div key={option.id} className="expand-button" id={option.id} onClick={onOptionClickedHandler}>
                <img src={option.icon} alt={`expand-icon-${option.id}`} style={{ width: ICON_SIZE }} />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default ExpandableOptions;
