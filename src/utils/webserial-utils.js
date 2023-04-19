import { f7 } from "framework7-react";
import dialog from "../components/molecules/dialog/dialog";
import * as sharedDataUtils from "./shared-data-utils";
import store from "store";

let webserial = {};

(function () {
  "use strict";

  webserial.port = undefined;
  webserial.reader = undefined;
  webserial.message = "";

  //outer function use this lib should declare first these functions
  //webserial.onConnectSuccess = function
  //webserial.onDisconnect = function
  //webserial.onReceive = function

  let textEncoder = new TextEncoder();
  let reader = undefined;
  let inputDone = undefined;

  let keepReading = true;

  let __waitForStr = (str, timeout, clear = true) =>
    new Promise((resolve, reject) => {
      var check = () => {
        if (webserial.message.indexOf(str) > -1) {
          if (clear) webserial.message = "";
          resolve();
        } else if ((timeout -= 10) < 0) {
          reject("timeout");
        } else setTimeout(check, 10);
      };
      setTimeout(check, 10);
    });

  let __delay = (timeout) =>
    new Promise((resolve, reject) => {
      var check = () => {
        if ((timeout -= 10) < 0) {
          resolve();
        } else setTimeout(check, 10);
      };
      setTimeout(check, 10);
    });

  let __readLoop = async function () {
    if (keepReading && webserial.port.readable) {
      // Listen to data coming from the serial device.
      try {
        const { value, done } = await reader.read();
        if (done) {
          // Allow the serial port to be closed later.
          reader.releaseLock();
          return;
        }
        // value is a string.
        //console.log(value);
        webserial.processReceivedData(value);
        setTimeout(__readLoop, 0);
      } catch (error) {
        // Handle error...
        console.log(error);
        reader.releaseLock();
        webserial.disconnect();
      }
    }
  };

  /**
   * Sets |port| to the currently selected port. If none is selected then the
   * user is prompted for one.
   */
  webserial.getSelectedPort = async function (auto = false) {
    if (!navigator.serial) {
      dialog.alert(
        "Lỗi kết nối",
        "Trình duyệt hiện tại không hỗ trợ kết nối Serial. Vui lòng sử dụng trình duyệt Chrome phiên bản mới nhất.",
        () => {}
      );
      return;
    }

    if (auto) {
      const ports = await navigator.serial.getPorts();
      if (ports !== null && Array.isArray(ports) && ports.length > 0) {
        console.log(ports);
        webserial.port = ports[0];
      }
    }
    if (webserial.port) return Promise.resolve();

    try {
      webserial.port = await navigator.serial.requestPort({});
    } catch (e) {
      console.log(e);
      return Promise.reject();
    }
  };

  /**
   * Initiates a connection to the selected port.
   */
  webserial.connect = async function (auto = false, stopCode = true) {
    await this.getSelectedPort(auto);

    if (!webserial.port) {
      return Promise.reject();
    }

    const options = {
      baudRate: 115200,
      dataBits: 8,
      parity: "none",
      stopBits: 1,
      flowControl: "none",

      // Prior to Chrome 86 these names were used.
      baudrate: 115200,
      databits: 8,
      stopbits: 1,
      rtscts: "none",
    };

    return webserial.port.open(options).then(
      async () => {
        let decoder = new TextDecoderStream();
        inputDone = webserial.port.readable.pipeTo(decoder.writable);
        reader = decoder.readable.getReader();

        keepReading = true;
        __readLoop();

        if (stopCode) {
          // send Ctrl+C twice to interrupt any running program
          let commands = new Uint8Array(1);
          commands[0] = 0x03;
          await webserial.send(commands);
          // send Ctrl+B to exit raw mode if any
          commands[0] = 0x02;
          await webserial.send(commands);
          console.log("Sent ctrl B");

          await __waitForStr(">", 2000).catch(() => {
            return Promise.reject("Connect timeout");
          });
        }

        if (webserial.onConnectSuccess) {
          webserial.onConnectSuccess();
        }

        return Promise.resolve();
      },
      (error) => {
        console.log("Cannot connect to device. Maybe it is being used by other app");
        console.log(error);
        webserial.disconnect();
        dialog.alert(
          "Lỗi kết nối",
          "Không thể kết nối đến cổng thiết bị này, có thể cổng này đã được sử dụng bởi ứng dụng khác!",
          () => {}
        );
        throw new Error(error);
      }
    );
  };

  /**
   * Closes the currently active connection.
   */
  webserial.disconnect = async function () {
    keepReading = false;

    if (reader) {
      await reader.cancel().catch(() => {}); // ignore error
      await inputDone.catch(() => {}); // ignore error
      reader = null;
      inputDone = null;
    }

    if (webserial.port) {
      console.log("Closing port");
      await webserial.port.close().catch(() => {}); // ignore error;
      webserial.port = null;
    }

    webserial.processReceivedDataError("device disconnected");

    if (webserial.onDisconnect) {
      webserial.onDisconnect();
    }
  };

  webserial.send = async function (data) {
    const writer = webserial.port.writable.getWriter();
    await writer.write(data);

    // Allow the serial port to be closed later.
    writer.releaseLock();
  };

  webserial.sendFile = async function (fileContent, fileName = "main.py", reset = true) {
    if (this.port == undefined) {
      throw new Error("Board not connected");
    }

    // send Ctrl+C twice to interrupt any running program
    let commands = new Uint8Array(1);
    commands[0] = 0x03;
    await this.send(commands);
    await this.send(commands);

    await __waitForStr(">", 2000);

    // send Ctrl+A to enter raw REPL mode
    commands[0] = 0x01;
    await this.send(commands);
    //await __waitForStr('raw REPL; CTRL-B to exit', 2000);

    let codeLines = fileContent.split("\n");

    await this.send(textEncoder.encode("f = open('" + fileName + "', 'w')\r\n"));
    commands[0] = 0x04;
    await this.send(commands); //await __waitForStr('OK', 1000);
    await __delay(100);

    let codeString = "";

    for (let lineNo = 0; lineNo < codeLines.length; lineNo++) {
      // send command to write each code line
      // replace \n\r character in code
      if (codeLines[lineNo].endsWith("\r") || codeLines[lineNo].endsWith("\n")) {
        codeLines[lineNo] = codeLines[lineNo].slice(0, -1);
      }

      if (codeLines[lineNo].endsWith("\r") || codeLines[lineNo].endsWith("\n")) {
        codeLines[lineNo] = codeLines[lineNo].slice(0, -1);
      }

      // escape special characters like " or \n or \r
      var escapedCode = codeLines[lineNo].replace(/[\\]/g, "\\\\").replace(/["]/g, '\\"');

      codeString += 'f.write("' + escapedCode + '\\n")\r\n';

      if (codeString.length > 100 || lineNo === codeLines.length - 1) {
        await this.send(textEncoder.encode(codeString));
        commands[0] = 0x04;
        await this.send(commands); //await __waitForStr('OK', 2000);
        await __delay(50);
        codeString = "";
      }
    }

    // save file and execute code
    await this.send(textEncoder.encode("f.close()\r\n"));
    commands[0] = 0x04;
    await this.send(commands); //await __waitForStr('OK', 1000);

    // send Ctrl+B to exit raw REPL mode
    commands[0] = 0x02;
    await this.send(commands);
    await __delay(100);

    //await __waitForStr('>', 1000);

    if (reset) {
      // send Ctrl+D to soft reset
      commands[0] = 0x04;
      await this.send(commands);
      await __delay(100);

      //await __waitForStr('reboot', 3000, false);

      //check if code got error
      await __waitForStr("Trace", 500).then(
        () => {
          return Promise.reject("Code error to run");
        },
        (error) => {
          return Promise.resolve();
        }
      );
    } else {
      return Promise.resolve();
    }
    return;
  };

  webserial.processReceivedData = function (data) {
    if (webserial.onReceive) {
      webserial.onReceive(data);
    }
    webserial.message += data;

    if (webserial.message.length > 2000) {
      // reset when message buffer too large
      webserial.message = "";
    }
  };

  webserial.processReceivedDataError = function (error) {
    if (webserial.onReceiveError) {
      webserial.onReceiveError(error);
    }
  };

  if (navigator.serial) {
    navigator.serial.addEventListener("connect", (event) => {
      // TODO: Automatically open event.target or warn user a port is available.
      store.set("serial-connected", true);
      console.log("device connected");
    });

    navigator.serial.addEventListener("disconnect", (event) => {
      // TODO: Remove |event.target| from the UI.
      // If the serial port was opened, a stream error would be observed as well.
      store.set("serial-connected", false);
      console.log("device disconnected");
      webserial.disconnect();
    });
  }
})();

export async function scanPorts(success, disconnect, auto = false, stopCode = true) {
  webserial.onConnectSuccess = success;
  webserial.onDisconnect = disconnect;
  webserial.onReceive = (data) => {
    sharedDataUtils.udpateDataFromDevice(data);
  };
  try {
    await webserial.connect(auto, stopCode);
  } catch (err) {
    console.log("webserialscanPorts", err);
  }
}

export async function disconnect() {
  try {
    await webserial.disconnect();
  } catch (err) {
    console.log("webserialdisconnect", err);
  }
}

export async function sendCommandToDevice(data) {
  try {
    await webserial.send(data);
  } catch (err) {
    console.log("webserialsendCommandToDevice", err);
  }
}

export async function sendFile(fileContent, fileName = "main.py", reset = true) {
  try {
    await webserial.sendFile(fileContent, fileName, reset);
  } catch (err) {
    console.log("webserialsendCommandToDevice", err);
  }
}
