import { CURRENT_SENSOR_V2_ID, VOLTAGE_SENSOR_V2_ID, SOUND_SENSOR_V2_ID } from "./sensor-service";

const buffers = new Map();
const oscBuffers = new Map();

export const currentBuffer = {};

export function clearOscBuffersData() {
  oscBuffers.clear();
}

export function addOscBufferData(sensorId, data) {
  let oscBufferData = oscBuffers.get(sensorId) || [];
  if (Array.isArray(data[0])) {
    oscBufferData = oscBufferData.concat(data);
  } else {
    oscBufferData.push(data);
  }
  oscBuffers.set(sensorId, oscBufferData);
}

export function getOscBufferData(sensorId) {
  return oscBuffers.get(sensorId);
}

export function clearAllBuffersData() {
  buffers.clear();
}

export function keepRecentBuffersData() {
  buffers.forEach((value, key) => {
    buffers.set(key, [value[value.length - 1]]);
  });
}

export function clearBufferData(sensorId) {
  buffers.delete(sensorId);
}

export function addBufferData(sensorId, data) {
  let bufferData = buffers.get(sensorId) || [];
  if (Array.isArray(data[0])) {
    currentBuffer[sensorId] = data[data.length - 1];
    bufferData = bufferData.concat(data);
  } else {
    currentBuffer[sensorId] = data;
    bufferData.push(data);
  }
  buffers.set(sensorId, bufferData);

  if ([CURRENT_SENSOR_V2_ID, VOLTAGE_SENSOR_V2_ID, SOUND_SENSOR_V2_ID].includes(sensorId)) {
    addOscBufferData(sensorId, data);
  }
}

function interpolateData(data, sampleSize) {
  const originalSize = data.length;

  if (!sampleSize || sampleSize === originalSize) {
    return data;
  }

  if (sampleSize === 1) {
    return [data[originalSize - 1]]; // Return an array with the last item
  }

  const interpolated = [];

  if (sampleSize < originalSize) {
    const step = (originalSize - 1) / sampleSize;
    for (let i = 1; i <= sampleSize; i++) {
      const position = Math.floor(i * step);
      interpolated.push(data[position]);
    }
  } else {
    const step = (originalSize - 1) / (sampleSize - 1);
    for (let i = 0; i < sampleSize; i++) {
      const position = Math.round(i * step);
      interpolated.push(data[position]);
    }
  }

  return interpolated;
}

export function getBufferData(sensorId, sampleSize) {
  const bufferData = buffers.get(sensorId);

  if (!bufferData) {
    return null;
  }

  return interpolateData(bufferData, sampleSize);
}

export default buffers;
