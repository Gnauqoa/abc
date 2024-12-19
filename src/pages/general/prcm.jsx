import React, { useRef, useState } from "react";
import {
  Button,
  Checkbox,
  FormControlLabel,
  List,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CustomButton from "../../components/atoms/custom-button";
import { Page } from "framework7-react";
import APRCM from "../../img/general/APRCM.png";
import PPRCM from "../../img/general/PPRCM.png";

const PRCMpage = () => {
  return (
    <Stack
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      }}
    >
      <Stack
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: 3,
          width: "100%",
          mt: 4,
        }}
      >
        <CustomButton title={"Check Config"} />
        <CustomButton title={"Save"} />
        <CustomButton title={"Generate"} />
        <div style={{ width: 40 }}></div>
      </Stack>
      <Stack sx={{ pt: "10%", display: "flex", ml: 4, flexDirection: "column" }}>
        <TextField
          sx={{
            "& .MuiInputBase-root": {
              height: 55,
              width: "210px",
              backgroundColor: "white",
            },
          }}
          size="normal"
          label="PRCM name"
        />
      </Stack>{" "}
      <RadioGroup aria-labelledby="demo-radio-buttons-group-label" name="radio-buttons-group">
        <Stack display={"flex"} flexDirection={"row"} gap={4} width={"100%"}>
          <div style={{ width: 25 }}></div>

          <Option image={APRCM} title={"APRCM"} content={["Can run individually", "Have TCPU, TBUS, ROM, RAM"]} />
          <Option
            image={PPRCM}
            title={"PPRCM"}
            content={["Control by other APRCM", "Does not have TCPU, TBUS, ROM, RAM"]}
          />
          <div style={{ width: 25 }}></div>
        </Stack>{" "}
      </RadioGroup>
    </Stack>
  );
};

const Option = ({ image, content, title }) => {
  return (
    <Stack sx={{ display: "flex", flexDirection: "column" }}>
      <img src={image} style={{ width: "100%", height: "auto", objectFit: "cover" }} />
      <FormControlLabel value={title} control={<Radio />} label={title} />
      <ul style={{ paddingLeft: 15 }}>
        {content.map((item) => (
          <li key={item}>
            <Typography>{item}</Typography>
          </li>
        ))}
      </ul>
    </Stack>
  );
};

export default PRCMpage;
