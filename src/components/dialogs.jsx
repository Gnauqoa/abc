import React, { Component } from "react";
import { Button, Row, Col, Icon, f7, Popover, List } from "framework7-react";
import $ from "jquery";

import DataManagerIST from "../services/data-manager";
import { FREQUENCIES, SAMPLING_MANUAL_NAME, SAMPLING_MANUAL_FREQUENCY } from "../js/constants";

import { DEFAULT_CODE_NAME } from "../js/constants";
import * as core from "../utils/core";

export default class extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inputText: "Tên",
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
          alert("Vui lòng cho phép quyền truy cập camera để tiếp tục.");
        }
      },
      {
        preferFrontCamera: false, // iOS and Android
        showFlipCameraButton: true, // iOS and Android
        showTorchButton: true, // iOS and Android
        torchOn: false, // Android
        saveHistory: true, // Android
        prompt: "Canh QR Code chính giữa trong khung",
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

    return (
      <>
        <div id="dialog-alert" className="dialog-component">
          <div className="dialog-content">
            <div className="content">
              <div className="title"></div>
              <div className="text"></div>
              <div className="buttons">
                <Button className="ok-button">OK</Button>
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
                <Button className="cancel-button">Bỏ qua</Button>
                <Button className="ok-button">OK</Button>
              </div>
            </div>
          </div>
        </div>

        <div id="dialog-sample-setting" className="dialog-component">
          <div className="dialog-content">
            <div className="content">
              <div className="title" />
              <div className="items">
                <div className="item">
                  <div className="text">Chu kỳ: </div>
                  <Button
                    id="input-sampling-frequency"
                    className="button"
                    raised
                    popoverOpen=".popover-frequency-advanced"
                  >
                    {this.state.samplingFrequency === SAMPLING_MANUAL_FREQUENCY
                      ? SAMPLING_MANUAL_NAME
                      : `${this.state.samplingFrequency}HZ`}
                  </Button>
                </div>

                <div className="item">
                  <div className="text">Thời gian (giây): </div>
                  <input
                    id="input-sampling-time"
                    type="text"
                    placeholder="--"
                    className="input"
                    value={this.state.samplingTime}
                    onChange={this.handleSamplingTimeChange}
                    onKeyDown={this.handleOkByEnter}
                  />
                </div>
              </div>
              <div className="buttons">
                <Button className="cancel-button">Bỏ qua</Button>
                <Button className="ok-button">OK</Button>
              </div>
            </div>
          </div>

          <Popover
            className="popover-frequency-advanced"
            style={{ borderRadius: "10px", width: "120px", zIndex: 99999 }}
          >
            <List className="test">
              {[...FREQUENCIES, SAMPLING_MANUAL_FREQUENCY].map((f) => {
                const frequency = f === SAMPLING_MANUAL_FREQUENCY ? SAMPLING_MANUAL_NAME : `${f}HZ`;
                return (
                  <Button
                    key={f}
                    textColor="black"
                    onClick={() => {
                      this.setState({
                        ...this.state,
                        samplingFrequency: f,
                      });
                      f7.popover.close();
                    }}
                  >
                    {frequency}
                  </Button>
                );
              })}
            </List>
          </Popover>
        </div>

        <div id="dialog-delete" className="dialog-component">
          <div className="dialog-content">
            <div className="content">
              <div className="title"></div>
              <div className="text"></div>
              <div className="buttons">
                <Button className="cancel-button">Không xoá</Button>
                <Button className="ok-button delete-mode">Xoá</Button>
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
                <Button className="ok-button">Có</Button>
                <Button className="cancel-button">Không</Button>
              </div>
            </div>
          </div>
        </div>

        <div id="dialog-prompt" className="dialog-component">
          <div className="dialog-content">
            <div className="content">
              <div className="title"></div>
              <div className="text"></div>
              <div className="text-1">
                <div className="form-group">
                  <input
                    type="text"
                    className="input"
                    value={this.state.samplingTime}
                    onChange={this.handleSamplingTimeChange}
                    onKeyDown={this.handleOkByEnter}
                  />
                  <Icon ios="material:backspace" md="material:backspace" className="clear-button"></Icon>
                </div>
              </div>
              <div className="buttons">
                <Button className="cancel-button">Bỏ qua</Button>
                <Button className="ok-button" disabled={!inputText.length}>
                  Lưu
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
                <Button className="cancel-button">Bỏ qua</Button>
                <Button className="ok-button">Lưu</Button>
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
                    Scan QR Code
                  </Button>
                </div>
              )}

              <div className="text-1">
                <div>Hoặc địa chỉ của project được chia sẻ</div>
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
                <Button className="cancel-button">Bỏ qua</Button>
                <Button className="ok-button">Lưu</Button>
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
                  <Icon f7="clear" className="clear-button"></Icon>
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
                <Button className="ok-button">OK</Button>
              </div>
            </div>
          </div>
        </div>

        <div id="dialog-firmware" className="dialog-component">
          <div className="dialog-content">
            <div className="content">
              <div className="title">Nâng cấp firmware</div>
              <div className="text">
                Đã có bản cập nhật firmware mới cho robot của bạn.{" "}
                <a href="https://fw.ohstem.vn" target="_blank" className="link external">
                  Nhấn vào đây
                </a>{" "}
                để đến trang web cập nhật firmware (yêu cầu máy tính và kết nối qua dây cáp USB)
              </div>
              <div className="checkboxs">
                <label className="remind">
                  <input id="remind-checkbox" className="remind-checkbox" type="checkbox" />
                  Không nhắc lại nữa
                </label>
              </div>
              <div className="buttons">
                <Button className="ok-button">OK</Button>
              </div>
            </div>
          </div>
        </div>

        <div id="dialog-devicename" className="dialog-component">
          <div className="dialog-content">
            <div className="content">
              <div className="title">Đổi tên thiết bị</div>
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
                <Button className="cancel-button">Hủy</Button>
                <Button className="ok-button" disabled={!inputText.length || inputText.trim().length === 0}>
                  Lưu
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div id="dialog-error-instruction" className="dialog-component">
          <div className="dialog-content">
            <div className="content">
              <div className="title">Có lỗi xảy ra</div>
              <div className="error-content"></div>
              <div className="buttons">
                <Button className="cancel-button">Bỏ qua</Button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}
