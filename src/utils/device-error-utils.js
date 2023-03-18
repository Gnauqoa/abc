import * as sharedDataUtils from "./shared-data-utils";
import dialog from "../components/dialog";
import { f7 } from "framework7-react";
import * as commandUtils from "./command-utils";
import * as core from "./core";

const ERROR_PATTERNS = [
  /(Traceback \(most recent call last\):\r\n(?:\s+File [^\r\n]{6,}\r\n)+\w{0,30}:[^\r\n]{0,200})\r\n/,
];

const MAX_ERROR_LENGTH = 600;

const ERROR_FIX_METHODS = {
  updateLibs: () => {
    document.dispatchEvent(new CustomEvent("updateLibsDevice"));
  },
  rebootDevice: async () => {
    f7.dialog.preloader(`Đang gửi lệnh khởi động lại thiết bị`);
    await commandUtils.sendStopRepl();
    await core.sleep(100);
    await commandUtils.sendExecuteRawRepl();
    await core.sleep(3000);
    f7.dialog.close();
  },
};

/**
 * Data structure of an object in ERROR_DATA:
 * 		code: error code (used to replace $error_code - defaultProcessError )
 *		regexp: array of regexes used to match the error, return groups to replace $1,$2,$3, ... of content
 * 		content: content of error dialog (defaultProcessError)
 * 			en: content in English
 * 			vi: content in Vietnamese
 *		buttons: array of buttons will be showed on error dialog
 *			name: display name of button
 * 			callback: function will be executed when the button is pressed
 * 		customData: this data is custom data of error object (due to this field, the above fields can be change)
 * 			preprocessError: change the default preprocess function
 */

const defaultProcessError = (errorData, matchedGroups) => {
  console.log("DEFAULT HANDLE", errorData, matchedGroups);
  var content = errorData.content.vi.replaceAll("$error_code", errorData.code);
  for (var i = 0; i < matchedGroups.length; i++) {
    content = content.replaceAll("$" + i, matchedGroups[i]);
  }
  dialog.notiErrorInstruction(content, errorData.buttons);
};

const ERROR_DATA = [
  {
    code: "E01",
    regexp: [/[^\r\n]+\r\n(?:\s+File [^\r\n]{6,}\r\n)+ImportError: no module named '(\w+)'/],
    content: {
      en: `<span>Thiết bị thiếu thư viện cần có cho chương trình</span><br>
        <span>Mã lỗi: <b>$error_code</b></span><br>
        <text>Tên thư viện: <b>$1</b>`,
      vi: `<span>Thiết bị thiếu thư viện cần có cho chương trình</span><br>
        <span>Mã lỗi: <b>$error_code</b></span><br>
        <span>Tên thư viện: <b>$1</b></span>`,
    },
    buttons: [
      {
        name: "Tải thư viện",
        callback: ERROR_FIX_METHODS.updateLibs,
      },
    ],
  },
  {
    code: ["E02", "E03"],
    regexp: [
      /[^\r\n]+\r\n\s+File [^\r\n]{6,}\r\n\s+File "([^\r\n]+)"[^\r\n]+\r\n(?:\s+File [^\r\n]{6,}\r\n)*OSError: \[Errno 19\] ENODEV/,
    ],
    customData: {
      errorMapping: {
        E02: {
          code: "E02",
          name_map: {
            DHT20: /.*dht.*/,
          },
          content: {
            en: `<span>Không tìm thấy module <b>$1</b></span><br>
              <span>Bạn hãy kiểm tra xem đã kết nối module này vào đúng cổng I2C chưa</span><br>
              <span>Mã lỗi: <b>$error_code</b></span><br>
              <text>Tên thiết bị: <b>$1</b>`,
            vi: `<span>Không tìm thấy module <b>$1</b></span><br>
              <span>Bạn hãy kiểm tra xem đã kết nối module này vào đúng cổng I2C chưa</span><br>
              <span>Mã lỗi: <b>$error_code</b></span><br>
              <text>Tên thiết bị: <b>$1</b>`,
          },
          buttons: [],
        },
        E03: {
          code: "E02",
          name_map: {
            DHT20: /.*dht.*/,
          },
          content: {
            en: `<span>$1 trên thiết bị có thể bị lỗi. Bạn hãy liên hệ bộ phận kỹ thuật để được hỗ trợ thêm</span><br>
              <span>Mã lỗi: <b>$error_code</b></span><br>
              <text>Tên thiết bị: <b>$1</b>`,
            vi: `<span>$1 trên thiết bị có thể bị lỗi. Bạn hãy liên hệ bộ phận kỹ thuật để được hỗ trợ thêm</span><br>
              <span>Mã lỗi: <b>$error_code</b></span><br>
              <text>Tên thiết bị: <b>$1</b>`,
          },
          buttons: [],
        },
      },
      preprocessError: (errorData, matchedGroups) => {
        for (const error in errorData.customData.errorMapping) {
          for (const deviceName in errorData.customData.errorMapping[error].name_map) {
            var groups = matchedGroups[1].match(errorData.customData.errorMapping[error].name_map[deviceName]);
            if (groups) {
              groups[1] = deviceName;
              defaultProcessError(errorData.customData.errorMapping[error], groups);
              return;
            }
          }
        }
      },
    },
  },
  {
    code: "E04",
    regexp: [/[^\r\n]+\r\n(?:\s+File [^\r\n]{6,}\r\n)+Exception: Failed to connect to WiFi/],
    content: {
      en: `<span>Thiết bị không thể kết nối đến Wifi</span><br>
        <span>Bạn hãy kiểm tra lại thông tin về mạng Wifi và đảm bảo chính xác</span><br>
        <span>Mã lỗi: <b>$error_code</b></span><br>
        <text>Tên lỗi: <b>Kết nối Wifi thất bại</b>`,
      vi: `<span>Thiết bị không thể kết nối đến Wifi</span><br>
        <span>Bạn hãy kiểm tra lại thông tin về mạng Wifi và đảm bảo chính xác</span><br>
        <span>Mã lỗi: <b>$error_code</b></span><br>
        <text>Tên lỗi: <b>Kết nối Wifi thất bại</b>`,
    },
    buttons: [],
  },
  {
    code: "E05",
    regexp: [
      /[^\r\n]+\r\n(?:\s+File [^\r\n]{6,}\r\n)+OSError: 23/,
      /[^\r\n]+\r\n(?:\s+File [^\r\n]{6,}\r\n)+OSError: Wifi Internal Error/,
    ],
    content: {
      en: `<span>Thiết bị không thể kết nối đến Wifi</span><br>
        <span>Chức năng Wifi trên thiết bị cần phải khởi động lại</span><br>
        <span>Mã lỗi: <b>$error_code</b></span><br>
        <text>Tên lỗi: <b>Kết nối Wifi bị lỗi</b>`,
      vi: `<span>Thiết bị không thể kết nối đến Wifi</span><br>
        <span>Chức năng Wifi trên thiết bị cần phải khởi động lại</span><br>
        <span>Mã lỗi: <b>$error_code</b></span><br>
        <text>Tên lỗi: <b>Kết nối Wifi bị lỗi</b>`,
    },
    buttons: [
      {
        name: "Reboot thiết bị",
        callback: ERROR_FIX_METHODS.rebootDevice,
      },
    ],
  },
  {
    code: "E06",
    regexp: [
      /[^\r\n]+\r\n(?:\s+File [^\r\n]{6,}\r\n)+OSError: -202/,
      /[^\r\n]+\r\n(?:\s+File [^\r\n]{6,}\r\n)+OSError: 118/,
    ],
    content: {
      en: `<span>Chương trình có dùng khối lệnh cần đến kết nối Internet</span><br>
        <span>Bạn hãy thêm khối lệnh để cho thiết bị kết nối Wifi và thử lại</span><br>
        <span>Mã lỗi: <b>$error_code</b></span><br>
        <text>Tên lỗi: <b>Thiếu kết nối Internet</b>`,
      vi: `<span>Chương trình có dùng khối lệnh cần đến kết nối Internet</span><br>
        <span>Bạn hãy thêm khối lệnh để cho thiết bị kết nối Wifi và thử lại</span><br>
        <span>Mã lỗi: <b>$error_code</b></span><br>
        <text>Tên lỗi: <b>Thiếu kết nối Internet</b>`,
    },
    buttons: [],
  },
  {
    code: "E07",
    regexp: [
      /[^\r\n]+\r\n(?:\s+File [^\r\n]{6,}\r\n)+MQTTException:5/,
      /[^\r\n]+\r\n(?:\s+File [^\r\n]{6,}\r\n)+OSError: \[Errno 113\] ECONNABORTED/,
    ],
    content: {
      en: `<span>Thiết bị không thể kết nối đến server MQTT</span><br>
        <span>Bạn hãy kiểm tra lại và đảm bảo thông tin server MQTT và tài khoản khai báo trong chương trình là chính xác</span><br>
        <span>Mã lỗi: <b>$error_code</b></span><br>
        <text>Tên lỗi: <b>Kết nối đến server MQTT thất bại</b>`,
      vi: `<span>Thiết bị không thể kết nối đến server MQTT</span><br>
        <span>Bạn hãy kiểm tra lại và đảm bảo thông tin server MQTT và tài khoản khai báo trong chương trình là chính xác</span><br>
        <span>Mã lỗi: <b>$error_code</b></span><br>
        <text>Tên lỗi: <b>Kết nối đến server MQTT thất bại</b>`,
    },
    buttons: [],
  },
  {
    code: "E08",
    regexp: [/[^\r\n]+\r\n\s+File "<stdin>", line (\d+)[^\d\r\n]*\r\nIndentationError: unexpected indent/],
    content: {
      en: `<span>Có lỗi thụt lề sai trong chương trình <b>ở dòng số $1</b></span><br>
        <span>Bạn hãy kiểm tra lại chương trình</span><br>
        <span>Mã lỗi: <b>$error_code</b></span><br>
        <text>Tên lỗi: <b>Lỗi thụt lề sai</b>`,
      vi: `<span>Có lỗi thụt lề sai trong chương trình <b>ở dòng số $1</b></span><br>
        <span>Bạn hãy kiểm tra lại chương trình</span><br>
        <span>Mã lỗi: <b>$error_code</b></span><br>
        <text>Tên lỗi: <b>Lỗi thụt lề sai</b>`,
    },
    buttons: [],
  },
  {
    code: "E08",
    regexp: [/[^\r\n]+\r\n\s+File "<stdin>", line (\d+)[^\d\r\n]*\r\nSyntaxError: invalid syntax/],
    content: {
      en: `<span>Có lỗi về cú pháp trong chương trình <b>ở dòng số $1</b></span><br>
        <span>Bạn hãy kiểm tra lại chương trình</span><br>
        <span>Mã lỗi: <b>$error_code</b></span><br>
        <text>Tên lỗi: <b>Lỗi cú pháp</b>`,
      vi: `<span>Có lỗi về cú pháp trong chương trình <b>ở dòng số $1</b></span><br>
        <span>Bạn hãy kiểm tra lại chương trình</span><br>
        <span>Mã lỗi: <b>$error_code</b></span><br>
        <text>Tên lỗi: <b>Lỗi cú pháp</b>`,
    },
    buttons: [],
  },
  {
    code: "E09",
    regexp: [/[^\r\n]+\r\n(?:\s+File [^\r\n]{6,}\r\n)+Exception: ([^\r\n]+) not found/],
    content: {
      en: `<span>Không thể tìm thấy thiết bị <b>$1</b></span><br>
        <span>Bạn hãy kiểm tra lại thiết bị này</span><br>
        <span>Mã lỗi: <b>$error_code</b></span><br>
        <text>Tên lỗi: <b>Không tìm thấy thiết bị</b>`,
      vi: `<span>Không thể tìm thấy thiết bị <b>$1</b></span><br>
        <span>Bạn hãy kiểm tra lại thiết bị này</span><br>
        <span>Mã lỗi: <b>$error_code</b></span><br>
        <text>Tên lỗi: <b>Không tìm thấy thiết bị</b>`,
    },
    buttons: [],
  },
  {
    code: "E10",
    regexp: [/[^\r\n]+\r\n(?:\s+File [^\r\n]{6,}\r\n)+NameError: name '(\w+)' isn't defined/],
    content: {
      en: `<span>Biến chưa được khởi tạo giá trị ban đầu</span><br>
        <span>Mã lỗi: <b>$error_code</b></span><br>
        <text>Tên biến: <b>$1</b>`,
      vi: `<span>Biến chưa được khởi tạo giá trị ban đầu</span><br>
        <span>Mã lỗi: <b>$error_code</b></span><br>
        <text>Tên biến: <b>$1</b>`,
    },
    buttons: [],
  },
];

export const globalHandleDeviceError = () => {
  var receiveBuf = "";
  var detect = () => {
    const newData = sharedDataUtils.fetchNewDataFromDevice();

    // Add new data to buf
    receiveBuf += newData;
    receiveBuf =
      receiveBuf.length > MAX_ERROR_LENGTH ? receiveBuf.substr(MAX_ERROR_LENGTH * -1, MAX_ERROR_LENGTH) : receiveBuf;

    for (var i = 0; i < ERROR_PATTERNS.length; i++) {
      var matchGroups = receiveBuf.match(ERROR_PATTERNS[i]);
      if (matchGroups) {
        handleDeviceError(matchGroups[1]);
        receiveBuf = receiveBuf.replace(matchGroups[1], "");
        break;
      }
    }
  };
  return detect;
};

export const handleDeviceError = (msg) => {
  for (const item of ERROR_DATA) {
    for (const regex of item.regexp) {
      var groups = msg.match(regex);
      if (groups) {
        if (item.customData !== undefined && item.customData.preprocessError) {
          item.customData.preprocessError(item, groups);
          return;
        }
        defaultProcessError(item, groups);
        return;
      }
    }
  }
};
