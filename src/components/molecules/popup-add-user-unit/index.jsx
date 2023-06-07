import { Button, Navbar, Page, Popup, f7 } from "framework7-react";
import React, { useRef, useState } from "react";

import "./index.scss";
import DataManagerIST from "../../../services/data-manager";

const AddUserUnitPopup = ({}) => {
  const addUserUnitPopupRef = useRef();
  const [measureName, setMeasureName] = useState("");
  const [measureUnit, setMeasureUnit] = useState("");

  const onSubmitHandler = () => {
    DataManagerIST.addCustomMeasurement({ measureName, measureUnit });
    f7.popup.close();
  };

  return (
    <Popup className="add-user-unit-popup" ref={addUserUnitPopupRef} onPopupClose={() => {}}>
      <Page className="add-user-unit">
        <Navbar className="add-user-unit-header" title="Thông tin người dùng nhập"></Navbar>
        <div className="add-user-unit-content">
          <div className="add-user-unit-content__items">
            <div className="add-user-unit-content__item">
              <span>Tên thông tin</span>
              <input
                type="text"
                value={measureName}
                onChange={(e) => {
                  setMeasureName(e.target.value.trim());
                }}
              />
            </div>
            <div className="add-user-unit-content__item">
              <span>Đơn vị đo</span>
              <input
                type="text"
                value={measureUnit}
                onChange={(e) => {
                  setMeasureUnit(e.target.value.trim());
                }}
              />
            </div>
          </div>

          <div className="add-user-unit__buttons">
            <Button className="cancel-button" popupClose>
              Bỏ qua
            </Button>
            <Button className="ok-button" onClick={onSubmitHandler}>
              OK
            </Button>
          </div>
        </div>
      </Page>
    </Popup>
  );
};

export default AddUserUnitPopup;
