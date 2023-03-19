import React, { Component } from "react";
import { Page, Link, Navbar, NavTitle, NavLeft } from "framework7-react";

import activityImg from "../img/activity/activity.png";

export default class extends Component {
  render() {
    const layout = this.props.f7route.params.layout;

    return (
      <Page className="bg-color-regal-blue custom-dashboards">
        <Navbar className="custom-dashboards-navbar">
          <NavLeft>
            <Link
              iconIos="material:arrow_back"
              iconMd="material:arrow_back"
              className="back-icon"
              onClick={() => this.props.f7router.back()}
            />
          </NavLeft>
          <NavTitle>Layout {layout}</NavTitle>
        </Navbar>
        <div className="page-content display-flex justify-content-center align-items-center">
          <img src={activityImg} className="responsive" />
        </div>
      </Page>
    );
  }
}
