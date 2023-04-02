export const sensors = [
  {
    id: 0,
    name: "Thời gian",
    data: [
      {
        id: "sens-time-00",
        name: "Thời gian",
        unit: "ms",
        altUnits: [
          { id: 0,  name: "s", cvtFomular: "x/1000" },
          { id: 1,  name: "ns", cvtFomular: "x*1000" },
        ],
      },
    ],
  },
  {
    id: 1,
    name: "Cảm biến nồng độ khí C02",
    data: [
      {
        id: "sens-co2-00",
        name: "Nồng độ khí CO2",
        unit: "ppm",
        min: 0,
        max: 50000,
        altUnits: [
          { id: 0,  name: "mg/m3", cvtFomular: "x*0.0409*28.01" },
          { id: 1,  name: "g/L", cvtFomular: "x/1000" },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Cảm biến Oxi hòa tan trong nước",
    data: [{ id: "sens-do-00", name: "DO", unit: "mg/L", min: 0, max: 20, altUnits: [] }],
  },
  {
    id: 3,
    name: "Cảm biến nồng độ Oxi trong không khí",
    data: [{ id: "sens-o2-00", name: "Nồng độ Oxi không khí", unit: "%", min: 0, max: 30, altUnits: [{}] }],
  },
  {
    id: 4,
    name: "Cảm biến nhiệt độ DS18B20",
    data: [{ id: "sens-ds18b20-00", name: "Nhiệt độ", unit: "°C", min: -40, max: 125, altUnits: [{}] }],
  },
  {
    id: 5,
    name: "Cảm biến nhiệt độ và độ ẩm SHT30",
    data: [
      { id: "sens-sdt30-00", name: "Nhiệt độ", unit: "°C", min: 0, max: 50, altUnits: [{}] },
      { id: "sens-sdt30-01", name: "Độ ẩm", unit: "%", min: 0, max: 100, altUnits: [{}] },
    ],
  },
  {
    id: 6,
    name: "Cảm biến độ mặn nước",
    data: [
      { id: "sens-salinity-00", name: "Độ mặn", unit: "ppt", min: 0, max: 50, altUnits: [{}] },
      {
        id: "sens-salinity-01",
        name: "Độ dẫn điện",
        unit: "mS/cm",
        min: 0,
        max: 20,
        altUnits: [{ id: 0, name: "S/m", cvtFomular: "x/10" }],
      },
    ],
  },
  {
    id: 7,
    name: "Cảm biến PH",
    data: [{ id: "sens-ph-00", name: "Độ PH", unit: "", min: 0, max: 14, altUnits: [{}] }],
  },
  {
    id: 8,
    name: "Cảm biến cường độ âm thanh",
    data: [{ id: "sens-sound-00", name: "Cường độ âm thanh", unit: "dBA", min: 40, max: 130, altUnits: [{}] }],
  },
  {
    id: 9,
    name: "Cảm biến áp suất khí",
    data: [{ id: "sens-baro-00", name: "Áp suất khí", unit: "kPa", min: 0, max: 700, altUnits: [{}] }],
  },
];

export function getUnit(sensorId, dataIndex) {
  return sensors.filter((s) => s.id === sensorId)[0]?.data[dataIndex]?.unit || "";
}

export default sensors;
