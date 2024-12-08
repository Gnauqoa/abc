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
  DELETE_LOG_ACTION,
  SET_LOG_SETTING,
  MAX_SAMPLE_REMOTE_LOGGING,
  SENSOR_VERSION,
  MAX_SAMPLE_REMOTE_LOGGING_V2,
} from "../../../js/constants";
import { useTranslation } from "react-i18next";

const storeSettingService = new storeService("remote-logging");

const LOGGING_MODE = {
  [OFF]: "key.off",
  [FLASH]: "key.save_to_memory",
  [MQTT]: "key.send_to_server",
};

const START_MODE = {
  [IMMEDIATELY]: "key.right_away",
  [NEXT_STARTUP]: "key.after_reset",
  [EVERY_STARTUP]: "key.always_running",
};

const RemoteLoggingTab = ({ sensorInfo, remoteLoggingInfo, sensorDataIndex, onSaveHandler }) => {
  const { t, i18n } = useTranslation();
  const [formSetting, setFormSetting] = useState({});
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

    if (savedSetting.mqttUri === "") {
      savedSetting.mqttUri = "mqtt://mqtt.ohstem.vn:1883";
    }

    if (savedSetting.topics.length < sensorInfo.data.length) {
      savedSetting.topics = sensorInfo.data.map((d, index) => `${savedSetting.mqttUsername}feeds/V${index + 1}`);
    }

    setFormSetting({ ...savedSetting, id: sensorId });
  }, [sensorInfo]);

  const formSettingHandler = (e) => {
    const name = e.target.name;
    let value = e.target.value.trim();
    if (["duration", "interval"].includes(name)) value = parseInt(value);

    if (name === "mqttUsername") {
      return setFormSetting((setting) => ({
        ...setting,
        [name]: value,
        topics: setting.topics.map((d, index) => `${value}/feeds/V${index + 1}`),
      }));
    }

    setFormSetting((setting) => ({ ...setting, [name]: value }));
  };

  const validateSettingParams = (setting) => {
    if (setting.loggingMode === OFF) {
      return true;
    }

    if (setting.interval === "" || isNaN(setting.interval) || setting.interval < 1) {
      f7.dialog.alert(t("modules.invalid_frequency"));
      return false;
    }

    if (
      formSetting.loggingMode === FLASH ||
      (formSetting.loggingMode === MQTT && formSetting.startMode !== EVERY_STARTUP)
    ) {
      if (setting.duration === "" || isNaN(setting.duration) || setting.duration < 1) {
        f7.dialog.alert(t("modules.total_time_is_invalid"));
        return false;
      }

      const sampleCount = ~~((setting.duration * 60) / setting.interval);
      if (sampleCount > MAX_SAMPLE_REMOTE_LOGGING) {
        f7.dialog.alert(
          `${t("modules.the_number_of_samples_exceeds_the_limit")} ${MAX_SAMPLE_REMOTE_LOGGING}. ${t(
            "modules.please_reduce_Total_Time_or_Frequency"
          )}.`
        );
        return false;
      }
    }

    if (setting.loggingMode === MQTT) {
      if (setting.wifiSSID === "") {
        f7.dialog.alert(t("modules.invalid_Wifi_name"));
        return false;
      }
      if (setting.mqttUri === "") {
        f7.dialog.alert(t("modules.invalid_server_address"));
        return false;
      }
      if (setting.mqttUsername === "") {
        f7.dialog.alert(t("modules.invalid_server_username"));
        return false;
      }
    }

    return true;
  };

  const onLoggingModeChange = (loggingMode) => {
    let startMode = formSetting.startMode;
    if (Number(loggingMode) === FLASH && formSetting.startMode === EVERY_STARTUP) {
      startMode = IMMEDIATELY;
    }

    setFormSetting({
      ...formSetting,
      startMode,
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
                  {t("modules.download")}
                </Button>
                <Button
                  className="edl-button"
                  bgColor="red"
                  onClick={() =>
                    onSaveHandler({ sensorId: sensorInfo.id, action: DELETE_LOG_ACTION, data: remoteLoggingInfo })
                  }
                >
                  {t("common.delete")}
                </Button>
              </div>
            </div>
          </li>
        )}
      </List>
      <List className="__setting __remote-logging" form noHairlinesMd inlineLabels>
        <CustomDropdownInput
          labelName={t("modules.regime")}
          buttonName={t(LOGGING_MODE[formSetting.loggingMode])}
          popOverName="popover-logging-mode"
        >
          {Object.keys(LOGGING_MODE).map((loggingMode) => {
            return (
              <Button key={loggingMode} onClick={() => onLoggingModeChange(loggingMode)}>
                <span style={{ textTransform: "none" }}>{t(LOGGING_MODE[loggingMode])}</span>
              </Button>
            );
          })}
        </CustomDropdownInput>
        {(formSetting.loggingMode === FLASH ||
          (formSetting.loggingMode === MQTT && formSetting.startMode !== EVERY_STARTUP)) && (
          <ListInput
            className="display-setting-input label-color-black"
            outline
            size={5}
            name="duration"
            label={t("modules.total_time")}
            type="number"
            value={formSetting.duration}
            onChange={formSettingHandler}
          >
            <div slot="inner-end" className="margin-left">
              {t("common.minute")}
            </div>
          </ListInput>
        )}
        {formSetting.loggingMode !== OFF && (
          <ListInput
            className="display-setting-input label-color-black"
            outline
            size={5}
            name="interval"
            label={t("modules.frequency")}
            type="number"
            value={formSetting.interval}
            onChange={formSettingHandler}
          >
            <div slot="inner-end" className="margin-left">
              {t("modules.seconds_time")}
            </div>
          </ListInput>
        )}
        {(formSetting.loggingMode === FLASH ||
          (formSetting.loggingMode === MQTT && formSetting.startMode !== EVERY_STARTUP)) && (
          <ListItem
            title={`${t("modules.total_number_of_samples")}: ${~~(
              (formSetting.duration * 60) /
              formSetting.interval
            )} (${t("modules.max")} ${(sensorInfo.sensorVersion === SENSOR_VERSION.V2
              ? MAX_SAMPLE_REMOTE_LOGGING
              : MAX_SAMPLE_REMOTE_LOGGING_V2
            )
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ",")})`}
          ></ListItem>
        )}
        {formSetting.loggingMode === MQTT && (
          <ListInput
            className="display-setting-input label-color-black"
            outline
            size={5}
            name="wifiSSID"
            label={t("modules.wifi_name")}
            type="text"
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
            label={t("modules.wifi_password")}
            type="text"
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
            label={t("modules.server_address")}
            type="text"
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
            label={t("modules.username_server")}
            type="text"
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
            label={t("modules.server_password")}
            type="text"
            value={formSetting.mqttPassword}
            onChange={formSettingHandler}
          ></ListInput>
        )}

        {formSetting.loggingMode === MQTT && (
          <li>
            <div className="item-content">{t("modules.information_channel")}</div>
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
                label={`● ${t(unitInfo.name)} (${t(unitInfo.unit)}):`}
                type="text"
                value={formSetting.topics[index]}
                onChange={(e) => handleTopicsChange(e, index)}
              ></ListInput>
            );
          })}

        {formSetting.loggingMode !== OFF && (
          <CustomDropdownInput
            labelName={t("modules.start_time")}
            buttonName={t(START_MODE[formSetting.startMode])}
            popOverName="popover-start-on"
          >
            {Object.keys(START_MODE).map((startMode) => {
              if (formSetting.loggingMode === FLASH && Number(startMode) === EVERY_STARTUP) {
                return;
              }
              return (
                <Button key={startMode} onClick={() => onStartModeChange(startMode)}>
                  <span style={{ textTransform: "none" }}>{t(START_MODE[startMode])}</span>
                </Button>
              );
            })}
          </CustomDropdownInput>
        )}
      </List>
      <div className="buttons">
        <Button className="save-button" onClick={onSubmitHandler}>
          {t("common.save")}
        </Button>
      </div>
    </>
  );
};

export default RemoteLoggingTab;
