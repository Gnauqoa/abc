import i18next from "i18next";
import store from "store";
import { f7 } from "framework7-react";
import moment from "moment";
import $ from "jquery";
import dialog from "../components/molecules/dialog/dialog";

import { utils, write } from "xlsx";
import { ENTER_KEY, SPACE_KEY, CONNECT_BLE_TYPE, DEFAULT_SENSOR_DATA } from "../js/constants";
import { exportDataRun } from "./cordova-file-utils";

let deviceHistory = [];

export function getTime() {
  return new Date().getTime();
}

export function selectedDevice() {
  return store.get("selected-device");
}

export function getConnectedDeviceId() {
  return store.get(selectedDevice() + "-device-id");
}
export function setConnectedDeviceId(id) {
  store.set(selectedDevice() + "-device-id", id);
}

export function getConnectedDeviceNameFromHistory() {
  const id = getConnectedDeviceId();
  let name = "";
  deviceHistory.forEach((device) => {
    if (device.id == id) {
      name = device.names.slice(-1);
    }
  });
  return name;
}

export function updateConnectedDeviceNameHistory(name, id = null) {
  if (id == null) id = getConnectedDeviceId();
  else setConnectedDeviceId(id);

  let isNew = true;
  let oldDevice = null;
  deviceHistory.forEach((device) => {
    if (device.id == id) {
      oldDevice = device;
      device.names.forEach((nameit) => {
        if (name == nameit) {
          isNew = false;
        }
      });
    }
  });
  if (isNew) {
    if (oldDevice) {
      oldDevice.names.push(name);
    } else {
      const device = { id: id, names: [name] };
      deviceHistory.push(device);
    }
  }
}

export function getAutoConnectConfig() {
  const auto = store.get("auto-connect-paired-device");
  if (auto) return true;
  return false;
}
export function setAutoConnectConfig(auto) {
  store.set("auto-connect-paired-device", auto);
}
export function getConnectedDeviceType() {
  const type = store.get("connected-device-type");
  if (type) return type;
  return CONNECT_BLE_TYPE;
}
export function setConnectedDeviceType(type) {
  store.set("connected-device-type", type);
}

export function checkFwVersionOnCloud(productName, productVersion) {
  const url = "https://s3.ap-southeast-1.amazonaws.com/fw.ohstem.vn/bin/list.json";

  fetch(url, {
    method: "GET",
    mode: "cors",
    cache: "no-cache",
  })
    .then((res) => res.json())
    .then((data) => {
      // console.log(data);
      let latest_version = "0.0.0";
      for (let i = 0; i < data.length; i++) {
        // console.log(data[i].product_name);
        if (data[i].product_name.toUpperCase() == productName.toUpperCase()) {
          if (data[i].product_version.localeCompare(latest_version) > 0) {
            latest_version = data[i].product_version;
          }
        }
      }
      if (latest_version.localeCompare(productVersion) > 0) {
        console.log("Latest version:", latest_version);
        dialog.askUpgradeFirmware(() => {
          store.set("noremind-upgrade-firmware", true);
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

export function vibrate(milliseconds = 200) {
  navigator.vibrate(milliseconds);
}

export function closest(arr, num) {
  return (
    arr.reduce((acc, val) => {
      if (Math.abs(val - num) < Math.abs(acc)) {
        return val - num;
      } else {
        return acc;
      }
    }, Infinity) + num
  );
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

///////////////////////////////////////////////////////////
////////////         Read S3 file                //////
///////////////////////////////////////////////////////////

export function readS3FileAsync(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => resolve(fileReadAsTextAsync(blob)))
      .catch((error) => {
        reject(error);
      });
  });
}

///////////////////////////////////////////////////////////
////////////         Read file                /////////////
///////////////////////////////////////////////////////////

export function fileReadAsTextAsync(f) {
  if (!f) return Promise.resolve(null);
  else {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onerror = (ev) => resolve(null);
      reader.onload = (ev) => resolve(reader.result);
      reader.readAsText(f);
    });
  }
}

export function fileReadAsBufferAsync(f) {
  // ArrayBuffer
  if (!f) return Promise.resolve(null);
  else {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onerror = (ev) => resolve(null);
      reader.onload = (ev) => resolve(new Uint8Array(reader.result));
      reader.readAsArrayBuffer(f);
    });
  }
}

///////////////////////////////////////////////////////////
////////////     Clean Vietnamese Accents     /////////////
///////////////////////////////////////////////////////////

export function cleanAccents(str) {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  // Combining Diacritical Marks
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // huyền, sắc, hỏi, ngã, nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // mũ â (ê), mũ ă, mũ ơ (ư)

  return str;
}

export function validateXml(xml) {
  const parser = new window.DOMParser();
  const theDom = parser.parseFromString(xml, "application/xml");
  if (theDom.getElementsByTagName("parsererror").length > 0) {
    console.error("XML validation failed");
    return false;
  }

  return true;
}

///////////////////////////////////////////////////////////
////////////              forceReload                //////
///////////////////////////////////////////////////////////

export function forceReload(inSecond = 0) {
  setTimeout(() => {
    if (navigator.onLine) {
      window.location.reload();
    }
  }, inSecond * 1000);
}

export function keyCodeFromEvent(e) {
  return typeof e.which === "number" ? e.which : e.keyCode;
}

export function fireClickOnEnter(e) {
  const charCode = keyCodeFromEvent(e);
  if (charCode === ENTER_KEY || charCode === SPACE_KEY) {
    e.preventDefault();
    e.currentTarget.click();
  }
}

///////////////////////////////////////////////////////////
////////////         Export to PC             /////////////
///////////////////////////////////////////////////////////

export function exportToPc(data, filename) {
  return exportFileToPc(data, filename, "json");
}

export const FORMAT_MAP = {
  json: {
    EXT: ".json",
    TYPE: "application/json",
  },
  csv: {
    EXT: ".csv",
    TYPE: "text/csv;charset=utf-8;",
  },
  xlsx: {
    EXT: ".xlsx",
    TYPE: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  },
  edl: {
    EXT: ".edl",
    TYPE: "application/json",
  },
  txt: {
    EXT: ".txt",
    TYPE: "text/plain",
  },
  log: {
    EXT: ".log",
    TYPE: "text/plain",
  },
};

export function exportFileToPc(data, filename, ext) {
  if (!data) {
    console.error("No data");
    return;
  }

  if (!ext) {
    ext = "json";
  }

  const format = FORMAT_MAP[ext];

  if (!filename) {
    filename = "download";
  }

  filename += format.EXT;

  if (typeof data === "object" && data.constructor === Object) {
    data = JSON.stringify(data);
  }

  const blob = new Blob([data], { type: format.TYPE });

  // FOR IE:

  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(blob, filename);
  } else {
    let e = document.createEvent("MouseEvents"),
      a = document.createElement("a");

    a.download = filename;
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl = [format.TYPE, a.download, a.href].join(":");
    e.initEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    a.dispatchEvent(e);
  }
}

export async function exportFileAndroid(data, filename, ext) {
  const format = FORMAT_MAP[ext];
  const savedPath = await exportDataRun(data, filename, format.EXT, format.TYPE);
  return savedPath;
}

export function isPressEnter(e, callback) {
  const charCode = keyCodeFromEvent(e);
  if (charCode === ENTER_KEY) {
    e.preventDefault();
    if (callback) callback();
    return true;
  }
  return false;
}

export function convertBlobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
}

///////////////////////////////////////////////////////////
////////////  Hanlde file access on mobiles   /////////////
///////////////////////////////////////////////////////////

export function saveBinaryFile(dirEntry, dataObj, fileName) {
  return new Promise((resolve, reject) => {
    dirEntry.getFile(
      fileName,
      { create: true, exclusive: false },
      function (fileEntry) {
        fileEntry.createWriter(function (fileWriter) {
          fileWriter.onwriteend = function () {
            if (f7.device.android) {
              resolve(fileEntry.toURL());
            } else {
              resolve(window.WkWebView.convertFilePath(fileEntry.toURL()));
            }
          };

          fileWriter.onerror = function (e) {
            console.log("Failed file write: " + e.toString());
            reject();
          };

          fileWriter.write(dataObj);
        });
      },
      (error) => {
        console.log("onErrorCreateFile", error);
        reject();
      }
    );
  });
}

export function displayImage(blob) {
  // Displays image if result is a valid DOM string for an image.
  let elem = document.getElementById("imageFile");
  // Note: Use window.URL.revokeObjectURL when finished with image.
  elem.src = window.URL.createObjectURL(blob);
}

export function displayImageByFileURL(fileEntry) {
  let elem = document.getElementById("imageFile");
  elem.src = fileEntry.toURL();
}

export function formatDisplay(value, format, option) {
  let displayFormat = "";
  let prefixFormat = "";
  let subfixFormat = "";
  if (format && !isNaN(parseFloat(value)) && isFinite(value)) {
    value = parseFloat(value);
    if (format.indexOf(".") < 0) {
      value = value.toFixed(0);
      prefixFormat = format.split("#")[0];
      subfixFormat = format.split("#")[1];
      displayFormat = format.replace("#", value);
    } else {
      prefixFormat = format.split(".")[0];
      subfixFormat = format.split(".")[1];
      const decimals = (subfixFormat.match(/#/g) || []).length;
      value = value.toFixed(decimals);
      prefixFormat = prefixFormat.replace(/#/g, "");
      subfixFormat = subfixFormat.replace(/#/g, "");
      displayFormat = prefixFormat + value + subfixFormat;
    }
    displayFormat = displayFormat.replace(/#/g, "");
    if (option === 0) {
      return value;
    } else if (option === -1) {
      return prefixFormat;
    } else if (option === 1) {
      return subfixFormat;
    }
    return displayFormat;
  } else {
    if (option === -1) {
      return "";
    } else if (option === 1) {
      return "";
    } else {
      return value;
    }
  }
}

export function cloneCanvas(oldCanvas) {
  let newCanvas = document.createElement("canvas");
  const context = newCanvas.getContext("2d");

  newCanvas.width = oldCanvas.width > oldCanvas.height ? oldCanvas.height : oldCanvas.width;
  newCanvas.height = newCanvas.width;
  context.drawImage(oldCanvas, 0, 0);

  return newCanvas;
}

export function slug(text) {
  return cleanAccents(text)
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

export function cropTo(image, size = 224, flipped = false) {
  let width = image.width;
  let height = image.height;

  const min = Math.min(width, height);
  const scale = size / min;
  const scaledW = Math.ceil(width * scale);
  const scaledH = Math.ceil(height * scale);

  const dx = scaledW - size;
  const dy = scaledH - size;
  let canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, ~~(dx / 2) * -1, ~~(dy / 2) * -1, scaledW, scaledH);

  // canvas is already sized and cropped to center correctly
  if (flipped) {
    ctx.scale(-1, 1);
    ctx.drawImage(canvas, size * -1, 0);
  }

  return canvas;
}

export function resize(image, scale, canvas) {
  canvas = canvas ?? document.createElement("canvas");
  canvas.width = image.width * scale;
  canvas.height = image.height * scale;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function scrollToElSelector(selector) {
  document.querySelector(selector).scrollIntoView({
    behavior: "auto",
    block: "center",
    inline: "center",
  });
}

export function findGCD(nums) {
  function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
  }

  let result = nums[0];
  for (let i = 1; i < nums.length; i++) {
    result = gcd(result, nums[i]);
  }
  return result;
}

export function getLCM(nums) {
  // Find the LCM using the prime factorization method
  const primes = {};
  nums.forEach((num) => {
    for (let i = 2; i <= num; i++) {
      let count = 0;
      while (num % i === 0) {
        num /= i;
        count++;
      }
      primes[i] = Math.max(primes[i] || 0, count);
    }
  });
  let lcm = 1;
  for (const prime in primes) {
    lcm *= prime ** primes[prime];
  }
  return lcm;
}

export function exportToCSV(filename, rows) {
  const processRow = function (row) {
    let finalVal = "";
    for (let j = 0; j < row.length; j++) {
      let innerValue = row[j] === null ? "" : row[j].toString();
      if (row[j] instanceof Date) {
        innerValue = row[j].toLocaleString();
      }
      let result = innerValue.replace(/"/g, '""');
      if (result.search(/("|,|\n)/g) >= 0) result = '"' + result + '"';
      if (j > 0) finalVal += ",";
      finalVal += result;
    }
    return finalVal + "\n";
  };

  let csvFile = "";
  rows.forEach((row) => {
    csvFile += processRow(row);
  });

  exportFileToPc(csvFile, filename, "csv");
}

export function createExcelWorkbookBuffer({ sheets }) {
  const workbook = utils.book_new();

  sheets.forEach((sheet) => {
    const { sheetName, sheetRows } = sheet;
    const workSheet = utils.aoa_to_sheet(sheetRows);
    utils.book_append_sheet(workbook, workSheet, sheetName);
  });

  const excelBuffer = write(workbook, { bookType: "xlsx", type: "buffer" });
  return excelBuffer;
}

export async function exportDataRunsToExcel({ filePath, fileName, dataRunsInfo }) {
  const fileExt = "xlsx";
  const excelBuffer = createExcelWorkbookBuffer({ sheets: dataRunsInfo });

  if (f7.device.electron) {
    const option = {
      filters: [{ name: "Excel Workbook", extensions: [fileExt] }],
      defaultPath: fileName,
    };
    try {
      return await window.fileApi.save(filePath, excelBuffer, option);
    } catch (error) {
      console.log("Save file error", error);
      dialog.alert(
        i18next.t("utils.unable_to_save_error"),
        i18next.t("utils.the_file_is_open_in_another_program_or_does_not_have_access_permissions"),
        () => {}
      );
    }
  } else if (f7.device.desktop) {
    exportFileToPc(excelBuffer, fileName, fileExt);
    return;
  } else if (f7.device.cordova) {
    try {
      const savedPath = await exportFileAndroid(excelBuffer, fileName, fileExt);
      dialog.alert(
        i18next.t("utils.saved_successfully"),
        `${i18next.t("utils.saved_run_data_successfully_at")} ${savedPath}`,
        () => {}
      );
      return;
    } catch (error) {
      console.log("Save file error", error);
      dialog.alert(
        i18next.t("utils.unable_to_save_error"),
        i18next.t("utils.the_file_is_open_in_another_program_or_does_not_have_access_permissions"),
        () => {}
      );
    }
  }
}

export function getUniqueFileName(fileName, existingFileNames) {
  let newFileName = fileName;
  let counter = 1;

  while (existingFileNames.includes(newFileName)) {
    const matches = newFileName.match(/^(.*) \((\d+)\)$/);
    if (matches) {
      // Increment the counter if the file name already has a number in parentheses
      newFileName = `${matches[1]} (${parseInt(matches[2]) + 1})`;
    } else {
      // Add a number in parentheses to the file name
      newFileName = `${newFileName} (${counter})`;
    }
    counter++;
  }

  return newFileName;
}

export function getCurrentTime() {
  return moment().format("DD-MM-YYYY HH:mm:ss");
}

export function getPageName(listPageName) {
  let newFileName = String(listPageName.length + 1);
  try {
    for (let i = 0; i < listPageName.length; i++) {
      if (!listPageName.includes(newFileName)) break;

      const matches = newFileName.match(/^\d$/);
      if (matches) {
        newFileName = parseInt(matches[0]) + 1;
        newFileName = newFileName.toString();
      } else break;
    }
  } catch (error) {
    console.log("getPageName: ", error);
  }
  return newFileName;
}

export function timeoutEventData(eventName, dataSize = 1, timeout = 3000, hasCancel = false) {
  f7.dialog.preloader(i18next.t("utils.loading") + "...");
  hasCancel &&
    $(".dialog-preloader .dialog-title").html(
      `${i18next.t("utils.loading") + "..."} <span class="edl-cancel-preloader dialog-button">Hủy</span>`
    );
  return new Promise((resolve, reject) => {
    let timeoutHandler;
    let dataBuffer = [];
    function dataHandler(e) {
      dataBuffer.push(e.detail);
      document.dispatchEvent(new CustomEvent(`${eventName}-${dataBuffer.length}`));
      if (dataSize > 1) {
        $(".dialog-preloader .dialog-title").html(
          `${i18next.t("utils.loading")} ${Math.round((dataBuffer.length / dataSize) * 100)}% ${
            hasCancel ? '<span class="edl-cancel-preloader dialog-button">Hủy</span>' : ""
          }`
        );
      }
      if (dataBuffer.length === dataSize) {
        f7.dialog.close();
        clearTimeout(timeoutHandler);
        document.removeEventListener(eventName, dataHandler);
        document.dispatchEvent(new CustomEvent(`${eventName}-done`, { detail: { status: "success", dataBuffer } }));
        resolve(dataSize === 1 ? dataBuffer[0] : dataBuffer);
      }
    }

    $(".edl-cancel-preloader").on("click", () => {
      f7.dialog.close();
      reject("cancel");
    });

    timeoutHandler = setTimeout(() => {
      f7.dialog.close();
      document.removeEventListener(eventName, dataHandler);
      document.dispatchEvent(new CustomEvent(`${eventName}-done`, { detail: { status: "failed", dataBuffer } }));

      reject("timeout");
    }, timeout + 200 * dataSize);

    document.addEventListener(eventName, dataHandler);
  });
}

export function mergeLists(...lists) {
  const mergedList = [];
  const uniqueIds = {};

  lists.forEach((list) => {
    list.forEach((element) => {
      const id = JSON.stringify(element);
      if (!uniqueIds[id]) {
        mergedList.push(element);
        uniqueIds[id] = true;
      }
    });
  });

  return mergedList;
}

export function createSensorInfo(sensor) {
  if (!sensor || sensor.id === undefined || sensor.index === undefined) return false;
  return `${sensor.id}-${sensor.index}`;
}

export function parseSensorInfo(sensorInfo) {
  if (!sensorInfo) return DEFAULT_SENSOR_DATA;
  const [id, index] = sensorInfo.split("-");
  return { id: parseInt(id), index: parseInt(index) };
}

export function createInputIdCustomUnit({ unitId, index }) {
  return `${unitId}_${index}`;
}

export function shareFile(filename, blob) {
  window.requestFileSystem(
    LocalFileSystem.PERSISTENT,
    0,
    function (fs) {
      fs.root.getFile(
        filename,
        { create: true, exclusive: false },
        function (fileEntry) {
          writeFile(fileEntry, blob);
        },
        function (error) {
          dialog.alert(i18next.t("utils.error_reading_data"), error, () => {});
        }
      );
    },
    function (error) {
      dialog.alert(i18next.t("utils.error_reading_data"), error, () => {});
    }
  );
}

function writeFile(fileEntry, blob) {
  fileEntry.createWriter(function (fileWriter) {
    fileWriter.onwriteend = function () {
      readFile(fileEntry);
    };

    fileWriter.onerror = function (error) {
      dialog.alert(i18next.t("utils.error_recording_data"), error, () => {});
    };
    fileWriter.write(blob);
  });
}

function readFile(fileEntry) {
  fileEntry.file(
    function (file) {
      var reader = new FileReader();

      reader.onloadend = function () {
        shareFileCordova(fileEntry.nativeURL);
      };

      reader.readAsText(file);
    },
    function (error) {
      dialog.alert(i18next.t("utils.error_reading_data"), error, () => {});
    }
  );
}

function shareFileCordova(fullPath) {
  console.log(fullPath);
  var options = {
    files: [fullPath],
    chooserTitle: i18next.t("utils.select_application"),
  };
  window.plugins.socialsharing.shareWithOptions(
    options,
    (result) => {
      console.log(result);
    },
    (error) => {
      dialog.alert(i18next.t("utils.sharing_error"), error, () => {});
    }
  );
}

export var getFromBetween = {
  results: [],
  string: "",
  getFromBetween: function (sub1, sub2) {
    if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return false;
    var SP = this.string.indexOf(sub1) + sub1.length;
    var string1 = this.string.substr(0, SP);
    var string2 = this.string.substr(SP);
    var TP = string1.length + string2.indexOf(sub2);
    return this.string.substring(SP, TP);
  },
  removeFromBetween: function (sub1, sub2) {
    if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return false;
    var removal = sub1 + this.getFromBetween(sub1, sub2) + sub2;
    this.string = this.string.replace(removal, "");
  },
  getAllResults: function (sub1, sub2) {
    // first check to see if we do have both substrings
    if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return;

    // find one result
    var result = this.getFromBetween(sub1, sub2);
    // push it to the results array
    this.results.push(result);
    // remove the most recently found one from the string
    this.removeFromBetween(sub1, sub2);

    // if there's more substrings
    if (this.string.indexOf(sub1) > -1 && this.string.indexOf(sub2) > -1) {
      this.getAllResults(sub1, sub2);
    } else return;
  },
  get: function (string, sub1, sub2) {
    this.results = [];
    this.string = string;
    this.getAllResults(sub1, sub2);
    return this.results;
  },
};
