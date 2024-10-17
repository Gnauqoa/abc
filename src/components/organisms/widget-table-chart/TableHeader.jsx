import React, { useState } from "react";
import { FIRST_COLUMN_DEFAULT_OPT, getFirstColumnOptions } from "../../../utils/widget-table-chart/commons";
import { Button } from "framework7-react";
import AddUserUnitPopup from "../../molecules/popup-add-user-unit";

import "./index.scss";
import SensorSelector from "../../molecules/popup-sensor-selector";
import { useTableContext } from "../../../context/TableContext";
import { useTranslation } from "react-i18next";

const TableHeader = ({ tableId, isRunning, widget, sensorsUnit, handleSensorChange }) => {
  const { t } = useTranslation();

  const { getFirstColumnOption, setFirstColumnOptions } = useTableContext();

  const [firstColumnTables, setFirstColumnTables] = useState(getFirstColumnOptions(t));
  const firstColumnOption = getFirstColumnOption({ tableId: tableId });

  const handleAddUserUnit = (option) => {
    setFirstColumnTables(getFirstColumnOptions(t));
    setFirstColumnOptions((prev) => {
      return { ...prev, [tableId]: { ...option } };
    });
  };

  const handleFirstColumSelector = ({ target: { value: optionId } }) => {
    const option = getFirstColumnOptions(t).find((option) => option.id === optionId);
    setFirstColumnOptions((prev) => {
      return { ...prev, [tableId]: { ...option } };
    });
  };

  return (
    <tr key="header-row" className="__header-column">
      {/* ========================== FIXED FIRST COLUMN ========================== */}
      <td key="header-row-fixed-column" className="__header-name">
        <div className={`__header-name-selector`}>
          <select
            className="custom-select"
            disabled={isRunning}
            value={firstColumnOption.id}
            onChange={handleFirstColumSelector}
          >
            <option value={"defaultSensorSelectedValue"} disabled>
              {t("organisms.select_information")}
            </option>
            {firstColumnTables.map((option) => {
              return (
                <option key={option.id} value={option.id}>
                  {t(option.name)}
                </option>
              );
            })}
          </select>
          <Button
            iconIos={`material:edit`}
            iconMd={`material:edit`}
            iconAurora={`material:edit`}
            popupOpen=".add-user-unit-popup"
          ></Button>
          <AddUserUnitPopup onSubmit={handleAddUserUnit} unitId={firstColumnOption.id} />
        </div>
        <div className="__header-unit">
          {firstColumnTables.find((option) => option.id === firstColumnOption.id)?.unit}
        </div>
      </td>

      {/* ========================== DYNAMIC COLUMN ========================== */}
      {widget.sensors.map((sensor, sensorIndex) => (
        <td key={`header-row-dynamic-colum-${sensorIndex}`} className="__header-name">
          <SensorSelector
            className="sensor-selector "
            disabled={isRunning}
            selectedSensor={sensor}
            hideDisplayUnit={true}
            onChange={(sensor) => handleSensorChange({ widgetId: widget.id, sensorIndex: sensorIndex, sensor: sensor })}
          ></SensorSelector>
          <div className="__header-unit">
            {sensorsUnit[sensorIndex] !== "" ? `(${sensorsUnit[sensorIndex]})` : "--------"}
          </div>
        </td>
      ))}
    </tr>
  );
};

export default TableHeader;
