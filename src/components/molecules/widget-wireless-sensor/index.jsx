import React, { useCallback, useEffect, useRef, useState } from "react";

import { f7 } from "framework7-react";
import WirelessSensorStatus from "../../atoms/wireless-sensor-status";
import SensorSettingPopup from "../popup-sensor-setting";
import DataManagerIST from "../../../services/data-manager.js";
import SensorServices from "../../../services/sensor-service";

import "./index.scss";
import dialog from "../dialog/dialog";
const DISCONNECT_ICON_CLASSNAMES = "icon material-icons";
const WirelessSensorContainer = () => {
  const [sensorsInfo, setSensorsInfo] = useState([{}]);
  const sensorSettingPopup = useRef();
  const [selectedSensorId, setSelectedSensorId] = useState();

  useEffect(() => {
    let intervalId = setInterval(() => {
      const buffer = DataManagerIST.getBuffer();
      const sensorsInfo = Object.keys(buffer).map((sensorId) => {
        const { icon, label, width, unit } = SensorServices.getSensorIcon(sensorId);
        return {
          sensorId: parseInt(sensorId),
          sensorData: buffer[sensorId],
          sensorIcon: {
            icon: icon,
            label: label,
            width: width,
            unit: unit,
          },
        };
      });
      setSensorsInfo(sensorsInfo);
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const onChooseSensorHandler = useCallback((event) => {
    if (event.target.className === DISCONNECT_ICON_CLASSNAMES) return;

    const sensorId = parseInt(event.currentTarget.id);
    if (sensorId === -1) {
    } else if (sensorId >= 1) {
      setSelectedSensorId(sensorId);

      if (sensorSettingPopup.current) {
        sensorSettingPopup.current = f7.popup.create({ el: ".sensor-setting-popup", animate: true });
        sensorSettingPopup.current.open();
      }
    }
  }, []);

  const onDisconnectHandler = (sensorId) => {
    dialog.question(
      "Xác nhận",
      `Bạn có chắc chắn muốn xóa cảm biến này không?`,
      () => {
        console.log("remove sensorId: ", sensorId);
        DataManagerIST.removeWirelessSensor(sensorId);
      },
      () => {}
    );
  };

  return (
    <div className="__card-sensors">
      <SensorSettingPopup sensorId={selectedSensorId} ref={sensorSettingPopup} />
      {sensorsInfo.map((sensorInfo) => (
        <div
          key={sensorInfo.sensorId}
          id={sensorInfo.sensorId}
          className="wireless-sensor-info"
          onClick={onChooseSensorHandler}
        >
          <WirelessSensorStatus
            sensorId={sensorInfo.sensorId}
            sensorData={sensorInfo.sensorData}
            sensorIcon={sensorInfo.sensorIcon}
            onDisconnect={onDisconnectHandler}
          ></WirelessSensorStatus>
        </div>
      ))}
    </div>
  );
};

export default WirelessSensorContainer;
