import React, { Component } from "react";
import { Popup, Icon, Navbar, Row, Col, NavLeft, Link, List, ListItem, Button, Block, f7 } from "framework7-react";

import {
  STEP_GUIDE,
  STEP_CONNECTING,
  STEP_FAIL,
  STEP_MANUAL,
  DEVICE_PREFIX,
  DASHBOARD,
  YOLOBIT,
} from "../../js/constants";
import storeService from "../../services/store-service";
import * as BluetoothUtil from "../../utils/bluetooth-utils";
import * as commandUtils from "../../utils/command-utils";
import { ConnectContext } from "./connect-context";
import * as core from "../../utils/core";

export default class extends Component {
  constructor(props) {
    super(props);
    this.state = {
      step: STEP_GUIDE,
      devices: [],
      isAutoConnect: true,
      isScanning: false,
    };
    this.settingService = new storeService(`setting`);
    this.callbackExec = null;
  }

  static contextType = ConnectContext;

  componentDidMount = () => {
    let dataSetting = this.settingService.recent();
    if (dataSetting && dataSetting.auto_connect !== undefined) {
      this.setState({ isAutoConnect: dataSetting.auto_connect });
    }
  };

  onPopupOpened = () => {
    this.handleScanDevicesCordova();
  };

  onClickScan = () => {
    this.handleScanDevicesCordova();
  };

  handleScanDevicesCordova = () => {
    this.resetListDevice();
    this.setState({ step: STEP_CONNECTING });
    BluetoothUtil.scanDevicesCordova(this.handleScanDone, this.handleScanError, this.showDevice);
  };

  connectDevice = async (device) => {
    BluetoothUtil.connectDevice(device, this.handleConnectSuccess, this.handleDisconnect, this.state.isAutoConnect);
  };

  showDevice = (device) => {
    let { devices, isScanning } = this.state;
    const deviceIndex = devices.findIndex((d) => d.id === device.id);
    if (deviceIndex < 0) {
      if (isScanning) {
        devices.push(device);
      } else {
        devices = [device];
      }
      this.setState({ devices, step: STEP_MANUAL, isScanning: true });
    }
  };

  handleConnectSuccess = async (device) => {
    this.context.setConnectStatus(true);
    this.$f7.popup.close(".scan-device");
    core.updateConnectedDeviceNameHistory(
      device.name && device.name.length > 0 && device.name.substring(0, DEVICE_PREFIX.length) === DEVICE_PREFIX
        ? device.name.substring(DEVICE_PREFIX.length)
        : device.name,
      device.id
    );
    this.setState({ step: STEP_GUIDE, isScanning: false, devices: [] });
    BluetoothUtil.receiveBleNotificationCordova();
    if (
      !this.$f7.views.main.router.url.includes("/dashboards/yolobit") &&
      !this.$f7.views.main.router.url.includes("/dashboards/myrobot")
    ) {
      await commandUtils.sendStopRepl();
    }
    if (this.callbackExec) {
      await this.callbackExec();
      this.callbackExec = null;
    }
  };

  handleDisconnect = () => {
    this.context.setConnectStatus(false);
    this.setState({ step: STEP_FAIL, isScanning: false });
  };

  handleConnectError = () => {
    this.context.setConnectStatus(false);
    this.setState({ step: STEP_FAIL });
    this.resetListDevice();
  };

  handleScanDone = () => {
    this.setState({ step: STEP_MANUAL, isScanning: false });
  };

  handleScanError = () => {
    this.setState({ step: STEP_FAIL, isScanning: false });
    this.resetListDevice();
  };

  resetListDevice = () => {
    this.setState({ devices: [] });
  };

  open = (callback) => {
    this.$f7.popup.open(".scan-device");
    if (callback) this.callbackExec = callback;
  };

  render() {
    const { step, isScanning } = this.state;
    return (
      <Popup className="scan-device" onPopupOpened={this.onPopupOpened}>
        <Navbar transparent>
          <NavLeft>
            <Link iconIos="material:close" iconMd="material:close" popupClose />
            <Button
              fill
              color="white"
              round
              onClick={this.onClickScan}
              disabled={step === STEP_CONNECTING || isScanning}
            >
              <span>
                <Icon ios="material:bluetooth" md="material:bluetooth"></Icon> Tìm thiết bị
              </span>
            </Button>
          </NavLeft>
        </Navbar>
        {step === STEP_GUIDE && <Block className="guide"></Block>}
        {step === STEP_CONNECTING && (
          <Block className="connecting">
            <Row>
              <Col>
                <img src="static/connect/hand-mobile.gif" className="responsive" />
              </Col>
              <Col>
                <img src="static/connect/connecting.gif" className="responsive" />
              </Col>
            </Row>
          </Block>
        )}
        {step === STEP_FAIL && (
          <Block className="guide">
            <Row>
              <Col>
                <p>Hãy đảm bảo:</p>
                <p>
                  1. Bluetooth đã được <span>BẬT</span> trên thiết bị này
                </p>
                <p>
                  2. Bạn đã <span>CẤP QUYỀN</span> sử dụng Bluetooth
                  {f7.device.android === true ? " và truy cập Thông tin vị trí" : ""} trên thiết bị này
                </p>
                {f7.device.android === true ? (
                  <>
                    <p>
                      <img src="static/connect/bluetooth-android.png" className="responsive" />
                    </p>
                    <p>
                      <img src="static/connect/location-android.png" className="responsive" />
                    </p>
                  </>
                ) : (
                  <p>
                    <img src="static/connect/bluetooth-ios.png" className="responsive" />
                  </p>
                )}
              </Col>
              <Col>
                <img src="static/connect/connect-fail.png" className="responsive" />
              </Col>
            </Row>
          </Block>
        )}
        {step === STEP_MANUAL && (
          <Block>
            <List>
              {this.state.devices.map((device) => (
                <ListItem
                  key={device.id}
                  title={
                    device.name &&
                    device.name.length > 0 &&
                    device.name.substring(0, DEVICE_PREFIX.length) === DEVICE_PREFIX
                      ? device.name.substring(DEVICE_PREFIX.length)
                      : device.name || device.id
                  }
                  onClick={() => this.connectDevice(device)}
                  link="#"
                />
              ))}
            </List>
          </Block>
        )}
      </Popup>
    );
  }
}
