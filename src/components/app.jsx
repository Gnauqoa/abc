import React from "react";
import { getDevice } from "framework7/lite-bundle";
import { f7, f7ready, App, View } from "framework7-react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import i18n from "i18next";
import store from "store";

import cordovaApp from "../js/cordova-app";
import routes from "../js/routes";
import MainMenu from "../pages/menu/menu";
import Dialogs from "./molecules/dialog/dialogs";
import dataManager from "../services/data-manager";
import { ActivityContextProvider } from "../context/ActivityContext";
import { TableContextProvider } from "../context/TableContext";
import commonEn from "../translations/en/common.json";
import commonVi from "../translations/vi/common.json";

const theme = createTheme({
  palette: {
    primary: {
      main: "#65558F",
    },
  },
});

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    detection: {
      order: ["localStorage"],
    },
    lng: store.get("i18nextLng") || "vi",
    interpolation: {
      escapeValue: false,
    },
    react: { withRef: true },
    resources: {
      en: {
        translation: commonEn,
      },
      vi: {
        translation: commonVi,
      },
    },
  })
  .then((t) => {});
import MobileSerialManagerIST from "../services/mobile-serial-manager";
import { createTheme, Stack, ThemeProvider } from "@mui/material";
import LeftBar from "./LeftBar";

const MyApp = () => {
  const device = getDevice();
  // Framework7 Parameters
  const f7params = {
    name: "InnoLab", // App name
    theme: "auto", // Automatic theme detection

    id: "vn.ohstem.edl_app", // App bundle ID
    // App store
    store: store,
    // App routes
    routes: routes,
    // Register service worker (only on production build)
    serviceWorker:
      process.env.NODE_ENV === "production"
        ? {
            path: "/service-worker.js",
          }
        : {},

    // Input settings
    input: {
      scrollIntoViewOnFocus: device.cordova && !device.electron,
      scrollIntoViewCentered: device.cordova && !device.electron,
    },
    // Cordova Statusbar settings
    statusbar: {
      iosOverlaysWebView: true,
      androidOverlaysWebView: false,
    },
  };
  f7ready(() => {
    // Init cordova APIs (see cordova-app.js)
    if (f7.device.cordova) {
      cordovaApp.init(f7);
      if (f7.device.android) {
        MobileSerialManagerIST.init();
        navigator.geolocation.getCurrentPosition(
          () => {},
          (err) => {
            logger.error("Cannot enable location", err);
          }
        );

        ble.isEnabled(
          () => {},
          () => {
            // Bluetooth not yet enabled so we try to enable it
            ble.enable(
              () => {},
              (err) => {
                console.error("Cannot enable bluetooth", err);
              }
            );
          }
        );
      }
    }

    // Call F7 APIs here
    if (f7.device.electron) {
      window._cdvElectronIpc.onDeviceDataReceived((event, data, source, device) => {
        dataManager.onDataCallback(data, source, device);
      });
      window._cdvElectronIpc.onDeviceDisconnected((event, value) => {
        dataManager.callbackSensorDisconnected(value);
      });
    }
  });

  return (
    <I18nextProvider i18n={i18n}>
      <ActivityContextProvider>
        <ThemeProvider theme={theme}>
          <TableContextProvider>
            <App {...f7params}>
              <Stack sx={{ display: "flex", flexDirection: "row", height: "100%", width: "100%" }}>
                <LeftBar />
                <View
                  style={{ overflow: "hidden", width: "90vw", maxWidth: "90vw" }}
                  main
                  url="/general"
                  className="safe-areas"
                />
              </Stack>
            </App>
          </TableContextProvider>
        </ThemeProvider>
      </ActivityContextProvider>
    </I18nextProvider>
  );
};
export default MyApp;
