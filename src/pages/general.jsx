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
import CustomButton from "../components/atoms/custom-button";
import { ListItem, Page } from "framework7-react";
import APRCM from "../img/general/APRCM.png";
import PPRCM from "../img/general/PPRCM.png";

const General = () => {
  return (
    <Page className="bg-color-regal-blue">
      <Stack
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "78vw",
          height: "100%",
          mt: 4,
          px: 10,
        }}
      >
        <Stack
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 3,
            width: "100%",
            pr: 4,
            mr: 4,
          }}
        >
          <CustomButton title={"Check Config"} />
          <CustomButton title={"Save"} />
          <CustomButton title={"Generate"} />
        </Stack>
        <Stack sx={{ pt: "10%", display: "flex" }}>
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
          <Stack display={"flex"} flexDirection={"row"} gap={4}>
            <Option image={APRCM} title={"APRCM"} content={["Can run individually", "Have TCPU, TBUS, ROM, RAM"]} />
            <Option
              image={PPRCM}
              title={"PPRCM"}
              content={["Control by other APRCM", "Does not have TCPU, TBUS, ROM, RAM"]}
            />
          </Stack>{" "}
        </RadioGroup>
      </Stack>
    </Page>
  );
};

const Option = ({ image, content, title }) => {
  return (
    <Stack sx={{ display: "flex", flexDirection: "column" }}>
      <img src={image} style={{ width: "100%", objectFit: "cover" }} />
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

export default General;
