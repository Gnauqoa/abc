import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";

import "./index.scss";
import { useActivityContext } from "../../../context/ActivityContext";
import { createChartDataAndParseXAxis, createChartJsDatas } from "../../../utils/widget-line-utils";
import { abs } from "mathjs";
import SensorSelector from "../../molecules/popup-sensor-selector";
import SensorServiceIST from "../../../services/sensor-service";
import MicrophoneServiceIST from "../../../services/microphone-service";

const MIN_DECIBELS = -90;
const MAX_DECIBELS = -10;
const GET_SAMPLES_INTERVAL = 200;
const BUFFER_TIME_DOMAIN = 1024;
const BUFFER_FREQUENCY_DOMAIN = 1024;
const DEFAULT_MIN_AMPLITUDE = 0.3;

let drawVisual;

const SINE_WAVE = 0;
const FREQUENCY_WAVE = 1;
const DECIBEL = 2;

const visualSettings = {
  "12-0": DECIBEL,
  "12-1": SINE_WAVE,
  "12-2": FREQUENCY_WAVE,
};

const updateChart = ({ chartInstance, data, maxX, maxY, labelX, labelY, tension }) => {
  chartInstance.data = createChartJsDatas({
    chartDatas: data,
    pointRadius: 1,
    tension: tension,
  });

  chartInstance.options.animation = false;
  chartInstance.options.scales = {
    y: {
      suggestedMin: maxY * -1,
      suggestedMax: maxY,
      title: {
        color: "orange",
        display: true,
        text: labelY,
      },
    },
    x: {
      type: "linear",
      min: 0,
      max: Math.round(maxX),
      ticks: {},
      title: {
        color: "orange",
        display: true,
        text: labelX,
        align: "end",
      },
    },
  };
  chartInstance.update();
};

const ScopeViewWidget = ({ widget, handleSensorChange }) => {
  const canvasRef = useRef();
  const chartInstanceRef = useRef();

  const defaultSensorIndex = 0;
  const sensor = widget.sensors[defaultSensorIndex];
  const sensorInfo = `${sensor.id}-${sensor.index}`;

  const soundSensors = SensorServiceIST.getActiveSoundSensors();
  const soundSensorsId = soundSensors.map((sensor) => sensor.id?.toString());

  const { isRunning } = useActivityContext();

  // console.log(MicrophoneServiceIST.getCurrentDecibel());

  const initWebAudio = () => {
    const samplingRate = MicrophoneServiceIST.getSamplingRate();

    function visualize() {
      if (visualSettings[sensorInfo] === SINE_WAVE) {
        let previousTimeStamp, currentTimeStamp;
        const timePerSample = 1 / samplingRate;
        let maxAmplitude = DEFAULT_MIN_AMPLITUDE;

        MicrophoneServiceIST.setFFTSize(BUFFER_TIME_DOMAIN);
        const bufferLength = BUFFER_TIME_DOMAIN;
        const dataArray = new Float32Array(bufferLength);

        const drawSineWave = function () {
          currentTimeStamp = Date.now();
          const diffTimeStamp = currentTimeStamp - previousTimeStamp;

          if (isRunning) drawVisual = requestAnimationFrame(drawSineWave);
          if (diffTimeStamp < GET_SAMPLES_INTERVAL) return;
          previousTimeStamp = currentTimeStamp;

          MicrophoneServiceIST.getFloatTimeDomainData(dataArray);

          let time = 0;
          const normalizedArray = [];

          for (let i = 0; i < bufferLength; i++) {
            const y = dataArray[i];
            if (abs(y) > maxAmplitude) maxAmplitude = abs(y);
            normalizedArray.push({ x: time, y: y });
            time += timePerSample * 1000;
          }

          const chartData = [
            {
              name: "Dao động chu kỳ theo thời gian",
              data: normalizedArray,
            },
          ];

          const chartDatas = createChartDataAndParseXAxis({ chartDatas: chartData });
          updateChart({
            chartInstance: chartInstanceRef.current,
            data: chartDatas,
            maxX: timePerSample * BUFFER_TIME_DOMAIN * 1000,
            maxY: maxAmplitude,
            labelY: "amplitude",
            labelX: "ms",
            tension: 0.6,
          });
        };

        drawSineWave();
      } else if (visualSettings[sensorInfo] === FREQUENCY_WAVE) {
        let maxX = 0;
        let previousTimeStamp, currentTimeStamp;

        MicrophoneServiceIST.setFFTSize(BUFFER_FREQUENCY_DOMAIN);
        const fftSize = BUFFER_FREQUENCY_DOMAIN;

        const bufferLengthAlt = MicrophoneServiceIST.getFrequencyBinCount();
        const dataArrayAlt = new Float32Array(bufferLengthAlt);

        const drawFrequencyWave = function () {
          currentTimeStamp = Date.now();
          const diffTimeStamp = currentTimeStamp - previousTimeStamp;

          if (isRunning) drawVisual = requestAnimationFrame(drawFrequencyWave);
          if (diffTimeStamp < GET_SAMPLES_INTERVAL) return;
          previousTimeStamp = currentTimeStamp;

          MicrophoneServiceIST.getFloatFrequencyData(dataArrayAlt);

          let frequency = 0;
          const normalizedArray = [];

          for (let i = 0; i < bufferLengthAlt; i++) {
            let y = dataArrayAlt[i];
            if (y < MIN_DECIBELS) y = MIN_DECIBELS;
            if (y !== MIN_DECIBELS && i > maxX) maxX = i;

            normalizedArray.push({ x: frequency, y: y });
            frequency = i * (samplingRate / fftSize);
          }

          const chartData = [
            {
              name: "Dao động chu kỳ theo tần số",
              data: normalizedArray,
            },
          ];

          const chartDatas = createChartDataAndParseXAxis({ chartDatas: chartData });
          updateChart({
            chartInstance: chartInstanceRef.current,
            data: chartDatas,
            maxX: maxX * (samplingRate / fftSize),
            maxY: MAX_DECIBELS,
            labelY: "decibels",
            labelX: "frequency",
            tension: 0.2,
          });
        };
        drawFrequencyWave();
      }
    }

    MicrophoneServiceIST.startRecordWebAudio(visualize);
  };

  useEffect(() => {
    chartInstanceRef.current = new Chart(canvasRef.current, {
      type: "line",
      options: {
        animation: false,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false, //This will do the task
          },
          zoom: {
            pan: {
              enabled: true,
              mode: "xy",
            },
            limits: {
              x: { min: 0 },
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true,
              },

              mode: "xy",
            },
          },
        },
      },
    });
    updateChart({ chartInstance: chartInstanceRef.current, data: [] });
  }, []);

  useEffect(() => {
    if (isRunning) initWebAudio();
    else cancelAnimationFrame(drawVisual);
  }, [isRunning]);

  return (
    <div className="scope-view-widget">
      <div className="canvas-container">
        <canvas ref={canvasRef} />
      </div>

      <div className="scope-view-options ">
        <SensorSelector
          disabled={isRunning}
          selectedSensor={sensor}
          onChange={(sensor) => handleSensorChange(widget.id, defaultSensorIndex, sensor)}
          whitelist={soundSensorsId}
        ></SensorSelector>
      </div>
    </div>
  );
};

export default ScopeViewWidget;
