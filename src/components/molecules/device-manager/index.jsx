import React, { useRef } from "react";
import { useImmer } from "use-immer";
import { Popup, Page, Navbar, NavRight, Link, Block, Button, List, ListItem, NavTitle } from "framework7-react";
import "./index.scss";

import signalStrengthIconFull from "../../../img/scan-devices/signal-strength-full.png";
import DeviceManagerIST from "../../../services/device-manager";

export default function useDeviceManager() {
  const [devices, setDevices] = useImmer([]);
  const scanPopupRef = useRef(null);

  function openScanPopup() {
    scanPopupRef.current.f7Popup().open();
  }

  function scan() {
    const callback = (devices) => {
      console.log("devices", JSON.stringify(devices));
      setDevices(devices);
    };
    DeviceManagerIST.scan({ callback });
  }

  function connect(deviceId) {
    const callback = (devices) => setDevices(devices);
    DeviceManagerIST.connect({ deviceId, callback });
  }

  function disconnect({ deviceId, id }) {
    const callback = (devices) => setDevices(devices);
    DeviceManagerIST.disconnect({ deviceId, id, callback });
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
          <Block className="scan-block">
            <span>Tìm kiếm cảm biến</span>
            <Button
              className="scan-button"
              onClick={scan}
              iconIos="material:search"
              iconMd="material:search"
              iconAurora="material:search"
            ></Button>
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
