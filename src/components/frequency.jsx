import React, { useState } from "react";
import clockFreImg from "../img/activity/clock-frequency.png";
import { Popover, List, Button, f7 } from "framework7-react";
import { FREQUENCIES } from "../js/constants";

export default ({ frequency, handleFrequencySelect }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const onSelectFrequency = (frequency) => {
    handleFrequencySelect(frequency);
    f7.popover.close();
  };

  return (
    <div className="frequency">
      <div className="image" onClick={handleOpenModal}>
        <img src={clockFreImg} alt="frequency" />
      </div>

      <Button
        className="button"
        textColor="black"
        bgColor="white"
        style={{ minWidth: "250", height: "44px", borderRadius: "0 10px 10px 0" }}
        raised
        popoverOpen=".popover-menu"
      >
        Định kỳ: {frequency}Hz
      </Button>

      <Popover className="popover-menu" style={{ borderRadius: "10px", width: "120px" }}>
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
