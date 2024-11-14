import React, { useState } from "react";
import { FIRST_COLUMN_DEFAULT_OPT, getFirstColumnOptions } from "../../../utils/widget-table-chart/commons";
import { Popover, List, Button, f7 } from "framework7-react";
import AddUserUnitPopup from "../../molecules/popup-add-user-unit";

import "./index.scss";
import SensorSelector from "../../molecules/popup-sensor-selector";
import { useTableContext } from "../../../context/TableContext";
import { useTranslation } from "react-i18next";

const TableHeader = ({
  tableId,
  isRunning,
  widget,
  sensorsUnit,
  handleSensorChange,
  dataRuns,
  handleChangeDataRun,
  dataRunName,
}) => {
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
        <div className="__header-unit" style={{ marginRight: "25px" }}>
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
          <div className="__header-unit" style={{ display: "flex", width: "100%", alignItems: "center" }}>
            {sensorsUnit[sensorIndex] !== "" ? `(${sensorsUnit[sensorIndex]})` : "--------"}
            {dataRuns.length > 1 && (
              <div>
                <Button
                  className="button __btn-select-time-id"
                  textColor="black"
                  bgColor="white"
                  raised
                  popoverOpen=".popover-time"
                >
                  <span style={{ textTransform: "none" }}>
                    {dataRunName ? dataRunName : dataRuns[dataRuns.length - 1].name}
                  </span>
                </Button>
                <Popover className="popover-time">
                  <List className="list-frequency">
                    {dataRuns &&
                      dataRuns.map((dataRun) => (
                        <Button
                          className="button-frequency frequency"
                          key={dataRun.id}
                          onClick={() => {
                            handleChangeDataRun(dataRun);
                            f7.popover.close();
                          }}
                        >
                          <span style={{ textTransform: "none" }}> {dataRun.name}</span>
                        </Button>
                      ))}
                  </List>
                </Popover>
              </div>
            )}
          </div>
        </td>
      ))}
    </tr>
  );
};

export default TableHeader;
