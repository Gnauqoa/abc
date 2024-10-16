import { f7, f7ready } from "framework7-react";
import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import dataManager from "../services/data-manager";
import { SCAN_SERIAL_INTERVAL, USB_TYPE } from "../js/constants";

export const MobileSerialContext = createContext({
  data: [],
  connected: false,
  isScanning: false,
});

export const MobileSerialContextProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [data, setData] = useState([]);
  const scanIntervalRef = useRef(null);

  const handleError = useCallback((message) => {
    setError(message);
    console.error("Serial Error:", message);

    if (!message.includes("Already open")) setConnected(false);

    if (!message.includes("No device found") && !message.includes("Already open")) {
      alert(`Error: ${message}`);
    }
  }, []);

  const scan = useCallback(() => {
    if (!window.serial) return;
    console.log("Scanning for devices...");
    serial.requestPermission((success) => {
      setConnected(true);
      console.log("Connection granted:", success);

      serial.open(
        { baudRate: 115200 },
        () => {
          serial.registerReadCallback((data) => setData(new Uint8Array(data)), handleError);
        },
        handleError
      );
    }, handleError);
  }, [handleError]);

  useEffect(() => {
    f7ready(() => {
      if (f7.device.android) {
        setIsScanning(true); // Set isScanning to true when starting
        scanIntervalRef.current = setInterval(scan, SCAN_SERIAL_INTERVAL); // Start scanning interval
      }
    });

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current); // Clear the interval on unmount
      }
    };
  }, []);

  useEffect(() => {
    if (data.length) {
      dataManager.onDataCallback(data, USB_TYPE, { deviceId: "as" });
    }
  }, [data]);

  return (
    <MobileSerialContext.Provider
      value={{
        connected,
        isScanning,
        data,
      }}
    >
      {children}
    </MobileSerialContext.Provider>
  );
};

export const useMobileSerialContext = () => useContext(MobileSerialContext);
