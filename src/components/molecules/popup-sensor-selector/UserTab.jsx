import clsx from "clsx";
import { Block, List, ListItem, PageContent } from "framework7-react";
import React from "react";

import "./index.scss";
import DataManagerIST from "../../../services/data-manager";

const UserTab = ({ changeHandler }) => {
  const userUnits = DataManagerIST.getCustomMeasurements();
  return (
    <PageContent className="invisible-scrollbar zero-padding">
      <Block>
        <List>
          {userUnits.map((s) => (
            <ListItem
              link="#"
              popupClose
              key={s.id}
              className={clsx("sensor-select-user-unit", {
                __activeDevice: true,
                __default: false,
              })}
              title={`${s.name} ${s.unit === "" ? "" : ` (${s.unit})`}`}
              onClick={() => {}}
            ></ListItem>
          ))}
        </List>
      </Block>
    </PageContent>
  );
};
export default UserTab;
