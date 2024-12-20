import React, { useState } from "react";
import { Navbar, NavLeft, NavRight, Popover, List, ListItem, f7 } from "framework7-react";
import BackButton from "../../atoms/back-button";
import RoundButton from "../../atoms/round-button";
import NewPagePopup from "../../molecules/popup-new-page";
import DataRunManagementPopup from "../../molecules/popup-data-run-management";
import { createExcelWorkbookBuffer, shareFile } from "../../../utils/core";

import DataManagerIST from "../../../services/data-manager";
import { useActivityContext } from "../../../context/ActivityContext";
import { useTranslation } from "react-i18next";

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
  const { t, i18n } = useTranslation();

  // If platform is android, then default is fullscreen
  const [isFullScreen, setIsFullScreen] = useState(f7.device.android);
  const { handleExportActivity } = useActivityContext();
  let settings = [];

  // Handle Functions
  const handleShareProject = () => {
    const activity = handleExportActivity();
    const blob = new Blob([JSON.stringify(activity, null, 2)], {
      type: "application/json",
    });

    shareFile((activity.name || t("organisms.experimental_activities")) + ".edl", blob);
  };

  const handleShareDataRuns = () => {
    const dataRunInfo = DataManagerIST.createDataRunInfos();
    const dataRunInfoBuffer = createExcelWorkbookBuffer({ sheets: dataRunInfo });
    const blob = new Blob([dataRunInfoBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    const activityName = name === "" ? t("organisms.experimental_data") : name;
    shareFile(activityName + ".xlsx", blob);
  };

  const handleExportDataRuns = () => {
    const activityName = name === "" ? t("organisms.experimental_data") : name;
    DataManagerIST.exportDataRunExcel({ fileName: activityName });
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

  const openResource = (e) => {
    const url = "https://drive.google.com/drive/folders/1NH5JFB3NsujqjsI0qMUlwOeKWZP1OHYG?usp=drive_link";
    if (f7.device.android) {
      navigator.app.loadUrl(url, {
        openExternal: true,
      });
    } else if (f7.device.electron) {
      window._cdvElectronIpc.openBrowser(url);
    } else {
      window.open(url, "_system");
    }
    e.preventDefault();
  };

  // Declare settings function for each device
  if (f7.device.android || f7.device.ios) {
    settings = [
      <ListItem
        key="activity-header-data-run-management"
        link="#"
        popupOpen=".data-run-management-popup"
        popoverClose
        title={t("modules.data_management")}
      />,
      <ListItem
        key="activity-header-share-project"
        link="#"
        popoverClose
        title={t("organisms.share_experiments")}
        onClick={handleShareProject}
      />,
      <ListItem
        key="activity-header-share-data-run"
        link="#"
        popoverClose
        title={t("modules.share_data")}
        onClick={handleShareDataRuns}
      />,
      <ListItem key="activity-header-resource" link="#" popoverClose title="Tài nguyên" onClick={openResource} />,
    ];
  } else {
    settings = [
      <ListItem
        key="activity-header-data-run-management"
        link="#"
        popupOpen=".data-run-management-popup"
        popoverClose
        title={t("modules.data_management")}
      />,
      <ListItem
        key="activity-header-export-excel"
        link="#"
        popoverClose
        title={t("organisms.export_to_Excel")}
        onClick={handleExportDataRuns}
      />,
      <ListItem
        key="activity-header-resource"
        link="#"
        popoverClose
        title={t("organisms.resources")}
        onClick={openResource}
      />,
    ];
  }

  return (
    <div>
      <Navbar className="header-nav">
        <NavLeft>
          <BackButton disabled={isRunning} onClick={handleActivityBack} />
          <RoundButton
            disabled={isRunning}
            icon="add_chart"
            popupOpen=".new-page-popup"
            popoverClose
            title={t("organisms.display_data_settings")}
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
