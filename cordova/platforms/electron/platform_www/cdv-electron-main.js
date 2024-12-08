/*
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

const fs = require("fs");
const path = require("path");

const { cordova } = require("./package.json");
// Module to control application life, browser window and tray.
const { app, BrowserWindow, protocol, ipcMain, dialog, shell } = require("electron");
// Electron settings from .json file.
const cdvElectronSettings = require("./cdv-electron-settings.json");
const reservedScheme = require("./cdv-reserved-scheme.json");

const devTools = cdvElectronSettings.browserWindow.webPreferences.devTools
  ? require("electron-devtools-installer")
  : false;

const scheme = cdvElectronSettings.scheme;
const hostname = cdvElectronSettings.hostname;
const isFileProtocol = scheme === "file";

const { SerialPort } = require("serialport");
const { DelimiterParser } = require("@serialport/parser-delimiter");

const BLE_TYPE = "ble";
const USB_TYPE = "usb";

// ESP32-S3
const VID_S3 = "303A";
const PID_S3 = "1001";

// CH340
const VID_CH = "1A86";
const PID_CH = "7523";

/**
 * The base url path.
 * E.g:
 * When scheme is defined as "file" the base path is "file://path-to-the-app-root-directory"
 * When scheme is anything except "file", for example "app", the base path will be "app://localhost"
 *  The hostname "localhost" can be changed but only set when scheme is not "file"
 */
const basePath = (() => (isFileProtocol ? `file://${__dirname}` : `${scheme}://${hostname}`))();

if (reservedScheme.includes(scheme))
  throw new Error(`The scheme "${scheme}" can not be registered. Please use a non-reserved scheme.`);

if (!isFileProtocol) {
  protocol.registerSchemesAsPrivileged([{ scheme, privileges: { standard: true, secure: true } }]);
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

app.commandLine.appendSwitch("enable-features", "ElectronSerialChooser");

async function createWindow() {
  // Create the browser window.
  let appIcon;
  if (fs.existsSync(path.join(__dirname, "img/app.png"))) {
    appIcon = path.join(__dirname, "img/app.png");
  } else if (fs.existsSync(path.join(__dirname, "img/icon.png"))) {
    appIcon = path.join(__dirname, "img/icon.png");
  } else {
    appIcon = path.join(__dirname, "img/logo.png");
  }

  const browserWindowOpts = Object.assign({}, cdvElectronSettings.browserWindow, { icon: appIcon });
  browserWindowOpts.webPreferences.preload = path.join(app.getAppPath(), "cdv-electron-preload.js");
  browserWindowOpts.webPreferences.contextIsolation = true;

  mainWindow = new BrowserWindow(browserWindowOpts);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.removeMenu();

  // Load a local HTML file or a remote URL.
  const cdvUrl = cdvElectronSettings.browserWindowInstance.loadURL.url;
  const loadUrl = cdvUrl.includes("://") ? cdvUrl : `${basePath}/${cdvUrl}`;
  const loadUrlOpts = Object.assign({}, cdvElectronSettings.browserWindowInstance.loadURL.options);

  mainWindow.loadURL(loadUrl, loadUrlOpts);

  // Open the DevTools.
  if (cdvElectronSettings.browserWindow.webPreferences.devTools) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  mainWindow.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

function configureProtocol() {
  protocol.registerFileProtocol(scheme, (request, cb) => {
    const url = request.url.substr(basePath.length + 1);
    cb({ path: path.normalize(path.join(__dirname, url)) }); // eslint-disable-line node/no-callback-literal
  });

  protocol.interceptFileProtocol("file", (_, cb) => {
    cb(null);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  if (!isFileProtocol) {
    configureProtocol();
  }

  if (devTools && cdvElectronSettings.devToolsExtension) {
    const extensions = cdvElectronSettings.devToolsExtension.map((id) => devTools[id] || id);
    devTools
      .default(extensions) // default = install extension
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log("An error occurred: ", err));
  }

  ipcMain.on("device-command", (_event, value) => {
    console.log("Received command from UI: ", value);
  });

  createWindow();
  setupBluetooth(mainWindow);
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    if (!isFileProtocol) {
      configureProtocol();
    }

    createWindow();
  }
});

ipcMain.handle("cdv-plugin-exec", async (_, serviceName, action, ...args) => {
  if (cordova && cordova.services && cordova.services[serviceName]) {
    const plugin = require(cordova.services[serviceName]);

    return plugin[action]
      ? plugin[action](args)
      : Promise.reject(
          new Error(`The action "${action}" for the requested plugin service "${serviceName}" does not exist.`)
        );
  } else {
    return Promise.reject(
      new Error(`The requested plugin service "${serviceName}" does not exist have native support.`)
    );
  }
});

ipcMain.handle("openFile", async (_, filePath, option) => {
  if (filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, "utf-8", (err, content) => {
        if (err) {
          reject(err);
        }
        resolve({ filePath, content });
      });
    });
  } else {
    return dialog.showOpenDialog(option).then((data) => {
      return new Promise((resolve, reject) => {
        const filePath = data.filePaths[0];
        if (filePath) {
          fs.readFile(filePath, "utf-8", (err, content) => {
            if (err) {
              reject(err);
            }
            resolve({ filePath, content });
          });
        } else {
          resolve(null);
        }
      });
    });
  }
});

ipcMain.handle("saveFile", async (_, filePath, content, option) => {
  if (filePath) {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, content, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(filePath);
        }
      });
    });
  } else {
    return dialog.showSaveDialog(option).then((data) => {
      return new Promise((resolve, reject) => {
        const filePath = data.filePath;
        if (!filePath) {
          resolve(null);
        }
        fs.writeFile(filePath, content, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(filePath);
          }
        });
      });
    });
  }
});

ipcMain.handle("quitApp", () => {
  app.quit();
});

ipcMain.handle("setFullscreen", (_, isFullscreen) => {
  if (isFullscreen) {
    mainWindow.setFullScreen(true);
  } else {
    mainWindow.setFullScreen(false);
  }
});

ipcMain.handle("openBrowser", (_, link) => {
  shell.openExternal(link);
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

let portsList = {};

ipcMain.on("write-data", (event, port, data) => {
  return new Promise((resolve, reject) => {
    portsList[port]?.port.write(data, (err) => {
      if (err) {
        reject(err.message);
      }
      resolve();
    });
  });
});

async function listSerialPorts() {
  await SerialPort.list().then((ports, err) => {
    if (err) {
      console.log(err);
      return;
    }

    if (ports.length > 0) {
      ports.forEach((port) => {
        //console.log(port);
        let baudRate = 115200;
        if (port.vendorId == VID_S3 && port.productId == PID_S3) {
          baudRate = 921600;
        } else if (port.vendorId == VID_CH && port.productId == PID_CH) {
          baudRate = 115200;
        } else {
          //console.log("Not InnoLab sensor device");
          return;
        }

        //console.log(portsList[port.path]);
        if (portsList[port.path] === undefined) {
          // try open first port
          try {
            const serialPort = new SerialPort({
              path: port.path,
              baudRate: baudRate,
            });

            // Open errors will be emitted as an error event
            serialPort.on("error", function (err) {
              console.log("Error: ", err.message);
              portsList[port.path] = undefined;
            });

            serialPort.on("close", function (err) {
              if (err.disconnected == true) {
                console.log(port.path, " disconnected");
                mainWindow.webContents.send("device-disconnected", portsList[port.path].sensorInfo);
              } else {
                console.log(port.path, " got unknown error");
              }

              portsList[port.path] = undefined;
            });

            const parser = serialPort.pipe(new DelimiterParser({ delimiter: [0xbb], includeDelimiter:false }));
            parser.on("data", function (data) {
              if (data[0] === 0xaa) {
                // sensor data V1
                var sensorId = data[1];
                var battery = data[3]; // TODO: Will use later
                var dataArray = [sensorId, battery, USB_TYPE];
                portsList[port.path].sensorInfo = dataArray;
              } else if (data[0] === 0xcc || data[0] === 0xdd) {
                // sensor data V2
                var sensorId = data[1];
                var battery = data[4]; // TODO: Will use later
                var dataArray = [sensorId, battery, USB_TYPE];
                portsList[port.path].sensorInfo = dataArray;
              } 
              mainWindow.webContents.send("device-data", data, USB_TYPE, { deviceId: port.path });
            });

            portsList[port.path] = {
              port: serialPort,
              sensorInfo: "",
            };
          } catch (err) {
            console.log(err);
          }
        }
      });
    }
  });
}

function listPorts() {
  listSerialPorts();
  setTimeout(listPorts, 1000);
}

function setupBluetooth(win) {
  let btCallback;

  // Setup handling of bluetooth scan results
  win.webContents.on("select-bluetooth-device", (event, devices, callback) => {
    // Store the callback for calling once a device is selected
    btCallback = callback;

    // Allow the WebBluetooth API to wait for a custom UI chooser
    event.preventDefault();

    // Notify the render process of found devices
    win.webContents.send("webble-scan", devices);
  });

  // Resolve a request when a device is selected
  ipcMain.on("webble-selected", (event, deviceId) => {
    if (btCallback) btCallback(deviceId);
    btCallback = null;
  });
}

// Set a timeout that will check for new serialPorts every 1 seconds.
// This timeout reschedules itself.
setTimeout(listPorts, 1000);

listSerialPorts();
