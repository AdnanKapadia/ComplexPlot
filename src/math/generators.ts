/**
 * Data generators for different plot types
 * Generates arrays suitable for Plotly visualization
 */

import { compile, i as imaginaryUnit, pi, e as eulerNumber } from 'mathjs';
import type {
  ComplexPoint,
  ContourConfig,
  ContourData,
  ContourEntry,
  ContourIntegralData,
  DomainColoringConfig,
  Surface3DConfig,
} from '../types';
import { toMathComplex, toComplexPoint, getColorValue } from './evaluator';

// Common math constants to include in evaluation scope
const mathConstants = {
  i: imaginaryUnit,
  pi: pi,
  e: eulerNumber,
};

/**
 * Generate points for a single contour expression z(t) with optional transform f(γ(t))
 * @param expression - The γ(t) expression to evaluate
 * @param transformFunction - Optional f(z) to apply: result = f(γ(t))
 * @param tMin - Start of parameter range
 * @param tMax - End of parameter range
 * @param tSteps - Number of evaluation points
 * @returns Array of complex points
 */
function evaluateSingleContour(
  expression: string,
  transformFunction: string,
  tMin: number,
  tMax: number,
  tSteps: number
): ComplexPoint[] {
  if (!expression || expression.trim() === '') {
    return [];
  }

  try {
    const compiled = compile(expression);
    // Compile the transform function if provided
    const hasTransform = transformFunction && transformFunction.trim() !== '';
    const compiledTransform = hasTransform ? compile(transformFunction) : null;
    
    const points: ComplexPoint[] = [];
    const dt = (tMax - tMin) / Math.max(tSteps - 1, 1);

    for (let step = 0; step < tSteps; step++) {
      const t = tMin + step * dt;
      
      try {
        // First evaluate γ(t)
        const gammaResult = compiled.evaluate({ t, ...mathConstants });
        let point = toComplexPoint(gammaResult);
        
        // Apply transform f(γ(t)) if provided
        if (compiledTransform) {
          const transformed = compiledTransform.evaluate({ 
            z: toMathComplex(point), 
            ...mathConstants 
          });
          point = toComplexPoint(transformed);
        }
        
        // Skip invalid points (NaN, Infinity)
        if (isFinite(point.re) && isFinite(point.im)) {
          points.push(point);
        }
      } catch {
        // Skip points that fail to evaluate
        continue;
      }
    }

    return points;
  } catch (error) {
    console.warn(`Failed to generate contour for "${expression}":`, error);
    return [];
  }
}

/**
 * Generate contour data for all enabled contours
 * Each contour uses its own parameter range [tMin, tMax]
 * If transformFunction is provided, result is f(γ(t))
 * @param config - Contour configuration with multiple contour entries
 * @returns Array of ContourData objects with evaluated points
 */
export function generateContourPoints(config: ContourConfig): ContourData[] {
  const { contours } = config;
  
  return contours
    .filter(contour => contour.enabled && contour.expression.trim() !== '')
    .map(contour => ({
      id: contour.id,
      expression: contour.transformFunction?.trim() 
        ? `${contour.transformFunction}(${contour.expression})`
        : contour.expression,
      color: contour.color,
      tMin: contour.tMin,
      tMax: contour.tMax,
      animationSpeed: contour.animationSpeed ?? 5,
      points: evaluateSingleContour(
        contour.expression,
        contour.transformFunction || '',
        contour.tMin,
        contour.tMax,
        contour.tSteps
      ),
    }));
}

/**
 * Complex number multiplication
 */
function complexMultiply(a: ComplexPoint, b: ComplexPoint): ComplexPoint {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

/**
 * Complex number addition
 */
function complexAdd(a: ComplexPoint, b: ComplexPoint): ComplexPoint {
  return {
    re: a.re + b.re,
    im: a.im + b.im,
  };
}

/**
 * Scale a complex number by a real scalar
 */
function complexScale(a: ComplexPoint, scalar: number): ComplexPoint {
  return {
    re: a.re * scalar,
    im: a.im * scalar,
  };
}

/**
 * Compute contour integral data for visualization
 * Calculates γ'(t) via numerical differentiation and accumulates ∫f(γ(t))γ'(t)dt
 * @param contour - The contour entry to compute integral for
 * @returns ContourIntegralData with integrand vectors and running sum, or null if invalid
 */
export function computeContourIntegral(contour: ContourEntry): ContourIntegralData | null {
  const { expression, transformFunction, tMin, tMax, tSteps, id, color } = contour;

  // Need both a contour and a function to integrate
  if (!expression || expression.trim() === '') {
    return null;
  }

  // If no transform function, default to f(z) = 1 (integrates to arc length in complex sense)
  const fExpr = transformFunction && transformFunction.trim() !== '' ? transformFunction : '1';

  try {
    const compiledGamma = compile(expression);
    const compiledF = compile(fExpr);

    const dt = (tMax - tMin) / Math.max(tSteps - 1, 1);
    const h = dt * 0.01; // Small step for numerical derivative

    const tValues: number[] = [];
    const contourPoints: ComplexPoint[] = [];
    const integrandVectors: ComplexPoint[] = [];
    const runningSum: ComplexPoint[] = [];

    let currentSum: ComplexPoint = { re: 0, im: 0 };

    // Evaluate γ(t) at a given t value
    const evalGamma = (t: number): ComplexPoint | null => {
      try {
        const result = compiledGamma.evaluate({ t, ...mathConstants });
        return toComplexPoint(result);
      } catch {
        return null;
      }
    };

    // Evaluate f(z) at a given complex point
    const evalF = (z: ComplexPoint): ComplexPoint | null => {
      try {
        const result = compiledF.evaluate({ z: toMathComplex(z), ...mathConstants });
        return toComplexPoint(result);
      } catch {
        return null;
      }
    };

    for (let step = 0; step < tSteps; step++) {
      const t = tMin + step * dt;

      // Evaluate γ(t)
      const gamma = evalGamma(t);
      if (!gamma || !isFinite(gamma.re) || !isFinite(gamma.im)) {
        continue;
      }

      // Compute γ'(t) using central difference: (γ(t+h) - γ(t-h)) / (2h)
      const gammaPlusH = evalGamma(t + h);
      const gammaMinusH = evalGamma(t - h);
      
      let gammaPrime: ComplexPoint;
      if (gammaPlusH && gammaMinusH && 
          isFinite(gammaPlusH.re) && isFinite(gammaPlusH.im) &&
          isFinite(gammaMinusH.re) && isFinite(gammaMinusH.im)) {
        gammaPrime = {
          re: (gammaPlusH.re - gammaMinusH.re) / (2 * h),
          im: (gammaPlusH.im - gammaMinusH.im) / (2 * h),
        };
      } else {
        // Fallback to forward difference at boundaries
        const gammaNext = evalGamma(t + h);
        if (gammaNext && isFinite(gammaNext.re) && isFinite(gammaNext.im)) {
          gammaPrime = {
            re: (gammaNext.re - gamma.re) / h,
            im: (gammaNext.im - gamma.im) / h,
          };
        } else {
          continue;
        }
      }

      // Evaluate f(γ(t))
      const fValue = evalF(gamma);
      if (!fValue || !isFinite(fValue.re) || !isFinite(fValue.im)) {
        continue;
      }

      // Compute integrand: f(γ(t)) · γ'(t)
      const integrand = complexMultiply(fValue, gammaPrime);
      if (!isFinite(integrand.re) || !isFinite(integrand.im)) {
        continue;
      }

      // Accumulate: sum += integrand * dt
      const contribution = complexScale(integrand, dt);
      currentSum = complexAdd(currentSum, contribution);

      tValues.push(t);
      contourPoints.push(gamma);
      integrandVectors.push(integrand);
      runningSum.push({ ...currentSum });
    }

    if (tValues.length === 0) {
      return null;
    }

    return {
      id,
      color,
      tValues,
      contourPoints,
      integrandVectors,
      runningSum,
      finalValue: { ...currentSum },
      expression,
      transformFunction: fExpr,
    };
  } catch (error) {
    console.warn(`Failed to compute contour integral for "${expression}":`, error);
    return null;
  }
}

/**
 * Generate domain coloring data for heatmap visualization
 * @param config - Domain coloring configuration
 * @returns Object with z (modulus/value) and colors (color mapping) 2D arrays
 */
export function generateDomainColoringData(config: DomainColoringConfig): {
  z: number[][];
  colors: number[][];
} {
  const { expression, xMin, xMax, yMin, yMax, resolution, colorBy } = config;
  
  if (!expression || expression.trim() === '') {
    return { z: [], colors: [] };
  }

  try {
    const compiled = compile(expression);
    const z: number[][] = [];
    const colors: number[][] = [];
    
    const dx = (xMax - xMin) / Math.max(resolution - 1, 1);
    const dy = (yMax - yMin) / Math.max(resolution - 1, 1);

    for (let j = 0; j < resolution; j++) {
      const row: number[] = [];
      const colorRow: number[] = [];
      const y = yMin + j * dy;

      for (let i = 0; i < resolution; i++) {
        const x = xMin + i * dx;
        const zInput: ComplexPoint = { re: x, im: y };

        try {
          const result = compiled.evaluate({ z: toMathComplex(zInput), ...mathConstants });
          const output = toComplexPoint(result);
          
          const value = getColorValue(output, colorBy);
          
          // Handle infinity and NaN
          if (isFinite(value)) {
            row.push(value);
            colorRow.push(value);
          } else {
            // Use NaN to create gaps in the plot
            row.push(NaN);
            colorRow.push(NaN);
          }
        } catch {
          row.push(NaN);
          colorRow.push(NaN);
        }
      }

      z.push(row);
      colors.push(colorRow);
    }

    return { z, colors };
  } catch (error) {
    console.warn(`Failed to generate domain coloring for "${expression}":`, error);
    return { z: [], colors: [] };
  }
}

/**
 * Generate 3D surface data for Plotly surface plot
 * @param config - Surface 3D configuration
 * @returns Object with x, y (1D arrays), z and colors (2D arrays)
 */
export function generateSurface3DData(config: Surface3DConfig): {
  x: number[];
  y: number[];
  z: number[][];
  colors: number[][];
} {
  const { expression, xMin, xMax, yMin, yMax, resolution, heightBy, colorBy } = config;
  
  if (!expression || expression.trim() === '') {
    return { x: [], y: [], z: [], colors: [] };
  }

  try {
    const compiled = compile(expression);
    const x: number[] = [];
    const y: number[] = [];
    const z: number[][] = [];
    const colors: number[][] = [];
    
    const dx = (xMax - xMin) / Math.max(resolution - 1, 1);
    const dy = (yMax - yMin) / Math.max(resolution - 1, 1);

    // Generate x array
    for (let i = 0; i < resolution; i++) {
      x.push(xMin + i * dx);
    }

    // Generate y array
    for (let j = 0; j < resolution; j++) {
      y.push(yMin + j * dy);
    }

    // Generate z and colors arrays
    for (let j = 0; j < resolution; j++) {
      const zRow: number[] = [];
      const colorRow: number[] = [];
      const yVal = y[j];

      for (let i = 0; i < resolution; i++) {
        const xVal = x[i];
        const zInput: ComplexPoint = { re: xVal, im: yVal };

        try {
          const result = compiled.evaluate({ z: toMathComplex(zInput), ...mathConstants });
          const output = toComplexPoint(result);
          
          const heightValue = getColorValue(output, heightBy);
          const colorValue = getColorValue(output, colorBy);
          
          // Handle infinity and NaN
          if (isFinite(heightValue)) {
            zRow.push(heightValue);
          } else {
            zRow.push(NaN);
          }
          
          if (isFinite(colorValue)) {
            colorRow.push(colorValue);
          } else {
            colorRow.push(NaN);
          }
        } catch {
          zRow.push(NaN);
          colorRow.push(NaN);
        }
      }

      z.push(zRow);
      colors.push(colorRow);
    }

    return { x, y, z, colors };
  } catch (error) {
    console.warn(`Failed to generate 3D surface for "${expression}":`, error);
    return { x: [], y: [], z: [], colors: [] };
  }
}

