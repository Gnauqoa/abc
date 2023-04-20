import React, { forwardRef, useEffect } from "react";
import { Page, Navbar, List, ListInput, Button, f7, Popup, Popover } from "framework7-react";

import SensorServices from "../../../services/sensor-service";
import _ from "lodash";

import "./index.scss";

const SensorSettingSettingPopup = ({ sensorId, onModifySensor }, ref) => {
  const sensorInfo = SensorServices.getSensorInfo(sensorId);
  const [formField, setFormField] = React.useState({});

  useEffect(() => {
    if (!sensorInfo) return;
    const unitInfos = sensorInfo.data;
    if (Array.isArray(unitInfos) && unitInfos.length > 0) {
      const unitInfo = unitInfos[0];
      setFormField({
        unitId: unitInfo.id,
        unitName: unitInfo.name || "",
        displayedNamed: unitInfo.name || "",
        unitOfMeasure: unitInfo.unit || "",
        minValue: unitInfo.min || "0",
        maxValue: unitInfo.max || "0",
        formatFloatingPoint: unitInfo.formatFloatingPoint || "0",
      });
    }
  }, [sensorId]);

  const onChangeSensorUnit = (unitInfo) => {
    setFormField({
      unitId: unitInfo.id,
      unitName: unitInfo.name,
      displayedNamed: unitInfo.name,
      unitOfMeasure: unitInfo.unit,
      minValue: unitInfo.min,
      maxValue: unitInfo.max,
      formatFloatingPoint: unitInfo.formatFloatingPoint || 0,
    });
    f7.popover.close();
  };

  const formFieldHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setFormField((values) => ({ ...values, [name]: value }));
  };

  const validate = (sensorUnitInfo) => {
    if (sensorUnitInfo.name === "") {
      f7.dialog.alert("Thông tin hiển thị không được phép để trống");
      return false;
    }

    if (Number.isNaN(sensorUnitInfo.min)) {
      f7.dialog.alert("Giá trị tối thiểu phải là số");
      return false;
    }

    if (Number.isNaN(sensorUnitInfo.max)) {
      f7.dialog.alert("Giá trị tối đa phải là số");
      return false;
    }

    if (Number.isNaN(sensorUnitInfo.formatFloatingPoint)) {
      f7.dialog.alert("Giá trị định dạng phải là số");
      return false;
    }

    return true;
  };

  const onSaveHandler = (event) => {
    event.preventDefault();

    const parsedMinValue = Number(formField.minValue || "0");
    const parsedMaxValue = Number(formField.maxValue || "0");
    const parsedFormatFloatingPoint = Number(formField.formatFloatingPoint || "0");
    const newSensorUnitInfo = {
      id: formField.unitId,
      name: formField.displayedNamed,
      unit: formField.unitOfMeasure,
      min: parsedMinValue,
      max: parsedMaxValue,
      formatFloatingPoint: parsedFormatFloatingPoint,
    };

    if (validate(newSensorUnitInfo)) {
      onModifySensor(newSensorUnitInfo);
      f7.popup.close();
    }
  };

  return (
    <Popup className="sensor-setting-popup" ref={ref}>
      <Page className="sensor-setting">
        <Navbar className="__header" title={sensorInfo?.name} />
        <div className="__content">
          <div className="__navbar"></div>

          <List className="__setting-content" form noHairlinesMd inlineLabels>
            <div className="display-setting-input label-color-black input-color-blue">
              <div className="item-content item-input item-input-outline item-input-with-value">
                <div className="item-inner">
                  <div className="item-title item-label">Thông tin sensor:</div>

                  <div className="item-input-wrap">
                    <Button
                      className="button"
                      textColor="black"
                      bgColor="white"
                      text={formField.unitName || "Chọn đơn vị đo"}
                      popoverOpen=".popover-choose-sensor-unit-sensor-setting"
                    ></Button>
                    <Popover className="popover-choose-sensor-unit-sensor-setting popover-choose-sensor-unit">
                      <List className="list-frequency">
                        {sensorInfo?.data?.map((sensorUnit) => {
                          return (
                            <Button
                              key={sensorInfo?.id + "|" + sensorUnit.id}
                              onClick={() => onChangeSensorUnit(sensorUnit)}
                            >
                              <span style={{ textTransform: "none" }}>{sensorUnit.name}</span>
                            </Button>
                          );
                        })}
                      </List>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>

            <ListInput
              className="display-setting-input label-color-black"
              outline
              size={5}
              name="displayedNamed"
              label="Thông tin hiển thị:"
              type="text"
              validateOnBlur
              value={formField.displayedNamed}
              onChange={formFieldHandler}
            ></ListInput>
            <ListInput
              className="display-setting-input label-color-black"
              outline
              size={5}
              name="unitOfMeasure"
              label="Đơn vị đo:"
              type="text"
              validateOnBlur
              value={formField.unitOfMeasure}
              onChange={formFieldHandler}
            ></ListInput>
            <ListInput
              className="display-setting-input label-color-black"
              outline
              size={5}
              name="minValue"
              label="Giá trị min:"
              type="text"
              validateOnBlur
              value={formField.minValue}
              onChange={formFieldHandler}
            ></ListInput>
            <ListInput
              className="display-setting-input label-color-black"
              outline
              size={5}
              name="maxValue"
              label="Giá trị max:"
              type="text"
              validateOnBlur
              value={formField.maxValue}
              onChange={formFieldHandler}
            ></ListInput>
            <ListInput
              className="display-setting-input label-color-black"
              outline
              size={5}
              name="formatFloatingPoint"
              label="Format số lẻ:"
              type="text"
              validateOnBlur
              value={formField.formatFloatingPoint}
              onChange={formFieldHandler}
            ></ListInput>
            <div className="buttons">
              <Button className="save-button" onClick={onSaveHandler}>
                Lưu
              </Button>
            </div>
          </List>
        </div>
      </Page>
    </Popup>
  );
};

export default forwardRef(SensorSettingSettingPopup);
