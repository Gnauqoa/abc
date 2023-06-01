import { LINE_CHART_LABEL_NOTE_TABLE } from "../../js/constants";
import StoreService from "../../services/store-service";
import {
  LABEL_NOTE_BACKGROUND,
  PREFIX_LABEL_NOTE,
  SAMPLE_LABEL_NOTE,
  clearAllSelectedPoints,
  prepareContentNote,
} from "./commons";

const labelNotesStorage = new StoreService(LINE_CHART_LABEL_NOTE_TABLE);

export const getAllCurrentLabelNotes = ({ pageId, dataRunId, hiddenDataRunIds }) => {
  const condition = {};
  if (pageId) condition.pageId = pageId;
  if (dataRunId) condition.dataRunId = dataRunId;

  const allLabelNotes = labelNotesStorage.query(condition);
  const labelNotes = {};

  allLabelNotes.forEach((note) => {
    if (hiddenDataRunIds && hiddenDataRunIds.has(note.dataRunId)) return;

    const labelNote = note.label;
    const newLabelNote = {
      ...SAMPLE_LABEL_NOTE,
      content: labelNote.content,
      backgroundColor: labelNote.backgroundColor,
      xValue: labelNote.xValue,
      yValue: labelNote.yValue,
      xAdjust: labelNote.xAdjust,
      yAdjust: labelNote.yAdjust,
    };

    labelNotes[labelNote.id] = newLabelNote;
  });
  return labelNotes;
};

export const addLabelNote = ({ chartInstance, pageId, newContent, selectedPointElement, selectedNoteElement }) => {
  const isValidPointElement = selectedPointElement && selectedPointElement.element;
  const isValidNoteElement = selectedNoteElement && selectedNoteElement.options;
  if (!isValidPointElement && !isValidNoteElement) return false;

  let noteId;
  if (isValidNoteElement) {
    noteId = selectedNoteElement.options.id;
  } else {
    noteId = `${PREFIX_LABEL_NOTE}_${pageId}_${selectedPointElement.datasetIndex}_${selectedPointElement.index}`;
  }

  const handleOpenPopup = (noteContent) => {
    const newNoteContent = !noteContent ? null : prepareContentNote(noteContent);
    const labelNote = labelNotesStorage.find(noteId);

    if (labelNote) {
      const note = labelNote.label;
      const updatedNote = { ...note, content: newNoteContent };
      labelNotesStorage.merge({ id: noteId, label: updatedNote });
      chartInstance.config.options.plugins.annotation.annotations[noteId].content = newNoteContent;
    } else if (newNoteContent) {
      const xValueNoteElement = chartInstance.scales.x.getValueForPixel(selectedPointElement.element.x);
      const yValueNoteElement = chartInstance.scales.y.getValueForPixel(selectedPointElement.element.y);
      const newNote = {
        id: noteId,
        content: newNoteContent,
        backgroundColor: LABEL_NOTE_BACKGROUND,
        xValue: xValueNoteElement,
        yValue: yValueNoteElement,
        xAdjust: -60,
        yAdjust: -60,
      };

      const newNoteElement = {
        ...SAMPLE_LABEL_NOTE,
        ...newNote,
      };

      labelNotesStorage.save({
        id: noteId,
        label: newNote,
        pageId: pageId,
        dataRunId: chartInstance.data.datasets[selectedPointElement.datasetIndex].dataRunId,
      });
      chartInstance.config.options.plugins.annotation.annotations = {
        ...chartInstance.config.options.plugins.annotation.annotations,
        [noteId]: newNoteElement,
      };
    }
    clearAllSelectedPoints(chartInstance);
    chartInstance.update();
  };

  handleOpenPopup(newContent);
  return true;
};
