export class AudioManager {
  constructor() {
    console.log("AudioManager constructor");

    this.initializeVariables();
  }

  initializeVariables() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;

    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
  }

  /**
   * Returns the instance of the AudioManager class.
   * @returns {AudioManager} - The instance of the AudioManager class.
   */
  static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  getTimeDomainData() {
    this.analyser.getByteTimeDomainData(this.dataArray);
    const data = [];
    for (let i = 0; i < this.bufferLength; i++) {
      const v = this.dataArray[i] / 128.0;
      const y = (v * 3) / 2;
      data.push(y);
    }
    return data;
  }
}

export default AudioManager.getInstance();
