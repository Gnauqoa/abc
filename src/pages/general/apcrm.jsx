import React from "react";
import { FormControlLabel, Radio, Stack, TextField, Typography } from "@mui/material";
import CustomButton from "../../components/atoms/custom-button";
import APRCM from "../../img/general/APRCM1.png";

const APRCMpage = () => {
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
      <Stack sx={{ pt: "10%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <img src={APRCM} style={{ width: "50%", objectFit: "cover" }} />
        <Stack justifyContent={"center"} display={"flex"} flexDirection={"row"} gap={4} mt={3} width={"100%"}>
          <TextField
            sx={{
              "& .MuiInputBase-root": {
                height: 55,
                width: "210px",
                backgroundColor: "white",
              },
            }}
            size="normal"
            label="RAM Size (KB)"
          />{" "}
          <TextField
            sx={{
              "& .MuiInputBase-root": {
                height: 55,
                width: "210px",
                backgroundColor: "white",
              },
            }}
            size="normal"
            label="ROM Size (KB)"
          />{" "}
          <TextField
            sx={{
              "& .MuiInputBase-root": {
                height: 55,
                width: "210px",
                backgroundColor: "white",
              },
            }}
            size="normal"
            label="INT width"
          />
        </Stack>
      </Stack>
    </Stack>
  );
};

export default APRCMpage;
