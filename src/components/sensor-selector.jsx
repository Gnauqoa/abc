import React from "react";

export default function SensorSelector({ sensorList }) {
    const changeHandler = evt => {
        let selectedIndex = evt.target.options.value;
        console.log('Label 👉️', evt.target.selectedOptions[0].id);
    }
    
  return (
    <select className="custom-select" onChange={ changeHandler }>
      <option selected disabled>
        Chọn thông tin
      </option>
      {sensorList.map(({ name, data }, key) => (
        <optgroup label={name} id={key}>
          {data.map(({ id, name, unit }) => (
            <option key={id}>{`${name} (${unit})`}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
