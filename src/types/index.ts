import type { MathNode } from 'mathjs';

export type PlotMode = 'contour' | 'domainColoring' | 'surface3d';
export type ColorMapping = 'modulus' | 'argument' | 'real' | 'imaginary';

export interface ComplexPoint {
  re: number;
  im: number;
}

/** A single contour definition z_n(t_n) with its own parameter range */
export interface ContourEntry {
  id: string;
  expression: string;      // z(t) = ... (γ(t))
  transformFunction: string; // f(z) to apply: f(γ(t))
  color: string;
  enabled: boolean;
  tMin: number;            // parameter range start
  tMax: number;            // parameter range end
  tSteps: number;          // number of evaluation points
  animationSpeed: number;  // animation speed (1-10, higher = faster)
  showIntegral?: boolean;  // whether to show integral visualization for this contour
}

/** Configuration for the contour plot mode */
export interface ContourConfig {
  contours: ContourEntry[];
}

/** Evaluated contour data for rendering */
export interface ContourData {
  id: string;
  points: ComplexPoint[];
  color: string;
  expression: string;
  tMin: number;
  tMax: number;
  animationSpeed: number;
}

/** Data for contour integral visualization */
export interface ContourIntegralData {
  id: string;
  color: string;
  tValues: number[];              // parameter values at each step
  contourPoints: ComplexPoint[];  // γ(t) values at each step
  integrandVectors: ComplexPoint[]; // f(γ(t))·γ'(t) at each t
  runningSum: ComplexPoint[];     // cumulative sum path (partial integrals)
  finalValue: ComplexPoint;       // ∮f(z)dz - the total integral
  expression: string;             // display expression for the contour
  transformFunction: string;      // f(z) being integrated
}

export interface DomainColoringConfig {
  expression: string;      // f(z) = ...
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  resolution: number;
  colorBy: ColorMapping;
}

export interface Surface3DConfig {
  expression: string;      // f(z) = ...
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  resolution: number;
  heightBy: ColorMapping;
  colorBy: ColorMapping;
  zMin?: number;           // Optional z-axis clamp (min)
  zMax?: number;           // Optional z-axis clamp (max)
}

export interface PlotState {
  mode: PlotMode;
  contour: ContourConfig;
  domainColoring: DomainColoringConfig;
  surface3d: Surface3DConfig;
}

// Math engine interface - what agents 2,3,4 can call
export interface MathEngine {
  parseExpression(expr: string, variable: string): MathNode | null;
  evaluateContour(config: ContourConfig): ContourData[];
  evaluateContourIntegral(contour: ContourEntry): ContourIntegralData | null;
  evaluateDomainColoring(config: DomainColoringConfig): {
    z: number[][];
    colors: number[][];
  };
  evaluateSurface3D(config: Surface3DConfig): {
    x: number[];
    y: number[];
    z: number[][];
    colors: number[][];
  };
}

