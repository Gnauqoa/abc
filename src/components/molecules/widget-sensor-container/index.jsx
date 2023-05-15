import React, { useCallback, useEffect, useRef, useState } from "react";
import { f7 } from "framework7-react";
import "./index.scss";
import {
  WIDGET_SENSOR_ACTIVE,
  WIDGET_SENSOR_INACTIVE,
  WIDGET_SENSOR_ID_INACTIVE,
  USB_TYPE,
  BLE_TYPE,
} from "../../../js/constants";

import SensorStatus from "../../atoms/widget-sensor-status";
import SensorSettingPopup from "../popup-sensor-setting";
import DataManagerIST from "../../../services/data-manager.js";
import SensorServices from "../../../services/sensor-service";

const DISCONNECT_ICON_CLASSNAMES = "icon material-icons";
const CHECK_SENSOR_STATUS_INTERVAL = 1000;

const SensorContainer = ({ deviceManager }) => {
  const [sensorsInfo, setSensorsInfo] = useState([]);
  const [sensorsDataIndex, setSensorsDataIndex] = useState({});
  const [selectedSensorId, setSelectedSensorId] = useState();
  const [openedPopup, setOpenedPopup] = useState(false);

  useEffect(() => {
    let intervalId = setInterval(() => {
      const activeSensorsIds = DataManagerIST.getActiveSensorIds();
      const sensors = [];

      for (const sensorId of activeSensorsIds) {
        const parsedSensorId = parseInt(sensorId);
        const sensorInfo = SensorServices.getSensorInfo(parsedSensorId);
        if (!sensorInfo) continue;

        const batteryStatus = DataManagerIST.getBatteryStatus();
        const uartConnections = DataManagerIST.getUartConnections();
        const type = uartConnections.has(parsedSensorId) ? USB_TYPE : BLE_TYPE;

        const sensor = {
          sensorId: parsedSensorId,
          sensorBattery: batteryStatus[parsedSensorId],
          sensorSubInfos: sensorInfo.data,
          subSensorIcon: sensorInfo.icon,
          subSensorLabel: sensorInfo.label,
          type: type,
        };
        sensors.push(sensor);
      }

      setSensorsInfo(sensors);
    }, CHECK_SENSOR_STATUS_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const onChooseSensorHandler = useCallback((event) => {
    if (event.target.className === DISCONNECT_ICON_CLASSNAMES) return;

    const sensorId = parseInt(event.currentTarget.id);
    if (sensorId === WIDGET_SENSOR_ID_INACTIVE) {
      console.log(sensorId);
    } else if (sensorId >= 1) {
      const isExist = SensorServices.isSensorExist(sensorId);
      if (!isExist) return;

      setSelectedSensorId(sensorId);
      setOpenedPopup(true);
    }
  }, []);

  const onDisconnectHandler = (sensorId) => {
    deviceManager?.disconnect({ id: sensorId });
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
        openedPopup={openedPopup}
        onClosePopup={() => setOpenedPopup(false)}
        sensorId={selectedSensorId}
        sensorDataIndex={sensorsDataIndex?.[selectedSensorId]}
        onSaveSetting={onSaveSettingHandler}
      />
      {sensorsInfo.length !== 0 ? (
        sensorsInfo.map((sensorInfo) => {
          const dataIndex = sensorsDataIndex[sensorInfo.sensorId] || 0;

          const sensorDatas = DataManagerIST.getDataBuffer(sensorInfo.sensorId);
          const sensorData = sensorDatas?.[dataIndex];

          const sensorSubInfo = sensorInfo.sensorSubInfos[dataIndex];
          const displayInfo = {
            icon: sensorInfo.subSensorIcon,
            label: sensorInfo.subSensorLabel,
            unit: sensorSubInfo.unit,
          };

          return (
            <div
              key={sensorInfo.sensorId}
              id={sensorInfo.sensorId}
              className="wireless-sensor-info"
              onClick={onChooseSensorHandler}
            >
              <SensorStatus
                sensorId={sensorInfo.sensorId}
                sensorBattery={sensorInfo.sensorBattery}
                type={sensorInfo.type}
                sensorData={sensorData}
                displayInfo={displayInfo}
                onDisconnect={onDisconnectHandler}
                status={WIDGET_SENSOR_ACTIVE}
              ></SensorStatus>
            </div>
          );
        })
      ) : (
        <div className="wireless-sensor-info" onClick={onChooseSensorHandler}>
          <SensorStatus status={WIDGET_SENSOR_INACTIVE}></SensorStatus>
        </div>
      )}
    </div>
  );
};

export default SensorContainer;
