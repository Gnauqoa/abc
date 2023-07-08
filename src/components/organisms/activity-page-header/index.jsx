import React, { useState } from "react";
import { Navbar, NavLeft, NavRight, Popover, List, ListItem, f7 } from "framework7-react";
import BackButton from "../../atoms/back-button";
import RoundButton from "../../atoms/round-button";
import NewPagePopup from "../../molecules/popup-new-page";
import DataRunManagementPopup from "../../molecules/popup-data-run-management";

import DataManagerIST from "../../../services/data-manager";
import { useActivityContext } from "../../../context/ActivityContext";

const ActivityHeader = ({
  name,
  pageLength,
  isRunning,
  handleActivityNameChange,
  handleActivityBack,
  handleActivitySave,
  handleNewPage,
  handlePageDelete,
  deviceManager,
}) => {
  // If platform is android, then default is fullscreen
  const [isFullScreen, setIsFullScreen] = useState(f7.device.android);
  const { handleExportActivity } = useActivityContext();
  let settings = [];

  // Handle Functions
  const handleShareProject = () => {
    const activity = handleExportActivity();
    // TODO: Share project
  };

  const handleFullScreen = (isFullScreen) => {
    try {
      if (f7.device.electron) {
        window._cdvElectronIpc.setFullscreen(isFullScreen);
      } else if (f7.device.desktop) {
        if (!document.fullscreenEnabled) {
          setIsFullScreen(false);
          return;
        }

        if (!isFullScreen) {
          document.exitFullscreen();
        } else {
          const appEl = f7.el;
          appEl.requestFullscreen();
        }
      } else if (f7.device.android) {
        if (!isFullScreen) {
          AndroidFullScreen.showSystemUI(console.log("leanMode It worked!"), (error) => console.error(error));
        } else {
          AndroidFullScreen.immersiveMode(console.log("immersiveMode It worked!"), (error) => console.error(error));
        }
      }
      setIsFullScreen(isFullScreen);
    } catch (e) {
      console.log(e);
      setIsFullScreen(false);
    }
  };

  // Declare settings function for each device
  if (f7.device.android || f7.device.ios) {
    settings = [
      <ListItem link="#" popupOpen=".data-run-management-popup" popoverClose title="Quản lý dữ liệu" />,
      <ListItem link="#" popoverClose title="Chia sẻ toàn bộ thí nghiệm" onClick={handleShareProject} />,
    ];
  } else {
    settings = [
      <ListItem link="#" popupOpen=".data-run-management-popup" popoverClose title="Quản lý dữ liệu" />,
      <ListItem link="#" popoverClose title="Xuất ra Excel" onClick={() => DataManagerIST.exportDataRunExcel()} />,
    ];
  }

  return (
    <div>
      <Navbar>
        <NavLeft>
          <BackButton disabled={isRunning} onClick={handleActivityBack} />
          <RoundButton
            disabled={isRunning}
            icon="add_chart"
            popupOpen=".new-page-popup"
            popoverClose
            title="Cài đặt dữ liệu hiển thị"
          />
          <RoundButton disabled={isRunning || pageLength === 1} icon="delete_forever" onClick={handlePageDelete} />
        </NavLeft>

        <input value={name} type="text" name="name" onChange={handleActivityNameChange} className="activity-name" />

        <NavRight>
          <RoundButton disabled={isRunning} icon="save" onClick={handleActivitySave} />
          <RoundButton disabled={isRunning} icon="settings" popoverOpen=".setting-popover-menu" />
          <RoundButton disabled={isRunning} icon="bluetooth" onClick={() => deviceManager.openScanPopup()} />
          <RoundButton
            disabled={isRunning}
            icon={isFullScreen ? "fullscreen_exit" : "fullscreen"}
            onClick={() => handleFullScreen(!isFullScreen)}
          />
        </NavRight>
      </Navbar>

      {/* Popup and Popover associate with Header */}
      <Popover className="setting-popover-menu">
        <List>{settings}</List>
      </Popover>

      <NewPagePopup handleNewPage={handleNewPage} />
      <DataRunManagementPopup />
      {deviceManager.renderScanPopup()}
    </div>
  );
};

export default ActivityHeader;
