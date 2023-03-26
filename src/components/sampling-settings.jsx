import React, { useState } from "react";
import clockFreImg from "../img/activity/clock-frequency.png";
import { Popover, List, Button, f7 } from "framework7-react";
import { FREQUENCIES } from "../js/constants";
import dialog from "./dialog";

export default ({ frequency, handleFrequencySelect }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  //   const handleOpenModal = () => {
  //     setIsModalOpen(true);
  //   };

  //   const handleCloseModal = () => {
  //     setIsModalOpen(false);
  //   };

  const handleClick = () => {
    dialog.samplingSettings("Tùy chọn lấy mẫu");
  };

  const onSelectFrequency = (frequency) => {
    handleFrequencySelect(frequency);
    f7.popover.close();
  };

  return (
    <div className="frequency">
      <div className="image" onClick={handleClick}>
        <img src={clockFreImg} alt="frequency" />
      </div>

      <Button
        className="button"
        textColor="black"
        bgColor="white"
        style={{ minWidth: "250", height: "44px", borderRadius: "0 10px 10px 0" }}
        raised
        popoverOpen=".popover-frequency"
      >
        Định kỳ: {frequency}Hz
      </Button>

      <Popover className="popover-frequency" style={{ borderRadius: "10px", width: "120px" }}>
        <List className="test">
          {FREQUENCIES.map((frequency) => (
            <Button
              key={frequency}
              textColor="black"
              onClick={() => {
                onSelectFrequency(frequency);
              }}
            >
              {frequency}HZ
            </Button>
          ))}
        </List>
      </Popover>
    </div>
  );
};
