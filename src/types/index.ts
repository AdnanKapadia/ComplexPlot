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

