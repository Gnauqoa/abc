import React from "react";
import ReactDOMServer from "react-dom/server";
import { f7, Button } from "framework7-react";

export const alert = (title, text, callbackOk) => {
  let dialogId = "dialog-alert";
  const open = () => {
    f7.$(`#${dialogId}`).css({ display: "block" });
    f7.$(`#${dialogId} .title`).html(title);
    f7.$(`#${dialogId} .text`).html(text);
    f7.$(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    f7.$(`#${dialogId}`).css({ display: "none" });
    f7.$(`#${dialogId} .title`).html("");
    f7.$(`#${dialogId} .text`).html("");
    f7.$(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  f7.$(`#${dialogId} .ok-button`).off("click");
  f7.$(`#${dialogId} .ok-button`).on("click", () => {
    callbackOk && callbackOk();
    close();
  });
};

export const confirm = (title, text, callbackOk, callbackCancel) => {
  let dialogId = "dialog-confirm";
  const open = () => {
    f7.$(`#${dialogId}`).css({ display: "block" });
    f7.$(`#${dialogId} .title`).html(title);
    f7.$(`#${dialogId} .text`).html(text);
    f7.$(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    f7.$(`#${dialogId}`).css({ display: "none" });
    f7.$(`#${dialogId} .title`).html("");
    f7.$(`#${dialogId} .text`).html("");
    f7.$(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  f7.$(`#${dialogId} .ok-button`).off("click");
  f7.$(`#${dialogId} .cancel-button`).off("click");

  f7.$(`#${dialogId} .ok-button`).on("click", () => {
    callbackOk && callbackOk();
    close();
  });
  f7.$(`#${dialogId} .cancel-button`).on("click", () => {
    callbackCancel && callbackCancel();
    close();
  });
};

export const confirmDelete = (title, text, callbackOk, callbackCancel) => {
  let dialogId = "dialog-delete";
  const open = () => {
    f7.$(`#${dialogId}`).css({ display: "block" });
    f7.$(`#${dialogId} .title`).html(title);
    f7.$(`#${dialogId} .text`).html(text);
    f7.$(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    f7.$(`#${dialogId}`).css({ display: "none" });
    f7.$(`#${dialogId} .title`).html("");
    f7.$(`#${dialogId} .text`).html("");
    f7.$(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  f7.$(`#${dialogId} .ok-button`).off("click");
  f7.$(`#${dialogId} .cancel-button`).off("click");

  f7.$(`#${dialogId} .ok-button`).on("click", () => {
    callbackOk && callbackOk();
    close();
  });
  f7.$(`#${dialogId} .cancel-button`).on("click", () => {
    callbackCancel && callbackCancel();
    close();
  });
};

export const question = (title, text, callbackOk, callbackCancel) => {
  let dialogId = "dialog-question";
  const open = () => {
    f7.$(`#${dialogId}`).css({ display: "block" });
    f7.$(`#${dialogId} .title`).html(title);
    f7.$(`#${dialogId} .text`).html(text);
    f7.$(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    f7.$(`#${dialogId}`).css({ display: "none" });
    f7.$(`#${dialogId} .title`).html("");
    f7.$(`#${dialogId} .text`).html("");
    f7.$(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  f7.$(`#${dialogId} .ok-button`).off("click");
  f7.$(`#${dialogId} .cancel-button`).off("click");

  f7.$(`#${dialogId} .ok-button`).on("click", () => {
    callbackOk();
    close();
  });
  f7.$(`#${dialogId} .cancel-button`).on("click", () => {
    callbackCancel();
    close();
  });
};

export const prompt = (title, text, callbackOk, callbackCancel, defaultValue) => {
  let dialogId = "dialog-prompt";
  const open = () => {
    f7.$(`#${dialogId}`).css({ display: "block" });
    f7.$(`#${dialogId} .title`).html(title);
    f7.$(`#${dialogId} .text`).html(text);
    f7.$(`#${dialogId} .input`).val(defaultValue);
    f7.$(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    f7.$(`#${dialogId}`).css({ display: "none" });
    f7.$(`#${dialogId} .title`).html("");
    f7.$(`#${dialogId} .text`).html("");
    f7.$(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  f7.$(`#${dialogId} .ok-button`).off("click");
  f7.$(`#${dialogId} .cancel-button`).off("click");

  f7.$(`#${dialogId} .ok-button`).on("click", () => {
    callbackOk(f7.$(`#${dialogId} .input`).val());
    close();
  });
  f7.$(`#${dialogId} .cancel-button`).on("click", () => {
    callbackCancel();
    close();
  });
};

export const promptNumpad = (callbackOk, defaultValue) => {
  let dialogId = "dialog-prompt-numpad";
  const open = () => {
    f7.$(`#${dialogId}`).css({ display: "block" });
    f7.$(`#${dialogId} .input`).val(defaultValue);
    f7.$(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    f7.$(`#${dialogId}`).css({ display: "none" });
    f7.$(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  window.toClearNumpad = true;

  f7.$(`#${dialogId} .ok-button`).off("click");

  f7.$(`#${dialogId} .ok-button`).on("click", () => {
    callbackOk(f7.$(`#${dialogId} .input`).val());
    close();
    window.toClearNumpad = true;
  });
};

export const zipUpload = (title, text, callbackOk, callbackCancel) => {
  let dialogId = "dialog-zip-upload";
  const open = () => {
    f7.$(`#${dialogId}`).css({ display: "block" });
    f7.$(`#${dialogId} .title`).html(title);
    f7.$(`#${dialogId} .text`).html(text);
    f7.$(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    f7.$(`#${dialogId}`).css({ display: "none" });
    f7.$(`#${dialogId} .title`).html("");
    f7.$(`#${dialogId} .text`).html("");
    f7.$(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  f7.$(`#${dialogId} .ok-button`).off("click");
  f7.$(`#${dialogId} .cancel-button`).off("click");

  f7.$(`#${dialogId} .ok-button`).on("click", () => {
    callbackOk(f7.$(`#${dialogId} .input`).val());
    close();
  });
  f7.$(`#${dialogId} .cancel-button`).on("click", () => {
    callbackCancel();
    close();
  });
};

export const jsonUpload = (title, text, callbackOk, callbackCancel) => {
  let dialogId = "dialog-json-upload";
  const open = () => {
    f7.$(`#${dialogId}`).css({ display: "block" });
    f7.$(`#${dialogId} .title`).html(title);
    f7.$(`#${dialogId} .text`).html(text);
    f7.$(`#${dialogId} input`).val("");
    f7.$(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    f7.$(`#${dialogId}`).css({ display: "none" });
    f7.$(`#${dialogId} .title`).html("");
    f7.$(`#${dialogId} .text`).html("");
    f7.$(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  f7.$(`#${dialogId} .ok-button`).off("click");
  f7.$(`#${dialogId} .cancel-button`).off("click");

  f7.$(`#${dialogId} .ok-button`).on("click", () => {
    callbackOk();
    close();
  });
  f7.$(`#${dialogId} .cancel-button`).on("click", () => {
    callbackCancel();
    close();
  });
};

export const askUpgradeFirmware = (callbackRemind) => {
  let dialogId = "dialog-firmware";
  const open = () => {
    f7.$(`#${dialogId}`).css({ display: "block" });
    f7.$(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    f7.$(`#${dialogId}`).css({ display: "none" });
    f7.$(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  f7.$(`#${dialogId} .ok-button`).off("click");

  f7.$(`#${dialogId} .ok-button`).on("click", () => {
    const isChecked = f7.$(`#${dialogId} .remind-checkbox`).prop("checked");
    if (isChecked) callbackRemind();
    close();
  });
};

export const changeFwDeviceName = (deviceName, callbackOK) => {
  let dialogId = "dialog-devicename";
  const open = () => {
    f7.$(`#${dialogId}`).css({ display: "block" });
    f7.$(`#${dialogId} .input`).val(deviceName);
    f7.$(`#${dialogId}`).addClass("dialog-in");
  };
  const close = () => {
    f7.$(`#${dialogId}`).css({ display: "none" });
    f7.$(`#${dialogId}`).removeClass("dialog-in");
  };

  open();

  f7.$(`#${dialogId} .ok-button`).off("click");
  f7.$(`#${dialogId} .cancel-button`).off("click");

  f7.$(`#${dialogId} .cancel-button`).on("click", () => {
    close();
  });

  f7.$(`#${dialogId} .ok-button`).on("click", () => {
    const name = f7.$(`#${dialogId} .input`).val().trim();
    if (name != deviceName) callbackOK(name);
    close();
  });
};

export const notiErrorInstruction = (content, buttonsMapping) => {
  let dialogId = "dialog-error-instruction";

  const open = () => {
    buttonsMapping.forEach((element, index) => {
      f7.$(`#${dialogId} .buttons`).append(
        ReactDOMServer.renderToString(
          <Button className="option-button" id={"button_id_" + index}>
            {element["name"]}
          </Button>
        )
      );
    });

    f7.$(`#${dialogId}`).css({ display: "block" });
    f7.$(`#${dialogId} .error-content`).html(content);
    f7.$(`#${dialogId}`).addClass("dialog-in");
  };

  const close = () => {
    f7.$(`#${dialogId}`).css({ display: "none" });
    f7.$(`#${dialogId} .error-content`).html("");
    f7.$(`#${dialogId}`).removeClass("dialog-in");
    f7.$(`#${dialogId} .buttons`).html(
      ReactDOMServer.renderToString(<Button className="cancel-button">Bỏ qua</Button>)
    );
  };

  open();

  buttonsMapping.forEach((element, index) => {
    f7.$(`#${dialogId} #${"button_id_" + index}`).off("click");
    f7.$(`#${dialogId} #${"button_id_" + index}`).on("click", () => {
      element["callback"]();
      close();
    });
  });

  f7.$(`#${dialogId} .cancel-button`).off("click");
  f7.$(`#${dialogId} .cancel-button`).on("click", () => {
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
