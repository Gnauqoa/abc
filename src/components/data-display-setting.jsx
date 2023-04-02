import React, { useState, useEffect } from "react";
import { Page, Navbar, NavRight, List, ListInput, Link, Row, Col, Button, Popup, Icon, f7 } from "framework7-react";

import _ from "lodash";
import sensors from "../services/sensor-service";
import { evaluate } from "mathjs";
import FormInitState from "../services/data-display-setting-service";

const sensorList = sensors;

export default function ({ sensorSettings, onSubmit = () => {} }) {
  const [unitOfMeasureList, setUnitOfMeasureList] = useState([]);
  const [formField, setFormField] = React.useState({});

  const resetSettingOnChangeSensor = () => {
    setFormField({
      unitOfMeasure: "",
      floatingPointPosition: "",
      transformFormula: "",
    });
  };

  const resetSettings = () => {
    setFormField(FormInitState);
    setUnitOfMeasureList([]);
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
      setUnitOfMeasureList([]);
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

    if (formField.floatingPointPosition === "nan" || formField.floatingPointPosition === "nan") {
      f7.dialog.alert(`Format số lẻ không được phép để trống`);
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
      const result = evaluate(trimmedFomular, scope);
      return true;
    } catch (err) {
      f7.dialog.alert(`CÔng thức không hợp lệ, vui lòng kiểm tra lại. Chi tiết lỗi: ${err.message}`);
      return false;
    }
  };

  const sensorChangeHandler = (evt) => {
    resetSettingOnChangeSensor();
    const selectedValueString = evt.target.value;
    if (selectedValueString) {
      const arr = selectedValueString.split("|");
      if (arr.length > 1) {
        const sensorId = parseInt(arr[0]),
          sensorDetailId = arr[1],
          existingSensorData = sensorList.find((s) => s.id == sensorId),
          sensorDetailData = _.find(existingSensorData.data, (item) => item.id === sensorDetailId),
          altUnits = sensorDetailData["altUnits"];
        console.log(!altUnits.find((e) => e.id === -1));
        if (!altUnits.find((e) => e.id === -1)) {
          altUnits.push({ id: -1, name: sensorDetailData.unit, cvtFomular: "" });
        }
        altUnits.sort().reverse();
        setUnitOfMeasureList(altUnits);
        formFieldHandler(evt);
        loadSensorSavedSetting(selectedValueString);
      }
    }
  };

  return (
    <Page>
      <Navbar className="sensor-select-title" title="Cài đặt hiển thị dữ liệu">
        <NavRight>
          <Link iconIos="material:close" iconMd="material:close" popupClose></Link>
        </NavRight>
      </Navbar>
      <List form noHairlinesMd inlineLabels>
        <ListInput
          outline
          name="sensorDetailId"
          label="Chọn dữ liệu:"
          defaultValue=""
          value={formField.sensorDetailId}
          type="select"
          validate
          onChange={sensorChangeHandler}
        >
          <option key="nan" id="nan"></option>
          {/* {sensorList.map(({ id, name, data }) =>
            data.map((s) => <option key={id + "|" + s.id} value={id + "|" + s.id}>{`${name} - ${s.name}`}</option>)
          )} */}
          {sensorList.map(({ id, name, data }) => (
            <optgroup label={name} key={id}>
              {data.map((s) => (
                <option key={id + "|" + s.id} value={id + "|" + s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          ))}
        </ListInput>
        <ListInput
          outline
          name="unitOfMeasure"
          label="Đơn vị đo:"
          type="select"
          onChange={formFieldHandler}
          validate
          value={formField.unitOfMeasure || ""}
        >
          {unitOfMeasureList.map((altUnit) => (
            <option key={altUnit.id} value={altUnit.id}>
              {altUnit.name}
            </option>
          ))}
        </ListInput>
        <ListInput
          outline
          name="floatingPointPosition"
          label="Format số lẻ:"
          type="select"
          onChange={formFieldHandler}
          validate
          value={formField.floatingPointPosition || ""}
        >
          <option value="nan"></option>
          {(() => {
            const arr = [];
            for (let i = 1; i <= 5; i++) {
              arr.push(
                <option key={i} id={i}>
                  {i}
                </option>
              );
            }
            return arr;
          })()}
        </ListInput>
        <ListInput
          outline
          name="transformFormula"
          label="Công thức tính toán: "
          type="textarea"
          onChange={formFieldHandler}
          value={formField.transformFormula}
        />
      </List>
      <Row className="form-button">
        <Col></Col>
        <Col></Col>
        <Col>
          <Button popupClose fill color="red" type="reset" onClick={resetSettings}>
            Huỷ
          </Button>
        </Col>
        <Col>
          <Button type="reset" fill color="green" onClick={handleSubmit}>
            Lưu cài đặt
          </Button>
        </Col>
      </Row>
    </Page>
  );
}
