import React from "react";
import { Page, Swiper, SwiperSlide, Link, Navbar, NavLeft, NavTitle } from "framework7-react";

import newImg from "../img/home/new-activity.png";
import openImg from "../img/home/open-activity.png";
import storeService from "../services/store-service";

const activityService = new storeService("activity");
const allActivities = activityService.all();

export default () => (
  <Page className="bg-color-regal-blue edl-home">
    <Navbar className="edl-home-navbar">
      <NavLeft>
        <Link iconIos="material:menu" iconMd="material:menu" panelOpen="left" />
      </NavLeft>
      <NavTitle>EDL</NavTitle>
    </Navbar>
    <div className="page-content display-flex flex-direction-column justify-content-space-around align-items-center">
      <Swiper pagination speed={500} slidesPerView={"auto"} spaceBetween={20}>
        <SwiperSlide>
          <Link href="/layout" view=".view-main">
            <img src={newImg} className="responsive" />
          </Link>
        </SwiperSlide>
        <SwiperSlide>
          <Link href="#" view=".view-main">
            <img src={openImg} className="responsive" />
          </Link>
        </SwiperSlide>
      </Swiper>
      <div>
        <h2 className="text-color-white">HOẠT ĐỘNG GẦN ĐÂY</h2>
        <Swiper pagination speed={500} slidesPerView={"auto"} spaceBetween={20}>
          {allActivities.map((a) => {
            return (
              <SwiperSlide key={a.id}>
                <Link href={`/edl/${a.id}`}>
                  <div className="text-color-white">{a.name}</div>
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </div>
    <h2 className="color-red">HOẠT ĐỘNG GẦN ĐÂY</h2>
  </Page>
);
