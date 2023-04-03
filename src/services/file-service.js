import { f7 } from "framework7-react";

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
  }
) {
  if (f7.device.electron) {
    return window.fileApi.save(filePath, content, option);
  }
}

export { openFile, saveFile };
