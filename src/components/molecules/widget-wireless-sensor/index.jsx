import React, { useCallback, useEffect, useRef, useState } from "react";
import { f7 } from "framework7-react";
import "./index.scss";

import WirelessSensorStatus from "../../atoms/wireless-sensor-status";
import SensorSettingPopup from "../popup-sensor-setting";
import DataManagerIST from "../../../services/data-manager.js";
import SensorServices from "../../../services/sensor-service";

const DISCONNECT_ICON_CLASSNAMES = "icon material-icons";
const CHECK_SENSOR_STATUS_INTERVAL = 1000;

const WirelessSensorContainer = () => {
  const sensorSettingPopup = useRef();
  const [sensorsInfo, setSensorsInfo] = useState([{}]);
  const [sensorsDataIndex, setSensorsDataIndex] = useState({});
  const [selectedSensorId, setSelectedSensorId] = useState();

  useEffect(() => {
    let intervalId = setInterval(() => {
      const buffer = DataManagerIST.getBuffer();
      const sensorsInfo = Object.keys(buffer).map((sensorId) => {
        const { icon, label, unit } = SensorServices.getSensorIcon(sensorId);
        return {
          sensorId: parseInt(sensorId),
          sensorDatas: buffer[sensorId],
          sensorIcon: {
            icon: icon,
            label: label,
            unit: unit,
          },
        };
      });

      setSensorsInfo(sensorsInfo);
    }, CHECK_SENSOR_STATUS_INTERVAL);

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
    console.log("remove sensorId: ", sensorId);
    DataManagerIST.removeWirelessSensor(sensorId);
  };

  const onSaveSettingHandler = (sensorId, newSensorUnitInfo) => {
    const sensorInfo = SensorServices.getSensorInfo(sensorId);
    if (!Array.isArray(sensorInfo.data)) return;
    const dataIndex = sensorInfo.data.findIndex((item) => item.id === newSensorUnitInfo.id); // output: -1 (not found)
    if (dataIndex !== -1) {
      setSensorsDataIndex({ ...sensorsDataIndex, [sensorId]: dataIndex });
    }
  };

  return (
    <div className="__card-sensors">
      <SensorSettingPopup
        sensorId={selectedSensorId}
        sensorDataIndex={sensorsDataIndex?.[selectedSensorId]}
        onSaveSetting={onSaveSettingHandler}
        ref={sensorSettingPopup}
      />
      {sensorsInfo.map((sensorInfo) => {
        const dataIndex = sensorsDataIndex[sensorInfo.sensorId] || 0;
        const sensorData = sensorInfo.sensorDatas?.[dataIndex];
        return (
          <div
            key={sensorInfo.sensorId}
            id={sensorInfo.sensorId}
            className="wireless-sensor-info"
            onClick={onChooseSensorHandler}
          >
            <WirelessSensorStatus
              sensorId={sensorInfo.sensorId}
              sensorData={sensorData}
              sensorIcon={sensorInfo.sensorIcon}
              onDisconnect={onDisconnectHandler}
            ></WirelessSensorStatus>
          </div>
        );
      })}
    </div>
  );
};

export default WirelessSensorContainer;
