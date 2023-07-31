import { useRef } from "react";
import { f7 } from "framework7-react";
import { timeoutEventData } from "../../../utils/core";
import "./index.scss";

export default function useToast() {
  const toast = useRef(null);

  const show = (text, type = "info", position = "bottom", timeout = 3000) => {
    /**
     * Create and open a Toast instance
     *
     * @param {string} text Message of the toast
     * @param {string} type Message type. Can be info, success, warning or error.
     * @param {string} position Toast position. Can be bottom, center or top.
     * @param {number} timeout The close timeout in millisecond.
     */
    toast.current = f7.toast.create({
      text,
      cssClass: type,
      position,
      closeTimeout: timeout,
    });
    toast.current.open();
  };

  /**
   * Notify status of DTO command via Toast
   */
  const notifyCmdDTO = async (cmdName = "") => {
    try {
      const status = await timeoutEventData("statusCmdDTO");
      if (status === "OK") {
        show(`Gởi lệnh ${cmdName} thành công.`, "success");
        return true;
      } else {
        show(`Gởi lệnh ${cmdName} bị lỗi.`, "error");
        return false;
      }
    } catch (err) {
      show(`Gởi lệnh ${cmdName} không nhận được tín hiệu phản hồi.`, "error");
      return false;
    }
  };

  return { show, notifyCmdDTO };
}
