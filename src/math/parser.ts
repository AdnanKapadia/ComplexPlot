/**
 * Expression parser using math.js
 * Handles complex number expressions with variables z and t
 */

import { parse, compile } from 'mathjs';
import type { MathNode, EvalFunction } from 'mathjs';

export interface ParsedExpression {
  node: MathNode;
  compiled: EvalFunction;
  variable: string;
}

/**
 * Parse a mathematical expression string into a math.js AST
 * @param expr - The expression string (e.g., "z^2 + 1", "sin(z)", "exp(i*t)")
 * @param _variable - The variable name to use ('z' or 't') - reserved for future validation
 * @returns The parsed MathNode or null if parsing fails
 */
export function parseExpression(expr: string, _variable: string): MathNode | null {
  if (!expr || expr.trim() === '') {
    return null;
  }

  try {
    // Parse the expression - math.js handles 'i' as imaginary unit natively
    const node = parse(expr);
    return node;
  } catch (error) {
    // Gracefully handle parse errors
    console.warn(`Failed to parse expression "${expr}":`, error);
    return null;
  }
}

/**
 * Parse and compile an expression for efficient repeated evaluation
 * @param expr - The expression string
 * @param variable - The variable name to use ('z' or 't')
 * @returns ParsedExpression object or null if parsing fails
 */
export function parseAndCompile(expr: string, variable: string): ParsedExpression | null {
  if (!expr || expr.trim() === '') {
    return null;
  }

  try {
    const node = parse(expr);
    const compiled = compile(expr);
    return {
      node,
      compiled,
      variable,
    };
  } catch (error) {
    console.warn(`Failed to parse/compile expression "${expr}":`, error);
    return null;
  }
}

/**
 * Validate that an expression can be parsed
 * @param expr - The expression string to validate
 * @returns true if valid, false otherwise
 */
export function isValidExpression(expr: string): boolean {
  try {
    parse(expr);
    return true;
  } catch {
    return false;
  }
}

