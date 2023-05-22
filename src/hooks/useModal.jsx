import React, { useState, useMemo, useCallback } from "react";

import { Popup } from "framework7-react";

const usePrompt = ({ className, callbackFn }) => {
  const [isShow, setIsShow] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const promptPopupRef = React.useRef(null);

  const onClose = (newInput) => {
    setModalContent(null);
    setIsShow(false);
    callbackFn(newInput);
  };

  const handleAfterLeave = () => {
    setModalContent(null);
    setIsShow(false);
  };

  const showModal = (getContent) => {
    setModalContent(getContent(onClose));
    setIsShow(true);
  };

  const prompt = useMemo(() => {
    return (
      <Popup ref={promptPopupRef} className={className} opened={isShow} onPopupClose={handleAfterLeave}>
        {modalContent}
      </Popup>
    );
  }, [isShow]);

  return { prompt, showModal };
};

export default usePrompt;
