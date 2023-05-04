import React, { useRef } from "react";
import { Navbar, Button, Page, Popup } from "framework7-react";
import DataManagerIST from "../../../services/data-manager";

const DataRunManagementPopup = ({ handleChangeDataRun }) => {
  const dataRunManagementPopupRef = useRef();
  const dataRunPreviews = DataManagerIST.getActivityDataRunPreview();
  const inputRef = useRef();

  const onSaveDataRun = (event) => {
    const dataRunId = event.currentTarget.id;
    const newDataRunName = inputRef.current.value;
    console.log("SAVE_DATA_RUN: ", dataRunId, " to NEW_NAME: ", newDataRunName);
  };

  const onDeleteDataRun = (event) => {
    const dataRunId = event.currentTarget.id;
    console.log("DELETE_DATA_RUN: ", dataRunId);
  };

  const handleOnChange = () => {
    handleChangeDataRun();
  };

  return (
    <Popup className="data-run-management-popup" ref={dataRunManagementPopupRef}>
      <Page className="data-run-management">
        <Navbar className="data-run-management-header" title="Quản lý dữ liệu"></Navbar>
        <div className="list-data-run">
          {dataRunPreviews.map((item) => (
            <div className="list-item" key={item.id}>
              <Button
                id={item.id}
                className="list-button"
                iconIos={"material:bookmark"}
                iconMd={"material:bookmark"}
                iconAurora={"material:bookmark"}
                iconSize={35}
                iconColor="blue"
                onClick={onSaveDataRun}
              ></Button>
              <input ref={inputRef} id={item.id} className="list-text" defaultValue={item.name} />
              <Button
                id={item.id}
                className="list-button"
                iconIos={"material:delete"}
                iconMd={"material:delete"}
                iconAurora={"material:delete"}
                iconSize={35}
                iconColor="gray"
                onClick={onDeleteDataRun}
              ></Button>
            </div>
          ))}
        </div>
        {/* <div className="button">
        <Button className="close-button" onClick={() => f7.popup.close()}>
          Đóng
        </Button>
      </div> */}
      </Page>
    </Popup>
  );
};

export default DataRunManagementPopup;
