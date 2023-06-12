import { f7 } from "framework7-react";
import { exportFileToPc } from "../utils/core";
import dialog from "../components/molecules/dialog/dialog";
import { saveProject } from "../utils/cordova-file-utils";

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

async function saveFile(filePath, content, option = null) {
  let name = "";
  if (option === null) {
    name = JSON.parse(content).name;
    option = { ext: "edl" };
  } else {
    name = option.name || "";
  }

  if (f7.device.electron) {
    try {
      option.filters = [{ name: option.ext.toUpperCase(), extensions: [option.ext] }];
      option.defaultPath = name;
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
    exportFileToPc(content, name, option.ext);
    return;
  } else if (f7.device.android) {
    try {
      const savedPath = await saveProject(name || "EDL", filePath, content);
      dialog.alert("Lưu thành công", `Lưu file thành công tại ${savedPath}`, () => {});
      return;
    } catch (err) {
      console.log("Save file error", err);
      dialog.alert(
        "Lỗi không thể lưu",
        "File đang mở trong một chương trình khác hoặc không có quyền truy cập.",
        () => {}
      );
    }
  }
}

export { openFile, saveFile };
