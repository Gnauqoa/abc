import React from "react";
import { Page, Swiper, SwiperSlide, Link, Navbar, NavLeft, NavTitle } from "framework7-react";

import newImg from "../img/home/new-activity.png";
import openImg from "../img/home/open-activity.png";
import storeService from "../services/store-service";
import { openFile } from "../services/file-service";

const recentFilesService = new storeService("recent-files");

export default ({ f7router }) => {
  const files = recentFilesService.all();

  async function handleFileOpen(filePath) {
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
  }

  return (
    <Page className="bg-color-regal-blue home">
      <Navbar>
        <NavLeft>
          <Link iconIos="material:menu" iconMd="material:menu" panelOpen="left" />
        </NavLeft>
        <NavTitle>EDL</NavTitle>
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
            <h2 className="text-color-white">HOẠT ĐỘNG GẦN ĐÂY</h2>
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
    </Page>
  );
};
