import React, { forwardRef } from "react";
import { Page, Navbar, NavRight, List, ListInput, Button, f7, Popup } from "framework7-react";

import _ from "lodash";
import SensorServices from "../../../services/sensor-service";
import { evaluate } from "mathjs";
import { useTranslation } from "react-i18next";

const sensorList = SensorServices.getSensors();

const DataDisplaySettingPopup = ({ sensorSettings, onSubmit = () => {} }, ref) => {
  const { t, i18n } = useTranslation();

  const [formField, setFormField] = React.useState({});

  const FormInitState = {
    sensorDetailId: "",
    unitOfMeasure: "",
    floatingPointPosition: "",
    transformFormula: "",
  };

  const resetSettingOnChangeSensor = () => {
    setFormField({
      unitOfMeasure: "",
      floatingPointPosition: "",
      transformFormula: "",
    });
  };

  const resetSettings = () => {
    setFormField(FormInitState);
  };

  const loadSensorSavedSetting = (sensorDetailId) => {
    const foundSavedSetting = sensorSettings.find((e) => e.sensorDetailId === sensorDetailId);
    if (foundSavedSetting != undefined) {
      setFormField({
        unitOfMeasure: foundSavedSetting.unitOfMeasure,
        floatingPointPosition: foundSavedSetting.floatingPointPosition,
        transformFormula: foundSavedSetting.transformFormula,
      });
    }
  };

  const formFieldHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setFormField((values) => ({ ...values, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (validate()) {
      setFormField(FormInitState);
      onSubmit({
        sensorDetailId: formField.sensorDetailId,
        unitOfMeasure: formField.unitOfMeasure,
        floatingPointPosition: formField.floatingPointPosition,
        transformFormula: formField.transformFormula,
      });
    }
  };

  const validate = () => {
    if (formField.sensorDetailId === "") {
      f7.dialog.alert(t("modules.no_sensors_selected"));
      return false;
    }

    if (formField.unitOfMeasure === "nan" || formField.unitOfMeasure === "") {
      f7.dialog.alert(t("modules.unit_of_measurement_cannot_be_left_blank"));
      return false;
    }

    return customFomularValidator(formField.transformFormula);
  };

  const customFomularValidator = (transformFormula) => {
    if (transformFormula.length === 0 || transformFormula === "undefined") {
      return true;
    }
    try {
      const trimmedFomular = transformFormula.trim();
      const scope = {
        x: 3,
      };
      evaluate(trimmedFomular, scope);
      return true;
    } catch (err) {
      f7.dialog.alert(`${t("modules.invalid_formula_please_check_again_Error_details")} ${err.message}`);
      return false;
    }
  };

  const sensorChangeHandler = (evt) => {
    resetSettingOnChangeSensor();
    const selectedValueString = evt.target.value;
    if (selectedValueString) {
      const arr = selectedValueString.split("|");
      if (arr.length > 1) {
        formFieldHandler(evt);
        loadSensorSavedSetting(selectedValueString);
      }
    }
  };

  return (
    <Popup className="display-setting-popup" ref={ref}>
      <Page>
        <Navbar className="sensor-select-title" title={t("modules.data_display_settings")}>
          <NavRight>{/* <Link iconIos="material:close" iconMd="material:close" popupClose></Link> */}</NavRight>
        </Navbar>
        <List form noHairlinesMd inlineLabels>
          <ListInput
            outline
            className="label-color-black input-stack-position"
            name="sensorDetailId"
            label={t("modules.select_data")}
            defaultValue=""
            value={formField.sensorDetailId}
            type="select"
            validate
            onChange={sensorChangeHandler}
          >
            <option key="nan" id="nan"></option>
            {sensorList.map(({ id, name, data }) => (
              <optgroup label={name} key={id}>
                {data.map((s) => (
                  <option key={id + "|" + s.id} value={id + "|" + s.id}>
                    {`${s.name} ${s.unit === "" ? "" : ` (${s.unit})`}`}
                  </option>
                ))}
              </optgroup>
            ))}
          </ListInput>
          <ListInput
            className="display-setting-input label-color-black"
            outline
            size={5}
            name="unitOfMeasure"
            label={t("modules.select_data") + ":"}
            type="text"
            onChange={formFieldHandler}
            value={formField.unitOfMeasure || ""}
          ></ListInput>
          <ListInput
            className="display-setting-input label-color-black"
            outline
            size={1}
            errorMessage={t("modules.enter_numbers_only")}
            pattern="[0-9]*"
            name="floatingPointPosition"
            label={t("modules.format_odd_number")}
            type="text"
            onChange={formFieldHandler}
            value={formField.floatingPointPosition || ""}
          ></ListInput>
          <ListInput
            outline
            name="transformFormula"
            className="label-color-black input-stack-position"
            label={t("modules.calculation_formula")}
            type="textarea"
            onChange={formFieldHandler}
            value={formField.transformFormula}
          />
        </List>
        <div className="buttons">
          <Button className="cancel-button" popupClose onClick={resetSettings}>
            {t("common.cancel")}
          </Button>
          <Button className="ok-button" type="reset" onClick={handleSubmit}>
            {t("common.save")}
          </Button>
        </div>
      </Page>
    </Popup>
  );
};

export default forwardRef(DataDisplaySettingPopup);
