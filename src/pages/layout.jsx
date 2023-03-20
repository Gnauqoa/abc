import React from "react";
import { Page, Link, Navbar, NavTitle, Row, Col, NavLeft, Block } from "framework7-react";

import {
  LAYOUT_CHART,
  LAYOUT_TABLE,
  LAYOUT_NUMBER,
  LAYOUT_TABLE_CHART,
  LAYOUT_NUMBER_CHART,
  LAYOUT_NUMBER_TABLE,
} from "../js/constants";

import chartImg from "../img/layout/chart.png";
import numberChartImg from "../img/layout/number-chart.png";
import numberTableImg from "../img/layout/number-table.png";
import numberImg from "../img/layout/number.png";
import tableChartImg from "../img/layout/table-chart.png";
import tableImg from "../img/layout/table.png";

export default ({ f7router }) => (
  <Page className="bg-color-regal-blue custom-dashboards">
    <Navbar className="custom-dashboards-navbar">
      <NavLeft>
        <Link
          iconIos="material:arrow_back"
          iconMd="material:arrow_back"
          className="back-icon"
          onClick={() => f7router.back()}
        />
      </NavLeft>
      <NavTitle>Hoạt động mới</NavTitle>
    </Navbar>
    <div className="page-content display-flex justify-content-center align-items-center">
      <Block>
        <Row>
          <Col>
            <Link href={`/chart/1`} view=".view-main">
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
        <Row>
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
