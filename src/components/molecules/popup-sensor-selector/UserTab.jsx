import clsx from "clsx";
import { Block, List, ListItem, PageContent } from "framework7-react";
import React from "react";
import { useTranslation } from "react-i18next";

import "./index.scss";
import DataManagerIST from "../../../services/data-manager";
import { X_AXIS_TIME_UNIT } from "../../../utils/widget-table-chart/commons";

const UserTab = ({ changeHandler = () => {} }) => {
  const { t, i18n } = useTranslation();

  const userUnits = DataManagerIST.getCustomUnits();

  const handleSelect = ({ option }) => {
    changeHandler({ option });
  };

  return (
    <PageContent className="invisible-scrollbar zero-padding">
      <Block>
        <List>
          {[X_AXIS_TIME_UNIT, ...userUnits].map((option) => (
            <ListItem
              link="#"
              popupClose
              key={option.id}
              className={clsx("sensor-select-user-unit", {
                __activeDevice: true,
                __default: false,
              })}
              title={`${t(option.name)} ${option.unit === "" ? "" : ` (${option.unit})`}`}
              onClick={() => handleSelect({ option })}
            ></ListItem>
          ))}
        </List>
      </Block>
    </PageContent>
  );
};
export default UserTab;
