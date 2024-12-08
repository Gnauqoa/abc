import { f7 } from "framework7-react";
import { USB_TYPE } from "../js/constants";
import DataManagerIST from "./data-manager";
import { BUILTIN_DECIBELS_SENSOR_ID, SINE_WAVE_SENSOR_INFO, FREQUENCY_WAVE_SENSOR_INFO } from "./sensor-service";
import { abs } from "mathjs";

const MIN_DECIBEL = -90;
const MAX_DECIBEL = 0;
const SCALE_DECIBEL = 150;
const GET_SAMPLES_INTERVAL = 100;
export const BUFFER_LENGTH = 1024;

const DEFAULT_MIN_AMPLITUDE = 0.1;

const MAX_FREQUENCY = 2000;
const REF_VALUE = 1.0; // Reference value for SPL calculation
const REF_DB = 150.0; // Reference level in dB

// var filterNode;

export class MicrophoneServices {
  constructor() {
    this.initializeVariables();
  }

  /**
   * Returns the instance of the MicrophoneServices class.
   * @returns {MicrophoneServices} - The instance of the MicrophoneServices class.
   */
  static getInstance() {
    if (!MicrophoneServices.instance) {
      MicrophoneServices.instance = new MicrophoneServices();
    }
    return MicrophoneServices.instance;
  }

  init() {
    this.startRecordWebAudio();
    this.startGetDecibel();
  }

  stop() {
    this.stopGetDecibel();
    this.stopRecordWebAudio();
  }

  getMicrophonePermission(onSuccess, onDenied, onError) {
    window.audioinput.checkMicrophonePermission(function (hasPermission) {
      try {
        if (hasPermission) {
          if (onSuccess) onSuccess();
        } else {
          window.audioinput.getMicrophonePermission(function (hasPermission, message) {
            try {
              if (hasPermission) {
                if (onSuccess) onSuccess();
              } else {
                if (onDenied) onDenied("User denied permission to record: " + message);
              }
            } catch (ex) {
              if (onError) onError("Start after getting permission exception: " + ex);
            }
          });
        }
      } catch (ex) {
        if (onError) onError("getMicrophonePermission exception: " + ex);
      }
    });
  }

  initializeVariables() {
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

    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.samplingRate = this.audioCtx.sampleRate;

    // Set up the different audio nodes we will use for the app
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.minDecibels = MIN_DECIBEL;
    this.analyser.maxDecibels = MAX_DECIBEL;
    this.analyser.smoothingTimeConstant = 0.9;

    this.timeDataArray;
    this.frequencyDataArray;
    this.timerGetDataId;

    this.isConnectToMicrophone = false;
  }

  startRecordWebAudio() {
    try {
      // Main block for doing the audio recording
      const audioCtx = this.audioCtx;
      const analyser = this.analyser;
      let source;

      analyser.fftSize = BUFFER_LENGTH;
      const bufferLengthFrequency = analyser.frequencyBinCount;
      const bufferLengthTime = BUFFER_LENGTH;

      this.timeDataArray = new Float32Array(bufferLengthTime);
      this.frequencyDataArray = new Float32Array(bufferLengthFrequency);

      const callbackReadMicrophone = () => {
        this.analyser.getFloatTimeDomainData(this.timeDataArray);
        this.analyser.getFloatFrequencyData(this.frequencyDataArray);
        this.timerGetDataId = setTimeout(callbackReadMicrophone, GET_SAMPLES_INTERVAL);
      };

      const initializeMicrophoneStream = () => {
        if (navigator.mediaDevices.getUserMedia) {
          const constraints = { audio: true };
          navigator.mediaDevices
            .getUserMedia(constraints)
            .then(function (stream) {
              window.localStream = stream;
              source = audioCtx.createMediaStreamSource(stream);
              source.connect(analyser);
              callbackReadMicrophone();
            })
            .catch(function (err) {
              console.log("The following gUM error occured: " + err);
            });
        } else {
          console.log("getUserMedia not supported on your browser!");
        }
      };

      if (f7.device.cordova) {
        if (window.audioinput && !window.audioinput.isCapturing()) {
          this.getMicrophonePermission(
            function () {
              // See utils.js
              // Connect the audioinput to the speaker(s) in order to hear the captured sound.
              // We're using a filter here to avoid too much feedback looping...
              // Start with default values and let the plugin handle conversion from raw data to web audio.

              console.log("Microphone input starting...");
              window.audioinput.start({
                streamToWebAudio: true,
              });
              console.log("Microphone input started!");

              // // Create a filter to avoid too much feedback
              // filterNode = audioinput.getAudioContext().createBiquadFilter();
              // filterNode.frequency.setValueAtTime(2048, audioinput.getAudioContext().currentTime);

              // audioinput.connect(filterNode);
              // filterNode.connect(audioinput.getAudioContext().destination);

              console.log("Capturing audio!");
              initializeMicrophoneStream();
            },
            function (deniedMsg) {
              console.log(deniedMsg);
            },
            function (errorMsg) {
              console.log(errorMsg);
            }
          );
        } else {
          console.log("Already capturing!");
        }
      } else {
        initializeMicrophoneStream();
      }
    } catch (ex) {
      console.log("startRecordWebAudio exception: " + ex);
    }
  }

  stopRecordWebAudio() {
    clearTimeout(this.timerGetDataId);
    console.log("stopRecordWebAudio: Stop callbackReadMicrophone");

    if (f7.device.cordova) {
      if (window.audioinput && window.audioinput.isCapturing()) {
        window.audioinput.stop();
        // if (filterNode) filterNode.disconnect();
        window.audioinput.disconnect();
      }
      console.log("stopRecordWebAudio: Stop audioinput");
    }

    if (window.localStream && window.localStream.getTracks()) {
      console.log("stopRecordWebAudio: Stop audio + video streams");
      window.localStream.getTracks().forEach((track) => track.stop());
    }
  }

  stopGetDecibel() {
    clearInterval(this.getDecibelIntervalId);
  }

  getFFTSize() {
    return this.analyser.fftSize;
  }

  getFrequencyBinCount() {
    return this.analyser.frequencyBinCount;
  }

  getSamplingRate() {
    return this.samplingRate;
  }

  getTimePerSample() {
    return 1 / this.samplingRate;
  }

  getFloatTimeDomainData() {
    return this.timeDataArray;
  }

  getFloatFrequencyData() {
    return this.frequencyDataArray;
  }

  calculateStartIndex() {
    const desiredStartFrequency = 0; // Specify your desired start frequency in Hz
    const binWidth = this.samplingRate / this.getFFTSize(); // Calculate the width of each frequency bin

    // Calculate the index corresponding to the desired start frequency
    const startIndex = Math.floor(desiredStartFrequency / binWidth);
    return startIndex;
  }

  getCurrentDecibel() {
    try {
      const dataArray = this.getFloatFrequencyData();
      const startIndex = this.calculateStartIndex(); // Calculate the start index based on desired frequency range
      const endIndex = dataArray.length; // Use the full buffer length

      // Calculate the sum and count of amplitudes within the desired frequency range
      let sum = 0;
      let count = 0;
      for (let i = startIndex; i < endIndex; i++) {
        // if (dataArray[i] <= MIN_DECIBEL) continue;
        sum += Math.pow(10, dataArray[i] / 20); // Convert the amplitude to linear scale
        count++;
      }

      // Calculate the average amplitude within the desired frequency range
      const averageAmplitude = sum / count;

      // Convert the average amplitude to decibels
      const decibelValue = 20 * Math.log10(averageAmplitude) + SCALE_DECIBEL;

      return Number.isFinite(decibelValue) ? decibelValue : null;
    } catch (error) {
      console.log("getCurrentDecibel: ", error);
      return null;
    }
  }

  startGetDecibel() {
    this.getDecibelIntervalId = setInterval(() => {
      const decibelValue = this.getCurrentDecibel();
      if (decibelValue !== null) {
        const dataArray = [BUILTIN_DECIBELS_SENSOR_ID, 100, USB_TYPE, "DUMMY", 1, [decibelValue]];
        DataManagerIST.callbackReadSensor(dataArray);
      }
    }, 1000);
  }

  getSoundChartData(sensorInfo) {
    const samplingRate = this.getSamplingRate();
    const fftSize = this.getFFTSize();
    const timePerSample = this.getTimePerSample();
    let maxAmplitude = DEFAULT_MIN_AMPLITUDE;
    const normalizedArray = [];

    if (sensorInfo === SINE_WAVE_SENSOR_INFO) {
      let time = 0;
      const dataArray = this.getFloatTimeDomainData();

      for (let i = 0; i < BUFFER_LENGTH; i++) {
        const y = dataArray[i];
        if (abs(y) > maxAmplitude) maxAmplitude = abs(y);
        normalizedArray.push({ x: time, y: y });
        time += timePerSample * 1000;
      }
    } else if (sensorInfo === FREQUENCY_WAVE_SENSOR_INFO) {
      let frequency = 0;
      const dataArrayAlt = this.getFloatFrequencyData();

      for (let i = 0; i < dataArrayAlt.length; i++) {
        const amplitude = Math.pow(10, dataArrayAlt[i] / 20);
        const spl = 20 * Math.log10(amplitude / REF_VALUE);
        const positivedB = spl + REF_DB;

        if (i * (samplingRate / fftSize) > MAX_FREQUENCY) break;

        normalizedArray.push({ x: frequency, y: positivedB });
        frequency = i * (samplingRate / fftSize);
      }
    }

    return normalizedArray;
  }
}

export default MicrophoneServices.getInstance();
