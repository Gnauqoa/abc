import React, { useCallback, useEffect, useRef, useState } from "react";
import { f7 } from "framework7-react";
import "./index.scss";
import { WIDGET_SENSOR_ACTIVE, WIDGET_SENSOR_INACTIVE, WIDGET_SENSOR_ID_INACTIVE } from "../../../js/constants";

import SensorStatus from "../../atoms/widget-sensor-status";
import SensorSettingPopup from "../popup-sensor-setting";
import DataManagerIST from "../../../services/data-manager.js";
import SensorServices from "../../../services/sensor-service";

const DISCONNECT_ICON_CLASSNAMES = "icon material-icons";
const CHECK_SENSOR_STATUS_INTERVAL = 1000;

const SensorContainer = ({ ble }) => {
  const sensorSettingPopup = useRef();
  const [wiredSensorsInfo, setWiredSensorsInfo] = useState([]);
  const [wirelessSensorsInfo, setWirelessSensorsInfo] = useState([]);
  const [sensorsDataIndex, setSensorsDataIndex] = useState({});
  const [selectedSensorId, setSelectedSensorId] = useState();

  const sensorsInfo = [...wiredSensorsInfo, ...wirelessSensorsInfo];

  useEffect(() => {
    let intervalId = setInterval(() => {
      const buffer = DataManagerIST.getBuffer();
      const wiredSensorsInfo = [];

      for (const sensorId of Object.keys(buffer)) {
        const sensorIcon = SensorServices.getSensorIcon(sensorId);
        if (!sensorIcon) continue;
        const { icon, label, unit } = sensorIcon;

        const sensorInfo = {
          sensorId: parseInt(sensorId),
          sensorDatas: buffer[sensorId],
          sensorIcon: {
            icon: icon,
            label: label,
            unit: unit,
          },
          isWireless: false,
        };

        wiredSensorsInfo.push(sensorInfo);
      }

      setWiredSensorsInfo(wiredSensorsInfo);
    }, CHECK_SENSOR_STATUS_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const wirelessSensorsInfo = [];

    for (const device of Object.keys(ble.connectedDevices)) {
      const sensorIcon = SensorServices.getSensorIcon(1);
      if (!sensorIcon) continue;
      const { icon, label, unit } = sensorIcon;

      const sensorInfo = {
        sensorId: device.id,
        sensorDatas: 1.0,
        sensorIcon: {
          icon: icon,
          label: label,
          unit: unit,
        },
        isWireless: true,
      };
      wirelessSensorsInfo.push(sensorInfo);
    }

    setWirelessSensorsInfo(wirelessSensorsInfo);
  }, [ble.connectedDevices]);

  const onChooseSensorHandler = useCallback((event) => {
    if (event.target.className === DISCONNECT_ICON_CLASSNAMES) return;

    const sensorId = parseInt(event.currentTarget.id);
    if (sensorId === WIDGET_SENSOR_ID_INACTIVE) {
      console.log(sensorId);
    } else if (sensorId >= 1) {
      const isExist = SensorServices.isSensorExist(sensorId);
      if (!isExist) return;

      setSelectedSensorId(sensorId);
      if (sensorSettingPopup.current) {
        sensorSettingPopup.current = f7.popup.create({ el: ".sensor-setting-popup", animate: true });
        sensorSettingPopup.current.open();
      }
    }
  }, []);

  const onDisconnectHandler = (sensorId) => {
    console.log("remove sensorId: ", sensorId);
    ble.disconnect(sensorId);
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
      {sensorsInfo.length !== 0 ? (
        sensorsInfo.map((sensorInfo) => {
          const dataIndex = sensorsDataIndex[sensorInfo.sensorId] || 0;
          const sensorData = sensorInfo.sensorDatas?.[dataIndex];
          return (
            <div
              key={sensorInfo.sensorId}
              id={sensorInfo.sensorId}
              className="wireless-sensor-info"
              onClick={onChooseSensorHandler}
            >
              <SensorStatus
                sensorId={sensorInfo.sensorId}
                sensorData={sensorData}
                sensorIcon={sensorInfo.sensorIcon}
                onDisconnect={onDisconnectHandler}
                isWireless={sensorInfo.isWireless}
                status={WIDGET_SENSOR_ACTIVE}
              ></SensorStatus>
            </div>
          );
        })
      ) : (
        <div key={WIDGET_SENSOR_ID_INACTIVE} id={WIDGET_SENSOR_ID_INACTIVE} className="wireless-sensor-info">
          <SensorStatus sensorId={WIDGET_SENSOR_ID_INACTIVE} status={WIDGET_SENSOR_INACTIVE}></SensorStatus>
        </div>
      )}
    </div>
  );
};

export default SensorContainer;
