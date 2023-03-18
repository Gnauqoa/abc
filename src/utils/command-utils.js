import * as WebSerialUtil from "./webserial-utils";
import * as BluetoothUtil from "./bluetooth-utils";
import * as sharedDataUtils from "./shared-data-utils";
import * as core from "./core";
import dialog from "../components/dialog";

import {
  YOLOBIT,
  XBOT,
  XBUILD,
  LIMIT_BYTE_BLE,
  CMD_CTRL_A,
  CMD_CTRL_B,
  CMD_CTRL_C,
  CMD_CTRL_D,
  CMD_REPL_BEGIN_PREFIX,
  CMD_REPL_END_PREFIX,
  CMD_REPL_EXEC_CMD,
} from "../js/constants";
import logger from "../services/logger-service";

import { CONNECT_BLE_TYPE, CONNECT_SERIAL_TYPE } from "../js/constants";

let $connectionType = CONNECT_BLE_TYPE;
let $bufferSize = 75;

export function setConnectType(connectType = CONNECT_BLE_TYPE) {
  $connectionType = connectType;
  if ($connectionType == CONNECT_SERIAL_TYPE) {
    $bufferSize = 150;
  } else {
    $bufferSize = 75;
  }
}

export function changeFwDeviceName(deviceName) {
  core.updateConnectedDeviceNameHistory(deviceName);
  const code = `device_config['device_name'] = '${deviceName}'\rsave_config()\rmachine.reset()\r`;
  execReplCode(code, true, true, true, true);
}

export function sendCommandToDevice(data, isTerminal = false) {
  try {
    switch ($connectionType) {
      case CONNECT_BLE_TYPE:
        return BluetoothUtil.sendCommandToDevice(data, isTerminal);
      case CONNECT_SERIAL_TYPE:
        return WebSerialUtil.sendCommandToDevice(data);
    }
  } catch (err) {
    logger.error("sendCommandToDevice error", err);
    throw new Error("sendCommandToDevice error");
  }
}

export async function sendTerminalData(data) {
  try {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    if ($connectionType == CONNECT_BLE_TYPE) {
      let mergedArray = new Uint8Array(encodedData.length + 1);
      mergedArray.set(Uint8Array.of(CMD_REPL_BEGIN_PREFIX));
      mergedArray.set(encodedData, 1);

      let begin = 0;
      const length = mergedArray.length;
      while (begin < length) {
        let end = begin + LIMIT_BYTE_BLE / 2;
        if (end > length) end = length;
        await sendCommandToDevice(mergedArray.subarray(begin, end), true);
        begin = end;
      }
      return;
    }
    return sendCommandToDevice(encodedData);
  } catch (err) {
    logger.error("sendTerminalData error", err);
    throw new Error("sendTerminalData error");
  }
}

//DONT REMOVE|CHANGE THIS CODE
//This space is a special char, it includes 2 byte codes:  194, 160, NOT 32 in normal
function replaceWhiteSpaceSpecial(code) {
  return code.replace(" ", " ");
}

async function sendCodeToDevice(code) {
  logger.log("sendCodeToDevice", code);
  const encoder = new TextEncoder();
  const encodedCode = encoder.encode(code);
  await sendCommandToDevice(encodedCode);
}

export async function removeAllFiles() {
  logger.log("removeAllFiles", "===== Delete all files on device");

  sharedDataUtils.clearDataBatchFromDevice();
  await sendBeginReplMode();
  await sendStopRepl();
  await sendEnterRawRepl();
  await waitForStr(">", 1000, false); // not check traceback due to keyboard interrupt traceback log after stopping current code
  let cmd = `l = [ f for f in os.listdir() if (f.endswith(".py") or f.endswith(".mpy")) and f != "boot.py"]
for f in l:
  os.remove(f)\r`;
  await sendCodeToDevice(cmd);
  await sendExecuteRawRepl();
  await waitForStr("OK", 2000);
  await waitForStr(">", 2000);
  await sendExitRawRepl();
  await sendEndReplMode();
  return;
}

export async function sendCodeToFileDevice(code, fileName) {
  code = replaceWhiteSpaceSpecial(code);
  if (!fileName) return;
  logger.log("sendCodeToFileDevice", "===== Write file to device: " + fileName);

  for (var i = 0; i < 3; i++) {
    // try to write file 3 times
    try {
      sharedDataUtils.clearDataBatchFromDevice();
      await sendBeginReplMode();
      await sendStopRepl();
      await sendEnterRawRepl();
      await waitForStr(">", 1000, false); // not check traceback due to keyboard interrupt traceback log after stopping current code
      let cmd = `file = open("${fileName}", "w")\r`;
      await sendCodeToDevice(cmd);
      await sendExecuteRawRepl();
      await waitForStr("OK", 1000);
      cmd = "";
      let t0 = performance.now();
      for (let i = 0; i < code.length; i = i + $bufferSize) {
        if (performance.now() - t0 >= 8000) {
          // Renew REPL mode for large files which need more than 10s to write
          await sendEndReplMode();
          core.sleep(50);
          await sendBeginReplMode();
          t0 = performance.now();
        }
        let data = code.substring(i, i + $bufferSize);
        data = data.replace(/\r\n/g, "\r");
        data = data.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, "\\r").replace(/\n/g, "\\n");
        cmd = `file.write("${data}")\r`;
        await sendCodeToDevice(cmd);
        await sendExecuteRawRepl();
        await waitForStr("OK", 1000);
      }
      cmd = "file.close()\r";
      await sendCodeToDevice(cmd);
      await sendExecuteRawRepl();
      await waitForStr("OK", 1000);
      await sendExitRawRepl();
      await sendEndReplMode();
      return;
    } catch (err) {
      logger.error("sendCodeToFileDevice error", err);
    }
  }
  throw new Error("sendCodeToFileDevice error");
}

export async function sendBinaryFileToDevice(bytes, fileName) {
  if (!fileName) return;
  logger.log("sendBinaryFile", "===== Write binary file to device: " + fileName);

  let success = false;

  for (var i = 0; i < 5; i++) {
    // try to write file 5 times
    try {
      sharedDataUtils.clearDataBatchFromDevice();
      await sendBeginReplMode();
      await sendStopRepl();
      await sendEnterRawRepl();
      await waitForStr(">", 1000, false); // not check traceback due to keyboard interrupt traceback log after stopping current code
      let cmd = `file = open("${fileName}", "wb")\r`;
      await sendCodeToDevice(cmd);
      await sendExecuteRawRepl();
      await waitForStr("OK", 3000);
      cmd = "";
      let t0 = performance.now();
      let $buffLen = 30;
      for (let i = 0; i < bytes.length; i = i + $buffLen) {
        if (performance.now() - t0 >= 8000) {
          // Renew REPL mode for large files which need more than 10s to write
          await sendEndReplMode();
          core.sleep(50);
          await sendBeginReplMode();
          t0 = performance.now();
        }
        let data = bytes.slice(i, i + $buffLen);
        let s = "";
        for (let j = 0; j < data.length; j++) {
          if (j != data.length - 1) s += "" + data[j] + ",";
          else s += "" + data[j];
        }

        cmd = "file.write(bytes([" + s + "]))\r\r\r";
        await sendCodeToDevice(cmd);
        sharedDataUtils.clearDataBatchFromDevice();
        await sendExecuteRawRepl();
        await waitForStr("OK", 3000);
      }
      success = true;
    } catch (err) {
      logger.error("sendCodeToFileDevice error", err);
    } finally {
      //await sendStopRepl();
      await sendCodeToDevice("file.close()\r\r");
      await sendExecuteRawRepl();
      await waitForStr("OK", 1000);
      await sendExitRawRepl();
      await sendEndReplMode();
      if (success) return;
    }
  }
  throw new Error("sendCodeToFileDevice error");
}

export async function sendStopRepl() {
  try {
    sharedDataUtils.beginCheckWaitResult();
    sharedDataUtils.beginCheckOKResult();
    await sendCommandToDevice(Uint8Array.of(CMD_CTRL_C));
    await core.sleep(100);
    if (!sharedDataUtils.isReadyResult()) {
      console.log("sendStop 2nd after 100ms");
      await sendCommandToDevice(Uint8Array.of(CMD_CTRL_C));
      const t0 = performance.now();
      while (!sharedDataUtils.isReadyResult() && performance.now() - t0 < 500) {}
      if (!sharedDataUtils.isReadyResult()) {
        console.log("sendStop 3rd after 500ms");
        await sendCommandToDevice(Uint8Array.of(CMD_CTRL_C));
      }
      //await sendCommandToDevice(Uint8Array.of(CMD_CTRL_B));
    }
    if (sharedDataUtils.getAskFirmwareInforFlag()) {
      sharedDataUtils.setAskFirmwareInforFlag(false);
      sharedDataUtils.beginCheckFwInforResult();
      //send command to ask firmware infor
      await sendCommandToDevice(Uint8Array.from([0x11, 0]));
    }
  } catch (err) {
    logger.error("sendStopRepl error", err);
    throw new Error("sendStopRepl error");
  }
}

export function sendEnterRawRepl() {
  try {
    return sendCommandToDevice(Uint8Array.of(CMD_CTRL_A));
  } catch (err) {
    logger.error("sendEnterRawRepl error", err);
    throw new Error("sendEnterRawRepl error");
  }
}

export function sendExecuteRawRepl() {
  try {
    return sendCommandToDevice(Uint8Array.of(CMD_CTRL_D));
  } catch (err) {
    logger.error("sendExecuteRawRepl error", err);
    throw new Error("sendExecuteRawRepl error");
  }
}

export function sendExecuteRepl() {
  try {
    return sendCommandToDevice(Uint8Array.of(CMD_REPL_EXEC_CMD));
  } catch (err) {
    logger.error("sendExecuteRepl error", err);
    throw new Error("sendExecuteRepl error");
  }
}

export function sendExitRawRepl() {
  try {
    return sendCommandToDevice(Uint8Array.of(CMD_CTRL_B));
  } catch (err) {
    logger.error("sendExitRawRepl error", err);
    throw new Error("sendExitRawRepl error");
  }
}

export function sendBeginReplMode() {
  try {
    return sendCommandToDevice(Uint8Array.of(CMD_REPL_BEGIN_PREFIX));
  } catch (err) {
    logger.error("sendBeginReplMode error", err);
    throw new Error("sendBeginReplMode error");
  }
}

export function sendEndReplMode() {
  try {
    return sendCommandToDevice(Uint8Array.of(CMD_REPL_END_PREFIX));
  } catch (err) {
    logger.error("sendEndReplMode error", err);
    throw new Error("sendEndReplMode error");
  }
}

export async function execSystemCommand(commands) {
  logger.log("execSystemCommand", commands);
  try {
    await sendCommandToDevice(Uint8Array.from(commands));
  } catch (err) {
    logger.error("execSystemCommand error", err);
    throw new Error("execSystemCommand error");
  }
}

export async function execCommand(command, ignoreCmdStop) {
  command = replaceWhiteSpaceSpecial(command);
  logger.log("execCommand", command);
  try {
    if (!ignoreCmdStop) {
      await sendStopRepl();
    }

    const encoder = new TextEncoder();
    const encodedAll = encoder.encode(`${command}\r`);
    if (encodedAll.length > LIMIT_BYTE_BLE) {
      const chunkSize = Math.round(command.length / Math.ceil(encodedAll.length / LIMIT_BYTE_BLE));
      const chunks = command.match(new RegExp(".{1," + chunkSize + "}", "g"));
      for (const item of chunks) {
        await sendCommandToDevice(encoder.encode(item));
      }
      await sendCommandToDevice(encoder.encode("\r"));
    } else {
      await sendCommandToDevice(encoder.encode(`${command}\r`));
    }
  } catch (err) {
    logger.error("execCommand error", err);
    throw new Error("execCommand error");
  }
}

export async function execCode(code, ignoreCmdStop) {
  try {
    code = replaceWhiteSpaceSpecial(code);
    if ([XBOT, XBUILD].includes(core.selectedDevice()))
      return await execReplCode(code, !ignoreCmdStop, true, true, true);

    logger.log("execCode", code);

    if (!ignoreCmdStop) {
      await sendStopRepl();
    }

    if ([XBOT, XBUILD].includes(core.selectedDevice())) {
      logger.log("Send system command - Start of code");
      await sendBeginReplMode();
    }

    const encoder = new TextEncoder();

    if (code.split("\n").length === 1) {
      // Code has 1 line only
      await sendCommandToDevice(encoder.encode(`${code}\r`));
      return;
    }

    sharedDataUtils.clearDataBatchFromDevice();

    await sendEnterRawRepl();

    code = code.replace(/\r\n/g, "\r").replace(/\n/g, "\r");
    for (let i = 0; i < code.length; i = i + $bufferSize) {
      let data = code.substring(i, i + $bufferSize);
      await sendCodeToDevice(data);
      core.sleep(50);
    }

    await sendExecuteRawRepl();
    await waitForStr("OK", 1000);

    await sendExitRawRepl();

    if ([XBOT, XBUILD].includes(core.selectedDevice())) {
      logger.log("Send system command - End of code");
      await sendEndReplMode();
    }
  } catch (err) {
    logger.error("execCode error", err);
    throw new Error("execCode error");
  }
}

export async function execReplCode(
  code,
  isStopFirst = true,
  isRawMode = false,
  isBeginReplMode = true,
  isEndReplMode = true
) {
  try {
    console.log("execReplCode:", code);
    sharedDataUtils.clearDataBatchFromDevice();
    if (isBeginReplMode) {
      //logger.log("sendBeginReplMode");
      await sendBeginReplMode();
    }

    if (isStopFirst) {
      //logger.log("sendStopRepl");
      await sendStopRepl();
    }

    if (isRawMode) {
      //logger.log("sendEnterRawRepl");
      sharedDataUtils.clearDataBatchFromDevice();
      await sendEnterRawRepl();
      await waitForStr("REPL", 3000, false);
    }

    code = code.replace(/\r\n/g, "\r").replace(/\n/g, "\r");
    for (let i = 0; i < code.length; i = i + $bufferSize) {
      let data = code.substring(i, i + $bufferSize);
      await sendCodeToDevice(data);
      core.sleep(50);
    }

    if (isRawMode) {
      //logger.log("sendExecuteRawRepl");
      await sendExecuteRawRepl();
      await waitForStr("OK", 3000);
    } else {
      //logger.log("sendExecuteRepl");
      await sendExecuteRepl();
    }

    if (isRawMode) {
      //logger.log("sendExitRawRepl");
      await sendExitRawRepl();
    }

    if (isEndReplMode) {
      //logger.log("sendEndReplMode");
      await sendEndReplMode();
    }
  } catch (err) {
    console.log("execReplCode error", err);
    if (err.includes("Traceback received")) {
      dialog.alert(
        "Đã phát sinh lỗi khi chạy chương trình",
        "Bạn hãy kiểm tra lại hoặc xem chi tiết lỗi trong menu <b>Cài đặt > Nhập lệnh</b>",
        () => {}
      );
    } else {
      throw new Error("execReplCode error");
    }
  }
}

export async function stopCode() {
  try {
    if (core.selectedDevice() === YOLOBIT) {
      await sendStopRepl();
      await core.sleep(100);
      const codeStop = "exec('try: stop_all()\\nexcept: pass')";
      return await execReplCode(codeStop, true, false, true, true, true);
    } else if ([XBOT, XBUILD].includes(core.selectedDevice())) {
      await sendBeginReplMode();
      await core.sleep(100);
      await sendStopRepl();
      await core.sleep(100);
      const codeStop = "robot.stop_all()";
      return await execReplCode(codeStop, true, true, true, true, true);
    } else {
      const codeStop = `\x03\rstop()\r`;
      return execCode(codeStop, false);
    }
  } catch (err) {
    logger.error("stopCode error", err);
    throw new Error("stopCode error");
  }
}

export async function sendText(text) {
  logger.log("sendText", text);
  try {
    const encoder = new TextEncoder();
    await sendCommandToDevice(encoder.encode(text));
  } catch (err) {
    logger.error("Send text error", err);
    throw new Error("Send text error");
  }
}

export async function waitForStr(str, timeout, checkTraceback = true) {
  return new Promise((resolve, reject) => {
    var check = () => {
      const data = sharedDataUtils.fetchNewDataBatchFromDevice();
      if (checkTraceback && data.indexOf("Traceback") > -1) {
        sharedDataUtils.clearDataBatchFromDevice();
        logger.error("waitForStr", "Device traceback received: " + data);
        reject("Traceback received: " + data);
      } else if (data.indexOf(str) > -1) {
        sharedDataUtils.clearDataBatchFromDevice();
        resolve();
      } else if ((timeout -= 1) < 0) {
        sharedDataUtils.clearDataBatchFromDevice();
        logger.error("waitForStr", "Check for output " + str + " failed");
        reject("Check for device output failed: " + str);
      } else setTimeout(check, 1);
    };
    setTimeout(check, 1);
  });
}
