import React from "react";
import { Page, Link, Navbar, NavTitle, Row, Col, NavLeft, Block } from "framework7-react";

import BackButton from "../components/atoms/back-button";
import {
  LAYOUT_CHART,
  LAYOUT_TABLE,
  LAYOUT_NUMBER,
  LAYOUT_TABLE_CHART,
  LAYOUT_NUMBER_CHART,
  LAYOUT_NUMBER_TABLE,
  LAYOUT_TEXT,
  LAYOUT_BAR,
  LAYOUT_SCOPE,
} from "../js/constants";

import chartImg from "../img/layout/chart.png";
import numberChartImg from "../img/layout/number-chart.png";
import numberTableImg from "../img/layout/number-table.png";
import numberImg from "../img/layout/number.png";
import tableChartImg from "../img/layout/table-chart.png";
import tableImg from "../img/layout/table.png";
import textImg from "../img/layout/text-view.png";
import barChartImg from "../img/layout/bar-chart.png";
import scopeViewImg from "../img/layout/scope-view.png";

export default () => (
  <Page className="bg-color-regal-blue">
    <Navbar>
      <NavLeft>
        <BackButton link="/" />
      </NavLeft>
      <NavTitle>Tạo trang mới</NavTitle>
    </Navbar>
    <div className="full-height display-flex justify-content-center align-items-center">
      <Block>
        <Row className="padding-bottom">
          <Col>
            <Link href={`/layout/${LAYOUT_CHART}`} view=".view-main">
              <img src={chartImg} className="responsive" />
            </Link>
          </Col>
          <Col>
            <Link href={`/layout/${LAYOUT_TABLE}`} view=".view-main">
              <img src={tableImg} className="responsive" />
            </Link>
          </Col>
          <Col>
            <Link href={`/layout/${LAYOUT_NUMBER}`} view=".view-main">
              <img src={numberImg} className="responsive" />
            </Link>
          </Col>
        </Row>
        <Row className="padding-bottom">
          <Col>
            <Link href={`/layout/${LAYOUT_TEXT}`} view=".view-main">
              <img src={textImg} className="responsive" />
            </Link>
          </Col>
          <Col>
            {/* <Link href={`/layout/${LAYOUT_BAR}`} view=".view-main"> */}
            <Link view=".view-main">
              <img src={barChartImg} className="responsive" />
            </Link>
          </Col>
          <Col>
            <Link href={`/layout/${LAYOUT_SCOPE}`} view=".view-main">
              <img src={scopeViewImg} className="responsive" />
            </Link>
          </Col>
        </Row>
        <Row className="padding-bottom">
          <Col>
            <Link href={`/layout/${LAYOUT_TABLE_CHART}`} view=".view-main">
              <img src={tableChartImg} className="responsive" />
            </Link>
          </Col>
          <Col>
            <Link href={`/layout/${LAYOUT_NUMBER_CHART}`} view=".view-main">
              <img src={numberChartImg} className="responsive" />
            </Link>
          </Col>
          <Col>
            <Link href={`/layout/${LAYOUT_NUMBER_TABLE}`} view=".view-main">
              <img src={numberTableImg} className="responsive" />
            </Link>
          </Col>
        </Row>
      </Block>
    </div>
  </Page>
);
