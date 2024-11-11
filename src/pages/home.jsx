import React, { useRef, useState } from "react";
import { Page, Swiper, SwiperSlide, Link, Navbar, NavLeft, NavTitle, f7 } from "framework7-react";

import newImg from "../img/home/new-activity.png";
import openImg from "../img/home/open-activity.png";
import storeService from "../services/store-service";
import { openFile } from "../services/file-service";
import { fileReadAsTextAsync } from "../utils/core";
import dialog from "../components/molecules/dialog/dialog";
import {
  USER_INPUTS_TABLE,
  LINE_CHART_STATISTIC_NOTE_TABLE,
  LINE_CHART_LABEL_NOTE_TABLE,
  LINE_CHART_RANGE_SELECTION_TABLE,
  LINE_CHART_DELTA_TABLE,
} from "../js/constants";
import ProjectManagementPopup from "../components/molecules/popup-projects-management";
import { useTranslation } from "react-i18next";

const recentFilesService = new storeService("recent-files");
const statisticNotesStorage = new storeService(LINE_CHART_STATISTIC_NOTE_TABLE);
const labelNotesStorage = new storeService(LINE_CHART_LABEL_NOTE_TABLE);
const rangeSelectionStorage = new storeService(LINE_CHART_RANGE_SELECTION_TABLE);
const deltasStorage = new storeService(LINE_CHART_DELTA_TABLE);

// Clear all Previous Tables
statisticNotesStorage.deleteAll();
labelNotesStorage.deleteAll();
rangeSelectionStorage.deleteAll();
deltasStorage.deleteAll();

export default ({ f7router }) => {
  const { t, i18n } = useTranslation();
  const files = recentFilesService.all();
  const inputFile = useRef(null);
  const [isProjectManagementOpened, setIsProjectManagementOpened] = useState(false);

  async function handleFileOpen(filePath) {
    if (f7.device.electron) {
      try {
        const file = await openFile(filePath);
        if (file) {
          const content = JSON.parse(file.content);
          recentFilesService.save({ id: file.filePath, activityName: content.name });
          f7router.navigate("/edl", {
            props: {
              filePath: file.filePath,
              content,
            },
          });
        }
      } catch (error) {
        console.error("Import failed", error.message);
        dialog.alert(
          t("page.error_cannot_open_file"),
          t("page.file_content_is_invalid_Please_create_a_new_activity"),
          () => {}
        );
      }
    } else if (f7.device.desktop) {
      inputFile.current.click();
    } else if (f7.device.android) {
      setIsProjectManagementOpened(true);
    }
  }

  function handleFileUpload(event) {
    const file = event.target.files[0];
    fileReadAsTextAsync(file).then((content) => {
      try {
        f7router.navigate("/edl", {
          props: {
            filePath: "",
            content: JSON.parse(content),
          },
        });
      } catch (error) {
        console.error("Import failed", error.message);
        dialog.alert(
          t("page.error_cannot_open_file"),
          t("page.file_content_is_invalid_Please_create_a_new_activity"),
          () => {}
        );
      }
    });
  }

  return (
    <Page className="bg-color-regal-blue home">
      <Navbar className="header-nav">
        <NavLeft>
          <Link iconIos="material:menu" iconMd="material:menu" iconAurora="material:menu" panelOpen="left" />
        </NavLeft>
        <NavTitle>InnoLab</NavTitle>
      </Navbar>
      <div className="full-height display-flex flex-direction-column justify-content-space-around">
        <Swiper className="activity-actions" pagination speed={500} slidesPerView={"auto"} spaceBetween={20}>
          <SwiperSlide>
            <Link href="/layout" view=".view-main">
              <img src={newImg} className="responsive" />
            </Link>
          </SwiperSlide>
          <SwiperSlide>
            <Link href="#" onClick={() => handleFileOpen("")} view=".view-main">
              <img src={openImg} className="responsive" />
            </Link>
          </SwiperSlide>
        </Swiper>
        {files.length > 0 && (
          <div className="activity-list">
            <h2 className="text-color-white">{t("page.recent_activity")}</h2>
            <Swiper className="recent-activities" navigation speed={500} slidesPerView={5}>
              {files.map((f) => {
                return (
                  <SwiperSlide key={f.id}>
                    <Link href="#" onClick={() => handleFileOpen(f.id)}>
                      <div className="activity text-color-white">{f.activityName}</div>
                    </Link>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        )}
      </div>
      <input type="file" id="activity-file" ref={inputFile} style={{ display: "none" }} onChange={handleFileUpload} />
      <ProjectManagementPopup
        f7router={f7router}
        opened={isProjectManagementOpened}
        onClose={() => setIsProjectManagementOpened(false)}
      ></ProjectManagementPopup>
    </Page>
  );
};
