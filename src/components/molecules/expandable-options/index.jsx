import React, { useState } from "react";

import "./index.scss";

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
        <img src={expandIcon} alt="expandIcon" style={{ width: EXPAND_ICON_SIZE }} />
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
