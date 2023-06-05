import React, { useEffect } from "react";
import { List, ListInput, Button, f7 } from "framework7-react";

import "./index.scss";
import DataManagerIST from "../../../services/data-manager";
import CustomDropdownInput from "./custom-list-input";

const CALIBRATING_1_POINT = 1;
const CALIBRATING_2_POINTS = 2;

const OtherSettingsTab = ({ sensorInfo, sensorDataIndex, onSaveHandler }) => {

  return (
    <>
      <List className="__other-settings" form noHairlinesMd inlineLabels>
        Chức năng khác
      </List>
    </>
  );
};

export default OtherSettingsTab;
