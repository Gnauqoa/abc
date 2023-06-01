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
            const iconSize = option.size ? option.size : ICON_SIZE;
            return (
              <div
                key={option.id}
                className={`expand-button ${option.selected && "selected"}`}
                id={option.id}
                onClick={onOptionClickedHandler}
              >
                <img
                  src={option.selected ? option.selectedIcon : option.icon}
                  alt={`expand-icon-${option.id}`}
                  style={{ width: iconSize }}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default ExpandableOptions;
