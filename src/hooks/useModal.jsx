import React, { useState, useMemo, useCallback } from "react";

import PromptPopup from "../components/molecules/popup-prompt";

const usePrompt = ({ title, defaultValue, onClosePopup }) => {
  const [isShow, setIsShow] = useState(false);

  const onClose = (newInput) => {
    setIsShow(false);
    onClosePopup(newInput);
  };

  const showModal = () => {
    setIsShow(true);
  };

  const prompt = useMemo(() => {
    return <PromptPopup title={title} defaultValue={defaultValue} isShow={isShow} onClosePopup={onClose} />;
  }, [isShow]);

  return { prompt, showModal };
};

export default usePrompt;
