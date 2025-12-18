/**
 * Math Engine - Main entry point for complex number calculations
 * Implements the MathEngine interface from types
 */

import type { MathNode } from 'mathjs';
import type {
  MathEngine,
  ContourConfig,
  ContourData,
  ContourEntry,
  ContourIntegralData,
  DomainColoringConfig,
  Surface3DConfig,
} from '../types';
import { parseExpression } from './parser';
import { generateContourPoints, generateDomainColoringData, generateSurface3DData, computeContourIntegral } from './generators';

// Re-export utilities for external use
export { parseExpression, parseAndCompile, isValidExpression } from './parser';
export {
  evaluateAt,
  evaluateExpressionAt,
  evaluateAtT,
  toMathComplex,
  toComplexPoint,
  modulus,
  argument,
  getColorValue,
} from './evaluator';
export { generateContourPoints, generateDomainColoringData, generateSurface3DData, computeContourIntegral } from './generators';

/**
 * Create a MathEngine instance that implements the MathEngine interface
 */
function createMathEngine(): MathEngine {
  return {
    /**
     * Parse an expression string into a math.js AST
     */
    parseExpression(expr: string, variable: string): MathNode | null {
      return parseExpression(expr, variable);
    },

    /**
     * Evaluate all contour expressions z_n(t) over the parameter range
     * Returns array of ContourData objects with evaluated points
     */
    evaluateContour(config: ContourConfig): ContourData[] {
      return generateContourPoints(config);
    },

    /**
     * Compute contour integral data for visualization
     * Calculates integrand vectors f(γ(t))·γ'(t) and running sum
     */
    evaluateContourIntegral(contour: ContourEntry): ContourIntegralData | null {
      return computeContourIntegral(contour);
    },

    /**
     * Evaluate a complex function f(z) over a 2D domain
     * Returns 2D arrays suitable for heatmap/domain coloring
     */
    evaluateDomainColoring(config: DomainColoringConfig): {
      z: number[][];
      colors: number[][];
    } {
      return generateDomainColoringData(config);
    },

    /**
     * Evaluate a complex function f(z) over a 2D domain for 3D surface
     * Returns x, y (1D) and z, colors (2D) arrays for Plotly surface plot
     */
    evaluateSurface3D(config: Surface3DConfig): {
      x: number[];
      y: number[];
      z: number[][];
      colors: number[][];
    } {
      return generateSurface3DData(config);
    },
  };
}

// Export a singleton instance of the math engine
export const mathEngine = createMathEngine();

// Default export for convenience
export default mathEngine;

