import React from "react";
import { f7, Button } from "framework7-react";
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

const NewPagePopup = ({ handleNewPage }) => {
  const conSelectHandler = (event) => {
    const chartType = event.currentTarget.id;
    handleNewPage(chartType);
    f7.popup.close();
  };
  return (
    <Page className="bg-color-regal-blue">
      <Navbar>
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
  );
};

export default NewPagePopup;
