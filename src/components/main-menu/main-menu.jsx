import React, { useState } from "react";
import { View, Panel } from "framework7-react";
import Landing from "../../pages/landing";
import * as core from "../../utils/core";

export default () => {
  const [hasCloseMenu, setCloseMenu] = useState(true);

  function onPanelOpen() {
    if (core.getLandingPage() === "/landing") {
      setCloseMenu(false);
    }
  }

  return (
    <Panel left className="main-menu" onPanelOpen={() => onPanelOpen()}>
      <View className="main-menu-content">
        <Landing hasCloseMenu={hasCloseMenu} />
      </View>
    </Panel>
  );
};
