import React from "react";
import ReactDOMServer from "react-dom/server";
import { Button } from "framework7-react";
import $ from "jquery";

export const alert = (title, text, callbackOk) => {
  let dialogId = "dialog-alert";
  const open = () => {
    $(`#${dialogId}`).css({ display: "block" });
    $(`#${dialogId} .title`).html(title);
    $(`#${dialogId} .text`).html(text);
    $(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    $(`#${dialogId}`).css({ display: "none" });
    $(`#${dialogId} .title`).html("");
    $(`#${dialogId} .text`).html("");
    $(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  $(`#${dialogId} .ok-button`).off("click");
  $(`#${dialogId} .ok-button`).on("click", () => {
    callbackOk && callbackOk();
    close();
  });
};

export const confirm = (title, text, callbackOk, callbackCancel) => {
  let dialogId = "dialog-confirm";
  const open = () => {
    $(`#${dialogId}`).css({ display: "block" });
    $(`#${dialogId} .title`).html(title);
    $(`#${dialogId} .text`).html(text);
    $(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    $(`#${dialogId}`).css({ display: "none" });
    $(`#${dialogId} .title`).html("");
    $(`#${dialogId} .text`).html("");
    $(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  $(`#${dialogId} .ok-button`).off("click");
  $(`#${dialogId} .cancel-button`).off("click");

  $(`#${dialogId} .ok-button`).on("click", () => {
    callbackOk && callbackOk();
    close();
  });
  $(`#${dialogId} .cancel-button`).on("click", () => {
    callbackCancel && callbackCancel();
    close();
  });
};

export const confirmDelete = (title, text, callbackOk, callbackCancel) => {
  let dialogId = "dialog-delete";
  const open = () => {
    $(`#${dialogId}`).css({ display: "block" });
    $(`#${dialogId} .title`).html(title);
    $(`#${dialogId} .text`).html(text);
    $(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    $(`#${dialogId}`).css({ display: "none" });
    $(`#${dialogId} .title`).html("");
    $(`#${dialogId} .text`).html("");
    $(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  $(`#${dialogId} .ok-button`).off("click");
  $(`#${dialogId} .cancel-button`).off("click");

  $(`#${dialogId} .ok-button`).on("click", () => {
    callbackOk && callbackOk();
    close();
  });
  $(`#${dialogId} .cancel-button`).on("click", () => {
    callbackCancel && callbackCancel();
    close();
  });
};

export const question = (title, text, callbackOk, callbackCancel) => {
  let dialogId = "dialog-question";
  const open = () => {
    $(`#${dialogId}`).css({ display: "block" });
    $(`#${dialogId} .title`).html(title);
    $(`#${dialogId} .text`).html(text);
    $(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    $(`#${dialogId}`).css({ display: "none" });
    $(`#${dialogId} .title`).html("");
    $(`#${dialogId} .text`).html("");
    $(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  $(`#${dialogId} .ok-button`).off("click");
  $(`#${dialogId} .cancel-button`).off("click");

  $(`#${dialogId} .ok-button`).on("click", () => {
    callbackOk();
    close();
  });
  $(`#${dialogId} .cancel-button`).on("click", () => {
    callbackCancel();
    close();
  });
};

export const prompt = (title, text, callbackOk, callbackCancel, defaultValue) => {
  let dialogId = "dialog-prompt";
  const open = () => {
    $(`#${dialogId}`).css({ display: "block" });
    $(`#${dialogId} .title`).html(title);
    $(`#${dialogId} .text`).html(text);
    $(`#${dialogId} .input`).val(defaultValue);
    $(`#${dialogId} .ok-button`).addClass("disabled");
    $(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    $(`#${dialogId}`).css({ display: "none" });
    $(`#${dialogId} .title`).html("");
    $(`#${dialogId} .text`).html("");
    $(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  $(`#${dialogId} .ok-button`).off("click");
  $(`#${dialogId} .cancel-button`).off("click");

  $(`#${dialogId} .ok-button`).on("click", () => {
    callbackOk($(`#${dialogId} .input`).val());
    close();
  });
  $(`#${dialogId} .cancel-button`).on("click", () => {
    callbackCancel();
    close();
  });
};

export const promptNumpad = (callbackOk, defaultValue) => {
  let dialogId = "dialog-prompt-numpad";
  const open = () => {
    $(`#${dialogId}`).css({ display: "block" });
    $(`#${dialogId} .input`).val(defaultValue);
    $(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    $(`#${dialogId}`).css({ display: "none" });
    $(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  window.toClearNumpad = true;

  $(`#${dialogId} .ok-button`).off("click");

  $(`#${dialogId} .ok-button`).on("click", () => {
    callbackOk($(`#${dialogId} .input`).val());
    close();
    window.toClearNumpad = true;
  });
};

export const zipUpload = (title, text, callbackOk, callbackCancel) => {
  let dialogId = "dialog-zip-upload";
  const open = () => {
    $(`#${dialogId}`).css({ display: "block" });
    $(`#${dialogId} .title`).html(title);
    $(`#${dialogId} .text`).html(text);
    $(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    $(`#${dialogId}`).css({ display: "none" });
    $(`#${dialogId} .title`).html("");
    $(`#${dialogId} .text`).html("");
    $(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  $(`#${dialogId} .ok-button`).off("click");
  $(`#${dialogId} .cancel-button`).off("click");

  $(`#${dialogId} .ok-button`).on("click", () => {
    callbackOk($(`#${dialogId} .input`).val());
    close();
  });
  $(`#${dialogId} .cancel-button`).on("click", () => {
    callbackCancel();
    close();
  });
};

export const jsonUpload = (title, text, callbackOk, callbackCancel) => {
  let dialogId = "dialog-json-upload";
  const open = () => {
    $(`#${dialogId}`).css({ display: "block" });
    $(`#${dialogId} .title`).html(title);
    $(`#${dialogId} .text`).html(text);
    $(`#${dialogId} input`).val("");
    $(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    $(`#${dialogId}`).css({ display: "none" });
    $(`#${dialogId} .title`).html("");
    $(`#${dialogId} .text`).html("");
    $(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  $(`#${dialogId} .ok-button`).off("click");
  $(`#${dialogId} .cancel-button`).off("click");

  $(`#${dialogId} .ok-button`).on("click", () => {
    callbackOk();
    close();
  });
  $(`#${dialogId} .cancel-button`).on("click", () => {
    callbackCancel();
    close();
  });
};

export const askUpgradeFirmware = (callbackRemind) => {
  let dialogId = "dialog-firmware";
  const open = () => {
    $(`#${dialogId}`).css({ display: "block" });
    $(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    $(`#${dialogId}`).css({ display: "none" });
    $(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  $(`#${dialogId} .ok-button`).off("click");

  $(`#${dialogId} .ok-button`).on("click", () => {
    const isChecked = $(`#${dialogId} .remind-checkbox`).prop("checked");
    if (isChecked) callbackRemind();
    close();
  });
};

export const changeFwDeviceName = (deviceName, callbackOK) => {
  let dialogId = "dialog-devicename";
  const open = () => {
    $(`#${dialogId}`).css({ display: "block" });
    $(`#${dialogId} .input`).val(deviceName);
    $(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    $(`#${dialogId}`).css({ display: "none" });
    $(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  $(`#${dialogId} .ok-button`).off("click");
  $(`#${dialogId} .cancel-button`).off("click");

  $(`#${dialogId} .cancel-button`).on("click", () => {
    close();
  });

  $(`#${dialogId} .ok-button`).on("click", () => {
    const name = $(`#${dialogId} .input`).val().trim();
    if (name != deviceName) callbackOK(name);
    close();
  });
};

export const notiErrorInstruction = (content, buttonsMapping) => {
  let dialogId = "dialog-error-instruction";

  const open = () => {
    buttonsMapping.forEach((element, index) => {
      $(`#${dialogId} .buttons`).append(
        ReactDOMServer.renderToString(
          <Button className="option-button" id={"button_id_" + index}>
            {element["name"]}
          </Button>
        )
      );
    });

    $(`#${dialogId}`).css({ display: "block" });
    $(`#${dialogId} .error-content`).html(content);
    $(`#${dialogId}`).addClass("dialog-in");
  };

  const close = () => {
    $(`#${dialogId}`).css({ display: "none" });
    $(`#${dialogId} .error-content`).html("");
    $(`#${dialogId}`).removeClass("dialog-in");
    $(`#${dialogId} .buttons`).html(ReactDOMServer.renderToString(<Button className="cancel-button">Bỏ qua</Button>));
  };

  open();

  buttonsMapping.forEach((element, index) => {
    $(`#${dialogId} #${"button_id_" + index}`).off("click");
    $(`#${dialogId} #${"button_id_" + index}`).on("click", () => {
      element["callback"]();
      close();
    });
  });

  $(`#${dialogId} .cancel-button`).off("click");
  $(`#${dialogId} .cancel-button`).on("click", () => {
    close();
  });
};

export default {
  alert,
  confirm,
  confirmDelete,
  question,
  prompt,
  promptNumpad,
  zipUpload,
  jsonUpload,
  askUpgradeFirmware,
  changeFwDeviceName,
  notiErrorInstruction,
};
