import React from "react";
import { List, ListItem, Navbar, Popover } from "framework7-react";

import "./PopoverDataRunSensors.scss";
import SensorServicesIST from "../../../services/sensor-service";
import DataManagerIST from "../../../services/data-manager";
import { FIRST_COLUMN_DEFAULT_OPT } from "../../../utils/widget-table-chart/commons";
import { useActivityContext } from "../../../context/ActivityContext";

const PopoverDataRunSensors = ({ unitId }) => {
  const { handleToggleExtraYAxis } = useActivityContext();

  let dataRuns = [];
  // if (unitId === FIRST_COLUMN_DEFAULT_OPT) {
  //   const dataRunPreviews = DataManagerIST.getActivityDataRunPreview();
  //   dataRuns =
  //     dataRunPreviews.length !== 0
  //       ? dataRunPreviews.map((dataRunPreview) => {
  //           const sensorIds = DataManagerIST.getSensorsOfDataRun(dataRunPreview.id);
  //           return { name: dataRunPreview.name, sensors: sensorIds };
  //         })
  //       : [];
  // } else {
  //   const customUnitSensorInfo = DataManagerIST.getCustomUnitSensorInfos({ unitId });
  //   const customUnitInfo = DataManagerIST.getCustomUnitInfo({ unitId });
  //   const sensors = [];

  //   for (const sensorId of customUnitSensorInfo) {
  //     const sensor = SensorServicesIST.getSensorInfo(sensorId);
  //     if (!sensor || !sensor.data?.length) continue;

  //     sensors.push({
  //       sensorId: parseInt(sensorId),
  //       sensorIndex: sensor.data.length - 1,
  //     });
  //   }

  //   dataRuns = [
  //     {
  //       name: customUnitInfo?.name,
  //       sensors: sensors,
  //     },
  //   ];
  // }

  const onSelectSenorInfo = ({ id, index }) => {
    const sensorInfo = { id: id, index: index };
    handleToggleExtraYAxis({ sensorInfo });
  };

  return (
    <Popover className="popover-data-run-sensors">
      <Navbar title="Các lần chạy"></Navbar>
      <List strongIos outlineIos dividersIos>
        {dataRuns.map((dataRun, dataRunIndex) => (
          <ListItem key={`dataRun-${dataRunIndex}`} title={dataRun.name} name="demo-checkbox">
            <ul slot="root">
              {dataRun.sensors.map((sensor, index) => {
                const sensorInfo = SensorServicesIST.getSensorInfo(sensor.sensorId);
                const sensorName = `${sensorInfo.data[sensor.sensorIndex]?.name} (${
                  sensorInfo.data[sensor.sensorIndex]?.unit
                })`;
                return (
                  <ListItem
                    key={`sensorInfo-${dataRunIndex}-${index}`}
                    title={sensorName}
                    name="demo-checkbox"
                    value={`${sensor.sensorId}-${sensor.sensorIndex}`}
                    onClick={() => onSelectSenorInfo({ id: sensor.sensorId, index: sensor.sensorIndex })}
                  />
                );
              })}
            </ul>
          </ListItem>
        ))}
      </List>
    </Popover>
  );
};

export default PopoverDataRunSensors;
