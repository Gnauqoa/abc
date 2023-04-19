import { f7 } from "framework7-react";
import { exportFileToPc } from "../utils/core";
import dialog from "../components/molecules/dialog/dialog";

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

async function saveFile(
  filePath,
  content,
  option = {
    filters: [{ name: "EDL", extensions: ["edl"] }],
    defaultPath: JSON.parse(content).name,
  }
) {
  if (f7.device.electron) {
    try {
      return await window.fileApi.save(filePath, content, option);
    } catch (err) {
      console.log("Save file error", err);
      dialog.alert(
        "Lỗi không thể lưu",
        "File đang mở trong một chương trình khác hoặc không có quyền truy cập.",
        () => {}
      );
    }
  } else if (f7.device.desktop) {
    exportFileToPc(content, JSON.parse(content).name, {
      EXT: ".edl",
      TYPE: "text/json",
    });
    return;
  }
}

export { openFile, saveFile };
