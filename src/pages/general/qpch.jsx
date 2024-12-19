import React from "react";
import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import QPCH1 from "../../img/general/QPCH1.png";
import QPCH2 from "../../img/general/QPCH2.png";
import CustomButton from "../../components/atoms/custom-button";

const rows = [
  [1, 2, 3],
  [2, 3, 2],
  [null, null, null],
  [null, null, null],
  [null, null, null],
  [null, null, null],
  [null, null, null],
  [null, null, null],
];

const QPCHpage = () => {
  return (
    <Stack
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      }}
    >
      {" "}
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
      <Stack sx={{ mt: 12, display: "flex", flexDirection: "row", mx: 12, justifyContent: "space-between" }}>
        <Option image={QPCH1} title={"Number of PCH"} />
        <Option image={QPCH2} title={"Number of QCH"} />
      </Stack>
      <TableContainer sx={{ maxWidth: 650, mx: 12, mt: 6 }} component={Paper}>
        <Table sx={{ maxWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell align="right">PCH</TableCell>
              <TableCell align="right">PACTIVE WIDTH</TableCell>
              <TableCell align="right">PSTATE WIDTHƒ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                <TableCell align="right">{row[0]}</TableCell>
                <TableCell align="right">{row[1]}</TableCell>
                <TableCell align="right">{row[2]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

const Option = ({ image, title }) => {
  return (
    <Stack sx={{ display: "flex", flexDirection: "column" }}>
      <img src={image} style={{ width: "500px", objectFit: "cover" }} />
      <TextField
        sx={{
          "& .MuiInputBase-root": {
            height: 55,
            width: "210px",
            backgroundColor: "white",
          },
        }}
        size="normal"
        label={title}
      />
    </Stack>
  );
};

export default QPCHpage;
