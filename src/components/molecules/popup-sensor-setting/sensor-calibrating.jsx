import React, { useEffect } from "react";
import { List, ListInput, Button, f7 } from "framework7-react";

import "./index.scss";
import DataManagerIST from "../../../services/data-manager";
import CustomDropdownInput from "./custom-list-input";

const CALIBRATING_1_POINT = 1;
const CALIBRATING_2_POINTS = 2;
const defaultCalibratingValues = [0, 1];

const SensorCalibratingTab = ({ sensorInfo, onSaveHandler }) => {
  const [formField, setFormField] = React.useState({});
  useEffect(() => {
    const unitInfos = sensorInfo.data;
    if (Array.isArray(unitInfos) && unitInfos.length > 0) {
      const unitInfo = unitInfos[0];
      const calibrationType = unitInfo.calibrationType;
      const calibrationValues = unitInfo.calibrationValues;
      setFormField({
        unitId: unitInfo.id,
        unitName: unitInfo.name || "",
        calibratingType: calibrationType || CALIBRATING_1_POINT,
        calibrationValues: calibrationValues || [0, 1], // { a: 1, b: 0 }
        calibrationValuesRead: [0, 1], // { a: 1, b: 0 }
      });
    }
  }, [sensorInfo]);

  const onChangeSensorUnit = (unitInfo) => {
    setFormField({
      ...formField,
      unitId: unitInfo.id,
      unitName: unitInfo.name || "",
    });
    f7.popover.close();
  };

  const onChangeCalibratingType = (calibrationType) => {
    setFormField({
      ...formField,
      calibratingType: calibrationType,
    });
    f7.popover.close();
  };

  const onGetSampleHandler = (event) => {
    if (!Array.isArray(sensorInfo.data) || sensorInfo.data.length === 0) return;

    const sensorIndex = sensorInfo.data.findIndex((sensorUnit) => sensorUnit.id === formField.unitId);
    const { id: sensorId } = sensorInfo;
    const data = DataManagerIST.getDataSensor(sensorId, sensorIndex);

    const nameSplit = event.currentTarget.id.split("_");
    if (nameSplit.length === 2) {
      const [calibrationValuesRead, index] = nameSplit;
      const newValues = formField[calibrationValuesRead];
      newValues[index] = data;
      setFormField((values) => ({ ...values, [calibrationValuesRead]: [...newValues] }));
    }
  };

  const formFieldHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;

    const nameSplit = name.split("_");
    if (nameSplit.length === 1) {
      setFormField((values) => ({ ...values, [name]: value }));
    } else if (nameSplit.length === 2) {
      const [calibrationValues, index] = nameSplit;
      const newValues = formField[calibrationValues];
      newValues[index] = value;
      setFormField((values) => ({ ...values, [calibrationValues]: [...newValues] }));
    }
  };

  const validateSensorCalibratingParams = (sensorUnitInfo) => {
    //   if (sensorUnitInfo.name === "") {
    //     f7.dialog.alert("Thông tin hiển thị không được phép để trống");
    //     return false;
    //   }

    //   if (Number.isNaN(sensorUnitInfo.min)) {
    //     f7.dialog.alert("Giá trị tối thiểu phải là số");
    //     return false;
    //   }

    //   if (Number.isNaN(sensorUnitInfo.max)) {
    //     f7.dialog.alert("Giá trị tối đa phải là số");
    //     return false;
    //   }

    //   if (Number.isNaN(sensorUnitInfo.formatFloatingPoint)) {
    //     f7.dialog.alert("Giá trị định dạng phải là số");
    //     return false;
    //   }

    return true;
  };

  const onSubmitHandler = (event) => {
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

    if (validateSensorCalibratingParams(newSensorUnitInfo)) {
      onSaveHandler(newSensorUnitInfo);
    }
  };

  return (
    <>
      <List className="__calibrating" form noHairlinesMd inlineLabels>
        <CustomDropdownInput
          labelName="Thông tin hiệu chỉnh:"
          buttonName={formField.unitName}
          popOverName="popover-sensor-unit"
        >
          {sensorInfo?.data?.map((sensorUnit) => {
            return (
              <Button key={sensorInfo?.id + "|" + sensorUnit.id} onClick={() => onChangeSensorUnit(sensorUnit)}>
                <span style={{ textTransform: "none" }}>{sensorUnit.name}</span>
              </Button>
            );
          })}
        </CustomDropdownInput>

        <CustomDropdownInput
          labelName="Kiểu hiệu chỉnh:"
          buttonName={`${formField.calibratingType} điểm`}
          popOverName="popover-sensor-calibrating-type"
        >
          {[CALIBRATING_1_POINT, CALIBRATING_2_POINTS].map((calibratingType) => {
            return (
              <Button key={calibratingType} onClick={() => onChangeCalibratingType(calibratingType)}>
                <span style={{ textTransform: "none" }}>{`${calibratingType} điểm`}</span>
              </Button>
            );
          })}
        </CustomDropdownInput>

        {[...Array(formField.calibratingType).keys()].map((calibrateType) => {
          return (
            <List key={`calibrationType_${calibrateType}`} style={{ marginTop: "10px", marginBottom: "10px" }}>
              <div className="__label-calibrating-type">Điểm {calibrateType + 1}</div>
              <ListInput
                className="display-setting-input label-color-black"
                outline
                size={5}
                name={`calibrationValues_${calibrateType}`}
                label="Giá trị chuẩn:"
                type="text"
                validateOnBlur
                value={
                  formField.calibrationValues
                    ? formField.calibrationValues[calibrateType]
                    : defaultCalibratingValues[calibrateType]
                }
                onChange={formFieldHandler}
              ></ListInput>

              <div className="display-setting-input-button label-color-black input-color-blue">
                <div className="item-content item-input item-input-outline item-input-with-value">
                  <div className="item-inner">
                    <div className="item-title item-label">Giá trị đọc được</div>
                    <div className="item-input-wrap">
                      <span className="input-with-value">
                        {formField.calibrationValuesRead
                          ? formField.calibrationValuesRead[calibrateType]
                          : defaultCalibratingValues[calibrateType]}
                      </span>
                    </div>
                    <div className="sampling-button">
                      <Button
                        key={`calibrationValuesRead_${calibrateType}`}
                        id={`calibrationValuesRead_${calibrateType}`}
                        className="sampling-button"
                        onClick={onGetSampleHandler}
                      >
                        Đọc cảm biến
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </List>
          );
        })}
        <div className="buttons">
          <Button className="save-button" onClick={onSubmitHandler}>
            Lưu
          </Button>
        </div>
      </List>
    </>
  );
};

export default SensorCalibratingTab;
