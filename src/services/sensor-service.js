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
import amperageSensorIcon from "../img/sensor-info/sensor-icons/amperage.png";

export const defaultSensors = [
  {
    id: 0,
    name: "Thời gian",
    data: [
      {
        id: "inno-000-time-00",
        name: "Thời gian",
        unit: "s",
        formatFloatingPoint: 0,
      },
    ],
  },
  {
    id: 1,
    code: "inno-001",
    name: "Cảm biến nồng độ khí CO2",
    label: "CO2",
    icon: co2SensorIcon,
    data: [
      {
        id: "inno-001-co2",
        name: "Nồng độ khí CO2",
        unit: "ppm",
        min: 0,
        max: 5000,
        formatFloatingPoint: 0,
      },
    ],
  },
  {
    id: 2,
    code: "inno-002",
    name: "Cảm biến Oxi hòa tan trong nước",
    label: "DO",
    icon: doSensorIcon,
    data: [
      { id: "inno-002-mg", name: "Nồng độ Oxy - mg/L", unit: "mg/L", min: 0, max: 20, formatFloatingPoint: 2 },
      { id: "inno-002-percent", name: "Nồng độ Oxy - %", unit: "%", min: 0, max: 100, formatFloatingPoint: 1 },
    ],
  },
  {
    id: 3,
    code: "inno-003",
    name: "Cảm biến nồng độ Oxi trong không khí",
    label: "O2",
    icon: o2SensorIcon,
    data: [{ id: "inno-003-o2", name: "Nồng độ Oxi không khí", unit: "%", min: 0, max: 30, formatFloatingPoint: 1 }],
  },
  {
    id: 4,
    code: "inno-004",
    name: "Cảm biến nhiệt độ",
    label: "Nhiệt độ",
    icon: tempSensorIcon,
    data: [{ id: "inno-004-tem", name: "Nhiệt độ", unit: "°C", min: -40, max: 125, formatFloatingPoint: 1 }],
  },
  {
    id: 5,
    code: "inno-005",
    name: "Cảm biến nhiệt độ và độ ẩm không khí",
    label: "Nhiệt độ Độ ẩm",
    icon: tempHumiditySensorIcon,
    data: [
      { id: "inno-005-hum", name: "Nhiệt độ", unit: "°C", min: 0, max: 80, formatFloatingPoint: 1 },
      { id: "inno-005-temp", name: "Độ ẩm", unit: "%", min: 0, max: 100, formatFloatingPoint: 0 },
    ],
  },
  {
    id: 6,
    code: "inno-006",
    name: "Cảm biến độ mặn nước",
    label: "Nồng độ mặn",
    icon: salinitySensorIcon,
    data: [
      { id: "inno-006-sal-00", name: "Độ mặn", unit: "ppt", min: 0, max: 50, formatFloatingPoint: 1 },
      {
        id: "inno-006-ec-01",
        name: "Độ dẫn điện",
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
    name: "Cảm biến PH",
    label: "PH",
    icon: phSensorIcon,
    data: [{ id: "inno-007-ph", name: "Độ PH", unit: "", min: 0, max: 14, formatFloatingPoint: 1 }],
  },
  {
    id: 9,
    code: "inno-009",
    name: "Cảm biến áp suất khí",
    label: "Áp suất khí",
    icon: pressureSensorIcon,
    data: [{ id: "inno-009-kpa", name: "Áp suất khí", unit: "kPa", min: -50, max: 250, formatFloatingPoint: 0 }],
  },
  {
    id: 10,
    code: "inno-010",
    name: "Cảm biến cường độ âm thanh",
    label: "Âm thanh",
    icon: soundSensorIcon,
    data: [{ id: "inno-010-dba", name: "Cường độ âm thanh", unit: "dBA", min: 0, max: 140, formatFloatingPoint: 1 }],
  },
  {
    id: 11,
    code: "inno-010",
    name: "Cảm biến dòng điện",
    label: "Dòng điện",
    icon: amperageSensorIcon,
    data: [{ id: "inno-010-amp", name: "Dòng điện", unit: "mA", min: -2500, max: 2500, formatFloatingPoint: 1 }],
  },
  {
    id: 12,
    code: "inno-011",
    name: "Cảm biến điện áp",
    label: "Điện áp",
    icon: voltageSensorIcon,
    data: [{ id: "inno-011-volt", name: "Điện áp", unit: "V", min: -20, max: 20, formatFloatingPoint: 1 }],
  },
  {
    id: 65,
    code: "BLE-9909",
    name: "Cảm biến chất lượng nước",
    label: "Chất lượng nước",
    icon: waterQualitySensorIcon,
    data: [
      { id: "BLE-9909-PH", name: "Độ PH", unit: "", min: 0, max: 14, formatFloatingPoint: 2 },
      { id: "BLE-9909-EC", name: "Độ dẫn điện EC", unit: "uS/cm", min: 0, max: 9999, formatFloatingPoint: 0 },
      { id: "BLE-9909-TDS", name: "Nồng độ chất rắn hòa tan TDS", unit: "ppm", min: 0, max: 9999, formatFloatingPoint: 0 },
      { id: "BLE-9909-SALT%", name: "Nồng độ mặn %", unit: "%", min: 0, max: 25, formatFloatingPoint: 2 },
      { id: "BLE-9909-SALTPPM", name: "Nồng độ mặn ppm", unit: "ppm", min: 0, max: 9999, formatFloatingPoint: 0 },
      { id: "BLE-9909-TEMP", name: "Nhiệt độ nước", unit: "°C", min: 0, max: 60, formatFloatingPoint: 1 },
    ],
  },
  {
    id: 66,
    code: "BLE-C600",
    name: "Cảm biến chất lượng nước",
    label: "Chất lượng nước",
    icon: waterQualitySensorIcon,
    data: [
      { id: "BLE-C600-PH", name: "Độ PH", unit: "", min: 0, max: 14, formatFloatingPoint: 2 },
      { id: "BLE-C600-EC", name: "Độ dẫn điện EC", unit: "uS/cm", min: 0, max: 9999, formatFloatingPoint: 0 },
      { id: "BLE-C600-TDS", name: "Nồng độ chất rắn hòa tan TDS", unit: "ppm", min: 0, max: 9999, formatFloatingPoint: 0 },
      { id: "BLE-C600-SALT%", name: "Nồng độ mặn %", unit: "%", min: 0, max: 25, formatFloatingPoint: 2 },
      { id: "BLE-C600-SALTPPM", name: "Nồng độ mặn ppm", unit: "ppm", min: 0, max: 9999, formatFloatingPoint: 0 },
      { id: "BLE-C600-TEMP", name: "Nhiệt độ nước", unit: "°C", min: 0, max: 60, formatFloatingPoint: 1 },
    ],
  },
  {
    id: 67,
    code: "BLE-9100",
    name: "Cảm biến Oxi hòa tan trong nước",
    label: "DO",
    icon: doSensorIcon,
    data: [
      { id: "BLE-9100-MG", name: "Nồng độ Oxy - mg/L", unit: "mg/L", min: 0, max: 30, formatFloatingPoint: 2 },
      { id: "BLE-9100-%", name: "Nồng độ Oxy - %", unit: "%", min: 0, max: 300, formatFloatingPoint: 1 },
      { id: "BLE-9100-TEMP", name: "Nhiệt độ nước", unit: "°C", min: 0, max: 60, formatFloatingPoint: 1 },
    ],
  },
  {
    id: 68,
    code: "inno-068",
    name: "Micro tích hợp",
    label: "Microphone",
    icon: soundSensorIcon,
    isBuiltin: true,
    data: [{ id: "inno-068-db", name: "Mức decibels", unit: "db", min: -100, max: 100, formatFloatingPoint: 1 }],
  },
  {
    id: 69,
    code: "inno-069",
    name: "Micro tích hợp",
    label: "Microphone",
    icon: soundSensorIcon,
    data: [
      { id: "inno-069-wave", name: "Sóng", unit: "A", min: -1, max: 1, formatFloatingPoint: 1 },
      { id: "inno-069-frequency", name: "Tần số", unit: "db", min: -100, max: 100, formatFloatingPoint: 1 },
    ],
  },
];

export const BUILTIN_DECIBELS_SENSOR_ID = 68;
export const BUILTIN_MICROPHONE_ID = 69;
export const BUILTIN_MICROPHONE_CODE = "inno-069";

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
    this.excludeSensorsId = [BUILTIN_MICROPHONE_ID];
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

  isSensorLogAvailable(sensorId) {
    return Promise.resolve(true); // TODO: check sensor log
  }

  getSensorLog(sensorId) {
    return Promise.resolve("data"); // TODO: get sensor log
  }
}

export default SensorServices.getInstance();
