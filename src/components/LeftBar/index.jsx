import React from "react";
import { Stack, Typography } from "@mui/material";
import { Link } from "framework7-react";
import clock from "../../img/icons/clock.svg";
import code from "../../img/icons/code.svg";
import memory from "../../img/icons/memory.svg";
import doc from "../../img/icons/doc.svg";
import reset from "../../img/icons/reset.svg";
import logo from "../../img/icons/logo.png";

const LeftBar = () => {
  return (
    <Stack
      sx={{
        display: "flex",
        gap: 3,
        flexDirection: "column",
        height: "100%",
        px: 4,
        pt: 16,
        backgroundColor: "#FEF7FF",
      }}
    >
      <img src={logo} style={{ width: 100 }} />
      <TabButton icon={memory} name="General" href={"/memory"} />
      <TabButton icon={clock} name="Clock" href={"/clock"} />
      <TabButton icon={reset} name="Reset" href={"/reset"} />
      <TabButton icon={doc} name="SFR" href={"/doc"} />
      <TabButton icon={code} name="Binary" href={"/code"} />
    </Stack>
  );
};

const TabButton = ({ icon, name, href }) => {
  return (
    <Link href={href} view=".view-main">
      <Stack sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <img src={icon} className="responsive" />
        <Typography sx={{ color: "black" }}>{name}</Typography>
      </Stack>
    </Link>
  );
};

export default LeftBar;
