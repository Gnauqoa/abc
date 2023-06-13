import { Button, Navbar, Page, Popup, f7 } from "framework7-react";
import React, { useRef, useState } from "react";

import "./index.scss";
import DataManagerIST from "../../../services/data-manager";

const AddUserUnitPopup = ({ onSubmit }) => {
  const addUserUnitPopupRef = useRef();
  const [unitName, setUnitName] = useState("");
  const [unit, setUnit] = useState("");

  const onSubmitHandler = () => {
    const option = DataManagerIST.addCustomUnit({ unitName, unit });
    onSubmit(option);
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
                value={unitName}
                onChange={(e) => {
                  setUnitName(e.target.value.trimStart());
                }}
              />
            </div>
            <div className="add-user-unit-content__item">
              <span>Đơn vị đo</span>
              <input
                type="text"
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value.trimStart());
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