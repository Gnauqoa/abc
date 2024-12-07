import _ from "lodash";

import o2SensorIcon from "../img/sensor-info/sensor-icons/o2.png";
import doSensorIcon from "../img/sensor-info/sensor-icons/do.png";
import co2SensorIcon from "../img/sensor-info/sensor-icons/co2.png";
import phSensorIcon from "../img/sensor-info/sensor-icons/ph.png";
import tempHumiditySensorIcon from "../img/sensor-info/sensor-icons/temp-humidity.png";
import soundSensorIcon from "../img/sensor-info/sensor-icons/sound.png";
import salinitySensorIcon from "../img/sensor-info/sensor-icons/salinity.png";
import tempSensorIcon from "../img/sensor-info/sensor-icons/temp.png";
import pressureSensorIcon from "../img/sensor-info/sensor-icons/pressure.png";
import waterQualitySensorIcon from "../img/sensor-info/sensor-icons/water-quality.png";
import voltageSensorIcon from "../img/sensor-info/sensor-icons/voltage.png";
import lightSensorIcon from "../img/sensor-info/sensor-icons/light.png";
import forceSensorIcon from "../img/sensor-info/sensor-icons/force.png";
import motionSensorIcon from "../img/sensor-info/sensor-icons/motion.png";
import amperageSensorIcon from "../img/sensor-info/sensor-icons/amperage.png";
import DeviceManagerIST from "./device-manager";
import * as core from "../utils/core";
import DataManagerIST from "./data-manager";

export const BUILTIN_DECIBELS_SENSOR_ID = 68;
export const BUILTIN_MICROPHONE_ID = 69;
export const BUILTIN_MICROPHONE_CODE = "inno-069";
export const CURRENT_SENSOR_ID = 11;
export const VOLTAGE_SENSOR_ID = 12;
export const VOLTAGE_SENSOR_V2_ID = 16;
export const CURRENT_SENSOR_V2_ID = 17;
export const SOUND_SENSOR_V2_ID = 18;

export const SINE_WAVE_SENSOR_INFO = `${BUILTIN_MICROPHONE_ID}-0`;
export const FREQUENCY_WAVE_SENSOR_INFO = `${BUILTIN_MICROPHONE_ID}-1`;
export const CURRENT_SENSOR_INFO = `${CURRENT_SENSOR_ID}-0`;
export const CURRENT_SENSOR_V2_INFO = `${CURRENT_SENSOR_V2_ID}-0`;
export const VOLTAGE_SENSOR_INFO = `${VOLTAGE_SENSOR_ID}-0`;
export const VOLTAGE_SENSOR_V2_INFO = `${VOLTAGE_SENSOR_V2_ID}-0`;
export const SOUND_SENSOR_V2_INFO = `${SOUND_SENSOR_V2_ID}-0`;

export const defaultSensors = [
  {
    id: 0,
    name: "common.time",
    data: [
      {
        id: "inno-000-time-00",
        name: "common.time",
        unit: "s",
        formatFloatingPoint: 0,
      },
    ],
  },
  {
    id: 1,
    code: "inno-001",
    name: "list_sensor.CO2_gas_concentration_sensor",
    label: "CO2",
    icon: co2SensorIcon,
    remote_logging: true,
    data: [
      {
        id: "inno-001-co2",
        name: "list_sensor.CO2_gas_concentration",
        unit: "ppm",
        min: 0,
        max: 5000,
        formatFloatingPoint: 0,
      },
    ],
  },
  /*
  {
    id: 2,
    code: "inno-002",
    name: "list_sensor.dissolved_Oxygen_Sensor_Analog",
    label: "DO",
    icon: doSensorIcon,
    remote_logging: true,
    support_calib: true,
    data: [
      { id: "inno-002-mg", name: "list_sensor.oxygen_concentration_mg", unit: "mg/L", min: 0, max: 20, formatFloatingPoint: 2 },
      { id: "inno-002-percent", name: "list_sensor.oxygen_concentration_percent", unit: "%", min: 0, max: 100, formatFloatingPoint: 1 },
    ],
  },
  */
  {
    id: 3,
    code: "inno-003",
    name: "list_sensor.oxygen_concentration_sensor",
    label: "O2",
    icon: o2SensorIcon,
    remote_logging: true,
    support_calib: true,
    data: [
      {
        id: "inno-003-o2",
        name: "list_sensor.oxygen_concentration",
        unit: "%",
        min: 0,
        max: 30,
        formatFloatingPoint: 1,
      },
    ],
  },
  {
    id: 4,
    code: "inno-004",
    name: "list_sensor.temperature_sensor",
    label: "list_sensor.temperature",
    icon: tempSensorIcon,
    remote_logging: true,
    support_calib: true,
    data: [
      {
        id: "inno-004-tem",
        name: "list_sensor.temperature",
        unit: "°C",
        min: -40,
        max: 125,
        formatFloatingPoint: 1,
        //dataLength: 4,
        //calcFunc: x => x/1000,
      },
    ],
  },
  {
    id: 5,
    code: "inno-005",
    name: "list_sensor.air_humidity_sensor",
    label: "list_sensor.humidity_Temperature",
    icon: tempHumiditySensorIcon,
    remote_logging: true,
    support_calib: true,
    data: [
      { id: "inno-005-hum", name: "list_sensor.humidity", unit: "%", min: 0, max: 100, formatFloatingPoint: 0 },
      { id: "inno-005-tem", name: "list_sensor.temperature", unit: "°C", min: 0, max: 80, formatFloatingPoint: 1 },
    ],
  },
  /*
  {
    id: 6,
    code: "inno-006",
    name: "list_sensor.water_salinity_sensor",
    label: "list_sensor.salinity_concentration",
    icon: salinitySensorIcon,
    remote_logging: true,
    support_calib: true,
    data: [
      { id: "inno-006-sal-00", name: "list_sensor.salinity", unit: "ppt", min: 0, max: 50, formatFloatingPoint: 1 },
      {
        id: "inno-006-ec-01",
        name: "list_sensor.electrical_conductivity",
        unit: "mS/cm",
        min: 10,
        max: 20,
        formatFloatingPoint: 2,
      },
    ],
  },
  {
    id: 7,
    code: "inno-007",
    name: "list_sensor.pH_sensor",
    label: "PH",
    icon: phSensorIcon,
    remote_logging: true,
    support_calib: true,
    data: [{ id: "inno-007-ph", name: "list_sensor.pH_level", unit: "", min: 0, max: 14, formatFloatingPoint: 1 }],
  },
  */
  {
    id: 9,
    code: "inno-009",
    name: "list_sensor.gas_pressure_sensor",
    label: "list_sensor.gas_pressure",
    icon: pressureSensorIcon,
    remote_logging: true,
    support_calib: true,
    data: [
      { id: "inno-009-kpa", name: "list_sensor.gas_pressure", unit: "kPa", min: -50, max: 250, formatFloatingPoint: 0 },
    ],
  },
  {
    id: 10,
    code: "inno-010",
    name: "list_sensor.sound_sensor",
    label: "list_sensor.sound",
    icon: soundSensorIcon,
    remote_logging: true,
    support_calib: true,
    data: [
      {
        id: "inno-010-dba",
        name: "list_sensor.sound_intensity",
        unit: "dBA",
        min: 30,
        max: 120,
        formatFloatingPoint: 1,
      },
    ],
  },
  {
    id: CURRENT_SENSOR_ID,
    code: "inno-011",
    name: "list_sensor.current_sensor",
    label: "list_sensor.electrical_current",
    icon: amperageSensorIcon,
    remote_logging: true,
    support_calib: true,
    data: [
      {
        id: "inno-011-amp",
        name: "list_sensor.electrical_current",
        unit: "mA",
        min: 0,
        max: 5000,
        formatFloatingPoint: 1,
      },
    ],
  },
  {
    id: VOLTAGE_SENSOR_ID,
    code: "inno-012",
    name: "list_sensor.voltage_sensor",
    label: "list_sensor.voltage",
    icon: voltageSensorIcon,
    remote_logging: true,
    support_calib: true,
    data: [
      {
        id: "inno-012-volt",
        name: "list_sensor.voltage",
        unit: "V",
        min: -10,
        max: 10,
        formatFloatingPoint: 1,
        dataLength: 4, // in bytes
      },
    ],
  },
  {
    id: 13,
    code: "inno-013",
    name: "list_sensor.light_sensor",
    label: "list_sensor.light",
    icon: lightSensorIcon,
    remote_logging: true,
    support_calib: false,
    data: [
      { id: "inno-013-light", name: "list_sensor.brightness", unit: "lux", min: 0, max: 500, formatFloatingPoint: 0 },
      //{ id: "inno-013-red", name: "Đỏ", unit: "lux", min: 0, max: 3000, formatFloatingPoint: 0 },
      //{ id: "inno-013-green", name: "Xanh lá", unit: "lux", min: 0, max: 3000, formatFloatingPoint: 0 },
      //{ id: "inno-013-blue", name: "Xanh lam", unit: "lux", min: 0, max: 3000, formatFloatingPoint: 0 },
    ],
  },
  {
    id: 14,
    code: "inno-014",
    name: "list_sensor.force_sensor",
    label: "list_sensor.force",
    icon: forceSensorIcon,
    remote_logging: true,
    support_calib: true,
    data: [{ id: "inno-014-force", name: "list_sensor.traction", unit: "N", min: 0, max: 50, formatFloatingPoint: 1 }],
  },
  {
    id: 15,
    code: "inno-015",
    name: "list_sensor.gas_pressure_sensor",
    label: "list_sensor.gas_pressure",
    icon: pressureSensorIcon,
    remote_logging: true,
    support_calib: true,
    data: [
      { id: "inno-015-kpa", name: "list_sensor.gas_pressure", unit: "kPa", min: 0, max: 700, formatFloatingPoint: 0 },
    ],
  },
  {
    id: VOLTAGE_SENSOR_V2_ID,
    code: "inno-016",
    name: "list_sensor.voltage_sensor",
    label: "list_sensor.voltage",
    icon: voltageSensorIcon,
    remote_logging: true,
    support_calib: true,
    data: [
      {
        id: "inno-016-volt",
        name: "list_sensor.voltage",
        unit: "V",
        min: -5,
        max: 5,
        formatFloatingPoint: 1,
        dataLength: 2, // in bytes
        calcFunc: x => x/1000,
      },
    ],
  },
  {
    id: CURRENT_SENSOR_V2_ID,
    code: "inno-017",
    name: "list_sensor.current_sensor",
    label: "list_sensor.electrical_current",
    icon: amperageSensorIcon,
    remote_logging: true,
    support_calib: true,
    data: [
      {
        id: "inno-017-amp",
        name: "list_sensor.electrical_current",
        unit: "mA",
        min: 0,
        max: 500,
        formatFloatingPoint: 0,
      },
    ],
  },
  {
    id: 18,
    code: "inno-018",
    name: "list_sensor.sound_sensor",
    label: "list_sensor.sound",
    icon: soundSensorIcon,
    remote_logging: true,
    support_calib: true,
    data: [
      {
        id: "inno-018-dba",
        name: "list_sensor.sound_intensity",
        unit: "dBA",
        min: 40,
        max: 80,
        formatFloatingPoint: 1,
        dataLength: 2, // in bytes
      },
    ],
  },
  {
    id: 19,
    code: "inno-019",
    name: "list_sensor.distance_sensor",
    label: "list_sensor.distance",
    icon: motionSensorIcon,
    remote_logging: true,
    support_calib: true,
    data: [
      { id: "inno-015-motion", name: "list_sensor.distance", unit: "cm", min: 0, max: 400, formatFloatingPoint: 1 },
    ],
  },
  {
    id: 65,
    code: "BLE-9909",
    name: "list_sensor.water_quality_sensor_9909",
    label: "list_sensor.water_quality",
    icon: waterQualitySensorIcon,
    remote_logging: false,
    support_calib: false,
    data: [
      { id: "BLE-9909-PH", name: "list_sensor.pH_level", unit: "", min: 0, max: 14, formatFloatingPoint: 2 },
      {
        id: "BLE-9909-EC",
        name: "list_sensor.electrical_conductivity",
        unit: "uS/cm",
        min: 0,
        max: 9999,
        formatFloatingPoint: 0,
      },
      {
        id: "BLE-9909-TDS",
        name: "list_sensor.TDS_concentration",
        unit: "ppm",
        min: 0,
        max: 9999,
        formatFloatingPoint: 0,
      },
      {
        id: "BLE-9909-SALT%",
        name: "list_sensor.salinity_concentration_percent",
        unit: "%",
        min: 0,
        max: 25,
        formatFloatingPoint: 2,
      },
      {
        id: "BLE-9909-SALTPPM",
        name: "list_sensor.salinity_ppm",
        unit: "ppm",
        min: 0,
        max: 9999,
        formatFloatingPoint: 0,
      },
      {
        id: "BLE-9909-TEMP",
        name: "list_sensor.water_temperature",
        unit: "°C",
        min: 0,
        max: 60,
        formatFloatingPoint: 1,
      },
    ],
  },
  {
    id: 66,
    code: "BLE-C600",
    name: "list_sensor.water_quality_sensor_C600",
    label: "list_sensor.water_quality",
    icon: waterQualitySensorIcon,
    remote_logging: false,
    support_calib: false,
    data: [
      { id: "BLE-C600-PH", name: "list_sensor.pH_level", unit: "", min: 0, max: 14, formatFloatingPoint: 2 },
      {
        id: "BLE-C600-EC",
        name: "list_sensor.electrical_conductivity",
        unit: "uS/cm",
        min: 0,
        max: 9999,
        formatFloatingPoint: 0,
      },
      {
        id: "BLE-C600-TDS",
        name: "list_sensor.TDS_concentration",
        unit: "ppm",
        min: 0,
        max: 9999,
        formatFloatingPoint: 0,
      },
      {
        id: "BLE-C600-SALT%",
        name: "list_sensor.salinity_concentration_percent",
        unit: "%",
        min: 0,
        max: 25,
        formatFloatingPoint: 2,
      },
      {
        id: "BLE-C600-SALTPPM",
        name: "list_sensor.salinity_ppm",
        unit: "ppm",
        min: 0,
        max: 9999,
        formatFloatingPoint: 0,
      },
      {
        id: "BLE-C600-TEMP",
        name: "list_sensor.water_temperature",
        unit: "°C",
        min: 0,
        max: 60,
        formatFloatingPoint: 1,
      },
    ],
  },
  {
    id: 67,
    code: "BLE-9100",
    name: "list_sensor.dissolved_oxygen_sensor_9100",
    label: "DO",
    icon: doSensorIcon,
    remote_logging: false,
    support_calib: false,
    data: [
      {
        id: "BLE-9100-MG",
        name: "list_sensor.oxygen_concentration_mg",
        unit: "mg/L",
        min: 0,
        max: 30,
        formatFloatingPoint: 2,
      },
      {
        id: "BLE-9100-%",
        name: "list_sensor.oxygen_concentration_percent",
        unit: "%",
        min: 0,
        max: 300,
        formatFloatingPoint: 1,
      },
      {
        id: "BLE-9100-TEMP",
        name: "list_sensor.water_temperature",
        unit: "°C",
        min: 0,
        max: 60,
        formatFloatingPoint: 1,
      },
    ],
  },
  {
    id: BUILTIN_DECIBELS_SENSOR_ID,
    code: "inno-068",
    name: "list_sensor.built_in_microphone",
    label: "Microphone",
    icon: soundSensorIcon,
    isBuiltin: true,
    remote_logging: false,
    support_calib: false,
    data: [
      { id: "inno-068-db", name: "list_sensor.decibel_level", unit: "dBA", min: 30, max: 120, formatFloatingPoint: 1 },
    ],
  },
  {
    id: BUILTIN_MICROPHONE_ID,
    code: BUILTIN_MICROPHONE_CODE,
    name: "list_sensor.built_in_microphone",
    label: "Microphone",
    icon: soundSensorIcon,
    isBuiltin: true,
    remote_logging: false,
    support_calib: false,
    data: [
      { id: "inno-069-wave", name: "list_sensor.wave", unit: "", min: -1, max: 1, formatFloatingPoint: 1 },
      {
        id: "inno-069-frequency",
        name: "list_sensor.frequency",
        unit: "",
        min: -100,
        max: 100,
        formatFloatingPoint: 1,
      },
    ],
  },
];

export class SensorServices {
  constructor() {
    this.initializeVariables();
  }

  /**
   * Returns the instance of the DataManager class.
   * @returns {SensorServices} - The instance of the DataManager class.
   */
  static getInstance() {
    if (!SensorServices.instance) {
      SensorServices.instance = new SensorServices();
    }
    return SensorServices.instance;
  }

  initializeVariables() {
    this.sensors = _.cloneDeep(defaultSensors);
    this.customSensors = [];
    this.definedSoundSensorsId = [];
    this.builtinSensors = [BUILTIN_DECIBELS_SENSOR_ID];
    this.excludeSensorsId = [BUILTIN_MICROPHONE_ID];
    this.oscSensorsId = [CURRENT_SENSOR_V2_ID, VOLTAGE_SENSOR_V2_ID, SOUND_SENSOR_V2_ID];
  }

  getSensors() {
    return this.sensors.filter((s) => !this.excludeSensorsId.includes(s.id));
  }

  /**
   * Get data for a specific sensor from the buffer.
   *
   * @param {Array<int>} definedSensors - The ID of the sensor to get data for.
   * @returns {Array<sensor>} - The sensor data or the specified data item (if the data is an array).
   */
  getDefinedSensors(definedSensors) {
    if (!definedSensors) return this.getSensors();
    return this.sensors.filter((s) => definedSensors.includes(s.id));
  }

  getCustomSensors() {
    return this.customSensors;
  }

  getAllSensors() {
    const allSensors = [...this.sensors, ...this.customSensors];
    return allSensors;
  }

  getUnit(sensorId, dataIndex) {
    const allSensors = [...this.sensors, ...this.customSensors];
    return allSensors.filter((s) => s.id === sensorId)[0]?.data[dataIndex]?.unit || "";
  }

  getMinUnitValueAllSensors() {
    let minValue;
    const allSensors = [...this.sensors, ...this.customSensors];
    allSensors.forEach((sensor) => {
      if (!Array.isArray(sensor.data)) return;

      sensor.data.forEach((unit) => {
        const minUnit = Number(unit.min);
        if (Number.isNaN(minUnit)) return;

        if (minValue === undefined) minValue = minUnit;
        else minValue = Math.min(minValue, minUnit);
      });
    });
    return minValue;
  }

  getSensorInfo(sensorId) {
    const sensorInfo = this.sensors.filter((sensor) => sensor.id === Number(sensorId));
    return sensorInfo !== undefined && sensorInfo[0] !== undefined ? sensorInfo[0] : null;
  }

  isSensorExist(sensorId) {
    const sensorIndex = this.sensors.findIndex((sensor) => sensor.id === sensorId);
    return sensorIndex !== -1 || sensorIndex !== 0;
  }

  updateSensorSetting(sensorId, sensorUnitData) {
    const newSensors = this.sensors.map((sensor) => {
      if (sensor.id === sensorId) {
        const newUnitData = sensor.data.map((unit) => {
          if (unit.id === sensorUnitData.id) {
            return sensorUnitData;
          } else {
            return unit;
          }
        });
        return { ...sensor, data: newUnitData };
      } else {
        return sensor;
      }
    });

    this.sensors = newSensors;
  }

  exportSensors() {
    return {
      sensors: this.sensors,
      customSensors: this.customSensors,
    };
  }
  importSensors(sensors, customSensors) {
    this.sensors = [...sensors];
    this.customSensors = [...customSensors];
  }

  getSensorByCode(code) {
    const sensorInfo = this.sensors.filter((sensor) => code.includes(sensor.code));
    return sensorInfo.length > 0 ? sensorInfo[0] : null;
  }

  getActiveSoundSensors() {
    const soundSensors = this.sensors.filter((sensor) => {
      if (this.definedSoundSensorsId.includes(sensor.code)) return true;
      else if (sensor.code === BUILTIN_MICROPHONE_CODE)
        return navigator.mediaDevices !== undefined && navigator.mediaDevices.getUserMedia !== undefined;
      else return false;
    });
    return soundSensors;
  }

  getOscSensors() {
    const oscSensors = this.sensors.filter((sensor) => {
      if (this.oscSensorsId.includes(sensor.id)) return true;
      else return false;
    });
    return [...oscSensors, ...this.getActiveSoundSensors()];
  }

  getActiveBuiltinSensors() {
    const builtinSensors = this.builtinSensors.filter((sensorId) => {
      if (sensorId === BUILTIN_DECIBELS_SENSOR_ID) {
        return navigator.mediaDevices !== undefined && navigator.mediaDevices.getUserMedia !== undefined;
      }
    });
    return builtinSensors;
  }

  async remoteLoggingInfo(sensorId) {
    DeviceManagerIST.sendCmdDTO(sensorId, "$$$log,chk###", "log,chk-done");

    const data = await core.timeoutEventData("log,chk");

    return data.map((d) => Number(d));
  }

  async remoteLoggingData(sensorId, size) {
    DataManagerIST.resetRemoteLoggingBuffer();
    DeviceManagerIST.sendCmdDTO(sensorId, "$$$log,get###", "log,get-done");

    return core.timeoutEventData("log,get", size, 2000, true);
  }
  configureSensorsDataRate(rate) {
    const sensors = DataManagerIST.getActiveSensorIds();

    for (let i = 0; i < sensors.length; ++i) {
      DeviceManagerIST.sendCmdDTO(sensors[i], `$$$fre,${rate}###`);
    }
  }
}

export default SensorServices.getInstance();
