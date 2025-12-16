/**
 * Expression evaluator for complex numbers
 * Evaluates compiled math.js expressions at complex points
 */

import { compile, complex } from 'mathjs';
import type { Complex } from 'mathjs';
import type { ComplexPoint } from '../types';
import type { ParsedExpression } from './parser';

/**
 * Convert a ComplexPoint to a math.js Complex number
 */
export function toMathComplex(point: ComplexPoint): Complex {
  return complex(point.re, point.im);
}

/**
 * Convert a math.js Complex number to a ComplexPoint
 */
export function toComplexPoint(c: Complex | number): ComplexPoint {
  if (typeof c === 'number') {
    return { re: c, im: 0 };
  }
  // Handle math.js Complex type
  const re = typeof c.re === 'number' ? c.re : 0;
  const im = typeof c.im === 'number' ? c.im : 0;
  return { re, im };
}

/**
 * Evaluate a compiled expression at a single complex point
 * @param compiled - The compiled expression
 * @param variable - Variable name ('z' or 't')
 * @param point - The complex point to evaluate at
 * @returns The resulting complex point, or null if evaluation fails
 */
export function evaluateAt(
  compiled: ParsedExpression,
  point: ComplexPoint
): ComplexPoint | null {
  try {
    const scope: Record<string, Complex> = {
      [compiled.variable]: toMathComplex(point),
    };
    
    const result = compiled.compiled.evaluate(scope);
    return toComplexPoint(result);
  } catch (error) {
    console.warn('Evaluation error:', error);
    return null;
  }
}

/**
 * Evaluate an expression string at a single complex point (convenience function)
 * @param expr - The expression string
 * @param variable - Variable name ('z' or 't')
 * @param point - The complex point to evaluate at
 * @returns The resulting complex point, or null if evaluation fails
 */
export function evaluateExpressionAt(
  expr: string,
  variable: string,
  point: ComplexPoint
): ComplexPoint | null {
  try {
    const compiled = compile(expr);
    const scope: Record<string, Complex> = {
      [variable]: toMathComplex(point),
    };
    
    const result = compiled.evaluate(scope);
    return toComplexPoint(result);
  } catch (error) {
    console.warn(`Failed to evaluate "${expr}" at (${point.re}, ${point.im}):`, error);
    return null;
  }
}

/**
 * Evaluate an expression at a real parameter value t
 * @param expr - The expression string
 * @param t - The real parameter value
 * @returns The resulting complex point, or null if evaluation fails
 */
export function evaluateAtT(expr: string, t: number): ComplexPoint | null {
  try {
    const compiled = compile(expr);
    const scope = { t };
    
    const result = compiled.evaluate(scope);
    return toComplexPoint(result);
  } catch (error) {
    console.warn(`Failed to evaluate "${expr}" at t=${t}:`, error);
    return null;
  }
}

/**
 * Calculate the modulus (absolute value) of a complex point
 */
export function modulus(point: ComplexPoint): number {
  return Math.sqrt(point.re * point.re + point.im * point.im);
}

/**
 * Calculate the argument (phase angle) of a complex point
 * Returns value in range [-π, π]
 */
export function argument(point: ComplexPoint): number {
  return Math.atan2(point.im, point.re);
}

/**
 * Get the value based on color mapping type
 */
export function getColorValue(point: ComplexPoint, colorBy: string): number {
  switch (colorBy) {
    case 'modulus':
      return modulus(point);
    case 'argument':
      return argument(point);
    case 'real':
      return point.re;
    case 'imaginary':
      return point.im;
    default:
      return modulus(point);
  }
}

