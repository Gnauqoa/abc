import React, { useEffect } from "react";
import { List, ListItem, Button, f7 } from "framework7-react";
import { useTranslation } from "react-i18next";

import "./index.scss";

const OtherSettingsTab = ({ sensorInfo, onSaveHandler }) => {
  const { t, i18n } = useTranslation();

  return (
      <List className="__other-settings" form noHairlinesMd inlineLabels>
        <ListItem>
          <Button className="edl-button" onClick={() => onSaveHandler({ sensorId: sensorInfo.id, action: "zero" })}>
           {t("modules.set_the_sensor_value_to_0")}
          </Button>
        </ListItem>
      </List>
  );
};

export default OtherSettingsTab;
