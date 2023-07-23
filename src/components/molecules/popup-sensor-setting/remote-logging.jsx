import React, { useState, useEffect } from "react";
import { List, ListInput, Button, f7, ListItem } from "framework7-react";

import "./index.scss";
import CustomDropdownInput from "./custom-list-input";
import storeService from "../../../services/store-service";
import SensorServicesIST from "../../../services/sensor-service";
import {
  OFF,
  FLASH,
  MQTT,
  IMMEDIATELY,
  NEXT_STARTUP,
  EVERY_STARTUP,
  DOWNLOAD_LOG_ACTION,
  SET_LOG_SETTING,
} from "../../../js/constants";

const storeSettingService = new storeService("remote-logging");

const LOGGING_MODE = {
  [OFF]: "Tắt",
  [FLASH]: "Lưu vào bộ nhớ",
  [MQTT]: "Gởi lên server",
};

const START_MODE = {
  [IMMEDIATELY]: "Ngay lập tức",
  [NEXT_STARTUP]: "Sau khi reset",
  [EVERY_STARTUP]: "Luôn luôn chạy",
};

const RemoteLoggingTab = ({ sensorInfo, sensorDataIndex, onSaveHandler }) => {
  const [formSetting, setFormSetting] = useState({});
  const [remoteLoggingInfo, setRemoteLoggingInfo] = useState([0, 0, 0, 0]);
  const sensorId = sensorInfo.id;

  useEffect(() => {
    let savedSetting = storeSettingService.find(sensorId) ||
      storeSettingService.find("default") || {
        loggingMode: OFF,
        duration: "",
        interval: "",
        wifiSSID: "",
        wifiPassword: "",
        mqttUri: "",
        mqttUsername: "",
        mqttPassword: "",
        topics: [""],
        startMode: IMMEDIATELY,
      };

    setFormSetting({ ...savedSetting, id: sensorId });

    (async () => {
      setRemoteLoggingInfo(await SensorServicesIST.remoteLoggingInfo(sensorId));
    })();
  }, [sensorInfo]);

  const formSettingHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setFormSetting((setting) => ({ ...setting, [name]: value.trim() }));
  };

  const validateSettingParams = (setting) => {
    if (setting.loggingMode === OFF) {
      return true;
    }

    if (setting.duration === "" || isNaN(setting.duration)) {
      f7.dialog.alert("Tổng thời gian không hợp lệ");
      return false;
    }

    if (setting.interval === "" || isNaN(setting.interval)) {
      f7.dialog.alert("Tần suất không hợp lệ");
      return false;
    }

    if (setting.loggingMode === MQTT) {
      if (setting.wifiSSID === "") {
        f7.dialog.alert("Tên Wifi không hợp lệ");
        return false;
      }
      if (setting.mqttUri === "") {
        f7.dialog.alert("Địa chỉ server không hợp lệ");
        return false;
      }
      if (setting.mqttUsername === "") {
        f7.dialog.alert("Username server không hợp lệ");
        return false;
      }
      if (setting.mqttPassword === "") {
        f7.dialog.alert("Mật khẩu server không hợp lệ");
        return false;
      }
    }

    return true;
  };

  const onLoggingModeChange = (loggingMode) => {
    setFormSetting({
      ...formSetting,
      loggingMode: Number(loggingMode),
    });
    f7.popover.close();
  };

  const onStartModeChange = (startMode) => {
    setFormSetting({
      ...formSetting,
      startMode: Number(startMode),
    });
    f7.popover.close();
  };

  const handleTopicsChange = (e, index) => {
    let topics = [...formSetting.topics];
    topics[index] = e.target.value;

    setFormSetting({
      ...formSetting,
      topics,
    });
  };

  const onSubmitHandler = (event) => {
    event.preventDefault();
    if (validateSettingParams(formSetting)) {
      storeSettingService.save(formSetting);

      storeSettingService.save({ ...formSetting, id: "default", loggingMode: OFF, topics: [""] });
      onSaveHandler({ sensorId: sensorInfo.id, action: SET_LOG_SETTING, data: formSetting });
    }
  };

  return (
    <>
      <List className="__setting __remote-logging" form noHairlinesMd inlineLabels>
        {remoteLoggingInfo[3] && (
          <li className="display-setting-input label-color-black">
            <div className="item-content item-input item-input-outline item-input-with-value">
              <div className="item-inner download-log-wrap">
                <div className="item-title item-label">Log data:</div>
                <Button
                  className="edl-button"
                  onClick={() =>
                    onSaveHandler({ sensorId: sensorInfo.id, action: DOWNLOAD_LOG_ACTION, data: remoteLoggingInfo })
                  }
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
          buttonName={LOGGING_MODE[formSetting.loggingMode]}
          popOverName="popover-logging-mode"
        >
          {Object.keys(LOGGING_MODE).map((loggingMode) => {
            return (
              <Button key={loggingMode} onClick={() => onLoggingModeChange(loggingMode)}>
                <span style={{ textTransform: "none" }}>{LOGGING_MODE[loggingMode]}</span>
              </Button>
            );
          })}
        </CustomDropdownInput>
        {formSetting.loggingMode !== OFF && (
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
        )}
        {formSetting.loggingMode !== OFF && (
          <ListInput
            className="display-setting-input label-color-black"
            outline
            size={5}
            name="interval"
            label="Tần suất:"
            type="text"
            validateOnBlur
            value={formSetting.interval}
            onChange={formSettingHandler}
          >
            <div slot="inner-end" className="margin-left">
              giây/lần
            </div>
          </ListInput>
        )}
        {formSetting.loggingMode === MQTT && (
          <ListInput
            className="display-setting-input label-color-black"
            outline
            size={5}
            name="wifiSSID"
            label="Tên Wifi:"
            type="text"
            validateOnBlur
            value={formSetting.wifiSSID}
            onChange={formSettingHandler}
          ></ListInput>
        )}
        {formSetting.loggingMode === MQTT && (
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

        {formSetting.loggingMode === MQTT && (
          <ListInput
            className="display-setting-input label-color-black"
            outline
            size={5}
            name="mqttUri"
            label="Địa chỉ server:"
            type="text"
            validateOnBlur
            value={formSetting.mqttUri}
            onChange={formSettingHandler}
          ></ListInput>
        )}

        {formSetting.loggingMode === MQTT && (
          <ListInput
            className="display-setting-input label-color-black"
            outline
            size={5}
            name="mqttUsername"
            label="Username server:"
            type="text"
            validateOnBlur
            value={formSetting.mqttUsername}
            onChange={formSettingHandler}
          ></ListInput>
        )}

        {formSetting.loggingMode === MQTT && (
          <ListInput
            className="display-setting-input label-color-black"
            outline
            size={5}
            name="mqttPassword"
            label="Mật khẩu server:"
            type="text"
            validateOnBlur
            value={formSetting.mqttPassword}
            onChange={formSettingHandler}
          ></ListInput>
        )}

        {formSetting.loggingMode === MQTT && (
          <li>
            <div className="item-content">Kênh thông tin:</div>
          </li>
        )}

        {formSetting.loggingMode === MQTT &&
          sensorInfo?.data?.map((unitInfo, index) => {
            return (
              <ListInput
                className="__topics display-setting-input label-color-black"
                outline
                size={5}
                key={sensorInfo?.id + "|" + unitInfo.id}
                label={`● ${unitInfo.name} (${unitInfo.unit}):`}
                type="text"
                validateOnBlur
                value={formSetting.topics[index]}
                onChange={(e) => handleTopicsChange(e, index)}
              ></ListInput>
            );
          })}

        {formSetting.loggingMode !== OFF && (
          <CustomDropdownInput
            labelName="Thời gian bắt đầu:"
            buttonName={START_MODE[formSetting.startMode]}
            popOverName="popover-start-on"
          >
            {Object.keys(START_MODE).map((startMode) => {
              return (
                <Button key={startMode} onClick={() => onStartModeChange(startMode)}>
                  <span style={{ textTransform: "none" }}>{START_MODE[startMode]}</span>
                </Button>
              );
            })}
          </CustomDropdownInput>
        )}
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
