import React, { useRef, useState } from "react";

import logo from "../img/icons/logo.png";
import plus from "../img/icons/plus.svg";
import upload from "../img/icons/upload.svg";
import guide from "../img/icons/guide.svg";

import { Button, Stack, Typography } from "@mui/material";
import CustomButton from "../components/atoms/custom-button";
import { Page } from "framework7-react";

export default () => {
  return (
    <Page className="bg-color-regal-blue">
      <Stack
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <img src={logo} style={{ height: 150, width: "auto", objectFit: "cover" }} />
        <Typography sx={{ mt: 3 }} variant="h2">
          BOS PRCM Generate Tool
        </Typography>
        <Stack sx={{ display: "flex", flexDirection: "row", gap: 2, mt: 3 }}>
          <CustomButton title={"New Design"} icon={plus} />
          <CustomButton title={"Load Design"} icon={upload} />
        </Stack>{" "}
        <Stack sx={{ mt: 4 }}>
          <CustomButton title={"User Guide"} icon={guide} />
        </Stack>
      </Stack>
    </Page>
  );
};
