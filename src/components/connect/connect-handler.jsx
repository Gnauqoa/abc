import React, { Component } from "react";
import clsx from "clsx";

import { Button, f7 } from "framework7-react";
import store from "store";
import ScanDevice from "../../components/connect/scan-device";
import * as WebSerialUtil from "../../utils/webserial-utils";
import * as BluetoothUtil from "../../utils/bluetooth-utils";
import * as core from "../../utils/core";
import { ConnectContext } from "./connect-context";
import dialog from "../dialog";

import { CONNECT_BLE_TYPE, CONNECT_SERIAL_TYPE, DASHBOARD, XBOT, XBUILD, YOLOBIT, AI_DEVICE } from "../../js/constants";

export default class extends Component {
  constructor(props) {
    super(props);
  }

  static contextType = ConnectContext;

  componentDidMount = () => {};

  handleConnections = async (callback, fromConnectType = null) => {
    if (!fromConnectType) {
      if (store.get("serial-connected")) {
        fromConnectType = CONNECT_SERIAL_TYPE;
      } else {
        fromConnectType = CONNECT_BLE_TYPE;
      }
    }
    // Disconnect other connection type
    if (this.context.isDeviceConnected && this.context.deviceConnectedType !== fromConnectType) {
      if (f7.device.cordova) {
        BluetoothUtil.disconnectDeviceCordova(() => {
          this.context.setConnectStatus(false);
        });
      } else {
        if (this.context.deviceConnectedType === CONNECT_BLE_TYPE) {
          BluetoothUtil.disconnectDeviceWeb(() => {
            this.context.setConnectStatus(false);
          });
        } else if (this.context.deviceConnectedType === CONNECT_SERIAL_TYPE) {
          WebSerialUtil.disconnect();
        }
      }

      await core.sleep(500);
    }

    switch (fromConnectType) {
      case CONNECT_BLE_TYPE:
        this.handleBleConnections(callback);
        break;
      case CONNECT_SERIAL_TYPE:
        this.handleSerialConnectionsWeb(callback);
        break;
    }
  };

  handleBleConnections(callback) {
    if (f7.device.cordova) {
      this.handleBleConnectionsCordova(callback);
    } else {
      this.handleBleConnectionsWeb(callback);
    }
  }

  handleSerialConnectionsWeb(callback) {
    if (this.context.isDeviceConnected === false) {
      WebSerialUtil.scanPorts(
        async () => {
          this.context.setConnectStatus(true, CONNECT_SERIAL_TYPE);
          if (callback) await callback();
        },
        (disconnect) => {
          this.context.setConnectStatus(false);
        },
        false,
        false
      );
    } else {
      WebSerialUtil.disconnect();
    }
  }

  handleBleConnectionsCordova(callback) {
    const scanDevice = this.refs["scan-device-ref"];
    if (this.context.isDeviceConnected === false) {
      ble.isEnabled(
        () => {
          scanDevice.open(callback);
        },
        () => {
          // Bluetooth not yet enabled so we try to enable it
          if (f7.device.ios) {
            dialog.alert("Lỗi Bluetooth", "Hãy đảm bảo Bluetooth đã được bật trên thiết bị này!", () => {});
          } else {
            ble.enable(
              () => {
                scanDevice.open(callback);
              },
              (err) => {
                logger.error("Cannot enable bluetooth", err);
              }
            );
          }
        }
      );
    } else {
      BluetoothUtil.disconnectDeviceCordova(() => {
        this.context.setConnectStatus(false);
      });
      scanDevice.resetListDevice();
    }
  }

  handleBleConnectionsWeb(callback) {
    if (this.context.isDeviceConnected === false) {
      BluetoothUtil.scanDevicesWeb(
        async () => {
          this.context.setConnectStatus(true);
          BluetoothUtil.receiveBleNotificationWeb();

          if (callback) {
            await callback();
          }
        },
        (disconnect) => {
          this.context.setConnectStatus(false);
        }
      );
    } else {
      BluetoothUtil.disconnectDeviceWeb();
    }
  }

  handleAutoConnect(success) {
    if (this.context.isDeviceConnected === false) {
      if (core.getAutoConnectConfig()) {
        const connectedType = store.get("serial-connected") ? CONNECT_SERIAL_TYPE : core.getConnectedDeviceType();
        switch (connectedType) {
          case CONNECT_BLE_TYPE:
            if (f7.device.cordova) {
              console.log("connect manually!");
              this.handleConnections(success, CONNECT_BLE_TYPE);
            } else {
              return BluetoothUtil.autoConnectDeviceWeb(
                async () => {
                  this.context.setConnectStatus(true);
                  BluetoothUtil.receiveBleNotificationWeb();
                  success();
                },
                () => {
                  console.log("auto connect failed, connect manually now!");
                  this.handleConnections(success, CONNECT_BLE_TYPE);
                },
                (disconnect) => {
                  this.context.setConnectStatus(false);
                }
              );
            }
            break;
          case CONNECT_SERIAL_TYPE:
            if (
              !this.$f7.views.main.router.url.includes("/dashboards/yolobit") &&
              !this.$f7.views.main.router.url.includes("/ai-programs/") &&
              !this.$f7.views.main.router.url.includes("/dashboards/myrobot")
            ) {
              WebSerialUtil.scanPorts(
                async () => {
                  this.context.setConnectStatus(true, CONNECT_SERIAL_TYPE);
                  success();
                },
                (disconnect) => {
                  this.context.setConnectStatus(false);
                },
                true,
                true
              );
            } else {
              WebSerialUtil.scanPorts(
                async () => {
                  this.context.setConnectStatus(true, CONNECT_SERIAL_TYPE);
                  success();
                },
                (disconnect) => {
                  this.context.setConnectStatus(false);
                },
                true,
                false
              );
            }

            break;
        }
      } else {
        console.log("connect manually");
        const connectedType = store.get("serial-connected") ? CONNECT_SERIAL_TYPE : core.getConnectedDeviceType();
        this.handleConnections(success, connectedType);
      }
    }
  }

  render() {
    const { isDeviceConnected, deviceConnectedType } = this.context;
    return (
      <>
        {this.props?.icon && (
          <>
            <Button
              className={clsx("round-button", this.props?.isClassMobile ? "css-button-mobile" : "")}
              large
              icon={isDeviceConnected === true ? `${this.props?.icon}-on` : `${this.props?.icon}-off`}
              onClick={() => this.handleConnections(false, CONNECT_BLE_TYPE)}
            />
            <ScanDevice ref="scan-device-ref" device={this.props.device} fromComponent={this.props.fromComponent} />
          </>
        )}
        {!this.props?.icon && f7.device.cordova == true && (
          <>
            <Button
              className={clsx(
                isDeviceConnected === true && deviceConnectedType == CONNECT_BLE_TYPE
                  ? "device-connected"
                  : "device-disconnected",
                "round-button",
                this.props?.isClassMobile ? "css-button-mobile" : ""
              )}
              large
              iconIos={
                isDeviceConnected === true && deviceConnectedType == CONNECT_BLE_TYPE
                  ? "material:bluetooth_connected"
                  : "material:bluetooth"
              }
              iconMd={
                isDeviceConnected === true && deviceConnectedType == CONNECT_BLE_TYPE
                  ? "material:bluetooth_connected"
                  : "material:bluetooth"
              }
              onClick={() => this.handleConnections(false, CONNECT_BLE_TYPE)}
            />
            <ScanDevice ref="scan-device-ref" device={this.props.device} fromComponent={this.props.fromComponent} />
          </>
        )}
        {!this.props?.icon && f7.device.cordova == false && (
          <>
            <Button
              className={clsx(
                isDeviceConnected === true && deviceConnectedType == CONNECT_BLE_TYPE
                  ? "device-connected"
                  : "device-disconnected",
                "round-button",
                this.props?.isClassMobile ? "css-button-mobile" : ""
              )}
              large
              iconIos={
                isDeviceConnected === true && deviceConnectedType == CONNECT_BLE_TYPE
                  ? "material:bluetooth_connected"
                  : "material:bluetooth"
              }
              iconMd={
                isDeviceConnected === true && deviceConnectedType == CONNECT_BLE_TYPE
                  ? "material:bluetooth_connected"
                  : "material:bluetooth"
              }
              onClick={() => this.handleConnections(false, CONNECT_BLE_TYPE)}
            />
            {[XBOT, XBUILD, YOLOBIT, AI_DEVICE].includes(core.selectedDevice()) &&
              this.props.fromComponent !== DASHBOARD && (
                <Button
                  className={clsx(
                    isDeviceConnected === true && deviceConnectedType == CONNECT_SERIAL_TYPE
                      ? "device-connected"
                      : "device-disconnected",
                    "round-button",
                    this.props?.isClassMobile ? "css-button-mobile" : ""
                  )}
                  large
                  iconIos={
                    isDeviceConnected === true && deviceConnectedType == CONNECT_SERIAL_TYPE
                      ? "material:usb"
                      : "material:usb_off"
                  }
                  iconMd={
                    isDeviceConnected === true && deviceConnectedType == CONNECT_SERIAL_TYPE
                      ? "material:usb"
                      : "material:usb_off"
                  }
                  onClick={() => this.handleConnections(false, CONNECT_SERIAL_TYPE)}
                />
              )}
          </>
        )}
      </>
    );
  }
}
