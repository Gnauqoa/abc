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

export const defaultSensors = [
  {
    id: 0,
    name: "Thời gian",
    data: [
      {
        id: "inno-000-time-00",
        name: "Thời gian",
        unit: "s",
        dec: 0,
      },
    ],
  },
  {
    id: 1,
    code: "inno-001",
    name: "Cảm biến nồng độ khí CO2",
    data: [
      {
        id: "inno-001-co2",
        name: "Nồng độ khí CO2",
        unit: "ppm",
        min: 0,
        max: 5000,
        dec: 0,
      },
    ],
  },
  {
    id: 2,
    code: "inno-002",
    name: "Cảm biến Oxi hòa tan trong nước",
    data: [
      { id: "inno-002-mg", name: "Nồng độ Oxy - mg/L", unit: "mg/L", min: 0, max: 20, dec: 2 },
      { id: "inno-002-percent", name: "Nồng độ Oxy - %", unit: "%", min: 0, max: 100, dec: 1 },
    ],
  },
  {
    id: 3,
    code: "inno-003",
    name: "Cảm biến nồng độ Oxi trong không khí",
    data: [{ id: "inno-003-o2", name: "Nồng độ Oxi không khí", unit: "%", min: 0, max: 30, dec: 1 }],
  },
  {
    id: 4,
    code: "inno-004",
    name: "Cảm biến nhiệt độ",
    data: [{ id: "inno-004-tem", name: "Nhiệt độ", unit: "°C", min: -40, max: 125, dec: 1 }],
  },
  {
    id: 5,
    code: "inno-005",
    name: "Cảm biến nhiệt độ và độ ẩm không khí",
    data: [
      { id: "inno-005-hum", name: "Nhiệt độ", unit: "°C", min: 0, max: 80, dec: 1 },
      { id: "inno-005-temp", name: "Độ ẩm", unit: "%", min: 0, max: 100, dec: 0 },
    ],
  },
  {
    id: 6,
    code: "inno-006",
    name: "Cảm biến độ mặn nước",
    data: [
      { id: "inno-006-sal-00", name: "Độ mặn", unit: "ppt", min: 0, max: 50, dec: 1 },
      {
        id: "inno-006-ec-01",
        name: "Độ dẫn điện",
        unit: "mS/cm",
        min: 10,
        max: 20,
        dec: 2,
      },
    ],
  },
  {
    id: 7,
    code: "inno-007",
    name: "Cảm biến PH",
    data: [{ id: "inno-007-ph", name: "Độ PH", unit: "", min: 0, max: 14, dec: 1 }],
  },
  {
    id: 8,
    code: "inno-008",
    name: "Cảm biến cường độ âm thanh",
    data: [{ id: "inno-008-dba", name: "Cường độ âm thanh", unit: "dBA", min: 0, max: 150, dec: 1 }],
  },
  {
    id: 9,
    code: "inno-009",
    name: "Cảm biến áp suất khí",
    data: [{ id: "inno-009-kpa", name: "Áp suất khí", unit: "kPa", min: -50, max: 250, dec: 0 }],
  },
  {
    id: 10,
    code: "inno-010",
    name: "Cảm biến dòng điện",
    data: [
      { id: "inno-010-amp", name: "Dòng điện", unit: "mA", min: -2500, max: 2500, dec: 1 },
    ]
  },
  {
    id: 11,
    code: "inno-011",
    name: "Cảm biến điện áp",
    data: [
      { id: "inno-011-volt", name: "Điện áp", unit: "V", min: -20, max: 20, dec: 1 },
    ]
  },
  {
    id: 65,
    code: "BLE-9909",
    name: "Cảm biến chất lượng nước",
    data: [
      { id: "BLE-9909-PH", name: "PH", unit: "", min: 0, max: 14, dec: 2 },
      { id: "BLE-9909-EC", name: "EC", unit: "uS/cm", min: 0, max: 9999, dec: 0 },
      { id: "BLE-9909-TDS", name: "TDS", unit: "ppm", min: 0, max: 9999, dec: 0 },
      { id: "BLE-9909-SALT%", name: "SALT %", unit: "%", min: 0, max: 25, dec: 2 },
      { id: "BLE-9909-SALTPPM", name: "SALT ppm", unit: "ppm", min: 0, max: 9999, dec: 0 },
      { id: "BLE-9909-TEMP", name: "Nhiệt độ nước", unit: "°C", min: 0, max: 60, dec: 1 },
    ],
  },
  {
    id: 66,
    code: "BLE-9100",
    name: "Cảm biến Oxi hòa tan trong nước",
    data: [
      { id: "BLE-9100-MG", name: "Nồng độ Oxy - mg/L", unit: "mg/L", min: 0, max: 30, dec: 2 },
      { id: "BLE-9100-%", name: "Nồng độ Oxy - %", unit: "%", min: 0, max: 300, dec: 1 },
      { id: "BLE-9100-TEMP", name: "Nhiệt độ nước", unit: "°C", min: 0, max: 100, dec: 1 },
    ],
  },
];

const sensorIcons = {
  1: {
    icon: co2SensorIcon,
    label: "CO2",
    unit: "ppm",
  },
  2: {
    icon: doSensorIcon,
    label: "DO",
    unit: "mg/L",
  },
  3: {
    icon: o2SensorIcon,
    label: "O2",
    unit: "ppm",
  },
  4: {
    icon: tempSensorIcon,
    label: "Nhiệt độ",
    unit: "°C",
  },
  5: {
    icon: tempHumiditySensorIcon,
    label: "Nhiệt độ & độ ẩm",
    unit: "%",
  },
  6: {
    icon: salinitySensorIcon,
    label: "Nồng độ mặn",
    unit: "ppt",
  },
  7: {
    icon: phSensorIcon,
    label: "PH",
    unit: "pH",
  },
  8: {
    icon: soundSensorIcon,
    label: "Âm thanh",
    unit: "dBA",
  },
  9: {
    icon: pressureSensorIcon,
    label: "Áp suất khí",
    unit: "kPa",
  },
  10: {
    icon: pressureSensorIcon,
    label: "Dòng điện",
    unit: "A",
  },
  11: {
    icon: pressureSensorIcon,
    label: "Điện áp",
    unit: "V",
  },
  65: {
    icon: phSensorIcon,
    label: "Chất lượng nước",
    unit: "pH",
  },
  66: {
    icon: doSensorIcon,
    label: "DO",
    unit: "mg/L",
  },
};

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
  }

  getSensors() {
    return this.sensors;
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

  getSensorIcon(sensorId) {
    const sensorIcon = sensorIcons[sensorId];
    return sensorIcon !== undefined ? sensorIcon : null;
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
}

export default SensorServices.getInstance();
