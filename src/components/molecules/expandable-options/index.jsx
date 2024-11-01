import React, { useState } from "react";

import "./index.scss";

const ICON_SIZE = "50%";
const EXPAND_ICON_SIZE = "80%";

const ExpandableOptions = ({ expandIcon, options, onChooseOption }) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpand = () => {
    setExpanded(!expanded);
  };

  const onOptionClickedHandler = ({ optionId }) => {
    onChooseOption({ optionId });
  };

  return (
    <div className="row">
      <div className="container expand-button" onClick={handleExpand}>
        <img src={expandIcon} alt="expandIcon" style={{ width: EXPAND_ICON_SIZE }} />
      </div>

      <div className={`container options ${expanded ? "expanded" : ""}`}>
        {Array.isArray(options) &&
          options.map((option) => {
            if (!option.visible) return null;

            const iconSize = option.size ? option.size : ICON_SIZE;
            return (
              <div
                key={option.id}
                id={option.id}
                className={`expand-button ${option.selected && "selected"}`}
                onClick={() => onOptionClickedHandler({ optionId: option.id })}
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
