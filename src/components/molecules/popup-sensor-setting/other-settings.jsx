import React, { useEffect } from "react";
import { List, ListItem, Button, f7 } from "framework7-react";

import "./index.scss";

const OtherSettingsTab = ({ sensorInfo, onSaveHandler }) => {
  return (
      <List className="__other-settings" form noHairlinesMd inlineLabels>
        <ListItem>
          <Button className="edl-button" onClick={() => onSaveHandler({ sensorId: sensorInfo.id, action: "zero" })}>
            Đặt giá trị cảm biến về 0
          </Button>
        </ListItem>
      </List>
  );
};

export default OtherSettingsTab;
