import React from "react";
import { FIRST_COLUMN_DEFAULT_OPT, getFirstColumnOptions } from "../../../utils/widget-table-chart/commons";
import { Button } from "framework7-react";
import AddUserUnitPopup from "../../molecules/popup-add-user-unit";

import "./index.scss";
import SensorSelector from "../../molecules/popup-sensor-selector";

const TableHeader = ({
  isRunning,
  firstColumnOption,
  widget,
  sensorsUnit,
  handleSensorChange,
  handleFirstColumSelector,
}) => {
  return (
    <tr key="header-row" className="__header-column">
      {/* ========================== FIXED FIRST COLUMN ========================== */}
      <td key="header-row-fixed-column" className="__header-name">
        <div className={`__header-name-selector ${firstColumnOption === FIRST_COLUMN_DEFAULT_OPT ? "time" : ""}`}>
          <select
            className="custom-select"
            disabled={isRunning}
            value={firstColumnOption}
            onChange={handleFirstColumSelector}
          >
            <option value={"defaultSensorSelectedValue"} disabled>
              Chọn thông tin
            </option>
            {getFirstColumnOptions().map((option) => {
              return (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              );
            })}
          </select>
          {firstColumnOption !== FIRST_COLUMN_DEFAULT_OPT && (
            <Button
              iconIos={`material:edit`}
              iconMd={`material:edit`}
              iconAurora={`material:edit`}
              popupOpen=".add-user-unit-popup"
            ></Button>
          )}
          <AddUserUnitPopup />
        </div>
        <div className="__header-unit">
          {getFirstColumnOptions().find((option) => option.id === firstColumnOption)?.unit}
        </div>
      </td>

      {/* ========================== DYNAMIC COLUMN ========================== */}
      {widget.sensors.map((sensor, sensorIndex) => (
        <td key={`header-row-dynamic-column-${sensorIndex}`} className="__header-name">
          <SensorSelector
            className="sensor-selector "
            disabled={isRunning}
            selectedSensor={sensor}
            hideDisplayUnit={true}
            onChange={(sensor) => handleSensorChange(widget.id, sensorIndex, sensor)}
          ></SensorSelector>
          <div className="__header-unit">
            <span className="header-unit__input">
              {sensorsUnit[sensorIndex] !== "" ? `(${sensorsUnit[sensorIndex]})` : "--------"}
            </span>
          </div>
        </td>
      ))}
    </tr>
  );
};

export default TableHeader;
