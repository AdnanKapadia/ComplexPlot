import React, { useState, useEffect, useCallback } from 'react';
import type { PlotMode } from '../../types/index';
import { isValidExpression } from '../../math/parser';
import './FunctionInput.css';

export interface FunctionInputProps {
  expression: string;
  mode: PlotMode;
  onChange: (expression: string) => void;
}

const placeholders: Record<PlotMode, string> = {
  contour: 'z(t) = exp(i * t)',
  domainColoring: 'f(z) = z^2 + 1',
  surface3d: 'f(z) = z^2 + 1',
};

const labels: Record<PlotMode, string> = {
  contour: 'z(t) =',
  domainColoring: 'f(z) =',
  surface3d: 'f(z) =',
};

const helpText: Record<PlotMode, string> = {
  contour: 'Parametric curve. Use t as parameter, i for imaginary unit.',
  domainColoring: 'Complex function. Use z as variable, i for imaginary unit.',
  surface3d: 'Complex function. Use z as variable, i for imaginary unit.',
};

export const FunctionInput: React.FC<FunctionInputProps> = ({
  expression,
  mode,
  onChange,
}) => {
  const [localValue, setLocalValue] = useState(expression);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setLocalValue(expression);
  }, [expression]);

  const validateExpression = useCallback((expr: string) => {
    if (!expr.trim()) {
      setParseError('Expression cannot be empty');
      return false;
    }
    
    if (!isValidExpression(expr)) {
      setParseError('Invalid expression syntax');
      return false;
    }
    
    setParseError(null);
    return true;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);
    validateExpression(value);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (validateExpression(localValue)) {
      onChange(localValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (validateExpression(localValue)) {
        onChange(localValue);
        (e.target as HTMLInputElement).blur();
      }
    }
  };

  return (
    <div className="function-input">
      <label className="function-input__label">{labels[mode]}</label>
      <div className={`function-input__wrapper ${isFocused ? 'focused' : ''} ${parseError ? 'error' : ''}`}>
        <input
          type="text"
          className="function-input__field"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholders[mode]}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
      {parseError && (
        <div className="function-input__error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{parseError}</span>
        </div>
      )}
      <div className="function-input__help">{helpText[mode]}</div>
    </div>
  );
};

export default FunctionInput;

