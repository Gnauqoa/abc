import { Button, Navbar, Page, Popup, f7 } from "framework7-react";
import React, { useEffect, useRef, useState } from "react";

import "./index.scss";
import DataManagerIST from "../../../services/data-manager";
import { FIRST_COLUMN_DEFAULT_OPT } from "../../../utils/widget-table-chart/commons";
import { useTranslation } from "react-i18next";

const AddUserUnitPopup = ({ onSubmit, unitId }) => {
  const { t, i18n } = useTranslation();
  const addUserUnitPopupRef = useRef();
  const [unitName, setUnitName] = useState("");
  const [unit, setUnit] = useState("");

  const onSubmitHandler = () => {
    let option;
    if (unitId === FIRST_COLUMN_DEFAULT_OPT) {
      option = DataManagerIST.addCustomUnit({ unitName, unit });
    } else {
      option = DataManagerIST.updateCustomUnit({ unitId, unitName, unit });
    }

    if (option) {
      onSubmit(option);
    }
    f7.popup.close();
  };

  useEffect(() => {
    const unitInfo = DataManagerIST.getCustomUnitInfo({ unitId });
    if (unitInfo) {
      setUnitName(unitInfo.name);
      setUnit(unitInfo.unit);
    }
  }, [unitId]);

  return (
    <Popup className="add-user-unit-popup" ref={addUserUnitPopupRef} onPopupClose={() => {}}>
      <Page className="add-user-unit">
        <Navbar className="add-user-unit-header" title={t("modules.user_input_information")}></Navbar>
        <div className="add-user-unit-content">
          <div className="add-user-unit-content__items">
            <div className="add-user-unit-content__item">
              <span>{t("modules.information_name")}</span>
              <input
                type="text"
                value={unitName}
                onChange={(e) => {
                  setUnitName(e.target.value.trimStart());
                }}
              />
            </div>
            <div className="add-user-unit-content__item">
              <span>{t("modules.measurement_unit")}</span>
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
              {t("common.cancel")}
            </Button>
            <Button className="ok-button" onClick={onSubmitHandler}>
              {t("common.ok")}
            </Button>
          </div>
        </div>
      </Page>
    </Popup>
  );
};

export default AddUserUnitPopup;
