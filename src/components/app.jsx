import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import EdlHome from "../pages/home";
import General from "../pages/general/prcm";
import LeftBar from "./LeftBar";
import { createTheme, ThemeProvider } from "@mui/material";
import QPCHpage from "../pages/general/qpch";
import APRCMpage from "../pages/general/apcrm";

const theme = createTheme({
  palette: {
    primary: {
      main: "#65558F",
    },
  },
});

const Layout = ({ children }) => {
  const location = useLocation();
  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <LeftBar />
      <div
        style={{
          width: location.pathname.includes("general") ? "80vw" : "90vw",
          maxWidth: location.pathname.includes("general") ? "80vw" : "90vw",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const AppRoutes = () => (
  <ThemeProvider theme={theme}>
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<EdlHome />} />
          <Route path="/general/prcm" element={<General />} />
          <Route path="/general/qpch" element={<QPCHpage />} />
          <Route path="/general/aprcm" element={<APRCMpage />} />
          <Route path="/general/*" element={<General />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>{" "}
      </Layout>
    </Router>
  </ThemeProvider>
);

export default AppRoutes;
