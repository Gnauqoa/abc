import React, { useState } from "react";
import { View, Panel, Navbar, Page, NavLeft, Link, Block, Row, Col, List, ListItem, Icon, f7 } from "framework7-react";
import store from "store";

import SettingsMenu from "./settings";
import AboutMenu from "./about";
import aboutusImg from "../../img/menu/about-ohstem.png";

export default () => {
  const [activeMenu, setActiveMenu] = useState(store.get("active-menu") || "about");

  function handleChange(e) {
    const activeMenu = e.target.value;
    store.set("active-menu", activeMenu);
    setActiveMenu(activeMenu);
  }

  return (
    <Panel left className="main-menu">
      <View className="main-menu-content">
        <Page className="main-menu-content">
          <Block>
            <Row>
              <Col width="40" className="main-menu-left">
                <List>
                  <Navbar transparent>
                    <NavLeft>
                      <Link iconIos="material:close" iconMd="material:close" iconAurora="material:close" panelClose />
                    </NavLeft>
                  </Navbar>
                  {/* <ListItem
                    radio
                    title="Cài đặt"
                    value="settings"
                    name="radio-menu"
                    onChange={handleChange}
                    className={activeMenu === "settings" ? "m-menu-active" : ""}
                  >
                    <Icon slot="media" ios="material:settings" md="material:settings" size="36px"></Icon>
                  </ListItem> */}
                  <ListItem
                    radio
                    title="Về InnoLab"
                    value="about"
                    name="radio-menu"
                    onChange={handleChange}
                    className={activeMenu === "about" ? "m-menu-active" : ""}
                  >
                    <img slot="media" src={aboutusImg} className="menu-icon" />
                  </ListItem>
                  {f7.device.electron && (
                    <ListItem radio title="Thoát" name="radio-menu" onClick={() => window._cdvElectronIpc.quitApp()}>
                      <Icon
                        slot="media"
                        ios="material:exit_to_app"
                        md="material:exit_to_app"
                        aurora="material:exit_to_app"
                        size="36px"
                      ></Icon>
                    </ListItem>
                  )}
                </List>
              </Col>
              <Col width="60" className="main-menu-right">
                {activeMenu === "settings" && <SettingsMenu />}
                {activeMenu === "about" && <AboutMenu />}
              </Col>
            </Row>
          </Block>
        </Page>
      </View>
    </Panel>
  );
};
