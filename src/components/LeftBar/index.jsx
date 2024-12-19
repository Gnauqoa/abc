import React from "react";
import { Button, Stack, Typography } from "@mui/material";
import clock from "../../img/icons/clock.svg";
import code from "../../img/icons/code.svg";
import memory from "../../img/icons/memory.svg";
import doc from "../../img/icons/doc.svg";
import reset from "../../img/icons/reset.svg";
import logo from "../../img/icons/logo.png";
import { Link, useLocation } from "react-router-dom";

const LeftBar = () => {
  const location = useLocation();

  return (
    <Stack
      sx={{
        display: "flex",
        flexDirection: "row",
        width: location.pathname.includes("/general") ? "20vw" : "10vw",
        maxWidth: location.pathname.includes("/general") ? "20vw" : "10vw",
      }}
    >
      <Stack
        sx={{
          display: "flex",
          gap: 3,
          flexDirection: "column",
          height: "100%",
          px: 4,
          pt: 16,
          backgroundColor: "#FEF7FF",
          width: "10vw",
          maxWidth: "10vw",
          overflow: "hidden",
          alignItems: "center",
        }}
      >
        <Link to="/">
          <img src={logo} style={{ width: 100 }} />
        </Link>
        <TabButton icon={memory} name="General" href={"/general/prcm"} />
        <TabButton icon={clock} name="Clock" href={"/clock"} />
        <TabButton icon={reset} name="Reset" href={"/reset"} />
        <TabButton icon={doc} name="SFR" href={"/doc"} />
        <TabButton icon={code} name="Binary" href={"/code"} />
      </Stack>
      {location.pathname.includes("/general") && <GeneralSubLeftBar />}
    </Stack>
  );
};

const generalTab = [
  { text: "PRCM Type", href: "/general/prcm" },
  {
    text: "Q/PCH Config",
    href: "/general/qpch",
  },
  {
    text: "APRCM Config",
    href: "/general/aprcm",
  },
];

const GeneralSubLeftBar = () => {
  const location = useLocation();

  return (
    <Stack
      sx={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#F7F2FA",
        px: 4,
        py: 6,
        width: "10vw",
        maxWidth: "10vw",
      }}
    >
      {generalTab.map((tab) => (
        <Link to={tab.href} key={tab.text}>
          <Button
            sx={{
              width: "auto",
              textTransform: "none",
              backgroundColor: location.pathname.includes(tab.href) ? "#E8DEF8" : "",
            }}
          >
            {tab.text}
          </Button>
        </Link>
      ))}
    </Stack>
  );
};

const TabButton = ({ icon, name, href }) => {
  return (
    <Link to={href} view=".view-main">
      <Stack sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <img src={icon} style={{ width: 44, height: 44 }} />
        <Typography sx={{ color: "black" }}>{name}</Typography>
      </Stack>
    </Link>
  );
};

export default LeftBar;
