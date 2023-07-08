import React, { useRef, useState } from "react";
import { Navbar, Button, Page, Popup, Block, NavTitle, NavRight, NavLeft, f7 } from "framework7-react";
import DataManagerIST from "../../../services/data-manager";

import "./index.scss";
import dataManagementIcon from "../../../img/activity/data-management.png";
import { useActivityContext } from "../../../context/ActivityContext";
import { createExcelWorkbookBuffer, shareFile } from "../../../utils/core";

const DataRunManagementPopup = () => {
  const dataRunManagementPopupRef = useRef();
  const dataRunPreviews = DataManagerIST.getActivityDataRunPreview();
  const [dataRunNameEdited, setDataRunNameEdited] = useState({});
  const { handleDeleteDataRun } = useActivityContext();

  const onSaveDataRun = () => {
    for (const [dataRunId, newDataRunName] of Object.entries(dataRunNameEdited)) {
      DataManagerIST.updateDataRun(dataRunId, newDataRunName);
    }
  };

  const onDeleteDataRun = (dataRunId) => {
    const result = DataManagerIST.deleteDataRun(dataRunId);
    result && handleDeleteDataRun(dataRunId, DataManagerIST.getCurrentDataRunId());
  };

  const onChangeDataRunName = (event) => {
    const dataRunId = event.target.id;
    const newName = event.target.value.trimStart();
    setDataRunNameEdited((values) => ({ ...values, [dataRunId]: newName }));
  };

  const handleShareDataRuns = () => {
    const dataRunInfo = DataManagerIST.createDataRunInfos();
    const dataRunInfoBuffer = createExcelWorkbookBuffer({ sheets: dataRunInfo });
    const blob = new Blob([dataRunInfoBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    shareFile("Dữ liệu thí ngiệm" + ".xlsx", blob);
  };

  const header =
    f7.device.android || f7.device.ios ? (
      <Navbar>
        <NavLeft>
          <NavTitle>Quản lý dữ liệu</NavTitle>
        </NavLeft>
        <NavRight>
          <Button raised fill onClick={handleShareDataRuns}>
            Chia sẻ dữ liệu
          </Button>
        </NavRight>
      </Navbar>
    ) : (
      <Navbar>
        <NavLeft>
          <NavTitle>Quản lý dữ liệu</NavTitle>
        </NavLeft>
      </Navbar>
    );

  return (
    <Popup className="data-run-management-popup" ref={dataRunManagementPopupRef} onPopupClose={onSaveDataRun}>
      <Page className="data-run-management">
        {header}
        <div className="data-run-management-content">
          <div className="data-run-management-header ">
            <div className="data-name-column">Dữ liệu</div>
            <div className="data-time-column">Thời gian</div>
          </div>
          <table>
            <tbody>
              {dataRunPreviews.map((item) => (
                // <tr key={item.id} className={currentDataRunId === item.id ? `selected` : ""}>
                <tr key={item.id}>
                  <td className="data-column">
                    <img src={dataManagementIcon || ""} alt={dataManagementIcon} />
                    <input
                      id={item.id}
                      className="data-run-name"
                      defaultValue={item.name}
                      onChange={onChangeDataRunName}
                    />
                  </td>
                  <td className="detail-column">
                    <span className="timestamp">{item.createdAt}</span>
                    <div className="list-buttons">
                      {/* <Button
                        iconIos={"material:edit"}
                        iconMd={"material:edit"}
                        iconAurora={"material:edit"}
                        iconSize={35}
                        iconColor="gray"
                        onClick={() => onSaveDataRun(item.id)}
                      ></Button> */}
                      <Button
                        iconIos={"material:delete"}
                        iconMd={"material:delete"}
                        iconAurora={"material:delete"}
                        iconSize={35}
                        iconColor="gray"
                        onClick={() => onDeleteDataRun(item.id)}
                      ></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Page>
    </Popup>
  );
};

export default DataRunManagementPopup;
