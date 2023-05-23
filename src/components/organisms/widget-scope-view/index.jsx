import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";

import "./index.scss";
import { useActivityContext } from "../../../context/ActivityContext";
import { createChartDataAndParseXAxis, createChartJsDatas } from "../../../utils/widget-line-utils";
import { abs } from "mathjs";

const MIN_DECIBELS = -90;
const MAX_DECIBELS = -10;
const GET_SAMPLES_INTERVAL = 100;
const BUFFER_TIME_DOMAIN_LENGTH = 1024;
const DEFAULT_MIN_AMPLITUDE = 0.3;

let drawVisual;

const updateChart = ({ chartInstance, data, maxX, maxY }) => {
  chartInstance.data = createChartJsDatas({
    chartDatas: data,
    pointRadius: 1,
    tension: 0.6,
  });

  chartInstance.options.animation = false;
  chartInstance.options.scales = {
    y: {
      suggestedMin: maxY * -1,
      suggestedMax: maxY,
      title: {
        color: "orange",
        display: true,
        text: "decibels",
      },
    },
    x: {
      type: "linear",
      suggestedMin: 0,
      suggestedMax: Number(maxX).toFixed(0),
      ticks: {},
      title: {
        color: "orange",
        display: true,
        text: "ms",
        align: "end",
      },
    },
  };
  chartInstance.options.scales.x.ticks.stepSize = 1;
  chartInstance.update();
};

const ScopeViewWidget = () => {
  const canvasRef = useRef();
  const chartInstanceRef = useRef();
  const [visualSetting, setVisualSetting] = useState("sineWave");

  const { isRunning } = useActivityContext();

  const initWebAudio = () => {
    // Older browsers might not implement mediaDevices at all, so we set an empty object first
    if (navigator.mediaDevices === undefined) {
      navigator.mediaDevices = {};
    }

    // Some browsers partially implement mediaDevices. We can't assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Add the getUserMedia property if it's missing.
    if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = function (constraints) {
        // First get ahold of the legacy getUserMedia, if present
        const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

        // Some browsers just don't implement it - return a rejected promise with an error
        // to keep a consistent interface
        if (!getUserMedia) {
          return Promise.reject(new Error("getUserMedia is not implemented in this browser"));
        }

        // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
        return new Promise(function (resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      };
    }

    // Set up forked web audio context, for multiple browsers
    // window. is needed otherwise Safari explodes
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const samplingRate = audioCtx.sampleRate;
    let source;

    // Set up the different audio nodes we will use for the app
    const analyser = audioCtx.createAnalyser();
    analyser.minDecibels = MIN_DECIBELS;
    analyser.maxDecibels = MAX_DECIBELS;
    analyser.smoothingTimeConstant = 0.9;

    const visualSelect = document.getElementById("visual");

    // Event listeners to change visualize and voice settings
    visualSelect.onchange = function () {
      window.cancelAnimationFrame(drawVisual);
      visualize();
    };

    // Main block for doing the audio recording
    if (navigator.mediaDevices.getUserMedia) {
      const constraints = { audio: true };
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (stream) {
          source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          visualize();
        })
        .catch(function (err) {
          console.log("The following gUM error occured: " + err);
        });
    } else {
      console.log("getUserMedia not supported on your browser!");
    }

    function visualize() {
      if (visualSetting === "sineWave") {
        let previousTimeStamp, currentTimeStamp;
        const timePerSample = 1 / samplingRate;
        let maxAmplitude = DEFAULT_MIN_AMPLITUDE;

        analyser.fftSize = BUFFER_TIME_DOMAIN_LENGTH;
        const bufferLength = analyser.fftSize;
        const dataArray = new Float32Array(bufferLength);

        const drawSineWave = function () {
          currentTimeStamp = Date.now();
          const diffTimeStamp = currentTimeStamp - previousTimeStamp;

          if (isRunning) drawVisual = requestAnimationFrame(drawSineWave);

          if (diffTimeStamp < GET_SAMPLES_INTERVAL) return;
          previousTimeStamp = currentTimeStamp;

          analyser.getFloatTimeDomainData(dataArray);

          let x = 0;
          const normalizedArray = [];

          for (let i = 0; i < bufferLength; i++) {
            const y = dataArray[i];
            if (abs(y) > maxAmplitude) maxAmplitude = abs(y);
            normalizedArray.push({ x: x, y: y });
            x += timePerSample * 1000;
          }

          const chartData = [
            {
              name: "Giao động chu kỳ theo thời gian",
              data: normalizedArray,
            },
          ];

          const chartDatas = createChartDataAndParseXAxis({ chartDatas: chartData });
          updateChart({
            chartInstance: chartInstanceRef.current,
            data: chartDatas,
            maxX: timePerSample * BUFFER_TIME_DOMAIN_LENGTH * 1000,
            maxY: maxAmplitude,
          });
        };

        drawSineWave();
      } else if (visualSetting == "frequencyBars") {
        // analyser.fftSize = 256;
        // const bufferLengthAlt = analyser.frequencyBinCount;
        // // See comment above for Float32Array()
        // const dataArrayAlt = new Uint8Array(bufferLengthAlt);
        // // const dataArrayAlt = new Float32Array(bufferLengthAlt);
        // canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        // const drawAlt = function () {
        //   drawVisual = requestAnimationFrame(drawAlt);
        //   analyser.getByteFrequencyData(dataArrayAlt);
        //   // analyser.getFloatFrequencyData(dataArrayAlt); // Use getFloatFrequencyData
        //   // console.log("dataArrayAlt: ", dataArrayAlt);
        //   canvasCtx.fillStyle = "rgb(255, 255, 255)";
        //   canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        //   const barWidth = (WIDTH / bufferLengthAlt) * 2.5;
        //   let barHeight;
        //   let x = 0;
        //   for (let i = 0; i < bufferLengthAlt; i++) {
        //     barHeight = dataArrayAlt[i];
        //     canvasCtx.fillStyle = "rgb(" + (barHeight + 100) + ",50,50)";
        //     canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);
        //     x += barWidth + 1;
        //   }
        // };
        // drawAlt();
      }
    }
  };

  useEffect(() => {
    chartInstanceRef.current = new Chart(canvasRef.current, {
      type: "line",
      options: {
        animation: false,
        maintainAspectRatio: false,
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
        <select
          id="visual"
          className="options"
          name="visual"
          defaultValue={visualSetting}
          onChange={({ target: { value } }) => {
            setVisualSetting(value);
          }}
        >
          <option value="sineWave" label="Sine Wave">
            sineWave
          </option>
          <option value="frequencyBars" label="Frequency Bars">
            Frequency bars
          </option>
          <option value="off">Off</option>
        </select>
      </div>
    </div>
  );
};

export default ScopeViewWidget;
