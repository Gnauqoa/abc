import React from "react";
import { Button } from "@mui/material";

const CustomButton = ({ title, icon }) => {
  return (
    <Button
      startIcon={icon ? <img src={icon} style={{ width: 14, height: 14 }} /> : undefined}
      sx={{
        overflow: "hidden",
        px: 4,
        py: 1,
        width: "auto",
        backgroundColor: "#65558F",
        fontWeight: 600,
        color: "#fff",
        textTransform: "none",
        borderRadius: "24px",
      }}
    >
      {title}
    </Button>
  );
};
export default CustomButton;
