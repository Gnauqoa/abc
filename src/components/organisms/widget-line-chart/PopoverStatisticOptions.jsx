import React from "react";
import { List, ListItem, Navbar, Popover } from "framework7-react";
import { useTranslation } from "react-i18next";

import "./PopoverStatisticOptions.scss";
import {
  STATISTIC_LINEAR,
  STATISTIC_QUADRATIC,
  STATISTIC_POWER,
  STATISTIC_INVERSE,
  STATISTIC_INVERSE_SQUARE,
  STATISTIC_SINUSOIDAL,
  STATISTIC_AREA,
} from "../../../utils/widget-line-chart/commons";

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
        <ListItem
          link="#"
          popoverClose
          title="Quadratic fit"
          onClick={() => callback({ statisticOptionId: STATISTIC_QUADRATIC })}
        />
        <ListItem
          link="#"
          popoverClose
          title="Power fit"
          onClick={() => callback({ statisticOptionId: STATISTIC_POWER })}
        />
        <ListItem
          link="#"
          popoverClose
          title="Inverse fit"
          onClick={() => callback({ statisticOptionId: STATISTIC_INVERSE })}
        />
        <ListItem
          link="#"
          popoverClose
          title="Inverse square fit"
          onClick={() => callback({ statisticOptionId: STATISTIC_INVERSE_SQUARE })}
        />
        <ListItem
          link="#"
          popoverClose
          title="Sinusoidal fit"
          onClick={() => callback({ statisticOptionId: STATISTIC_SINUSOIDAL })}
        />
        <ListItem
          link="#"
          popoverClose
          title="Area fit"
          onClick={() => callback({ statisticOptionId: STATISTIC_AREA })}
        />
      </List>
    </Popover>
  );
};

export default PopoverStatisticOptions;
