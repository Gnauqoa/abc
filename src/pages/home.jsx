import React from "react";
import { Page, Swiper, SwiperSlide, Link, Navbar, NavLeft, NavTitle } from "framework7-react";

import newImg from "../img/home/new-activity.png";
import openImg from "../img/home/open-activity.png";

export default () => (
  <Page className="bg-color-regal-blue edl-home">
    <Navbar className="edl-home-navbar">
      <NavLeft>
        <Link iconIos="material:menu" iconMd="material:menu" panelOpen="left" />
      </NavLeft>
      <NavTitle>EDL</NavTitle>
    </Navbar>
    <div className="page-content display-flex justify-content-center align-items-center">
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
    </div>
  </Page>
);
