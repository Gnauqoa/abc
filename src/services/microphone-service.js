import { USB_TYPE } from "../js/constants";
import DataManagerIST from "./data-manager";
import { BUILTIN_DECIBELS_SENSOR_ID } from "./sensor-service";

const MIN_DECIBELS = -90;
const MAX_DECIBELS = 0;
const SCALE_DECIBELS = 150;
const GET_SAMPLES_INTERVAL = 200;
const BUFFER_LENGTH = 2048;

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
    this.stopRecordWebAudio();
    this.stopGetDecibel();
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
    this.analyser.minDecibels = MIN_DECIBELS;
    this.analyser.maxDecibels = MAX_DECIBELS;
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

      if (typeof cordova !== "undefined" && cordova.platformId === "android") {
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
          alert("Already capturing!");
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

    if (typeof cordova !== "undefined" && cordova.platformId === "android") {
      if (window.audioinput && window.audioinput.isCapturing()) {
        window.audioinput.stop();
        // if (filterNode) filterNode.disconnect();
        window.audioinput.disconnect();
      }
      console.log("stopRecordWebAudio: Stop audioinput");
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
        // if (dataArray[i] <= MIN_DECIBELS) continue;
        sum += Math.pow(10, dataArray[i] / 20); // Convert the amplitude to linear scale
        count++;
      }

      // Calculate the average amplitude within the desired frequency range
      const averageAmplitude = sum / count;

      // Convert the average amplitude to decibels
      const decibelValue = 20 * Math.log10(averageAmplitude);

      return decibelValue + SCALE_DECIBELS;
    } catch (error) {
      console.log("getCurrentDecibel: ", error);
    }
  }

  startGetDecibel() {
    this.getDecibelIntervalId = setInterval(() => {
      const decibelValue = this.getCurrentDecibel();
      const dataArray = [BUILTIN_DECIBELS_SENSOR_ID, 100, USB_TYPE, "DUMMY", 1, [decibelValue]];
      DataManagerIST.callbackReadSensor(dataArray);
    }, 1000);
  }
}

export default MicrophoneServices.getInstance();
