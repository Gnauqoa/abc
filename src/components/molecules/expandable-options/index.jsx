import React, { useState } from "react";

import "./index.scss";

import expandRowIcon from "../../../img/expandable-options/expand-row.png";

const ICON_SIZE = "36px";
const EXPAND_ICON_SIZE = "10px";

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
        <div>
          <img src={expandIcon} alt="expandIcon" style={{ width: ICON_SIZE }} />
        </div>
        <div>
          <img src={expandRowIcon} alt="expandRowIcon" style={{ width: EXPAND_ICON_SIZE }} />
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
