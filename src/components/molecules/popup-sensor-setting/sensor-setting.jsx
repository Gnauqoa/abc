import React, { useEffect } from "react";
import { List, ListInput, Button, f7 } from "framework7-react";
import { useTranslation } from "react-i18next";

import "./index.scss";
import CustomDropdownInput from "./custom-list-input";

const SensorSettingTab = ({ sensorInfo, sensorDataIndex, onSaveHandler }) => {
  const { t, i18n } = useTranslation();
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
        formatFloatingPoint: (unitInfo.formatFloatingPoint ??= "1"),
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
      formatFloatingPoint: (unitInfo.formatFloatingPoint ??= "1"),
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
      f7.dialog.alert(t("modules.display_information_cannot_be_left_blank"));
      return false;
    }

    if (Number.isNaN(sensorUnitInfo.min)) {
      f7.dialog.alert(t("modules.minimum_value_must_be_numeric"));
      return false;
    }

    if (Number.isNaN(sensorUnitInfo.max)) {
      f7.dialog.alert(t("modules.maximum_value_must_be_numeric"));
      return false;
    }

    if (Number.isNaN(sensorUnitInfo.formatFloatingPoint)) {
      f7.dialog.alert(t("modules.the_format_value_must_be_numeric"));
      return false;
    }

    if (![0, 1, 2, 3].includes(sensorUnitInfo.formatFloatingPoint)) {
      f7.dialog.alert(t("modules.the_format_value_must_be_0_1_2_or_3"));
      return false;
    }

    return true;
  };

  const onSubmitHandler = (event) => {
    event.preventDefault();

    const parsedMinValue = Number(formField.minValue || "0");
    const parsedMaxValue = Number(formField.maxValue || "0");
    const parsedFormatFloatingPoint = Number((formField.formatFloatingPoint ??= "1"));
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
        {sensorInfo?.data?.length > 1 && (
          <CustomDropdownInput
            labelName={t("modules.installation_information")}
            buttonName={t(formField.unitName)}
            popOverName="popover-sensor-unit"
          >
            <List className="list-frequency">
              {sensorInfo?.data?.map((sensorUnit) => {
                return (
                  <Button key={sensorInfo?.id + "|" + sensorUnit.id} onClick={() => onChangeSensorUnit(sensorUnit)}>
                    <span style={{ textTransform: "none" }}>{t(sensorUnit.name)}</span>
                  </Button>
                );
              })}
            </List>
          </CustomDropdownInput>
        )}

        <ListInput
          className="display-setting-input label-color-black"
          outline
          size={5}
          name="displayedNamed"
          label={t("modules.information_displayed")}
          type="text"
          value={t(formField.displayedNamed)}
          onChange={formFieldHandler}
        ></ListInput>
        <ListInput
          className="display-setting-input label-color-black"
          outline
          size={5}
          name="unitOfMeasure"
          label={t("modules.measurement_unit") + ":"}
          type="text"
          value={formField.unitOfMeasure}
          onChange={formFieldHandler}
        ></ListInput>
        <ListInput
          className="display-setting-input label-color-black"
          outline
          size={5}
          name="minValue"
          label={t("modules.min_value") + ":"}
          type="number"
          value={formField.minValue}
          onChange={formFieldHandler}
        ></ListInput>
        <ListInput
          className="display-setting-input label-color-black"
          outline
          size={5}
          name="maxValue"
          label={t("modules.max_value") + ":"}
          type="number"
          value={formField.maxValue}
          onChange={formFieldHandler}
        ></ListInput>
        <ListInput
          className="display-setting-input label-color-black"
          outline
          size={5}
          name="formatFloatingPoint"
          label={t("modules.format_odd_number")}
          type="text"
          value={formField.formatFloatingPoint}
          onChange={formFieldHandler}
        ></ListInput>
      </List>
      <div className="buttons">
        <Button className="save-button" onClick={onSubmitHandler}>
          {t("common.save")}
        </Button>
      </div>
    </>
  );
};

export default SensorSettingTab;
