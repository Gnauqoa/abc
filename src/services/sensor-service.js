import o2SensorIcon from "../img/sensor-info/o2.png";
import doSensorIcon from "../img/sensor-info/do.png";
import co2SensorIcon from "../img/sensor-info/co2.png";
import phSensorIcon from "../img/sensor-info/ph.png";
import humiditySensorIcon from "../img/sensor-info/temp-humidity.png";
import soundSensorIcon from "../img/sensor-info/sound.png";
import salinitySensorIcon from "../img/sensor-info/salinity.png";
import tempSensorIcon from "../img/sensor-info/temp.png";

export const sensors = [
  {
    id: 0,
    name: "Thời gian",
    data: [
      {
        id: "inno-000-time-00",
        name: "Thời gian",
        unit: "s",
      },
    ],
  },
  {
    id: 1,
    name: "Cảm biến nồng độ khí C02",
    data: [
      {
        id: "inno-001-co2",
        name: "Nồng độ khí CO2",
        unit: "ppm",
        min: 0,
        max: 5000,
      },
    ],
  },
  {
    id: 2,
    name: "Cảm biến Oxi hòa tan trong nước",
    data: [{ id: "inno-002-do", name: "DO", unit: "mg/L", min: 0, max: 20 }],
  },
  {
    id: 3,
    name: "Cảm biến nồng độ Oxi trong không khí",
    data: [{ id: "inno-003-o2", name: "Nồng độ Oxi không khí", unit: "%", min: 0, max: 30 }],
  },
  {
    id: 4,
    name: "Cảm biến nhiệt độ",
    data: [{ id: "inno-004-tem", name: "Nhiệt độ", unit: "°C", min: -40, max: 125 }],
  },
  {
    id: 5,
    name: "Cảm biến nhiệt độ và độ ẩm không khí",
    data: [
      { id: "inno-005-hum-00", name: "Nhiệt độ", unit: "°C", min: 0, max: 80 },
      { id: "inno-005-temp-01", name: "Độ ẩm", unit: "%", min: 0, max: 100 },
    ],
  },
  {
    id: 6,
    name: "Cảm biến độ mặn nước",
    data: [
      { id: "inno-006-sal-00", name: "Độ mặn", unit: "ppt", min: 0, max: 50 },
      {
        id: "inno-006-ec-01",
        name: "Độ dẫn điện",
        unit: "mS/cm",
        min: 0,
        max: 20,
      },
    ],
  },
  {
    id: 7,
    name: "Cảm biến PH",
    data: [{ id: "inno-007-ph", name: "Độ PH", unit: "", min: 0, max: 14 }],
  },
  {
    id: 8,
    name: "Cảm biến cường độ âm thanh",
    data: [{ id: "inno-008-dba", name: "Cường độ âm thanh", unit: "dBA", min: 0, max: 150 }],
  },
  {
    id: 9,
    name: "Cảm biến áp suất khí",
    data: [{ id: "inno-009-kpa", name: "Áp suất khí", unit: "kPa", min: -50, max: 50 }],
  },
];

const sensorIcons = {
  1: [
    {
      icon: co2SensorIcon,
      label: "CO2",
      width: 60,
    },
  ],
  2: [
    {
      icon: doSensorIcon,
      label: "DO",
      width: 60,
    },
  ],
  3: [
    {
      icon: o2SensorIcon,
      label: "O2",
      width: 60,
    },
  ],
  4: [
    {
      icon: tempSensorIcon,
      label: "Nhiệt độ",
      width: 40,
    },
  ],
  5: [
    {
      icon: tempSensorIcon,
      label: "Nhiệt độ",
      width: 40,
    },
    {
      icon: humiditySensorIcon,
      label: "Độ ẩm",
      width: 60,
    },
  ],
  6: [
    {
      icon: salinitySensorIcon,
      label: "Nồng độ mặn",
      width: 60,
    },
  ],
  7: [
    {
      icon: phSensorIcon,
      label: "HP",
      width: 60,
    },
  ],
  8: [
    {
      icon: soundSensorIcon,
      label: "Âm thanh",
      width: 60,
    },
  ],
  9: [
    {
      icon: soundSensorIcon,
      label: "Áp suất khí",
      width: 60,
    },
  ],
};

export function getUnit(sensorId, dataIndex) {
  return sensors.filter((s) => s.id === sensorId)[0]?.data[dataIndex]?.unit || "";
}

export function getSensorIcon(sensorId, dataIndex) {
  const sensorIcon = sensorIcons[sensorId]?.[dataIndex];
  return sensorIcon !== undefined ? sensorIcon : {};
}

export default sensors;
