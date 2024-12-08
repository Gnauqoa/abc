export const APP_VERSION = "v1.0.5";

// Layout
export const LAYOUT_CHART = "chart";
export const LAYOUT_TABLE = "table";
export const LAYOUT_NUMBER = "number";
export const LAYOUT_TEXT = "text";
export const LAYOUT_SCOPE = "scope";
export const LAYOUT_BAR = "bar";
export const LAYOUT_TABLE_CHART = "table-chart";
export const LAYOUT_NUMBER_CHART = "number-chart";
export const LAYOUT_NUMBER_TABLE = "number-table";

// Bluetooth
export const DEVICE_PREFIX = "inno-";
export const DEVICE_YINMIK_PREFIX = "BLE-";
export const MIN_SCAN_TIME = 8000; // millisecond
export const MAX_SCAN_TIME = 15000; // millisecond
export const LIMIT_BYTE_BLE = 99;
export const BLE_SERVICE_ID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
export const BLE_RX_ID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
export const BLE_TX_ID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

// Mobile Serial
export const SCAN_SERIAL_INTERVAL = 1000; // millisecond
export const READ_SERIAL_INTERVAL = 100; // millisecond
export const RUNNER_INTERVAL = 50; // millisecond
export const SERIAL_BAUD_RATE = 115200;
export const SERIAL_BAUD_RATE_V2 = 921600;
export const RUNNER_TYPE = {
  SCAN: "scan",
  READ: "read",
  SEND: "send",
};
// API
export const GITHUB_ACCESS_TOKEN = "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";
// MQTT
export const MQTT_URL = "wss://mqtt.ohstem.vn:8084/mqtt";

//Connect type
export const CONNECT_BLE_TYPE = 1;
export const CONNECT_SERIAL_TYPE = 2;
export const AUTO_CONNECT = false;

// Connect flow
export const STEP_GUIDE = "guide";
export const STEP_CONNECTING = "connecting";
export const STEP_FAIL = "fail";
export const STEP_MANUAL = "manual";

// Generic
export const DEFAULT_ID = "default";
export const DEFAULT_CODE_NAME = "const.servo_calibration";
export const ROW = "row";
export const COLUMN = "column";
export const EVENT_RELEASED = "released";
export const EVENT_LOW = "low";
export const EVENT_HIGH = "high";

export const ENTER_KEY = 13;
export const SPACE_KEY = 32;

// Frequency
export const FREQUENCY_UNIT = "const.sample_second";
export const FREQUENCY_MINI_SECOND_UNIT = "const.sample_mini_second";
export const INVERSE_FREQUENCY_UNIT = "const.seconds_sample";
// Sample setting
export const CONDITION_TYPE = {
  TIME: "time",
  SENSOR_VALUE: "sensor_value",
  NONE: "none",
};

export const CONDITION = {
  GREATER_THAN: "greater_than",
  LESS_THAN: "less_than",
  RISES_ABOVE: "rises_above",
  FALLS_BELOW: "falls_below",
};

// export const FREQUENCIES = [1, 2, 5, 10, 50, 100, 1000];
export const FREQUENCIES = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 4000, 5000, 10000, 48000];
export const SAMPLING_MANUAL_NAME = "const.manual";
export const SAMPLING_MANUAL_FREQUENCY = 0;
export const SAMPLING_INTERVAL_LESS_1HZ = 1000;
export const EMIT_DATA_MANUAL_FREQUENCY = 1;
export const RENDER_INTERVAL = 1000;
export const READ_BUFFER_INTERVAL = 100;

// SAMPLING MODE
export const SAMPLING_AUTO = 0;
export const SAMPLING_MANUAL = 1;

// TIMER
export const TIMER_INTERVAL = 100;
export const TIMER_NO_STOP = -1;

// Sensor
export const SENSOR_STATUS_ONLINE = "online";
export const SENSOR_STATUS_OFFLINE = "offline";
export const SENSOR_SELECTOR_SENSOR_TAB = "sensor";
export const SENSOR_SELECTOR_USER_TAB = "user";

export const DEFAULT_SENSOR_ID = -1;
export const DEFAULT_SENSOR_DATA = { id: DEFAULT_SENSOR_ID, index: 0 };
export const DEFAULT_CUSTOM_UNIT_DATA = { sensorIds: [], data: {}, labels: [] };

export const WIDGET_SENSOR_ACTIVE = 0;
export const WIDGET_SENSOR_INACTIVE = 1;
export const WIDGET_SENSOR_ID_INACTIVE = -1;

export const BLE_TYPE = "ble";
export const USB_TYPE = "usb";

export const SENSOR_NONE_VALUE = 0;
export const SENSOR_VERSION = {
  V1: 1,
  V2: 2,
};

export const NUM_NON_DATA_SENSORS_CALLBACK = 5;
export const NUM_NON_DATA_SENSORS_CALLBACK_V2 = 7;
export const START_BYTE_V1 = 0xaa;
export const START_BYTE_V2 = 0xcc;
export const START_BYTE_V2_LOG = 0xdd;
export const STOP_BYTE = 0xbb;

// TABLES DEFINED
export const USER_INPUTS_TABLE = "user-inputs";
export const LINE_CHART_STATISTIC_NOTE_TABLE = "line-chart-statistic-notes";
export const LINE_CHART_LABEL_NOTE_TABLE = "line-chart-label-notes";
export const LINE_CHART_RANGE_SELECTION_TABLE = "line-chart-range-selection";
export const LINE_CHART_POINT_DATA_PREVIEW_TABLE = "line-chart-point-data-preview";

// DELTA
export const LINE_CHART_DELTA_TABLE = "line-chart-delta";

// ANDROID SAVE EXPORT PROJECTS VARIABLES
export const PROJECT_FOLDER = "InnoLabProject";
export const PROJECT_FILE_EXT = ".edl";
export const PROJECT_FILE_TYPE = "text/json";

export const PROJECT_DATA_RUN_FOLDER = "InnoLabProjectDataRun";
export const PROJECT_DATA_RUN_EXT = ".xlsx";

export const RETURN_LIST_OPTION = "list";
export const RETURN_DICT_OPTION = "dict";

// REMOTE LOGGING
export const OFF = 0;
export const FLASH = 1;
export const MQTT = 2;

export const IMMEDIATELY = 1;
export const NEXT_STARTUP = 2;
export const EVERY_STARTUP = 3;

export const DOWNLOAD_LOG_ACTION = "download-log";
export const DELETE_LOG_ACTION = "delete-log";
export const SET_LOG_SETTING = "set-log-setting";
export const MAX_SAMPLE_REMOTE_LOGGING = 2000;
export const MAX_SAMPLE_REMOTE_LOGGING_V2 = 100000;
