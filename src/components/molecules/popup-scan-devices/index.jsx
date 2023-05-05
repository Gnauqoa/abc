import React, { useRef, useState } from "react";
import { useImmer } from "use-immer";
import {
  Popup,
  Page,
  Navbar,
  NavRight,
  Link,
  Block,
  Button,
  List,
  ListItem,
  NavTitle,
  Preloader,
} from "framework7-react";
import "./index.scss";

import signalStrengthIconFull from "../../../img/scan-devices/signal-strength-full.png";
import DeviceManagerIST from "../../../services/device-manager";

export default function useDeviceManager() {
  const [devices, setDevices] = useImmer([]);
  const scanPopupRef = useRef(null);
  const timeoutScanId = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  const callbackSetDevices = (devices) => setDevices(devices);

  function openScanPopup() {
    scanPopupRef.current.f7Popup().open();
  }

  function scan() {
    DeviceManagerIST.scan({ callback: callbackSetDevices });
    timeoutScanId.current = setTimeout(() => stopScan(), 30000);
    setIsScanning(true);
  }

  function stopScan() {
    clearTimeout(timeoutScanId.current);
    DeviceManagerIST.handleStopScan();
    setIsScanning(false);
  }

  function connect(deviceId) {
    DeviceManagerIST.connect({ deviceId, callback: callbackSetDevices });
  }

  function disconnect({ deviceId, id }) {
    DeviceManagerIST.disconnect({ deviceId, id, callback: callbackSetDevices });
  }

  function renderScanPopup() {
    return (
      <Popup ref={scanPopupRef} className="edl-popup scan-devices">
        <Page>
          <Navbar>
            <NavTitle style={{ color: "#0086ff" }}>Kết nối Cảm biến không dây</NavTitle>
            <NavRight>
              <Link iconIos="material:close" iconMd="material:close" iconAurora="material:close" popupClose></Link>
            </NavRight>
          </Navbar>

          <Block className="scan-block text-align-center">
            <span className="title">Tìm kiếm cảm biến</span>
            {isScanning ? (
              <div onClick={stopScan}>
                <Preloader color="blue" />
              </div>
            ) : (
              <Button
                className="scan-button"
                onClick={scan}
                iconIos="material:search"
                iconMd="material:search"
                iconAurora="material:search"
              ></Button>
            )}
          </Block>

          <Block className="devices-block">
            <List dividersIos outlineIos strongIos>
              {devices.map((d) => {
                if (!d.isConnected)
                  return (
                    <ListItem
                      key={d.deviceId}
                      link="#"
                      title={`${d.name} (${d.code})`}
                      onClick={() => connect(d.deviceId)}
                    >
                      <div className="item-after">
                        <img src={signalStrengthIconFull} alt={"signalStrengthIconFull"} />
                      </div>
                    </ListItem>
                  );
              })}
            </List>
          </Block>
        </Page>
      </Popup>
    );
  }

  return { connect, disconnect, openScanPopup, renderScanPopup };
}
