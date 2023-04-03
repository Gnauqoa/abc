import React, { useState, useEffect } from "react";
import { Page, Navbar, NavRight, List, ListInput, Link, Row, Col, Button, Popup, Icon, f7 } from "framework7-react";

import _ from "lodash";
import sensors from "../services/sensor-service";
import { evaluate } from "mathjs";

const sensorList = sensors;

export default function ({ sensorSettings, onSubmit = () => {} }) {
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
      f7.dialog.alert("Không có cảm biến nào được chọn");
      return false;
    }

    if (formField.unitOfMeasure === "nan" || formField.unitOfMeasure === "") {
      f7.dialog.alert(`Đơn vị đo không được phép để trống`);
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
      f7.dialog.alert(`Công thức không hợp lệ, vui lòng kiểm tra lại. Chi tiết lỗi: ${err.message}`);
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
    <Page>
      <Navbar className="sensor-select-title" title="Cài đặt hiển thị dữ liệu">
        <NavRight>{/* <Link iconIos="material:close" iconMd="material:close" popupClose></Link> */}</NavRight>
      </Navbar>
      <List form noHairlinesMd inlineLabels>
        <ListInput
          outline
          className="label-color-black input-stack-position"
          name="sensorDetailId"
          label="Chọn dữ liệu:"
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
          label="Đơn vị đo:"
          type="text"
          onChange={formFieldHandler}
          validateOnBlur
          value={formField.unitOfMeasure || ""}
        ></ListInput>
        <ListInput
          className="display-setting-input label-color-black"
          outline
          size={1}
          errorMessage="Chỉ nhập số"
          pattern="[0-9]*"
          name="floatingPointPosition"
          label="Format số lẻ:"
          type="text"
          onChange={formFieldHandler}
          validateOnBlur
          value={formField.floatingPointPosition || ""}
        ></ListInput>
        <ListInput
          outline
          name="transformFormula"
          className="label-color-black input-stack-position"
          label="Công thức tính toán: "
          type="textarea"
          onChange={formFieldHandler}
          value={formField.transformFormula}
        />
      </List>
      <div className="buttons">
        <Button className="cancel-button" popupClose onClick={resetSettings}>
          Bỏ qua
        </Button>
        <Button className="ok-button" type="reset" onClick={handleSubmit}>
          Lưu
        </Button>
      </div>
    </Page>
  );
}
