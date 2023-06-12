import React, { useState, useEffect } from "react";
import { List, ListInput, Button, f7, Icon } from "framework7-react";

import "./index.scss";
import CustomDropdownInput from "./custom-list-input";
import storeService from "../../../services/store-service";

const storeSettingService = new storeService("remote-logging");
const LOGGING_MODE = {
  off: "Tắt",
  memory: "Lưu vào bộ nhớ",
  server: "Gởi lên server",
};
const START_ON = {
  now: "Ngay lập tức",
  reset: "Sau khi reset",
  always: "Luôn luôn chạy",
};

const RemoteLoggingTab = ({ sensorInfo, sensorDataIndex, onSaveHandler }) => {
  const [formSetting, setFormSetting] = useState({});
  const sensorId = sensorInfo.id;

  useEffect(() => {
    let savedSetting = storeSettingService.find(sensorId) ||
      storeSettingService.find("default") || {
        mode: "off", // off/memory/server
        duration: "",
        freq: "",
        wifiName: "",
        wifiPassword: "",
        server: "",
        unitInfo: {},
        channel: "",
        startOn: "now", // now/reset/always
      };

    let unitInfo = { name: "", unit: "" };
    const unitInfos = sensorInfo.data;
    if (Array.isArray(unitInfos) && unitInfos.length > 0) {
      unitInfo = unitInfos[sensorDataIndex || 0];
    }

    console.log("savedSetting", savedSetting)
    setFormSetting({ ...savedSetting, id: sensorId, unitInfo });
  }, [sensorInfo]);

  const formSettingHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setFormSetting((setting) => ({ ...setting, [name]: value.trim() }));
  };

  const validateSettingParams = (setting) => {
    if (setting.duration === "" || isNaN(setting.duration)) {
      f7.dialog.alert("Tổng thời gian không hợp lệ");
      return false;
    }

    if (setting.freq === "" || isNaN(setting.freq)) {
      f7.dialog.alert("Tần suất không hợp lệ");
      return false;
    }

    if (setting.mode === "server") {
      if (setting.wifiName === "" || isNaN(setting.wifiName)) {
        f7.dialog.alert("Tên Wifi không hợp lệ");
        return false;
      }
      if (setting.server === "" || isNaN(setting.server)) {
        f7.dialog.alert("Địa chỉ server không hợp lệ");
        return false;
      }
      if (setting.channel === "" || isNaN(setting.channel)) {
        f7.dialog.alert("Kênh thông tin không hợp lệ");
        return false;
      }
    }

    return true;
  };

  const onSubmitHandler = (event) => {
    event.preventDefault();

    if (validateSettingParams(formSetting)) {
      storeSettingService.save(formSetting);
      storeSettingService.save({ ...formSetting, id: "default" });
      onSaveHandler({ sensorId: sensorInfo.id, action: "setting-log", data: formSetting });
    }
  };

  const onLoggingModeChange = (mode) => {
    setFormSetting({
      ...formSetting,
      mode,
    });
    f7.popover.close();
  };

  const onStartOnChange = (startOn) => {
    setFormSetting({
      ...formSetting,
      startOn,
    });
    f7.popover.close();
  };

  const onChangeSensorUnit = (unitInfo) => {
    setFormSetting({
      ...formSetting,
      unitInfo,
    });
    f7.popover.close();
  };

  return (
    <>
      <List className="__setting __remote-logging" form noHairlinesMd inlineLabels>
        {sensorInfo.isSensorLogAvailable && (
          <li className="display-setting-input label-color-black">
            <div className="item-content item-input item-input-outline item-input-with-value">
              <div className="item-inner download-log-wrap">
                <div className="item-title item-label">Log data:</div>
                <Button
                  className="edl-button"
                  onClick={() => onSaveHandler({ sensorId: sensorInfo.id, action: "download-log" })}
                >
                  Download
                </Button>
              </div>
            </div>
          </li>
        )}
      </List>
      <List className="__setting __remote-logging" form noHairlinesMd inlineLabels>
        <CustomDropdownInput
          labelName="Chế độ:"
          buttonName={LOGGING_MODE[formSetting.mode]}
          popOverName="popover-logging-mode"
        >
          {Object.keys(LOGGING_MODE).map((mode) => {
            return (
              <Button key={mode} onClick={() => onLoggingModeChange(mode)}>
                <span style={{ textTransform: "none" }}>{LOGGING_MODE[mode]}</span>
              </Button>
            );
          })}
        </CustomDropdownInput>
        <ListInput
          className="display-setting-input label-color-black"
          outline
          size={5}
          name="duration"
          label="Tổng thời gian:"
          type="text"
          validateOnBlur
          value={formSetting.duration}
          onChange={formSettingHandler}
        >
          <div slot="inner-end" className="margin-left">
            phút
          </div>
        </ListInput>
        <ListInput
          className="display-setting-input label-color-black"
          outline
          size={5}
          name="freq"
          label="Tần suất:"
          type="text"
          validateOnBlur
          value={formSetting.freq}
          onChange={formSettingHandler}
        >
          <div slot="inner-end" className="margin-left">
            giây/lần
          </div>
        </ListInput>
        {formSetting.mode === "server" && (
          <ListInput
            className="display-setting-input label-color-black"
            outline
            size={5}
            name="wifiName"
            label="Tên Wifi:"
            type="text"
            validateOnBlur
            value={formSetting.wifiName}
            onChange={formSettingHandler}
          ></ListInput>
        )}
        {formSetting.mode === "server" && (
          <ListInput
            className="display-setting-input label-color-black"
            outline
            size={5}
            name="wifiPassword"
            label="Mật khẩu Wifi:"
            type="text"
            validateOnBlur
            value={formSetting.wifiPassword}
            onChange={formSettingHandler}
          ></ListInput>
        )}

        {formSetting.mode === "server" && (
          <ListInput
            className="display-setting-input label-color-black"
            outline
            size={5}
            name="server"
            label="Địa chỉ server:"
            type="text"
            validateOnBlur
            value={formSetting.server}
            onChange={formSettingHandler}
          ></ListInput>
        )}

        {formSetting.mode === "server" && sensorInfo?.data?.length > 1 && (
          <CustomDropdownInput
            labelName="Thông tin gởi:"
            buttonName={`${formSetting.unitInfo.name} (${formSetting.unitInfo.unit})`}
            popOverName="popover-sensor-unit"
          >
            <List className="list-frequency">
              {sensorInfo?.data?.map((unitInfo) => {
                return (
                  <Button key={sensorInfo?.id + "|" + unitInfo.id} onClick={() => onChangeSensorUnit(unitInfo)}>
                    <span style={{ textTransform: "none" }}>{`${unitInfo.name} (${unitInfo.unit})`}</span>
                  </Button>
                );
              })}
            </List>
          </CustomDropdownInput>
        )}

        {formSetting.mode === "server" && (
          <ListInput
            className="display-setting-input label-color-black"
            outline
            size={5}
            name="channel"
            label="Kênh thông tin:"
            type="text"
            validateOnBlur
            value={formSetting.channel}
            onChange={formSettingHandler}
          ></ListInput>
        )}

        <CustomDropdownInput
          labelName="Thời gian bắt đầu:"
          buttonName={START_ON[formSetting.startOn]}
          popOverName="popover-start-on"
        >
          {Object.keys(START_ON).map((startOn) => {
            return (
              <Button key={startOn} onClick={() => onStartOnChange(startOn)}>
                <span style={{ textTransform: "none" }}>{START_ON[startOn]}</span>
              </Button>
            );
          })}
        </CustomDropdownInput>
      </List>
      <div className="buttons">
        <Button className="save-button" onClick={onSubmitHandler}>
          Lưu
        </Button>
      </div>
    </>
  );
};

export default RemoteLoggingTab;
