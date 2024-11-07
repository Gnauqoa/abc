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

const { contextBridge, ipcRenderer } = require("electron");
const { cordova } = require("./package.json");

contextBridge.exposeInMainWorld("_cdvElectronIpc", {
  exec: (success, error, serviceName, action, args) => {
    return ipcRenderer.invoke("cdv-plugin-exec", serviceName, action, args).then(success, error);
  },

  onDeviceDataReceived: (data, source, device) => ipcRenderer.on("device-data", data, source, device),
  onDeviceDisconnected: (callback) => ipcRenderer.on("device-disconnected", callback),
  writeDeviceData: (port, data) => ipcRenderer.send("write-data", port, data),

  hasService: (serviceName) => cordova && cordova.services && cordova.services[serviceName],

  quitApp: () => ipcRenderer.invoke("quitApp"),

  setFullscreen: (isFullscreen) => ipcRenderer.invoke("setFullscreen", isFullscreen),

  onScanBleResults: (callback) => {
    ipcRenderer.on("webble-scan", callback);
  },

  selectBleDevice: (deviceId) => ipcRenderer.send("webble-selected", deviceId),

  openBrowser: (link) => ipcRenderer.invoke("openBrowser", link),
});

contextBridge.exposeInMainWorld("fileApi", {
  open: (filePath, option) => ipcRenderer.invoke("openFile", filePath, option),
  save: (filePath, content, option) => ipcRenderer.invoke("saveFile", filePath, content, option),
});
