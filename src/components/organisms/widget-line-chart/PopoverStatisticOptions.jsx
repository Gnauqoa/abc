import React from "react";
import { List, ListItem, Navbar, Popover } from "framework7-react";

import "./PopoverStatisticOptions.scss";
import { STATISTIC_LINEAR } from "../../../utils/widget-line-chart/commons";

const PopoverStatisticOptions = ({ callback }) => {
  return (
    <Popover className="popover-statistic-options">
      <Navbar title="Chọn hàm tính toán"></Navbar>
      <List strongIos outlineIos dividersIos>
        <ListItem
          link="#"
          popoverClose
          title="Đường tuyến tính"
          onClick={() => callback({ statisticOptionId: STATISTIC_LINEAR })}
        />
        ,
      </List>
    </Popover>
  );
};

export default PopoverStatisticOptions;
