function openFile(
  filePath,
  option = {
    filters: [{ name: "EDL", extensions: ["edl"] }],
  }
) {
  return window.fileApi.open(filePath, option);
}

function saveFile(
  filePath,
  content,
  option = {
    filters: [{ name: "EDL", extensions: ["edl"] }],
  }
) {
  return window.fileApi.save(filePath, content, option);
}

export { openFile, saveFile };
