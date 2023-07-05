import React, { useRef, useEffect, useState } from "react";
import { TextEditor, Button, f7 } from "framework7-react";
import { getDocument } from "ssr-window";
import { openFile } from "../../../services/file-service";
import { useActivityContext } from "../../../context/ActivityContext";

import "./index.scss";

const EDIT_MODE = "edit";
const VIEW_MODE = "view";

const TextViewWidget = ({ widget }) => {
  const [mode, setMode] = useState(VIEW_MODE);
  const { handleTextChange } = useActivityContext();
  const containerRef = useRef(null);
  const inputFile = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    if (widget.text === undefined) return;
    const dom = new DOMParser().parseFromString(widget.text.replace(/\n/g, ""), "text/html");
    const container = containerRef.current;
    if (container && dom.body) {
      container.replaceChildren(dom.body);
    }
  }, [widget, mode]);

  const onToggleHandler = () => {
    if (mode === VIEW_MODE) {
      setMode(EDIT_MODE);
    } else {
      setMode(VIEW_MODE);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        const document = getDocument();
        document.execCommand("insertImage", false, imageUrl.trim());
      };

      reader.readAsDataURL(file);
    }
  };

  async function handleOpenImage() {
    if (f7.device.electron) {
      try {
        const file = await openFile(null, {
          filters: [{ name: "EDL", extensions: ["png", "jpeg", "jpg"] }],
        });

        if (file && file.filePath) {
          console.log("file.filePath.trim(): ", file.filePath.trim());
          const document = getDocument();
          document.execCommand("insertImage", false, file.filePath.trim());
        }
      } catch (error) {
        console.error("Import failed", error.message);
        dialog.alert("Lỗi không thể mở file", "Nội dung file không hợp lệ. Vui lòng tạo hoạt động mới.", () => {});
      }
    } else if (f7.device.desktop) {
      inputFile.current.click();
    }
  }

  return (
    <div className="text-view-widget">
      {mode === EDIT_MODE ? (
        <TextEditor
          ref={editorRef}
          placeholder="Enter text..."
          value={widget.text}
          onTextEditorChange={(value) => handleTextChange({ widgetId: widget.id, text: value })}
          customButtons={{
            image: {
              content: '<i class="material-icons">image</i>',
              onClick(event, buttonEl) {
                handleOpenImage();
              },
            },
          }}
        />
      ) : (
        <div className="text-view-view-mode" ref={containerRef}></div>
      )}
      <div className="toggle-button">
        <Button raised fill round onClick={onToggleHandler}>
          {mode === VIEW_MODE ? "Edit" : "View"}
        </Button>
        <input ref={inputFile} type="file" onChange={handleImageUpload} hidden={true} />
      </div>
    </div>
  );
};

export default TextViewWidget;
