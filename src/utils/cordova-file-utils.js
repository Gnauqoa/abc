import { getUniqueFileName } from "./core";

const PROJECT_FOLDER = "InnoLabProject";
const PROJECT_FILE_EXT = ".edl";

export async function searchProjects() {
  return new Promise((resolve, reject) => {
    window.resolveLocalFileSystemURL(
      cordova.file.externalDataDirectory,
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
      cordova.file.externalDataDirectory,
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
      cordova.file.externalDataDirectory,
      (rootEntry) => {
        const callbackGetSaveFiles = (files) => {
          const fileNames = files.map((file) => {
            const baseName = file.name.replace(/\.edl$/i, "");
            return baseName;
          });
          const newFileName = getUniqueFileName(fileName, fileNames) + PROJECT_FILE_EXT;
          const newFilePath = PROJECT_FOLDER + "/" + newFileName;

          createFile(rootEntry, newFilePath, content);
          resolve(cordova.file.externalDataDirectory + newFilePath);
        };

        try {
          if (filePath) {
            createFile(rootEntry, filePath, content);
            resolve(cordova.file.externalDataDirectory + filePath);
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
      cordova.file.externalDataDirectory,
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
            path: entry.fullPath,
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
