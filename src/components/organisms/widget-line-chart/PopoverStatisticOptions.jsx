import React from "react";
import { List, ListItem, Navbar, Popover } from "framework7-react";
import { useTranslation } from "react-i18next";

import "./PopoverStatisticOptions.scss";
import { STATISTIC_LINEAR } from "../../../utils/widget-line-chart/commons";

const PopoverStatisticOptions = ({ callback }) => {
  const { t, i18n } = useTranslation();

  return (
    <Popover className="popover-statistic-options">
      <Navbar title={t("organisms.select_calculation_function")}></Navbar>
      <List strongIos outlineIos dividersIos>
        <ListItem
          link="#"
          popoverClose
          title={t("organisms.linear_line")}
          onClick={() => callback({ statisticOptionId: STATISTIC_LINEAR })}
        />
        ,
      </List>
    </Popover>
  );
};

export default PopoverStatisticOptions;
