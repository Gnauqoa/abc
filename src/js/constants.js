export const APP_VERSION = "v1.0";

// Layout
export const LAYOUT_CHART = "chart";
export const LAYOUT_TABLE = "table";
export const LAYOUT_NUMBER = "number";
export const LAYOUT_TABLE_CHART = "table-chart";
export const LAYOUT_NUMBER_CHART = "number-chart";
export const LAYOUT_NUMBER_TABLE = "number-table";

// Bluetooth
export const DEVICE_PREFIX = "ohstem-";
export const XBOT_PREFIX = "xbot";
export const MIN_SCAN_TIME = 8000; // millisecond
export const MAX_SCAN_TIME = 15000; // millisecond
export const LIMIT_BYTE_BLE = 99;
export const BLE_SERVICE_ID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
export const BLE_RX_ID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
export const BLE_TX_ID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

// API
export const GITHUB_ACCESS_TOKEN = "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";
// MQTT
export const MQTT_URL = "wss://mqtt.ohstem.vn:8084/mqtt";

// Home modules
export const BUILD = "build";
export const DASHBOARD = "dashboard";
export const CODE = "code";
export const LESSON = "lesson";
export const CUSTOM_DASHBOARD = "custom-dashboard";
export const GAMEPAD = "gamepad";
export const PIN_IO = "pin-io";
export const DRAW_RUN = "draw_run";
export const RECORD_PLAY = "record_play";
export const PLAYS = "plays";
export const EXPAND = "expand";

// Dashboard mode
export const PLAY = "play";
export const DESIGN = "design";

// Widgets
export const DEFAULT_BUTTON = "default-button";
export const DEFAULT_SWITCH = "default-switch";
export const JOYSTICK = "joystick";
export const BUTTON = "button";
export const SWITCH = "switch";
export const IMG_SWITCH = "img-switch";
export const IMG_SWITCH_SUGGESTIONS = [
  {
    turn_on: "static/widgets/img-switch-on.png",
    turn_off: "static/widgets/img-switch-off.png",
    id: "default", // Alway keep one default suggestion
    name: "Mặc định",
  },
  {
    turn_on: "static/widgets/img-switch-light-on.png",
    turn_off: "static/widgets/img-switch-light-off.png",
    id: "light",
    name: "Bóng đèn",
  },
  {
    turn_on: "static/widgets/img-switch-audio-on.png",
    turn_off: "static/widgets/img-switch-audio-off.png",
    id: "audio",
    name: "Âm thanh",
  },
  {
    turn_on: "static/widgets/img-switch-wifi-on.png",
    turn_off: "static/widgets/img-switch-wifi-off.png",
    id: "wifi",
    name: "Wifi",
  },
  {
    turn_on: "static/widgets/img-switch-micro-on.png",
    turn_off: "static/widgets/img-switch-micro-off.png",
    id: "micro",
    name: "Ghi âm",
  },
  {
    turn_on: "static/widgets/img-switch-media-play.png",
    turn_off: "static/widgets/img-switch-media-stop.png",
    id: "media",
    name: "Nút play/stop",
  },
  {
    turn_on: "static/widgets/img-switch-camera-on.png",
    turn_off: "static/widgets/img-switch-camera-off.png",
    id: "camera",
    name: "Camera",
  },
  {
    turn_on: "static/widgets/img-switch-bell-on.png",
    turn_off: "static/widgets/img-switch-bell-off.png",
    id: "bell",
    name: "Chuông",
  },
  {
    turn_on: "static/widgets/img-switch-lock-on.png",
    turn_off: "static/widgets/img-switch-lock-off.png",
    id: "lock",
    name: "Ổ khóa",
  },
];
export const IMG_SWITCH_DEFAULT_SUGGESTION = IMG_SWITCH_SUGGESTIONS.find((s) => s.id === "default");
export const DPAD = "dpad";
export const SLIDER = "slider";
export const SERVO = "servo";
export const KNOB = "knob";
export const PULL_SLIDER = "pull-slider";
export const LED_PANEL = "led-panel";
export const VALUE_DISPLAY = "value-display";
export const STEP_CONTROL = "step-control";
export const COLOR_PICKER = "color-picker";
export const MENU = "menu";
export const CHART = "chart";
export const GAUGE = "gauge";

// Devices
export const ARMBOT = "armbit";
export const MYPET = "mypet";
export const BATMAN = "batman";
export const YOLOBIT = "yolobit";
export const TANK = "tank";
export const XBOT = "xbot";
export const XBUILD = "xbuild";
export const TRANSFORMBOT = "transformbot";
export const SPIDERBOT = "spiderbot";
export const ROBOTWALLE = "robotwalle";
export const CONTROLLERHANDLE = "controllerhandle";
export const MYROBOT = "myrobot";
export const GROUP_LESS = "group-less";
export const AI = "ai";
export const AI_DEVICE = "ai_device";
export const RIO = "rio";

//Connect type
export const CONNECT_BLE_TYPE = 1;
export const CONNECT_SERIAL_TYPE = 2;
export const AUTO_CONNECT = false;

//CONSTANT FOR CMD SETTING
export const CMD_CTRL_A = 0x01;
export const CMD_CTRL_B = 0x02;
export const CMD_CTRL_C = 0x03;
export const CMD_CTRL_D = 0x04;
export const CMD_SYS_PREFIX = 0x11;
export const CMD_REPL_BEGIN_PREFIX = 0x12;
export const CMD_REPL_END_PREFIX = 0x13;
export const CMD_REPL_EXEC_CMD = 13;

export const ROBOT_MESSAGE_CHAR_LIMIT = 35;
export const ROBOT_DATA_RECV_SIGN = "\x06";

// Pin mode
export const INPUT = "Input";
export const OUTPUT = "Output";
export const PWM = "PWM";
export const FLOATING = "Floating";
export const PULL_UP = "Pull Up";
export const LOW = "Low";
export const HIGH = "High";

// Connect flow
export const STEP_GUIDE = "guide";
export const STEP_CONNECTING = "connecting";
export const STEP_FAIL = "fail";
export const STEP_MANUAL = "manual";

// Generic
export const DEFAULT_ID = "default";
export const DEFAULT_CODE_NAME = "Cân chỉnh servo";
export const ROW = "row";
export const COLUMN = "column";
export const EVENT_RELEASED = "released";
export const EVENT_LOW = "low";
export const EVENT_HIGH = "high";

export const ENTER_KEY = 13;
export const SPACE_KEY = 32;

// Frequency
export const FREQUENCY_UNIT = "Hz";
export const FREQUENCIES = [1, 2, 5, 10, 50, 100, 1000];
export const SAMPLING_MANUAL_NAME = "Thủ công";
export const SAMPLING_MANUAL_FREQUENCY = 0;
export const EMIT_DATA_MANUAL_FREQUENCY = 1;

// SAMPLING MODE
export const SAMPLING_AUTO = 0;
export const SAMPLING_MANUAL = 1;

// TIMER
export const TIMER_INTERVAL = 100;
export const TIMER_NO_STOP = -1;

// Sensor
export const SENSOR_STATUS_ONLINE = "online";
export const SENSOR_STATUS_OFFLINE = "offline";

export const DEFAULT_SENSOR_ID = -1;
export const DEFAULT_SENSOR_DATA = { id: DEFAULT_SENSOR_ID, index: 0 };

export const BLE_TYPE = "ble";
export const USB_TYPE = "usb";
