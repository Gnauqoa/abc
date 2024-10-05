import React, { useEffect } from "react";
import { List, ListInput, Button, f7 } from "framework7-react";

import "./index.scss";
import DataManagerIST from "../../../services/data-manager";
import CustomDropdownInput from "./custom-list-input";
import { useTranslation } from "react-i18next";

const CALIBRATING_1_POINT = 1;
const CALIBRATING_2_POINTS = 2;

const SensorCalibratingTab = ({ sensorInfo, sensorDataIndex, onSaveHandler }) => {
  const { t, i18n } = useTranslation();
  const [formField, setFormField] = React.useState({});

  useEffect(() => {
    const unitInfos = sensorInfo.data;
    if (Array.isArray(unitInfos) && unitInfos.length > 0) {
      const unitInfo = unitInfos[sensorDataIndex || 0];
      const calibrationType = unitInfo.calibrationType;
      const calibrationValues = unitInfo.calibrationValues;
      setFormField({
        unitId: unitInfo.id,
        unitName: unitInfo.name || "",
        calibratingType: calibrationType || CALIBRATING_1_POINT,
        calibrationValues: calibrationValues || [], // { a: 1, b: 0 } y = a * x + b
        calibrationValuesRead: [], // { a: 1, b: 0 }
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
    if (data === undefined) return;

    const nameSplit = event.currentTarget.id.split("_");
    if (nameSplit.length === 2) {
      const [calibrationValuesRead, index] = nameSplit;
      const newValues = formField[calibrationValuesRead];
      newValues[index] = data;
      setFormField((values) => ({ ...values, [calibrationValuesRead]: [...newValues] }));
    }
  };

  const formFieldHandler = ({ value, type, index }) => {
    const newValues = formField[type];
    if (newValues === undefined) {
      console.log("sensor-calibrating.jsx: formFieldHandler: newValues is undefined");
      return;
    }

    newValues[index] = value;
    setFormField((values) => ({ ...values, [type]: [...newValues] }));
  };

  const convertCalibrationValues = (calibrationValues, calibrationValuesRead, calibratingType) => {
    const calibrationValue = calibrationValues[calibratingType - 1];
    const calibrationValueRead = calibrationValuesRead[calibratingType - 1];
    const calibrationValueParsed = Number(calibrationValue);
    const calibrationValueReadParsed = Number(calibrationValueRead);

    if (Number.isNaN(calibrationValueParsed) || calibrationValue === "") {
      f7.dialog.alert(
        `${t("modules.standard_value")} ${
          calibratingType === CALIBRATING_1_POINT ? t("modules.point_1") : t("modules.point_2")
        } ${t("modules.must_be_a_number")}`
      );
      return false;
    }

    if (Number.isNaN(calibrationValueReadParsed) || calibrationValueRead === "") {
      f7.dialog.alert(
        `${t("modules.readable_value")}c ${
          calibratingType === CALIBRATING_1_POINT ? t("modules.point_1") : t("modules.point_2")
        } ${t("modules.must_be_a_number")}`
      );
      return false;
    }
    return { calibrationValue: calibrationValueParsed, calibrationValueRead: calibrationValueReadParsed };
  };

  const onSubmitHandler = (event) => {
    event.preventDefault();

    const onePointResult = convertCalibrationValues(
      formField.calibrationValues,
      formField.calibrationValuesRead,
      CALIBRATING_1_POINT
    );
    if (!onePointResult) return;

    const twoPointsResult =
      formField.calibratingType === CALIBRATING_2_POINTS
        ? convertCalibrationValues(formField.calibrationValues, formField.calibrationValuesRead, CALIBRATING_2_POINTS)
        : { calibrationValue: 0, calibrationValueRead: 0 };
    if (!twoPointsResult) return;

    const { calibrationValue: v1, calibrationValueRead: r1 } = onePointResult;
    const { calibrationValue: v2, calibrationValueRead: r2 } = twoPointsResult;

    let k, offset;
    if (formField.calibratingType === CALIBRATING_1_POINT) {
      k = 1;
      offset = (v1 - r1).toFixed(2);
    } else if (formField.calibratingType === CALIBRATING_2_POINTS) {
      const numerator = v1 - v2;
      const denominator = r1 - r2 !== 0 ? r1 - r2 : 1;
      k = (numerator / denominator).toFixed(2);
      offset = (v1 - k * r1).toFixed(2);
    }

    onSaveHandler({ k: k, offset: offset, sensorId: sensorInfo.id });
  };

  return (
    <>
      <List className="__calibrating" form noHairlinesMd inlineLabels>
        {sensorInfo?.data?.length > 1 && (
          <CustomDropdownInput
            labelName={t("modules.calibration_information")}
            buttonName={t(formField.unitName)}
            popOverName="popover-sensor-unit"
          >
            {sensorInfo?.data?.map((sensorUnit) => {
              return (
                <Button key={sensorInfo?.id + "|" + sensorUnit.id} onClick={() => onChangeSensorUnit(sensorUnit)}>
                  <span style={{ textTransform: "none" }}>{t(sensorUnit.name)}</span>
                </Button>
              );
            })}
          </CustomDropdownInput>
        )}

        <CustomDropdownInput
          labelName={t("modules.correction_type")}
          buttonName={`${formField.calibratingType} ${t("modules.point")}`}
          popOverName="popover-sensor-calibrating-type"
        >
          {[CALIBRATING_1_POINT, CALIBRATING_2_POINTS].map((calibratingType) => {
            return (
              <Button key={calibratingType} onClick={() => onChangeCalibratingType(calibratingType)}>
                <span style={{ textTransform: "none" }}>{`${calibratingType} ${t("modules.point")}`}</span>
              </Button>
            );
          })}
        </CustomDropdownInput>

        {[...Array(formField.calibratingType).keys()].map((calibrateType) => {
          return (
            <List key={`calibrationType_${calibrateType}`} style={{ marginTop: "10px", marginBottom: "10px" }}>
              <div className="__label-calibrating-type">
                {t("modules.point")} {calibrateType + 1}
              </div>
              <ListInput
                className="display-setting-input label-color-black"
                outline
                size={5}
                label={t("modules.standard_value") + ":"}
                type="number"
                value={formField.calibrationValues?.[calibrateType]}
                onChange={(e) =>
                  formFieldHandler({ value: e.target.value, type: "calibrationValues", index: calibrateType })
                }
              ></ListInput>

              <ul>
                <li className="display-setting-input-button label-color-black input-color-blue">
                  <div className="item-content item-input item-input-outline item-input-with-value">
                    <div className="item-inner">
                      <div className="item-title item-label">{t("modules.readable_value") + ":"}</div>
                      <div className="item-input-wrap">
                        <input
                          type="number"
                          size="5"
                          class=""
                          value={formField.calibrationValuesRead?.[calibrateType]}
                          onChange={(e) =>
                            formFieldHandler({
                              value: e.target.value,
                              type: "calibrationValuesRead",
                              index: calibrateType,
                            })
                          }
                        />
                      </div>
                      <div className="sampling-button">
                        <Button
                          key={`calibrationValuesRead_${calibrateType}`}
                          id={`calibrationValuesRead_${calibrateType}`}
                          className="sampling-button"
                          onClick={onGetSampleHandler}
                        >
                          {t("modules.read_the_sensor")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </List>
          );
        })}
        <div className="buttons">
          <Button className="save-button" onClick={onSubmitHandler}>
            {t("common.save")}
          </Button>
        </div>
      </List>
    </>
  );
};

export default SensorCalibratingTab;
