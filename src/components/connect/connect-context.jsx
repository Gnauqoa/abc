import React, { Component } from "react";

const ConnectContext = React.createContext();

import { CONNECT_BLE_TYPE } from "../../js/constants";
import * as core from "../../utils/core";
import * as commandUtils from "../../utils/command-utils";
import * as sharedDataUtils from "../../utils/shared-data-utils";

class ConnectContextProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isDeviceConnected: false,
      deviceConnectedType: CONNECT_BLE_TYPE,
      setConnectStatus: this.setConnectStatus,
    };
  }

  componentDidMount = () => {
    document.addEventListener("newdata", this.handleNewRobotData);
  };

  componentWillUnmount() {
    document.removeEventListener("newdata", this.handleNewRobotData);
  }

  handleNewRobotData = () => {
    const data = sharedDataUtils.fetchNewDataFromDevice();
  };

  setConnectStatus = (status, connectType = CONNECT_BLE_TYPE) => {
    commandUtils.setConnectType(connectType);
    this.setState({ isDeviceConnected: status, deviceConnectedType: connectType });
    if (status) {
      core.setConnectedDeviceType(connectType);
      sharedDataUtils.setAskFirmwareInforFlag(true);
    }
  };

  render() {
    return <ConnectContext.Provider value={this.state}>{this.props.children}</ConnectContext.Provider>;
  }
}

export { ConnectContext, ConnectContextProvider };
