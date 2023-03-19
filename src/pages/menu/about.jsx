import React from "react";
import { Block, Icon } from "framework7-react";
import logo from "../../img/icons/logo.png";
import { APP_VERSION } from "../../js/constants";

export default () => (
  <Block className={"about-menu"}>
    <div>
      <div>
        <img src={logo} width={"25%"} />
      </div>
      <div className="project">OhStem {APP_VERSION}</div>
      <div className="copyright">Bản quyền thuộc sở hữu của AITT</div>
      <div className="contact">
        <span>
          <Icon slot="media" ios="material:headset_mic" md="material:headset_mic" size="2vw"></Icon>08.6666.8168
        </span>
        <span>
          <Icon slot="media" ios="material:local_post_office" md="material:local_post_office" size="2vw"></Icon>
          contact@ohstem.vn
        </span>
      </div>
      <div className="contact">
        <Icon slot="media" ios="material:location_on" md="material:location_on" size="2vw"></Icon>22/15 Đường 440,
        Phường Phước Long A, Thủ Đức, TP.HCM
      </div>
    </div>
  </Block>
);
