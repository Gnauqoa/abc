import React from "react";
import { Popover, List, Button, ListItem, f7 } from "framework7-react";

import "./index.scss";
import { useActivityContext } from "../../../context/ActivityContext";
import usePrompt from "../../../hooks/useModal";

const PageManagement = () => {
  const { pages, changePageName, currentPageIndex, handleNavigatePage } = useActivityContext();

  const onCloseChangeNamePopup = (newPageName) => {
    newPageName && changePageName(currentPageIndex, newPageName);
  };

  const { prompt, showModal } = usePrompt({
    title: "Đổi tên trang hiện tại",
    inputLabel: "Tên trang",
    defaultValue: pages[currentPageIndex].name,
    onClosePopup: onCloseChangeNamePopup,
  });

  const handlePageChangeName = () => {
    f7.popover.close();
    showModal();
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
            Đổi tên trang hiện tại
          </ListItem>
          <ListItem>Danh sách các trang</ListItem>
          <List>
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
