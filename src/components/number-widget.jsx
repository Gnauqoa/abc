import React, { useState } from "react";
import { Page, BlockTitle, Row, ListItem, BlockFooter } from "framework7-react";

export default class NumberWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = { sensorValue: -1 };
  }

  flexFont = function () {
    var divs = document.getElementsByClassName("flexFont");
    for (var i = 0; i < divs.length; i++) {
      var relFontsize = divs[i].offsetWidth * 20;
      divs[i].style.fontSize = relFontsize + "px";
    }
  };

  componentDidMount() {
    this.flexFont();
  }

  render() {
    return (
      <Page className="custom-number-widget-page">
        <BlockTitle>
          <div className="flexFont">
            <h2 className="auto-size">
              {() => {
                if (this.props.floatingPoint === true) {
                  Math.round(this.props.valueSensor * 100) / 100;
                } else {
                  this.props.valueSensor;
                }
              }}
            </h2>
            <div className="smaller">
              <p>%</p>
            </div>
          </div>
        </BlockTitle>
      </Page>
    );
  }
}
