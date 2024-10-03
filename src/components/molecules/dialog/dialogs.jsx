import React, { Component } from "react";
import { Button, Row, Col, Icon, f7, Popover, List } from "framework7-react";
import $ from "jquery";
import { withTranslation } from "react-i18next";

import DataManagerIST from "../../../services/data-manager";
import {
  FREQUENCIES,
  SAMPLING_MANUAL_NAME,
  SAMPLING_MANUAL_FREQUENCY,
  INVERSE_FREQUENCY_UNIT,
} from "../../../js/constants";

import { DEFAULT_CODE_NAME, FREQUENCY_UNIT } from "../../../js/constants";
import * as core from "../../../utils/core";

class Dialogs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inputText: "Tên",
      inputNote: "Note",
      samplingTime: "",
      samplingFrequency: DataManagerIST.getCollectingDataFrequency(),
    };
    this.inputNumpad = React.createRef();
  }

  componentDidMount = () => {
    $("#dialog-prompt .clear-button").on("click", () => {
      this.setState({ inputText: $("#dialog-prompt .input").val().slice(0, -1) });
    });
    $("#dialog-prompt-numpad .clear-button").on("click", () => {
      this.inputNumpad.current.value = "";
    });
  };

  handleInputTextChange = (e) => {
    this.setState({ inputText: e.target.value.trimStart() });
  };

  handleInputNoteChange = (e) => {
    this.setState({ inputNote: e.target.value.trimStart() });
  };

  handleSamplingTimeChange = (e) => {
    this.setState({ ...this.state, samplingTime: e.target.value.trim() });
  };

  handleInputTextChangeForDevice = (e) => {
    this.setState({ inputText: e.target.value.trimStart().substring(0, 15) });
  };

  handleBtnNum = (btn) => {
    if (window.toClearNumpad) {
      this.inputNumpad.current.value = "";
      window.toClearNumpad = false;
    }

    let currentInput = this.inputNumpad.current.value;
    if (currentInput.length > 11) {
      return;
    }

    if (btn === "-/+") {
      if (currentInput.substring(0, 1) === "-") {
        currentInput = currentInput.substr(1, currentInput.length);
      } else {
        currentInput = "-" + currentInput;
      }
    } else if (btn === ".") {
      if (currentInput.length > 0 && currentInput.indexOf(".") === -1) {
        currentInput += ".";
      }
    } else if (btn === "0") {
      if (
        (currentInput.substring(0, 1) === "0" && currentInput.length === 1) ||
        (currentInput.substring(0, 2) === "-0" && currentInput.length === 2)
      ) {
        return;
      }
      currentInput += "0";
    } else {
      if (currentInput.substring(0, 1) === "0" && currentInput.length === 1) {
        currentInput = btn;
      } else {
        currentInput += btn;
      }
    }

    this.inputNumpad.current.value = currentInput;
  };

  handleOkByEnter = (e) => {
    if (core.isPressEnter(e)) {
      this.$f7.$("#dialog-prompt .ok-button").click();
    }
  };

  scanQRCode = () => {
    window.cordova.plugins.barcodeScanner.scan(
      (result) => {
        if (result.cancelled) {
          return;
        }
        this.setState({
          inputText: result.text,
        });
      },
      (error) => {
        if (error === "Illegal access") {
          alert(t("modules.please_allow_camera_access_to_continue"));
        }
      },
      {
        preferFrontCamera: false, // iOS and Android
        showFlipCameraButton: true, // iOS and Android
        showTorchButton: true, // iOS and Android
        torchOn: false, // Android
        saveHistory: true, // Android
        prompt: t("modules.align_the_QR_Code_to_the_center_of_the_frame"),
        resultDisplayDuration: 200,
        formats: "QR_CODE",
        orientation: "landscape", // Android only (portrait|landscape)
        disableAnimations: true, // iOS
        disableSuccessBeep: false, // iOS and Android
      }
    );
  };

  render() {
    const { inputText } = this.state;
    const t = this.props.t;

    return (
      <>
        <div id="dialog-alert" className="dialog-component">
          <div className="dialog-content">
            <div className="content">
              <div className="title"></div>
              <div className="text"></div>
              <div className="buttons">
                <Button className="ok-button">{t("common.ok")}</Button>
              </div>
            </div>
          </div>
        </div>

        <div id="dialog-confirm" className="dialog-component">
          <div className="dialog-content">
            <div className="content">
              <div className="title"></div>
              <div className="text"></div>
              <div className="buttons">
                <Button className="cancel-button">{t("common.cancel")}</Button>
                <Button className="ok-button">{t("common.ok")}</Button>
              </div>
            </div>
          </div>
        </div>

        <div id="dialog-delete" className="dialog-component">
          <div className="dialog-content">
            <div className="content">
              <div className="title"></div>
              <div className="text"></div>
              <div className="buttons">
                <Button className="cancel-button">{t("common.do_not_delete")}</Button>
                <Button className="ok-button delete-mode">{t("common.delete")}</Button>
              </div>
            </div>
          </div>
        </div>

        <div id="dialog-question" className="dialog-component">
          <div className="dialog-content">
            <div className="content">
              <div className="title"></div>
              <div className="text"></div>
              <div className="buttons">
                <Button className="ok-button">{t("common.yes")}</Button>
                <Button className="cancel-button">{t("common.no")}</Button>
              </div>
            </div>
          </div>
        </div>

        <div id="dialog-prompt" className="dialog-component">
          <div className="dialog-content">
            <div className="content">
              <div className="header">
                <div className="skip-button">
                  <Icon
                    ios="material:arrow_back"
                    md="material:arrow_back"
                    iconAurora="material:arrow_back"
                    className="prevent-select"
                  ></Icon>
                </div>
                <div className="title"></div>
              </div>
              <div className="text"></div>
              <div className="text-1">
                <div className="form-group">
                  <input
                    type="text"
                    className="input"
                    value={this.state.inputText}
                    onChange={this.handleInputTextChange}
                    onKeyDown={this.handleOkByEnter}
                  />
                  <Icon ios="material:backspace" md="material:backspace" className="clear-button prevent-select"></Icon>
                </div>
              </div>
              <div className="buttons">
                <Button className="cancel-button">{t("common.cancel")}</Button>
                <Button className="ok-button" disabled={!inputText.length}>
                  {t("common.save")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div id="dialog-zip-upload" className="dialog-component">
          <div className="dialog-content">
            <div className="content">
              <div className="title"></div>
              <div className="text"></div>
              <div className="upload">
                <input
                  id="zip-file-upload"
                  type="file"
                  accept=".zip"
                  tabIndex={0}
                  autoFocus
                  aria-describedby="selectFileToOpenLabel"
                  className="zip-file-upload"
                />
              </div>
              <div className="buttons">
                <Button className="cancel-button">{t("common.cancel")}</Button>
                <Button className="ok-button">{t("common.save")}</Button>
              </div>
            </div>
          </div>
        </div>

        <div id="dialog-json-upload" className="dialog-component">
          <div className="dialog-content">
            <div className="content">
              <div className="title"></div>
              <div className="text"></div>

              {f7.device.cordova == false && (
                <div className="upload">
                  <input
                    id="json-file-upload"
                    type="file"
                    accept=".json"
                    tabIndex={0}
                    autoFocus
                    aria-describedby="selectFileToOpenLabel"
                    className="json-file-upload"
                  />
                </div>
              )}

              {f7.device.cordova == true && (
                <div style={{ width: "160px", marginLeft: "auto", marginRight: "auto" }}>
                  <Button large iconF7={"qrcode"} onClick={this.scanQRCode}>
                    {t("modules.scan_QR_Code")}
                  </Button>
                </div>
              )}

              <div className="text-1">
                <div>{t("modules.or_the_address_of_the_shared_project")}</div>
                <div className="form-group">
                  <input
                    id="import-project-input"
                    type="text"
                    className="input"
                    value={this.state.inputText}
                    onChange={this.handleInputTextChange}
                  />
                </div>
              </div>
              <div className="buttons">
                <Button className="cancel-button">{t("common.cancel")}</Button>
                <Button className="ok-button">{t("common.save")}</Button>
              </div>
            </div>
          </div>
        </div>

        <div id="dialog-prompt-numpad" className="dialog-component">
          <div className="dialog-content">
            <div className="content">
              <div className="text-1">
                <div className="form-group">
                  <input className="input" readOnly type="text" ref={this.inputNumpad} />
                  <Icon f7="clear" className="clear-button prevent-select"></Icon>
                </div>
                <div className="numpad-content">
                  <Row>
                    <Col>
                      <Button raised onClick={() => this.handleBtnNum("7")}>
                        7
                      </Button>
                    </Col>
                    <Col>
                      <Button raised onClick={() => this.handleBtnNum("8")}>
                        8
                      </Button>
                    </Col>
                    <Col>
                      <Button raised onClick={() => this.handleBtnNum("9")}>
                        9
                      </Button>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Button raised onClick={() => this.handleBtnNum("4")}>
                        4
                      </Button>
                    </Col>
                    <Col>
                      <Button raised onClick={() => this.handleBtnNum("5")}>
                        5
                      </Button>
                    </Col>
                    <Col>
                      <Button raised onClick={() => this.handleBtnNum("6")}>
                        6
                      </Button>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Button raised onClick={() => this.handleBtnNum("1")}>
                        1
                      </Button>
                    </Col>
                    <Col>
                      <Button raised onClick={() => this.handleBtnNum("2")}>
                        2
                      </Button>
                    </Col>
                    <Col>
                      <Button raised onClick={() => this.handleBtnNum("3")}>
                        3
                      </Button>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Button raised onClick={() => this.handleBtnNum("0")}>
                        0
                      </Button>
                    </Col>
                    <Col>
                      <Button raisedraised onClick={() => this.handleBtnNum(".")}>
                        .
                      </Button>
                    </Col>
                    <Col>
                      <Button raised onClick={() => this.handleBtnNum("-/+")}>
                        -/+
                      </Button>
                    </Col>
                  </Row>
                </div>
              </div>
              <div className="buttons">
                <Button className="ok-button">{t("common.ok")}</Button>
              </div>
            </div>
          </div>
        </div>

        <div id="dialog-firmware" className="dialog-component">
          <div className="dialog-content">
            <div className="content">
              <div className="title">{t("modules.firmware_upgrade")}</div>
              <div className="text">
                {t("modules.a_new_firmware_update_is_available_for_your_robot")}{" "}
                <a href="https://fw.ohstem.vn" target="_blank" className="link external">
                  {t("modules.click_here")}
                </a>{" "}
                {t("modules.to_go_to_the_firmware_update_website_requires_computer_and_connection_via_USB_cable")}
              </div>
              <div className="checkboxs">
                <label className="remind">
                  <input id="remind-checkbox" className="remind-checkbox" type="checkbox" />
                  {t("modules.do_not_mention_it_again")}
                </label>
              </div>
              <div className="buttons">
                <Button className="ok-button">{t("common.ok")}</Button>
              </div>
            </div>
          </div>
        </div>

        <div id="dialog-devicename" className="dialog-component">
          <div className="dialog-content">
            <div className="content">
              <div className="title"> {t("modules.rename_the_device")}</div>
              <div className="text-1">
                <div className="form-group">
                  <input
                    type="text"
                    className="input"
                    value={this.state.inputText}
                    onChange={this.handleInputTextChangeForDevice}
                  />
                </div>
              </div>
              <div className="buttons">
                <Button className="cancel-button">{t("common.cancel")}</Button>
                <Button className="ok-button" disabled={!inputText.length || inputText.trim().length === 0}>
                  {t("common.save")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div id="dialog-error-instruction" className="dialog-component">
          <div className="dialog-content">
            <div className="content">
              <div className="title">{t("modules.an_error_occurred")}</div>
              <div className="error-content"></div>
              <div className="buttons">
                <Button className="cancel-button">{t("common.cancel")}</Button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default withTranslation()(Dialogs);
