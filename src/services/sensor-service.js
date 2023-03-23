export const sensors = [
  {
    id: 0,
    name: "Thời gian",
    data: [{ id: "sens-time-00", name: "Thời gian", unit: "ms" }],
  },
  {
    id: 1,
    name: "Cảm biến nồng độ khí C02",
    data: [{ id: "sens-co2-00", name: "Nồng độ khí CO2", unit: "ppm" }],
  },
  {
    id: 2,
    name: "Cảm biến Oxi hòa tan trong nước",
    data: [{ id: "sens-do-00", name: "DO", unit: "mg/L" }],
  },
  {
    id: 3,
    name: "Cảm biến nồng độ Oxi trong không khí",
    data: [{ id: "sens-o2-00", name: "Nồng độ Oxi không khí", unit: "%" }],
  },
  {
    id: 4,
    name: "Cảm biến nhiệt độ DS18B20",
    data: [{ id: "sens-ds18b20-00", name: "Nhiệt độ", unit: "°C" }],
  },
  {
    id: 5,
    name: "Cảm biến nhiệt độ và độ ẩm SHT30",
    data: [
      { id: "sens-sdt30-00", name: "Nhiệt độ", unit: "°C" },
      { id: "sens-sdt30-01", name: "Độ ẩm", unit: "%" },
    ],
  },
  {
    id: 6,
    name: "Cảm biến độ mặn nước",
    data: [
      { id: "sens-salinity-00", name: "Độ mặn", unit: "ppt" },
      { id: "sens-salinity-01", name: "Độ dẫn điện", unit: "ms/cm" },
    ],
  },
  {
    id: 7,
    name: "Cảm biến PH",
    data: [{ id: "sens-ph-00", name: "Độ PH", unit: "" }],
  },
  {
    id: 8,
    name: "Cảm biến cường độ âm thanh",
    data: [{ id: "sens-sound-00", name: "Cường độ âm thanh", unit: "dBA" }],
  },
  {
    id: 9,
    name: "Cảm biến áp suất khí",
    data: [{ id: "sens-baro-00", name: "Áp suất khí", unit: "kPa" }],
  },
];

export default sensors;
