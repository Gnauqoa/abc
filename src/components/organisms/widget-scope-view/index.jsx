import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";

import "./index.scss";
import { useActivityContext } from "../../../context/ActivityContext";
import { createChartDataAndParseXAxis, createChartJsDatas, getMaxMinAxises } from "../../../utils/widget-line-utils";
import { abs } from "mathjs";
import SensorSelector from "../../molecules/popup-sensor-selector";
import SensorServiceIST from "../../../services/sensor-service";
import MicrophoneServiceIST from "../../../services/microphone-service";
import DataManagerIST from "../../../services/data-manager";

const MIN_DECIBELS = -90;
const MAX_DECIBELS = -10;
const GET_SAMPLES_INTERVAL = 200;
const BUFFER_TIME_DOMAIN = 1024;
const BUFFER_FREQUENCY_DOMAIN = 1024;
const DEFAULT_MIN_AMPLITUDE = 0.3;
const MAX_FREQUENCY = 6000;

let drawChartTimerId;

const SINE_WAVE = 0;
const FREQUENCY_WAVE = 1;
const DECIBEL = 2;

const visualSettings = {
  "12-0": DECIBEL,
  "13-0": SINE_WAVE,
  "13-1": FREQUENCY_WAVE,
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
  const { currentDataRunId } = useActivityContext();
  const canvasRef = useRef();
  const chartInstanceRef = useRef();

  const defaultSensorIndex = 0;
  const sensor = widget.sensors[defaultSensorIndex];
  const sensorInfo = `${sensor.id}-${sensor.index}`;

  const soundSensors = SensorServiceIST.getActiveSoundSensors();
  const soundSensorsId = soundSensors.map((sensor) => sensor.id?.toString());

  const { isRunning } = useActivityContext();

  const initWebAudio = () => {
    const samplingRate = MicrophoneServiceIST.getSamplingRate();
    const fftSize = MicrophoneServiceIST.getFFTSize();
    const timePerSample = MicrophoneServiceIST.getTimePerSample();
    let maxAmplitude = DEFAULT_MIN_AMPLITUDE;

    function visualize() {
      if (visualSettings[sensorInfo] === SINE_WAVE) {
        const drawSineWave = function () {
          let time = 0;
          const normalizedArray = [];
          const dataArray = MicrophoneServiceIST.getFloatTimeDomainData();

          for (let i = 0; i < dataArray.length; i++) {
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

          if (isRunning) drawChartTimerId = setTimeout(drawSineWave, GET_SAMPLES_INTERVAL);
        };

        drawSineWave();
      } else if (visualSettings[sensorInfo] === FREQUENCY_WAVE) {
        const drawFrequencyWave = function () {
          let frequency = 0;
          const normalizedArray = [];
          const dataArrayAlt = MicrophoneServiceIST.getFloatFrequencyData();

          for (let i = 0; i < dataArrayAlt.length; i++) {
            let y = dataArrayAlt[i];
            if (y < MIN_DECIBELS) y = MIN_DECIBELS;

            if (i * (samplingRate / fftSize) > MAX_FREQUENCY) break;

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
            maxX: MAX_FREQUENCY,
            maxY: MAX_DECIBELS,
            labelY: "decibels",
            labelX: "frequency",
            tension: 0.2,
          });

          if (isRunning) drawChartTimerId = setTimeout(drawFrequencyWave, GET_SAMPLES_INTERVAL);
        };
        drawFrequencyWave();
      }
    }

    visualize();
  };

  useEffect(() => {
    try {
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

      const data = DataManagerIST.getSoundDataDataRun(sensorInfo, currentDataRunId);
      if (Array.isArray(data) && data.length === 1) {
        const chartData = [
          {
            name: "Dao động chu kỳ theo tần số",
            data: data[0],
          },
        ];

        const chartDatas = createChartDataAndParseXAxis({ chartDatas: chartData });
        const { maxX, maxY, minY } = getMaxMinAxises({ chartDatas: chartDatas });
        const yValue = Math.max(Math.abs(maxY), Math.abs(minY));
        updateChart({
          chartInstance: chartInstanceRef.current,
          data: chartDatas,
          maxX: maxX,
          maxY: yValue,
          labelY: visualSettings[sensorInfo] === SINE_WAVE ? "amplitude" : "decibels",
          labelX: visualSettings[sensorInfo] === SINE_WAVE ? "ms" : "frequency",
          tension: visualSettings[sensorInfo] === SINE_WAVE ? 0.6 : 0.2,
        });
      } else {
        updateChart({ chartInstance: chartInstanceRef.current, data: [] });
      }
    } catch (error) {
      console.log("useEffect: ", error);
    }
  }, []);

  useEffect(() => {
    if (isRunning) initWebAudio();
    else {
      const curDatasets = chartInstanceRef.current.data?.datasets;
      if (Array.isArray(curDatasets) && curDatasets.length === 1) {
        const data = curDatasets[0].data;
        DataManagerIST.addSoundDataDataRun(sensorInfo, data, currentDataRunId);
      }
      clearTimeout(drawChartTimerId);
    }
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
          definedSensors={soundSensorsId}
        ></SensorSelector>
      </div>
    </div>
  );
};

export default ScopeViewWidget;
