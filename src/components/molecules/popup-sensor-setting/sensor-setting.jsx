import React, { useEffect } from "react";
import { List, ListInput, Button, f7 } from "framework7-react";

import "./index.scss";
import CustomDropdownInput from "./custom-list-input";

const SensorSettingTab = ({ sensorInfo, sensorDataIndex, onSaveHandler }) => {
  const [formField, setFormField] = React.useState({});

  useEffect(() => {
    const unitInfos = sensorInfo.data;
    if (Array.isArray(unitInfos) && unitInfos.length > 0) {
      const unitInfo = unitInfos[sensorDataIndex || 0];
      setFormField({
        unitId: unitInfo.id,
        unitName: unitInfo.name || "",
        displayedNamed: unitInfo.name || "",
        unitOfMeasure: unitInfo.unit || "",
        minValue: unitInfo.min || "0",
        maxValue: unitInfo.max || "0",
        formatFloatingPoint: unitInfo.formatFloatingPoint || "1",
      });
    }
  }, [sensorInfo]);

  const onChangeSensorUnit = (unitInfo) => {
    setFormField({
      unitId: unitInfo.id,
      unitName: unitInfo.name || "",
      displayedNamed: unitInfo.name || "",
      unitOfMeasure: unitInfo.unit || "",
      minValue: unitInfo.min || "0",
      maxValue: unitInfo.max || "0",
      formatFloatingPoint: unitInfo.formatFloatingPoint || "1",
    });
    f7.popover.close();
  };

  const formFieldHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setFormField((values) => ({ ...values, [name]: value }));
  };

  const validateSensorSettingParams = (sensorUnitInfo) => {
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

  const onSubmitHandler = (event) => {
    event.preventDefault();

    const parsedMinValue = Number(formField.minValue || "0");
    const parsedMaxValue = Number(formField.maxValue || "0");
    const parsedFormatFloatingPoint = Number(formField.formatFloatingPoint || "1");
    const newSensorUnitInfo = {
      id: formField.unitId,
      name: formField.displayedNamed,
      unit: formField.unitOfMeasure,
      min: parsedMinValue,
      max: parsedMaxValue,
      formatFloatingPoint: parsedFormatFloatingPoint,
    };

    if (validateSensorSettingParams(newSensorUnitInfo)) {
      onSaveHandler(newSensorUnitInfo);
    }
  };

  return (
    <>
      <List className="__setting" form noHairlinesMd inlineLabels>
        <CustomDropdownInput
          labelName="Thông tin cài đặt:"
          buttonName={formField.unitName}
          popOverName="popover-sensor-unit"
        >
          <List className="list-frequency">
            {sensorInfo?.data?.map((sensorUnit) => {
              return (
                <Button key={sensorInfo?.id + "|" + sensorUnit.id} onClick={() => onChangeSensorUnit(sensorUnit)}>
                  <span style={{ textTransform: "none" }}>{sensorUnit.name}</span>
                </Button>
              );
            })}
          </List>
        </CustomDropdownInput>

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
      </List>
      <div className="buttons">
        <Button className="save-button" onClick={onSubmitHandler}>
          Lưu
        </Button>
      </div>
    </>
  );
};

export default SensorSettingTab;
