import React, { useRef } from "react";
import { f7, Button } from "framework7-react";
import { Page, Link, Navbar, NavTitle, Row, Col, NavLeft, Block, Popup } from "framework7-react";

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
} from "../../../js/constants";

import "./index.scss";

import chartImg from "../../../img/layout/chart.png";
import numberChartImg from "../../../img/layout/number-chart.png";
import numberTableImg from "../../../img/layout/number-table.png";
import numberImg from "../../../img/layout/number.png";
import tableChartImg from "../../../img/layout/table-chart.png";
import tableImg from "../../../img/layout/table.png";
import textImg from "../../../img/layout/text-view.png";
import barChartImg from "../../../img/layout/bar-chart.png";
import scopeViewImg from "../../../img/layout/scope-view.png";

const NewPagePopup = ({ handleNewPage }) => {
  const newPagePopupRef = useRef();
  const conSelectHandler = (event) => {
    const chartType = event.currentTarget.id;
    handleNewPage(chartType);
    f7.popup.close();
  };
  return (
    <Popup className="new-page-popup" ref={newPagePopupRef}>
      <Page className="bg-color-regal-blue">
        <Navbar className="header-nav">
          <NavLeft>
            <Button
              iconIos="material:arrow_back"
              iconMd="material:arrow_back"
              iconAurora="material:arrow_back"
              className="back-icon margin-right"
              popupClose
            ></Button>
          </NavLeft>
          <NavTitle>Tạo trang mới</NavTitle>
        </Navbar>
        <div className="full-height display-flex justify-content-center align-items-center">
          <Block>
            <Row className="padding-bottom">
              <Col>
                <Link id={LAYOUT_CHART} view=".view-main" onClick={conSelectHandler}>
                  <img src={chartImg} className="responsive" />
                </Link>
              </Col>
              <Col>
                <Link id={LAYOUT_TABLE} view=".view-main" onClick={conSelectHandler}>
                  <img src={tableImg} className="responsive" />
                </Link>
              </Col>
              <Col>
                <Link id={LAYOUT_NUMBER} view=".view-main" onClick={conSelectHandler}>
                  <img src={numberImg} className="responsive" />
                </Link>
              </Col>
            </Row>
            <Row className="padding-bottom">
              <Col>
                <Link id={LAYOUT_TEXT} view=".view-main" onClick={conSelectHandler}>
                  <img src={textImg} className="responsive" />
                </Link>
              </Col>
              <Col>
                <Link id={LAYOUT_BAR} view=".view-main" onClick={conSelectHandler}>
                  <img src={barChartImg} className="responsive" />
                </Link>
              </Col>
              <Col>
                <Link id={LAYOUT_SCOPE} view=".view-main" onClick={conSelectHandler}>
                  <img src={scopeViewImg} className="responsive" />
                </Link>
              </Col>
            </Row>
            <Row>
              <Col>
                <Link id={LAYOUT_TABLE_CHART} view=".view-main" onClick={conSelectHandler}>
                  <img src={tableChartImg} className="responsive" />
                </Link>
              </Col>
              <Col>
                <Link id={LAYOUT_NUMBER_CHART} view=".view-main" onClick={conSelectHandler}>
                  <img src={numberChartImg} className="responsive" />
                </Link>
              </Col>
              <Col>
                <Link id={LAYOUT_NUMBER_TABLE} view=".view-main" onClick={conSelectHandler}>
                  <img src={numberTableImg} className="responsive" />
                </Link>
              </Col>
            </Row>
          </Block>
        </div>
      </Page>
    </Popup>
  );
};

export default NewPagePopup;
