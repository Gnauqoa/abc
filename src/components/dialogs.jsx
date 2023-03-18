import React, { Component } from "react";
import { Button, Row, Col, Icon, f7 } from "framework7-react";

import { FREQUENCIES, DEFAULT_CODE_NAME } from "../js/constants";
import * as core from "../utils/core";

export default class extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inputText: "Tên",
    };
    this.inputNumpad = React.createRef();
  }

  componentDidMount = () => {
    this.$$("#dialog-prompt .clear-button").on("click", () => {
      this.setState({ inputText: this.$$("#dialog-prompt .input").val().slice(0, -1) });
    });
    this.$$("#dialog-prompt-numpad .clear-button").on("click", () => {
      this.inputNumpad.current.value = "";
    });

    /* Piano */
    const key = Array.from(document.querySelectorAll(".key"));
    let volume = 0.5;

    //Create new audio context when note played
    function playNote(note, length) {
      const AudioContext = window.AudioContext || window.webkitAudioContext,
        ctx = new AudioContext(),
        oscillator = ctx.createOscillator(),
        gainNode = ctx.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = note;
      gainNode.gain.value = volume;
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start(0);
      //Trying to prevent popping sound on note end. Probably can be improved
      gainNode.gain.setTargetAtTime(0, length / 1000 - 0.05, 0.08);
      oscillator.stop(ctx.currentTime + (length / 1000 + 0.2));
      oscillator.onended = () => ctx.close();
    }

    //Finds clicked element returns data-note value and runs playKey function
    function onClickPlay(e) {
      let key = 0;
      let length = 300;
      let noteClass = e.target.dataset.note;
      window.selectedNote = noteClass;
      f7.$(".active-note").removeClass("active-note");
      f7.$(e.target).addClass("active-note");
      for (let i = 0; i < FREQUENCIES.length; i++) {
        if (FREQUENCIES[i][0] === noteClass) {
          key = FREQUENCIES[i][1];
        }
      }
      addVisual(e.target);
      playNote(key, length);
    }

    //adds css class when note played
    function addVisual(key, length) {
      key.classList.add("played");
      setTimeout(() => {
        key.classList.remove("played");
      }, length || 300);
    }

    //event listeners
    key.forEach((key) => {
      key.addEventListener("click", onClickPlay);
    });
  };

  handleInputTextChange = (e) => {
    this.setState({ inputText: e.target.value.trimStart() });
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
                    value={this.state.inputText}
                    onChange={this.handleInputTextChange}
                    onKeyDown={this.handleOkByEnter}
                  />
                  <Icon ios="material:backspace" md="material:backspace" className="clear-button"></Icon>
                </div>
              </div>
              <div className="buttons">
                <Button className="cancel-button">Bỏ qua</Button>
                <Button className="ok-button" disabled={!inputText.length || inputText.trim() === DEFAULT_CODE_NAME}>
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

        <div id="dialog-prompt-piano" className="dialog-component">
          <div id="piano-content" className="dialog-content">
            <div className="content">
              <div className="piano-wrap">
                <div className="keyboard">
                  <div data-note="C3" className="key white">
                    đô
                  </div>
                  <div data-note="DB3" className="key black black1"></div>
                  <div data-note="D3" className="key white">
                    rê
                  </div>
                  <div data-note="EB3" className="key black black2"></div>
                  <div data-note="E3" className="key white">
                    mi
                  </div>
                  <div data-note="F3" className="key white">
                    fa
                  </div>
                  <div data-note="GB3" className="key black black3"></div>
                  <div data-note="G3" className="key white">
                    sol
                  </div>
                  <div data-note="AB3" className="key black black4"></div>
                  <div data-note="A3" className="key white">
                    la
                  </div>
                  <div data-note="BB3" className="key black black5"></div>
                  <div data-note="B3" className="key white">
                    si
                  </div>

                  <div data-note="C4" className="key white">
                    đô
                  </div>
                  <div data-note="DB4" className="key black black6"></div>
                  <div data-note="D4" className="key white">
                    rê
                  </div>
                  <div data-note="EB4" className="key black black7"></div>
                  <div data-note="E4" className="key white">
                    mi
                  </div>
                  <div data-note="F4" className="key white">
                    fa
                  </div>
                  <div data-note="GB4" className="key black black8"></div>
                  <div data-note="G4" className="key white">
                    sol
                  </div>
                  <div data-note="AB4" className="key black black9"></div>
                  <div data-note="A4" className="key white">
                    la
                  </div>
                  <div data-note="BB4" className="key black black10"></div>
                  <div data-note="B4" className="key white">
                    si
                  </div>

                  <div data-note="C5" className="key white">
                    đô
                  </div>
                  <div data-note="DB5" className="key black black11"></div>
                  <div data-note="D5" className="key white">
                    rê
                  </div>
                  <div data-note="EB5" className="key black black12"></div>
                  <div data-note="E5" className="key white">
                    mi
                  </div>
                  <div data-note="F5" className="key white">
                    fa
                  </div>
                  <div data-note="GB5" className="key black black13"></div>
                  <div data-note="G5" className="key white">
                    sol
                  </div>
                  <div data-note="AB5" className="key black black14"></div>
                  <div data-note="A5" className="key white">
                    la
                  </div>
                  <div data-note="BB5" className="key black black15"></div>
                  <div data-note="B5" className="key white">
                    si
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="dialog-location" className="dialog-component">
          <div className="dialog-content">
            <div className="content" style={{ maxWidth: "460px" }}>
              <div className="title">
                <Icon ios="material:location_on" md="material:location_on"></Icon> Sử dụng định vị (Use your location)
              </div>
              <p style={{ margin: "auto 20px 15px" }}>
                Khi sử dụng ứng dụng để quét và kết nối với thiết bị, bạn được yêu cầu bật Định Vị. Điều này cần thiết
                cho mục đích giao tiếp Bluetooth năng lượng thấp. Chúng tôi không dùng Định Vị khi ứng dụng không được
                sử dụng. Chúng tôi không thu thập, lưu trữ hoặc chia sẻ thông tin này.
              </p>
              <p style={{ margin: "auto 20px" }}>
                When using the app to scan and connect to device, you will be asked to enable Location. This is required
                for the Bluetooth low energy communication item. We do not use location when the app is not in use. We
                do not collect, store or share this information.
              </p>
              <div className="buttons">
                <Button className="cancel-button">Bỏ qua</Button>
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
