import { f7 } from "framework7-react";
import { exportFileToPc } from "../utils/core";

function openFile(
  filePath,
  option = {
    filters: [{ name: "EDL", extensions: ["edl"] }],
  }
) {
  if (f7.device.electron) {
    return window.fileApi.open(filePath, option);
  }
}

function saveFile(
  filePath,
  content,
  option = {
    filters: [{ name: "EDL", extensions: ["edl"] }],
    defaultPath: JSON.parse(content).name,
  }
) {
  console.log("saveFile", filePath, option);
  if (f7.device.electron) {
    return window.fileApi.save(filePath, content, option);
  } else if (f7.device.desktop) {
    exportFileToPc(content, JSON.parse(content).name, {
      EXT: ".edl",
      TYPE: "text/json",
    });
    return;
  }
}

export { openFile, saveFile };
