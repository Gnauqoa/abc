const MIN_DECIBELS = -90;
const MAX_DECIBELS = -10;
const GET_SAMPLES_INTERVAL = 200;
const BUFFER_TIME_DOMAIN = 1024;
const BUFFER_FREQUENCY_DOMAIN = 1024;
const DEFAULT_MIN_AMPLITUDE = 0.3;

export class MicrophoneServices {
  constructor() {
    this.initializeVariables();
    // this.startGetDecibel();
  }

  /**
   * Returns the instance of the DataManager class.
   * @returns {MicrophoneServices} - The instance of the DataManager class.
   */
  static getInstance() {
    if (!MicrophoneServices.instance) {
      MicrophoneServices.instance = new MicrophoneServices();
    }
    return MicrophoneServices.instance;
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

    this.decibelBufferLength;
    this.decibelDataArray;
  }

  startRecordWebAudio(callback) {
    // Main block for doing the audio recording
    const audioCtx = this.audioCtx;
    const analyser = this.analyser;
    let source;

    if (navigator.mediaDevices.getUserMedia) {
      const constraints = { audio: true };
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (stream) {
          source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          callback();
        })
        .catch(function (err) {
          console.log("The following gUM error occured: " + err);
        });
    } else {
      console.log("getUserMedia not supported on your browser!");
    }
  }

  setFFTSize(fftSize) {
    this.analyser.fftSize = fftSize;
  }

  getFrequencyBinCount() {
    return this.analyser.frequencyBinCount;
  }

  getSamplingRate() {
    return this.samplingRate;
  }

  getFloatTimeDomainData(dataArray) {
    this.analyser.getFloatTimeDomainData(dataArray);
  }

  getFloatFrequencyData(dataArray) {
    this.analyser.getFloatFrequencyData(dataArray);
  }

  //   getCurrentDecibel() {
  //     try {
  //       const bufferLengthAlt = this.getFrequencyBinCount();
  //       const dataArrayAlt = new Float32Array(bufferLengthAlt);
  //       this.getFloatFrequencyData(dataArrayAlt);

  //       // Calculate the average amplitude of the frequency data
  //       let sum = 0;
  //       let count = 0;
  //       for (let i = 0; i < bufferLengthAlt; i++) {
  //         if (dataArrayAlt[i] <= MIN_DECIBELS) continue;
  //         sum += dataArrayAlt[i];
  //         count += 1;
  //       }
  //       const averageAmplitude = sum / count;
  //       console.log("sum: ", sum, averageAmplitude);

  //       // Convert the average amplitude to decibels
  //       const minDecibels = this.analyser.minDecibels;
  //       const maxDecibels = this.analyser.maxDecibels;
  //       const range = maxDecibels - minDecibels;
  //       const normalizedAmplitude = averageAmplitude / 255; // Normalize the amplitude to [0, 1]
  //       const decibelValue = normalizedAmplitude * range + minDecibels;

  //       return decibelValue;
  //     } catch (error) {
  //       console.log("getCurrentDecibel: ", error);
  //     }
  //   }

  //   startGetDecibel() {
  //     this.getDecibelIntervalId = setInterval(() => {
  //       const decibelValue = this.getCurrentDecibel();
  //       console.log("decibelValue: ", decibelValue);
  //     }, 1000);
  //   }
}

export default MicrophoneServices.getInstance();
