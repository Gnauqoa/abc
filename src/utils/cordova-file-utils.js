import { f7 } from "framework7-react";

import { PROJECT_FILE_EXT, PROJECT_FOLDER } from "../js/constants";
import { getUniqueFileName } from "./core";

let DEFAULT_ROOT_DIRECTORY;
let hasExternalMem;
try {
  hasExternalMem = cordova.file.externalDataDirectory ? true : false;
  DEFAULT_ROOT_DIRECTORY = hasExternalMem ? cordova.file.externalDataDirectory : cordova.file.dataDirectory;
} catch (error) {
  console.log("cordova-file-utils: ", error);
}

export async function searchProjects() {
  return new Promise((resolve, reject) => {
    window.resolveLocalFileSystemURL(
      DEFAULT_ROOT_DIRECTORY,
      function (rootEntry) {
        try {
          getAllFiles(rootEntry, (files) => resolve(files));
        } catch (error) {
          reject(new Error("getAllFiles: " + error));
        }
      },
      () => reject(new Error("onErrorLoadFs: " + error))
    );
  });
}

export async function openProject(filePath) {
  return new Promise((resolve, reject) => {
    window.resolveLocalFileSystemURL(
      DEFAULT_ROOT_DIRECTORY,
      (rootEntry) => {
        try {
          rootEntry.getFile(
            filePath,
            { create: false, exclusive: false },
            (fileEntry) => readFile(fileEntry, (fileContent) => resolve(fileContent)),
            (error) => reject(new Error("onErrorGetFile: " + error))
          );
        } catch (error) {
          reject(new Error("getFile: " + error));
        }
      },
      (error) => reject(new Error("onErrorLoadFs: " + error))
    );
  });
}

export async function saveProject(fileName, filePath, content) {
  return new Promise((resolve, reject) => {
    window.resolveLocalFileSystemURL(
      DEFAULT_ROOT_DIRECTORY,
      (rootEntry) => {
        const callbackGetSaveFiles = (files) => {
          const fileNames = files.map((file) => {
            const baseName = file.name.replace(/\.edl$/i, "");
            return baseName;
          });
          const newFileName = getUniqueFileName(fileName, fileNames) + PROJECT_FILE_EXT;
          const newFilePath = PROJECT_FOLDER + "/" + newFileName;

          createFile(rootEntry, newFilePath, content);
          formatReturnPath(DEFAULT_ROOT_DIRECTORY, newFilePath, (returnPath) => resolve(returnPath));
        };

        try {
          if (filePath) {
            createFile(rootEntry, filePath, content);
            formatReturnPath(DEFAULT_ROOT_DIRECTORY, filePath, (returnPath) => resolve(returnPath));
          } else getAllFiles(rootEntry, (files) => callbackGetSaveFiles(files));
        } catch (error) {
          reject(new Error("getAllFiles: " + error));
        }
      },
      () => reject(new Error("onErrorLoadFs: " + error))
    );
  });
}

export async function removeProject(filePath) {
  return new Promise((resolve, reject) => {
    window.resolveLocalFileSystemURL(
      DEFAULT_ROOT_DIRECTORY,
      (rootEntry) => {
        rootEntry.getFile(
          filePath,
          { create: false, exclusive: false },
          (fileEntry) => removeFile(fileEntry, (result) => resolve(result)),
          (error) => reject(new Error("onErrorGetFile: " + error))
        );
      },
      (error) => reject(new Error("onErrorLoadFs: " + error))
    );
  });
}

const formatReturnPath = (rootPath, filePath, callback) => {
  window.resolveLocalFileSystemURL(
    cordova.file.externalRootDirectory,
    function (entry) {
      const fileSystemName = entry.filesystem.name;

      const matcherPattern = hasExternalMem ? /^.*\/Android/ : /^.*\/files/;
      const replacePattern = hasExternalMem ? `${fileSystemName}/Android` : "";
      const returnPath = String(rootPath + filePath).replace(matcherPattern, replacePattern);

      callback(returnPath);
    },
    function (error) {
      console.error(error);
      callback(null);
    }
  );
};

function getAllFiles(rootEntry, callback) {
  rootEntry.getDirectory(
    PROJECT_FOLDER,
    { create: true },
    (projectDir) => {
      const callbackReadEntries = (entries) => {
        const files = [];
        for (const entry of entries) {
          files.push({
            name: entry.name,
          });
        }
        callback(files);
      };

      const projectDirReader = projectDir.createReader();
      projectDirReader.readEntries(
        (entries) => callbackReadEntries(entries),
        (error) => console.log("onErrorReadEntries: ", error)
      );
    },
    (error) => console.log("onErrorGetDir: ", error)
  );
}

function createFile(rootEntry, filePath, content) {
  rootEntry.getFile(
    filePath,
    { create: true, exclusive: false },
    (fileEntry) => writeFile(fileEntry, content),
    () => console.log("onErrorCreateFile")
  );
}

function writeFile(fileEntry, content) {
  fileEntry.createWriter(function (fileWriter) {
    fileWriter.onwriteend = function () {
      readFile(fileEntry, (content) => console.log("Successful file write...", content));
    };

    fileWriter.onerror = function (e) {
      console.log("Failed file write: " + e.toString());
    };

    // If data object is not passed in,
    // create a new Blob instead.
    const dataObj = new Blob([content], { type: "text/json" });
    fileWriter.write(dataObj);
  });
}

function readFile(fileEntry, callback) {
  fileEntry.file(
    function (file) {
      var reader = new FileReader();
      reader.onloadend = function () {
        callback(this.result);
      };

      reader.readAsText(file);
    },
    (error) => console.log("onErrorReadFile: ", error)
  );
}

function removeFile(fileEntry, callback) {
  fileEntry.remove(
    () => callback(true),
    (error) => console.log("onErrorRemoveFile: ", error)
  );
}
