import { round, mean, sum, max, min } from "mathjs";
import { roundXValue } from "./commons";
import {
  STATISTIC_LINEAR,
  STATISTIC_QUADRATIC,
  STATISTIC_POWER,
  STATISTIC_INVERSE,
  STATISTIC_INVERSE_SQUARE,
  STATISTIC_SINUSOIDAL,
  STATISTIC_AREA,
} from "./commons";

const COULD_NOT_FIND_BEST_FIT_LABEL = "Could not find a best fit";

// Utility function to calculate limits
const calculateLimits = (yValues) => {
  const maxY = max(yValues);
  const minY = min(yValues);
  const range = maxY - minY;
  const upperLimit = maxY + range / 2;
  const lowerLimit = minY - range / 2;

  return { upperLimit, lowerLimit };
};

// Utility function to check fit success
const checkFitSuccess = (xValues, equation, upperLimit, lowerLimit) => {
  const withinLimits = xValues.filter((x) => {
    const y = equation(x);
    return y <= upperLimit && y >= lowerLimit;
  });

  return withinLimits.length / xValues.length > 0.5;
};

const getMidOriginalPoint = (xValues, yValues) => {
  const n = yValues.length;
  return {
    x: xValues[Math.floor(n / 2)],
    y: yValues[Math.floor(n / 2)],
  };
};

// Example: Linear Regression
export const linearRegression = (data) => {
  const n = data.length;
  const xValues = data.map((point) => parseFloat(point.x));
  const yValues = data.map((point) => parseFloat(point.y));

  const midOriginalPoint = getMidOriginalPoint(xValues, yValues);
  const notFoundContent = [COULD_NOT_FIND_BEST_FIT_LABEL, "  y = mx + b", ""];

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += xValues[i];
    sumY += yValues[i];
    sumXY += xValues[i] * yValues[i];
    sumX2 += xValues[i] * xValues[i];
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const equation = (x) => slope * x + intercept;

  const { upperLimit, lowerLimit } = calculateLimits(yValues);
  const fitSuccessful = checkFitSuccess(xValues, equation, upperLimit, lowerLimit);
  console.log("fitSuccessful: ", upperLimit, lowerLimit, fitSuccessful);

  const content = fitSuccessful
    ? ["Linear fit", "  y = mx + b", `  m = ${round(slope, 4)}`, `  b = ${round(intercept, 4)}`, ""]
    : notFoundContent;

  return {
    type: STATISTIC_LINEAR,
    fitSuccessful,
    content,
    equationLabel: fitSuccessful ? `y = ${round(slope, 4)}x + ${round(intercept, 4)}` : "N/A",
    equation: fitSuccessful ? equation : () => NaN,
    midOriginalPoint,
  };
};

// Quadratic Regression
export const quadraticRegression = (data) => {
  const n = data.length;
  const xValues = data.map((point) => parseFloat(point.x));
  const yValues = data.map((point) => parseFloat(point.y));

  const midOriginalPoint = getMidOriginalPoint(xValues, yValues);
  const notFoundContent = [COULD_NOT_FIND_BEST_FIT_LABEL, "  y = ax² + bx + c", ""];

  let sumX = 0;
  let sumY = 0;
  let sumX2 = 0;
  let sumX3 = 0;
  let sumX4 = 0;
  let sumXY = 0;
  let sumX2Y = 0;

  for (let i = 0; i < n; i++) {
    const x = xValues[i];
    const y = yValues[i];
    const x2 = x * x;
    const x3 = x2 * x;
    const x4 = x2 * x2;

    sumX += x;
    sumY += y;
    sumX2 += x2;
    sumX3 += x3;
    sumX4 += x4;
    sumXY += x * y;
    sumX2Y += x2 * y;
  }

  // Calculate the denominator
  const denominator =
    n * sumX2 * sumX4 +
    sumX * sumX3 * sumX2 +
    sumX2 * sumX * sumX3 -
    sumX2 * sumX2 * sumX2 -
    n * sumX3 * sumX3 -
    sumX * sumX * sumX4;

  // Check if the denominator is zero
  if (denominator === 0) {
    return {
      type: STATISTIC_QUADRATIC,
      fitSuccessful: false,
      content: notFoundContent,
      equationLabel: "N/A",
      equation: () => NaN,
      midOriginalPoint,
    };
  }

  // Solve the coefficients a, b, and c
  const a =
    (sumY * sumX2 * sumX4 +
      sumX * sumX3 * sumX2Y +
      sumX2 * sumXY * sumX3 -
      sumX2 * sumX2 * sumX2Y -
      sumY * sumX3 * sumX3 -
      sumX * sumXY * sumX4) /
    denominator;

  const b =
    (n * sumXY * sumX4 +
      sumY * sumX3 * sumX2 +
      sumX2 * sumX * sumX2Y -
      sumX2 * sumXY * sumX2 -
      n * sumX3 * sumX2Y -
      sumY * sumX * sumX4) /
    denominator;

  const c =
    (n * sumX2 * sumX2Y +
      sumX * sumXY * sumX2 +
      sumX2 * sumY * sumX3 -
      sumX2 * sumXY * sumX2 -
      sumX * sumX2 * sumX2Y -
      n * sumY * sumX4) /
    denominator;

  const equation = (x) => a * x * x + b * x + c;
  const { upperLimit, lowerLimit } = calculateLimits(yValues);
  const fitSuccessful = checkFitSuccess(xValues, equation, upperLimit, lowerLimit);

  // Round the coefficients for better readability
  const aRounded = round(a, 4);
  const bRounded = round(b, 4);
  const cRounded = round(c, 4);

  const content = fitSuccessful
    ? ["Quadratic fit", "  y = ax² + bx + c", `  a = ${aRounded}`, `  b = ${bRounded}`, `  c = ${cRounded}`, ""]
    : notFoundContent;

  return {
    type: STATISTIC_QUADRATIC,
    fitSuccessful,
    content,
    equationLabel: fitSuccessful ? `y = ${aRounded}x² + ${bRounded}x + ${cRounded}` : "N/A",
    equation: fitSuccessful ? equation : () => NaN,
    midOriginalPoint,
  };
};

// Power Regression
export const powerRegression = (data) => {
  const n = data.length;
  const xValues = data.map((point) => parseFloat(point.x));
  const yValues = data.map((point) => parseFloat(point.y));
  const midOriginalPoint = getMidOriginalPoint(xValues, yValues);
  const notFoundContent = [COULD_NOT_FIND_BEST_FIT_LABEL, "  y = ax^b", ""];

  let sumLogX = 0;
  let sumLogY = 0;
  let sumLogXLogY = 0;
  let sumLogX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = xValues[i];
    const y = yValues[i];

    // Ensure x and y are positive for logarithmic transformation
    if (x <= 0 || y <= 0) {
      return {
        type: STATISTIC_POWER,
        fitSuccessful: false,
        content: notFoundContent,
        equationLabel: "N/A",
        equation: () => NaN,
        midOriginalPoint,
      };
    }

    const logX = Math.log(x);
    const logY = Math.log(y);

    sumLogX += logX;
    sumLogY += logY;
    sumLogXLogY += logX * logY;
    sumLogX2 += logX * logX;
  }

  const slope = (n * sumLogXLogY - sumLogX * sumLogY) / (n * sumLogX2 - sumLogX * sumLogX);
  const intercept = (sumLogY - slope * sumLogX) / n;

  const a = Math.exp(intercept);
  const b = slope;

  const equation = (x) => a * Math.pow(x, b);
  const { upperLimit, lowerLimit } = calculateLimits(yValues);
  const fitSuccessful = checkFitSuccess(xValues, equation, upperLimit, lowerLimit);

  const aRounded = round(a, 4);
  const bRounded = round(b, 4);

  const content = fitSuccessful
    ? ["Power fit", "  y = ax^b", `  a = ${aRounded}`, `  b = ${bRounded}`, ""]
    : notFoundContent;

  return {
    type: STATISTIC_POWER,
    fitSuccessful,
    content,
    equationLabel: fitSuccessful ? `y = ${aRounded}x^${bRounded}` : "N/A",
    equation: fitSuccessful ? equation : () => NaN,
    midOriginalPoint,
  };
};

// Inverse Regression
export const inverseRegression = (data) => {
  const n = data.length;
  const xValues = data.map((point) => parseFloat(point.x));
  const yValues = data.map((point) => parseFloat(point.y));
  const midOriginalPoint = getMidOriginalPoint(xValues, yValues);
  const notFoundContent = [COULD_NOT_FIND_BEST_FIT_LABEL, "  y = a/x + b", ""];

  let sumInvX = 0;
  let sumY = 0;
  let sumInvXY = 0;
  let sumInvX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = xValues[i];
    const y = yValues[i];

    // Ensure x is not zero to avoid division by zero
    if (x === 0) {
      return {
        type: STATISTIC_INVERSE,
        fitSuccessful: false,
        content: notFoundContent,
        equationLabel: "N/A",
        equation: () => NaN,
        midOriginalPoint,
      };
    }

    const invX = 1 / x;

    sumInvX += invX;
    sumY += y;
    sumInvXY += invX * y;
    sumInvX2 += invX * invX;
  }

  // Calculate the coefficients a and b
  const denominator = n * sumInvX2 - sumInvX * sumInvX;

  // Check if the denominator is zero
  if (denominator === 0) {
    return {
      type: STATISTIC_INVERSE,
      fitSuccessful: false,
      content: notFoundContent,
      equationLabel: "N/A",
      equation: () => NaN,
      midOriginalPoint,
    };
  }

  const a = (n * sumInvXY - sumInvX * sumY) / denominator;
  const b = (sumY - a * sumInvX) / n;

  const equation = (x) => a / x + b;
  const { upperLimit, lowerLimit } = calculateLimits(yValues);
  const fitSuccessful = checkFitSuccess(xValues, equation, upperLimit, lowerLimit);

  // Round the coefficients for better readability
  const aRounded = round(a, 4);
  const bRounded = round(b, 4);

  const content = fitSuccessful
    ? ["Inverse fit", "  y = a/x + b", `  a = ${aRounded}`, `  b = ${bRounded}`, ""]
    : notFoundContent;

  return {
    type: STATISTIC_INVERSE,
    fitSuccessful,
    content,
    equationLabel: fitSuccessful ? `y = ${aRounded}/x + ${bRounded}` : "N/A",
    equation: fitSuccessful ? equation : () => NaN,
    midOriginalPoint,
  };
};

// Inverse Square Regression
export const inverseSquareRegression = (data) => {
  const n = data.length;
  const xValues = data.map((point) => parseFloat(point.x));
  const yValues = data.map((point) => parseFloat(point.y));
  const midOriginalPoint = getMidOriginalPoint(xValues, yValues);
  const notFoundContent = [COULD_NOT_FIND_BEST_FIT_LABEL, "  y = a/x² + b", ""];

  let sumInvX2 = 0;
  let sumY = 0;
  let sumInvX2Y = 0;
  let sumInvX4 = 0;

  for (let i = 0; i < n; i++) {
    const x = xValues[i];
    const y = yValues[i];

    // Ensure x is not zero to avoid division by zero
    if (x === 0) {
      console.error("Zero x-value encountered; unable to compute inverse square regression.");
      return {
        type: STATISTIC_INVERSE_SQUARE,
        fitSuccessful: false,
        content: notFoundContent,
        equationLabel: "N/A",
        equation: () => NaN,
        midOriginalPoint,
      };
    }

    const invX2 = 1 / (x * x);

    sumInvX2 += invX2;
    sumY += y;
    sumInvX2Y += invX2 * y;
    sumInvX4 += invX2 * invX2;
  }

  // Calculate the coefficients a and b
  const denominator = n * sumInvX4 - sumInvX2 * sumInvX2;

  // Check if the denominator is zero
  if (denominator === 0) {
    console.error("Denominator is zero; unable to compute inverse square regression.");
    return {
      type: STATISTIC_INVERSE_SQUARE,
      fitSuccessful: false,
      content: notFoundContent,
      equationLabel: "N/A",
      equation: () => NaN,
      midOriginalPoint,
    };
  }

  const a = (n * sumInvX2Y - sumInvX2 * sumY) / denominator;
  const b = (sumY - a * sumInvX2) / n;

  const equation = (x) => a / (x * x) + b;
  const { upperLimit, lowerLimit } = calculateLimits(yValues);
  const fitSuccessful = checkFitSuccess(xValues, equation, upperLimit, lowerLimit);

  // Round the coefficients for better readability
  const aRounded = round(a, 4);
  const bRounded = round(b, 4);

  const content = fitSuccessful
    ? ["Inverse Square fit", "  y = a/x² + b", `  a = ${aRounded}`, `  b = ${bRounded}`, ""]
    : notFoundContent;

  return {
    type: STATISTIC_INVERSE_SQUARE,
    fitSuccessful,
    content,
    equationLabel: fitSuccessful ? `y = ${aRounded}/x² + ${bRounded}` : "N/A",
    equation: fitSuccessful ? equation : () => NaN,
    midOriginalPoint,
  };
};

// Sinusoidal Regression
export const sinusoidalRegression = (data) => {
  const n = data.length;
  const xValues = data.map((point) => parseFloat(point.x));
  const yValues = data.map((point) => parseFloat(point.y));
  const midOriginalPoint = getMidOriginalPoint(xValues, yValues);
  const notFoundContent = [COULD_NOT_FIND_BEST_FIT_LABEL, "  y = A * sin(Bx + C) + D", ""];

  if (n < 2) {
    return {
      type: STATISTIC_SINUSOIDAL,
      fitSuccessful: false,
      content: notFoundContent,
      equationLabel: "N/A",
      equation: () => NaN,
      midOriginalPoint,
    };
  }

  // Estimate initial parameters
  const A = (max(yValues) - min(yValues)) / 2;
  const D = mean(yValues);
  const B = (2 * Math.PI) / n; // Assume one full cycle over the data range
  const C = 0; // Initial phase shift

  const equation = (x) => A * Math.sin(B * x + C) + D;
  const { upperLimit, lowerLimit } = calculateLimits(yValues);
  const fitSuccessful = checkFitSuccess(xValues, equation, upperLimit, lowerLimit);

  // Round the coefficients for better readability
  const ARounded = round(A, 4);
  const BRounded = round(B, 4);
  const CRounded = round(C, 4);
  const DRounded = round(D, 4);

  const content = fitSuccessful
    ? [
        "Sinusoidal fit",
        "  y = A * sin(Bx + C) + D",
        `  A = ${ARounded}`,
        `  B = ${BRounded}`,
        `  C = ${CRounded}`,
        `  D = ${DRounded}`,
        "",
      ]
    : notFoundContent;

  return {
    type: STATISTIC_SINUSOIDAL,
    fitSuccessful,
    content,
    equationLabel: fitSuccessful ? `y = ${ARounded} * sin(${BRounded}x + ${CRounded}) + ${DRounded}` : "N/A",
    equation: fitSuccessful ? equation : () => NaN,
    midOriginalPoint,
  };
};
// Area Regression
export const areaRegression = (data) => {
  const n = data.length;
  const xValues = data.map((point) => parseFloat(point.x));
  const yValues = data.map((point) => parseFloat(point.y));
  const midOriginalPoint = getMidOriginalPoint(xValues, yValues);
  const notFoundContent = [COULD_NOT_FIND_BEST_FIT_LABEL, ""];

  if (n < 2) {
    return {
      type: STATISTIC_AREA,
      fitSuccessful: false,
      content: notFoundContent,
      equationLabel: "N/A",
      equation: () => NaN,
      midOriginalPoint,
    };
  }
  // Area là tổng diện tích của tất cả các hình thang giữa các điểm trong mảng dữ liệu data.
  // Công thức tính diện tích hình thang giữa (x1, y1) và (x2, y2):
  // A_i = 1/2 * (x_{i+1} - x_i) * (y_i + y_{i+1})

  let totalArea = 0;
  for (let i = 0; i < data.length - 1; i++) {
    let x1 = data[i].x;
    let y1 = parseFloat(data[i].y); // Chuyển đổi y từ chuỗi thành số
    let x2 = data[i + 1].x;
    let y2 = parseFloat(data[i + 1].y); // Chuyển đổi y từ chuỗi thành số

    // Diện tích của hình thang giữa (x1, y1) và (x2, y2)
    let area = 0.5 * (x2 - x1) * (y1 + y2);
    totalArea += area;
  }

  const content = totalArea
    ? [
        "Area fit",
        ` Area = ${totalArea.toLocaleString("de-DE", {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        })}`,
        "",
      ]
    : notFoundContent;

  return {
    type: STATISTIC_AREA,
    fitSuccessful: true,
    content,
    equationLabel: totalArea ? `Area = ${totalArea}` : "N/A",
    equation: () => NaN,
    midOriginalPoint,
  };
};
export const createRegressionDataPoints = (
  id,
  { equation, fitSuccessful, color },
  x1,
  x2,
  min,
  max,
  defaultMidPoint
) => {
  const defaultResponse = {
    id,
    label: "none",
    data: [],
    dataRunId: id,
    borderColor: color,
    backgroundColor: color,
    midPoint: defaultMidPoint,
    yAxis: {},
    pointStyle: false,
    tension: 0.4,
    borderDash: [5, 5],
  };
  if (!fitSuccessful) {
    console.warn(`Fit was not successful for id: ${id}`);
    return defaultResponse;
  }

  const data = [];
  const step = (x2 - x1) / 99;
  const range = max - min;
  const upperLimit = max + range / 2;
  const lowerLimit = min - range / 2;

  let firstPoint = null;

  for (let i = 0; i <= 99; i++) {
    const x = x1 + i * step;
    const y = roundXValue(equation(x));

    if (y <= upperLimit && y >= lowerLimit) {
      if (!firstPoint) {
        firstPoint = { x: roundXValue(x), y };
      }
      data.push({ x: roundXValue(x - firstPoint.x) + x1, y });
    } else {
      return defaultResponse;
    }
  }

  if (!firstPoint) {
    console.warn(`No valid data points found for id: ${id}`);
    return defaultResponse;
  }

  const midPointX = (x1 + x2) / 2;
  const midPoint = {
    x: roundXValue(midPointX - firstPoint.x) + x1,
    y: roundXValue(equation(midPointX)),
  };

  return {
    id,
    label: "none",
    data,
    dataRunId: id,
    borderColor: color,
    backgroundColor: color,
    midPoint,
    yAxis: {},
    pointStyle: false,
    tension: 0.4,
    borderDash: [5, 5],
  };
};
