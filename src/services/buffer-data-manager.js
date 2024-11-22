const buffers = new Map();

export function clearAllBuffersData() {
  buffers.clear();
}

export function clearBufferData(sensorId) {
  buffers.delete(sensorId);
}

export function addBufferData(sensorId, data) {
  let bufferData = buffers.get(sensorId) || [];
  if (!Array.isArray(data)) {
    bufferData = bufferData.concat(data);
  } else {
    bufferData.push(data);
  }
  buffers.set(sensorId, bufferData);
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
