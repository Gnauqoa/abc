import React from "react";
import { Popover, List, Button, ListItem, f7 } from "framework7-react";

import "./index.scss";
import { useActivityContext } from "../../../context/ActivityContext";
import usePrompt from "../../../hooks/useModal";
import PromptPopup from "../../molecules/popup-prompt-dialog";
import { useTranslation } from "react-i18next";

const PageManagement = () => {
  const { t, i18n } = useTranslation();

  const { pages, changePageName, currentPageIndex, handleNavigatePage } = useActivityContext();

  const onCloseChangeNamePopup = ({ newInput: newPageName }) => {
    newPageName && changePageName(currentPageIndex, newPageName);
  };

  const { prompt, showModal } = usePrompt({ className: "use-prompt-dialog-popup", callbackFn: onCloseChangeNamePopup });

  const handlePageChangeName = () => {
    f7.popover.close();
    showModal((onClose) => (
      <PromptPopup
        title={t("atoms.rename_current_page")}
        inputLabel={t("atoms.page_name")}
        defaultValue={pages[currentPageIndex]?.name}
        onClosePopup={onClose}
      />
    ));
  };

  const handleChangePage = (pageIndex) => {
    handleNavigatePage(pageIndex);
    f7.popover.close();
  };

  return (
    <div>
      <Popover className="popover-page-management">
        <List>
          <ListItem className="rename-page-button" key="rename-page-button" onClick={handlePageChangeName}>
            {t("atoms.rename_current_page")}
          </ListItem>
          <ListItem>{t("atoms.list_of_pages")}</ListItem>
          <List
            style={{
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {pages.map((page, index) => (
              <Button
                key={`page-${index}`}
                className={`page-name ${index === currentPageIndex ? "selected" : ""}`}
                onClick={() => handleChangePage(index)}
              >
                {page.name}
              </Button>
            ))}
          </List>
        </List>
      </Popover>
      {prompt}
    </div>
  );
};

export default PageManagement;
