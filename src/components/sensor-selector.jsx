import React, { useState } from "react";
import _ from "lodash";
import sensorList from "../services/sensor-service";

const defaultSensorSelectedValue = "";
export default function SensorSelector({ selectedSensor, onChange = () => {} }) {
  const [selectedSensorState, setSelectedSensorState] = useState();

  //const derivedSensorList =

  let selectedIdString = "";
  if (selectedSensor && _.isNumber(selectedSensor.id)) {
    const existingSensorData = sensorList.find((s) => s.id === selectedSensor.id),
      sensorDetailData = existingSensorData.data[selectedSensor.index];
    selectedIdString = `${existingSensorData.id}|${sensorDetailData.id}`;
  }

  const changeHandler = (evt) => {
    let selectedIndex = evt.target.options.value;
    const selectedValueString = evt.target.value;
    if (selectedValueString) {
      const arr = selectedValueString.split("|");
      if (arr.length > 1) {
        const sensorId = parseInt(arr[0]),
          sensorDetailId = arr[1],
          existingSensorData = sensorList.find((s) => s.id == sensorId),
          sensorIndex = _.findIndex(existingSensorData.data, (item) => item.id === sensorDetailId);

        onChange({
          id: sensorId,
          index: sensorIndex,
        });
      }
    }

    console.log("Label 👉️", evt.target.value);
  };

  return (
    <select value={selectedIdString} className="custom-select" onChange={changeHandler}>
      <option value={defaultSensorSelectedValue} disabled>
        Chọn thông tin
      </option>
      {sensorList.map(({ id, name, data }) => (
        <optgroup label={name} key={id}>
          {data.map((s) => (
            <option key={id + "|" + s.id} value={id + "|" + s.id}>{`${s.name} (${s.unit})`}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
