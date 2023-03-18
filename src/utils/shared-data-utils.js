import * as core from "./core";
import store from "store";

import { ROBOT_DATA_RECV_SIGN } from "../js/constants";

const PATTERN_WAIT_RESULT = ">>> ";
const PATTERN_OK_RESULT = "OK";
const PATTERN_FIRMWARE_RESULT = ROBOT_DATA_RECV_SIGN + "prd/";

let $isNew = false;
let $recvData = "";
let $recvDataBatch = "";
let $needDecode = false;

let $isReadySign = false;
let $isOKSign = false;

let $matrixData = [];
let $field_matrix_image = null;

let $isAskFwInforFlag = false;
let $tAskFwInforTimeOut = 0;
let $firmwareInfor = false;

// DONT DO ANYTHING SLOW IN THIS FUNCTION
export function udpateDataFromDevice(data, needDecode = false) {
  if (needDecode) {
    data = new TextDecoder("utf-8").decode(data);
    $needDecode = false;
  }

  // Corrupted INF message
  if (data[0] == ROBOT_DATA_RECV_SIGN) {
    if (data.substr(1).indexOf(ROBOT_DATA_RECV_SIGN) == -1) {
      // Corrupted INF message
      $recvData = data;
      return;
    } else {
      $recvData = data;
    }
  } else if (data.indexOf(ROBOT_DATA_RECV_SIGN) != -1) {
    // Receive second part of corrupted INF message
    $recvData += data;
  } else {
    $recvData = data;
  }

  if ($recvDataBatch.length < 500) {
    $recvDataBatch += data;
  } else {
    $recvDataBatch = data;
  }

  $needDecode = false;
  $isNew = true;
  const evt = new Event("newdata", { bubbles: true, cancelable: false });
  document.dispatchEvent(evt);
}
export function fetchNewDataBatchFromDevice() {
  return $recvDataBatch;
}

export function clearDataBatchFromDevice() {
  $recvDataBatch = "";
}

export function fetchNewDataFromDevice() {
  if ($isNew) {
    $isNew = false;
    console.log($recvData);
    checkDataResult();
  }
  return $recvData;
}

function checkDataResult() {
  const data = $recvData;
  try {
    if (data === undefined || data.length == 0) return;

    if (!$isReadySign && data.indexOf(PATTERN_WAIT_RESULT) >= 0) $isReadySign = true;

    if (!$isOKSign && data.indexOf(PATTERN_OK_RESULT) >= 0) $isOKSign = true;

    if (!$firmwareInfor && performance.now() - $tAskFwInforTimeOut < 5000 && data.indexOf(PATTERN_FIRMWARE_RESULT) >= 0)
      parseFwInfor(data);
  } catch (err) {}
}

export function beginCheckWaitResult() {
  $isReadySign = false;
}
export function beginCheckOKResult() {
  $isOKSign = false;
}
export function isReadyResult() {
  return $isReadySign;
}
export function isOKResult() {
  return $isOKSign;
}

export function setLedMatrixData(data) {
  $matrixData = data;
}
export function getLedMatrixData() {
  return $matrixData;
}

export function setFieldMatrixImage(this_field) {
  $field_matrix_image = this_field;
}
export function getFieldMatrixImage() {
  return $field_matrix_image;
}

//Firmware infor
export function beginCheckFwInforResult() {
  $tAskFwInforTimeOut = performance.now();
}
export function setAskFirmwareInforFlag(val = true) {
  const no_remind = store.get("noremind-upgrade-firmware");
  if (no_remind === true && val == true) {
    return;
  }
  $isAskFwInforFlag = val;
}
export function getAskFirmwareInforFlag() {
  return $isAskFwInforFlag;
}
function parseFwInfor(data) {
  $tAskFwInforTimeOut = -2000;
  const p1 = data.indexOf(PATTERN_FIRMWARE_RESULT) + PATTERN_FIRMWARE_RESULT.length;
  const p2 = data.indexOf("/" + ROBOT_DATA_RECV_SIGN, p1);
  $firmwareInfor = data.substring(p1 - 1, p2 + 1);
  //console.log($firmwareInfor);
  const fw_infor = $firmwareInfor.split("/");
  if (fw_infor.length > 2) {
    const productName = fw_infor[1];
    // console.log(productName);
    const productVersion = fw_infor[2];
    // console.log(productVersion);
    core.checkFwVersionOnCloud(productName, productVersion);
  }
}
