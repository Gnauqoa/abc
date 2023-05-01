import React, { useState } from "react";
import { Navbar, NavLeft, NavRight, Popover, List, ListItem, f7 } from "framework7-react";
import BackButton from "../../atoms/back-button";
import RoundButton from "../../atoms/round-button";
import NewPagePopup from "../../molecules/popup-new-page";
import DataRunManagementPopup from "../../molecules/popup-data-run-management";

import DataManagerIST from "../../../services/data-manager";

const ActivityHeader = ({
  name,
  pageLength,
  isRunning,
  handleActivityNameChange,
  handleActivityBack,
  handleActivitySave,
  handleNewPage,
  handlePageDelete,
  ble,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  function handleExportExcel() {
    DataManagerIST.exportDataRunExcel();
  }

  function handleChangeDataRun() {
    console.log("handleChangeDataRun");
  }

  function handleFullScreen() {
    try {
      if (f7.device.electron) {
        window._cdvElectronIpc.setFullscreen(!isFullScreen);
        setIsFullScreen(!isFullScreen);
      } else if (f7.device.desktop) {
        if (!document.fullscreenEnabled) {
          setIsFullScreen(false);
          return;
        }

        if (isFullScreen) {
          document.exitFullscreen();
        } else {
          const appEl = f7.el;
          appEl.requestFullscreen();
        }
        setIsFullScreen(!isFullScreen);
      }
    } catch (e) {
      console.log(e);
      setIsFullScreen(false);
    }
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
          <RoundButton icon="bluetooth" onClick={() => ble.openScanPopup()} />
          <RoundButton
            disabled={isRunning}
            icon={isFullScreen ? "fullscreen_exit" : "fullscreen"}
            onClick={handleFullScreen}
          />
        </NavRight>
      </Navbar>

      {/* Popup and Popover associate with Header */}
      <Popover className="setting-popover-menu">
        <List>
          <ListItem link="#" popupOpen=".data-run-management-popup" popoverClose title="Quản lý dữ liệu" />
          <ListItem link="#" popoverClose title="Xuất ra Excel" onClick={handleExportExcel} />
        </List>
      </Popover>

      <NewPagePopup handleNewPage={handleNewPage} />
      <DataRunManagementPopup handleChangeDataRun={handleChangeDataRun} />
      {ble.renderScanPopup()}
    </div>
  );
};

export default ActivityHeader;
