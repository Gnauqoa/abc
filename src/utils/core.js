import store from "store";
import $ from "jquery";
import { f7 } from "framework7-react";
import dialog from "../components/dialog";

import {
  ARMBOT,
  MYPET,
  BATMAN,
  YOLOBIT,
  TANK,
  XBOT,
  XBUILD,
  TRANSFORMBOT,
  SPIDERBOT,
  ROBOTWALLE,
  CONTROLLERHANDLE,
  MYROBOT,
  ENTER_KEY,
  SPACE_KEY,
  CONNECT_BLE_TYPE,
} from "../js/constants";

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
  if (selectedDevice() !== ARMBOT) {
    console.log("vibrate");
    navigator.vibrate(milliseconds);
  }
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
  return exportFileToPc(data, filename, FORMAT_MAP.JSON);
}

export const FORMAT_MAP = {
  JSON: {
    EXT: ".json",
    TYPE: "text/json",
  },
  CSV: {
    EXT: ".csv",
    TYPE: "text/csv;charset=utf-8;",
  },
};

export function exportFileToPc(data, filename, format) {
  if (!data) {
    console.error("No data");
    return;
  }

  if (!format) {
    format = FORMAT_MAP.JSON;
  }

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

export function isPressEnter(e, callback) {
  const charCode = keyCodeFromEvent(e);
  if (charCode === ENTER_KEY) {
    e.preventDefault();
    if (callback) callback();
    return true;
  }
  return false;
}

export function getDeviceName(id) {
  switch (id) {
    case ARMBOT:
      return "ArmBot";
    case MYPET:
      return "PetBot";
    case BATMAN:
      return "BatmanBot";
    case YOLOBIT:
      return "Yolo:Bit";
    case TANK:
      return "TankBot";
    case XBOT:
      return "xBot";
    case XBUILD:
      return "xBuild";
    case TRANSFORMBOT:
      return "TransformBot";
    case SPIDERBOT:
      return "SpiderBot";
    case ROBOTWALLE:
      return "Robot Wall-E";
    case CONTROLLERHANDLE:
      return "Tay cầm điều khiển";
    case MYROBOT:
      return "My Robot";
    default:
      return id;
  }
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

export function showWinAnimation() {
  $(".win-notification-xbot").addClass("win-animation-xbot");
  setTimeout(function () {
    $(".win-notification-xbot").removeClass("win-animation-xbot");
  }, 3000);
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

export function getLandingPage() {
  let landingPage = "";
  const selectedDev = selectedDevice();
  const url = location.href;
  if (url.includes("/#!/share/")) {
    const params = url.split("/");
    const sharedId = params[params.length - 1];
    const device = params[params.length - 2];
    landingPage = `/share/${device}/${sharedId}`;
  } else if (store.get("active-menu") === "iot-panels") {
    landingPage = "/iot-panels";
  } else if (
    store.get("active-menu") !== "devices" ||
    !selectedDev ||
    [CONTROLLERHANDLE, MYROBOT].includes(selectedDev) ||
    ![ARMBOT, MYPET, BATMAN, YOLOBIT, TANK, XBOT, XBUILD, TRANSFORMBOT, SPIDERBOT, ROBOTWALLE].includes(selectedDev)
  ) {
    landingPage = "/landing";
  } else {
    landingPage = `/devices/${selectedDev}`;
  }

  return landingPage;
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
  for (let i = 0; i < rows.length; i++) {
    csvFile += processRow(rows[i]);
  }

  const blob = new Blob([csvFile], { type: "text/csv;charset=utf-8;" });
  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, filename);
  } else {
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      console.log("url: ", url);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      //   document.body.removeChild(link);
    }
  }
}
