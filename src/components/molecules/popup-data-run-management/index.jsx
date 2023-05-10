import React, { useRef, useState } from "react";
import { Navbar, Button, Page, Popup, Block } from "framework7-react";
import DataManagerIST from "../../../services/data-manager";

import "./index.scss";
import dataManagementIcon from "../../../img/activity/data-management.png";
import { useActivityContext } from "../../../context/ActivityContext";

const DataRunManagementPopup = ({ handleChangeDataRun }) => {
  const dataRunManagementPopupRef = useRef();
  const dataRunPreviews = DataManagerIST.getActivityDataRunPreview();
  const [dataRunName, setDataRunName] = useState({});
  const { currentDataRunId, setCurrentDataRunId } = useActivityContext();

  const onSaveDataRun = (dataRunId) => {
    const newName = dataRunName[dataRunId];
    DataManagerIST.updateDataRun(dataRunId, newName);
  };

  const onDeleteDataRun = (dataRunId) => {
    const result = DataManagerIST.deleteDataRun(dataRunId);
    result && setCurrentDataRunId(DataManagerIST.getCurrentDataRunId());
  };

  const onChangeDataRunName = (event) => {
    const dataRunId = event.target.id;
    const newName = event.target.value.trimStart();
    setDataRunName((values) => ({ ...values, [dataRunId]: newName }));
  };

  return (
    <Popup className="data-run-management-popup" ref={dataRunManagementPopupRef}>
      <Page className="data-run-management">
        <Navbar title="Quản lý dữ liệu"></Navbar>
        <div className="data-run-management-header ">
          <div className="data-name-column">Dữ liệu</div>
          <div className="data-time-column">Thời gian</div>
        </div>
        <table className="data-run-management-content">
          <tbody>
            {dataRunPreviews.map((item) => (
              <tr key={item.id} className={currentDataRunId === item.id && `selected`}>
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
                    <Button
                      iconIos={"material:edit"}
                      iconMd={"material:edit"}
                      iconAurora={"material:edit"}
                      iconSize={35}
                      iconColor="gray"
                      onClick={() => onSaveDataRun(item.id)}
                    ></Button>
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
        {/* <div className="list-data-run">
          {dataRunPreviews.map((item) => (
            <div className="list-item" key={item.id}>

            </div>
          ))}
        </div> */}
      </Page>
    </Popup>
  );
};

export default DataRunManagementPopup;
