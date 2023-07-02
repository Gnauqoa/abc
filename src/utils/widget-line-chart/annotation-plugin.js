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

export const onClickChartHandler = (event, elements, chart, selectedPointElement) => {
  let newPointEl;

  if (event.type === "click") {
    const isPointElement = elements[0]?.element instanceof PointElement;

    // Handle click point
    if (isPointElement || selectedPointElement !== null) {
      if (isPointElement) {
        clearAllSelectedPoints(chart);

        const selectedPoint = elements[0];
        const datasetIndex = selectedPoint.datasetIndex;
        const dataPointIndex = selectedPoint.index;
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
      } else if (selectedPointElement !== null) {
        newPointEl = null;

        clearAllSelectedPoints(chart);
        chart.update();
      }
      return { status: true, newPointEl };
    }
  }
  return { status: false, newPointEl };
};
