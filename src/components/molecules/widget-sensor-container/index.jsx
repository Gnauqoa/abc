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

const SensorContainer = () => {
  const [sensorsInfo, setSensorsInfo] = useState([]);
  const [sensorsDataIndex, setSensorsDataIndex] = useState({});
  const [selectedSensorId, setSelectedSensorId] = useState();
  const [openedPopup, setOpenedPopup] = useState(false);

  useEffect(() => {
    let intervalId = setInterval(() => {
      const buffer = DataManagerIST.getBuffer();
      const sensors = [];

      for (const sensorId of Object.keys(buffer)) {
        const sensorIcon = SensorServices.getSensorIcon(sensorId);
        const sensorInfo = SensorServices.getSensorInfo(sensorId);

        if (!sensorIcon || !sensorInfo) continue;
        const { icon, label, unit } = sensorIcon;

        const sensor = {
          sensorId: parseInt(sensorId),
          sensorDatas: buffer[sensorId],
          sensorIcon: {
            icon: icon,
            label: label,
            unit: unit,
          },
          type: sensorInfo.type,
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
    console.log("remove sensorId: ", sensorId);
    // useDeviceManager.disconnect(sensorId);
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
            <SensorStatus
              sensorId={sensorInfo.sensorId}
              sensorData={sensorData}
              sensorIcon={sensorInfo.sensorIcon}
              onDisconnect={onDisconnectHandler}
              type={sensorInfo.type}
              status={WIDGET_SENSOR_ACTIVE}
            ></SensorStatus>
          </div>
        );
      })}
    </div>
  );
};

export default SensorContainer;