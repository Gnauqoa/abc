import { PointElement } from "chart.js";
import {
  ALLOW_CLICK_ANNOTATIONS,
  LABEL_NOTE_BACKGROUND,
  LABEL_NOTE_BACKGROUND_ACTIVE,
  clearAllSelectedPoints,
} from "./commons";
import StoreService from "../../services/store-service";
import { LINE_CHART_LABEL_NOTE_TABLE } from "../../js/constants";

const labelNotesStorage = new StoreService(LINE_CHART_LABEL_NOTE_TABLE);

export const onClickNoteElement = ({ element, selectedNoteElement }) => {
  const elementNoteId = element?.options?.id;
  const prefixElementNoteId = elementNoteId?.split("_")?.[0];

  // Only allows to select label note
  if (!ALLOW_CLICK_ANNOTATIONS.includes(prefixElementNoteId)) return { status: false, element: element };

  if (selectedNoteElement === element) {
    element.options.backgroundColor = LABEL_NOTE_BACKGROUND;

    // Update label note background color
    const labelNote = labelNotesStorage.find(elementNoteId);
    if (!labelNote) return { status: false, element: element };
    const updateNote = { ...labelNote.label, backgroundColor: LABEL_NOTE_BACKGROUND };
    labelNotesStorage.merge({ id: elementNoteId, label: updateNote });
    selectedNoteElement = null;
  } else {
    if (selectedNoteElement !== null) {
      const prevNoteElementId = selectedNoteElement.options.id;
      selectedNoteElement.backgroundColor = LABEL_NOTE_BACKGROUND;

      // Update prev label note background color
      const prevLabelNote = labelNotesStorage.find(prevNoteElementId);
      if (!prevLabelNote) return { status: false, element: element };
      const updatePrevNote = { ...prevLabelNote.label, backgroundColor: LABEL_NOTE_BACKGROUND };
      labelNotesStorage.merge({ id: prevNoteElementId, label: updatePrevNote });
    }

    element.options.backgroundColor = LABEL_NOTE_BACKGROUND_ACTIVE;

    // Update label note background color
    const labelNote = labelNotesStorage.find(elementNoteId);
    if (!labelNote) return { status: false, element: element };
    const updateNote = { ...labelNote.label, backgroundColor: LABEL_NOTE_BACKGROUND_ACTIVE };
    labelNotesStorage.merge({ id: elementNoteId, label: updateNote });

    selectedNoteElement = element;
  }

  return { status: true, element: selectedNoteElement };
};

export const onClickChartHandler = ({ event, elements, chart, selectedPointElement, widgetIndex }) => {
  let newPointEl;

  if (event.type === "click") {
    const isPointElement = elements[0]?.element instanceof PointElement;

    // Handle click point
    if (isPointElement || selectedPointElement !== null) {
      if (isPointElement) {
        clearAllSelectedPoints(chart);

        const selectedPoint = elements[0];
        const datasetIndex = selectedPoint.datasetIndex;
        let dataPointIndex = selectedPoint.index;
        const currentDataset = chart.data.datasets[datasetIndex];
        const newPointBackgroundColor = Array.from(
          { length: currentDataset.data.length },
          () => currentDataset.backgroundColor
        );
        const newPointBorderColor = Array.from(
          { length: currentDataset.data.length },
          () => currentDataset.borderColor
        );

        newPointEl = selectedPoint;
        newPointBackgroundColor[dataPointIndex] = "red";

        currentDataset.pointBackgroundColor = newPointBackgroundColor;
        currentDataset.pointBorderColor = newPointBorderColor;

        chart.update();

        // Tính toán vị trí của icons
        // const x = selectedPoint.element.x + rect.left;
        // const y = selectedPoint.element.y + rect.top - 20; // 20px phía trên
        const x = selectedPoint.element.x - 30;
        let y = selectedPoint.element.y - 70;
        if (y < 20) y = y + 120;

        const iconContainers = document.getElementsByClassName("icon-container-widget");
        Array.from(iconContainers).forEach((iconContainer) => {
          iconContainer.style.display = "none";
        });

        const iconContainerSelected = document.getElementById(`icon-container-widget-${widgetIndex}`);
        iconContainerSelected.style.left = `${x}px`;
        iconContainerSelected.style.top = `${y}px`;
        iconContainerSelected.style.display = "flex"; // Hiện các icon

        return { status: true, newPointEl };
      } else if (selectedPointElement !== null) {
        newPointEl = null;

        clearAllSelectedPoints(chart);
        chart.update();

        // Ẩn icon nếu không có điểm nào được chọn
        const iconContainer = document.getElementById(`icon-container-widget-${widgetIndex}`);
        iconContainer.style.display = "none";
      }
    } else {
      // Ẩn icon nếu không có điểm nào được chọn
      const iconContainer = document.getElementById(`icon-container-widget-${widgetIndex}`);
      iconContainer.style.display = "none";
    }
  }
  return { status: false, newPointEl };
};
