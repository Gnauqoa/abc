import React, { useRef, useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useActivityContext } from "../../../context/ActivityContext";
import RoundButton from "../../atoms/round-button";

import "./index.scss";

const EDIT_MODE = "edit";
const VIEW_MODE = "view";

const TextViewWidget = ({ widget }) => {
  const [mode, setMode] = useState(VIEW_MODE);
  const { handleTextChange } = useActivityContext();
  const containerRef = useRef(null);

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

  return (
    <div className="text-view-widget">
      {mode === EDIT_MODE ? (
        <ReactQuill
          modules={{
            toolbar: [
              [{ header: [1, 2, false] }],
              ["bold", "italic", "underline", "strike"],
              [{ color: [] }, { background: [] }],
              [{ script: "super" }, { script: "sub" }],
              ["blockquote", "code-block"],
              [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
              [{ align: [] }],
              ["link", "image", "video", "formula"],
              ["clean"],
            ],
          }}
          theme="snow"
          value={widget.text}
          onChange={(value) => handleTextChange({ widgetId: widget.id, text: value })}
        />
      ) : (
        <div className="text-view-view-mode" ref={containerRef}></div>
      )}
      <div className="toggle-button">
        <RoundButton icon={mode === VIEW_MODE ? "edit" : "preview"} color="#0086ff" onClick={onToggleHandler} />
      </div>
    </div>
  );
};

export default TextViewWidget;
