import React, { useState } from "react";
import { FIRST_COLUMN_DEFAULT_OPT, getFirstColumnOptions } from "../../../utils/widget-table-chart/commons";
import { Button } from "framework7-react";
import AddUserUnitPopup from "../../molecules/popup-add-user-unit";

import "./index.scss";
import SensorSelector from "../../molecules/popup-sensor-selector";
import { useTableContext } from "../../../context/TableContext";

const TableHeader = ({ tableId, isRunning, widget, sensorsUnit, handleSensorChange }) => {
  const { getFirstColumnOption, setFirstColumnOptions } = useTableContext();

  const [firstColumnTables, setFirstColumnTables] = useState(getFirstColumnOptions());
  const firstColumnOption = getFirstColumnOption({ tableId: tableId });

  const handleAddUserUnit = (option) => {
    setFirstColumnTables(getFirstColumnOptions());
    setFirstColumnOptions((prev) => {
      return { ...prev, [tableId]: { ...option } };
    });
  };

  const handleFirstColumSelector = ({ target: { value: optionId } }) => {
    const option = getFirstColumnOptions().find((option) => option.id === optionId);
    setFirstColumnOptions((prev) => {
      return { ...prev, [tableId]: { ...option } };
    });
  };

  return (
    <tr key="header-row" className="__header-column">
      {/* ========================== FIXED FIRST COLUMN ========================== */}
      <td key="header-row-fixed-column" className="__header-name">
        <div className={`__header-name-selector ${firstColumnOption.id === FIRST_COLUMN_DEFAULT_OPT ? "time" : ""}`}>
          <select
            className="custom-select"
            disabled={isRunning}
            value={firstColumnOption.id}
            onChange={handleFirstColumSelector}
          >
            <option value={"defaultSensorSelectedValue"} disabled>
              Chọn thông tin
            </option>
            {firstColumnTables.map((option) => {
              return (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              );
            })}
          </select>
          {firstColumnOption.id !== FIRST_COLUMN_DEFAULT_OPT && (
            <Button
              iconIos={`material:edit`}
              iconMd={`material:edit`}
              iconAurora={`material:edit`}
              popupOpen=".add-user-unit-popup"
            ></Button>
          )}
          <AddUserUnitPopup onSubmit={handleAddUserUnit} />
        </div>
        <div className="__header-unit">
          {firstColumnTables.find((option) => option.id === firstColumnOption.id)?.unit}
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
