import React, { useState, useCallback } from 'react';
import type { ContourEntry } from '../../types/index';
import { isValidExpression } from '../../math/parser';
import { compile } from 'mathjs';
import './ContourInput.css';

export interface ContourInputProps {
  contours: ContourEntry[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ContourEntry>) => void;
  isAnimatingAll: boolean;
  onToggleAnimationAll: () => void;
  animatingContourIds: Set<string>;
  onToggleContourAnimation: (id: string) => void;
  /** ID of contour currently showing integral visualization (only one at a time) */
  showingIntegralId: string | null;
  /** Toggle integral visualization for a specific contour */
  onToggleShowIntegral: (id: string) => void;
}

// Color palette for contours
const CONTOUR_COLORS = [
  '#00d4ff', // cyan
  '#ff6b9d', // pink
  '#50fa7b', // green
  '#ffb86c', // orange
  '#bd93f9', // purple
  '#f1fa8c', // yellow
  '#ff5555', // red
  '#8be9fd', // light cyan
];

interface ContourRowProps {
  contour: ContourEntry;
  index: number;
  onUpdate: (id: string, updates: Partial<ContourEntry>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
  isAnimating: boolean;
  onToggleAnimation: () => void;
  isShowingIntegral: boolean;
  onToggleShowIntegral: () => void;
}

const ContourRow: React.FC<ContourRowProps> = ({
  contour,
  index,
  onUpdate,
  onRemove,
  canRemove,
  isAnimating,
  onToggleAnimation,
  isShowingIntegral,
  onToggleShowIntegral,
}) => {
  const [localExpr, setLocalExpr] = useState(contour.expression);
  const [localTransform, setLocalTransform] = useState(contour.transformFunction || '');
  const [localTMin, setLocalTMin] = useState(String(contour.tMin));
  const [localTMax, setLocalTMax] = useState(String(contour.tMax));
  const [error, setError] = useState<string | null>(null);
  const [transformError, setTransformError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isTransformFocused, setIsTransformFocused] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const validate = useCallback((expr: string) => {
    if (!expr.trim()) {
      setError('Empty');
      return false;
    }
    if (!isValidExpression(expr)) {
      setError('Invalid');
      return false;
    }
    setError(null);
    return true;
  }, []);

  const validateTransform = useCallback((expr: string) => {
    if (!expr.trim()) {
      // Empty is valid - means no transform
      setTransformError(null);
      return true;
    }
    if (!isValidExpression(expr)) {
      setTransformError('Invalid');
      return false;
    }
    setTransformError(null);
    return true;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalExpr(value);
    validate(value);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (validate(localExpr)) {
      onUpdate(contour.id, { expression: localExpr });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (validate(localExpr)) {
        onUpdate(contour.id, { expression: localExpr });
        (e.target as HTMLInputElement).blur();
      }
    }
  };

  const handleTransformChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalTransform(value);
    validateTransform(value);
  };

  const handleTransformBlur = () => {
    setIsTransformFocused(false);
    if (validateTransform(localTransform)) {
      onUpdate(contour.id, { transformFunction: localTransform });
    }
  };

  const handleTransformKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (validateTransform(localTransform)) {
        onUpdate(contour.id, { transformFunction: localTransform });
        (e.target as HTMLInputElement).blur();
      }
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(contour.id, { color: e.target.value });
  };

  const handleToggle = () => {
    onUpdate(contour.id, { enabled: !contour.enabled });
  };

  const handleTStepsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate(contour.id, { tSteps: parseInt(e.target.value) });
  };

  const handleAnimationSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(contour.id, { animationSpeed: parseInt(e.target.value) });
  };

  const parseNumericInput = (expr: string): number | null => {
    const trimmed = expr.trim();
    if (!trimmed) return null;

    try {
      const result = compile(trimmed).evaluate({});

      if (typeof result === 'number') {
        return Number.isFinite(result) ? result : null;
      }

      if (result && typeof result === 'object' && 're' in result && 'im' in result) {
        const re = (result as { re: number }).re;
        const im = (result as { im: number }).im;
        if (Math.abs(im) < 1e-10 && Number.isFinite(re)) {
          return re;
        }
      }

      return null;
    } catch {
      return null;
    }
  };

  const handleTMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalTMin(value);
    const parsed = parseNumericInput(value);
    if (parsed !== null) {
      onUpdate(contour.id, { tMin: parsed });
    }
  };

  const handleTMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalTMax(value);
    const parsed = parseNumericInput(value);
    if (parsed !== null) {
      onUpdate(contour.id, { tMax: parsed });
    }
  };

  const parsedTMin = parseNumericInput(localTMin);
  const parsedTMax = parseNumericInput(localTMax);
  const hasTRangeError = parsedTMin !== null && parsedTMax !== null && parsedTMin >= parsedTMax;

  return (
    <div className={`contour-row ${!contour.enabled ? 'disabled' : ''} ${expanded ? 'expanded' : ''}`}>
      <div className="contour-row__main">
        <div className="contour-row__index">
          <span className="contour-row__label">z<sub>{index + 1}</sub>(t) =</span>
        </div>
        
        <input
          type="color"
          className="contour-row__color"
          value={contour.color}
          onChange={handleColorChange}
          title="Curve color"
        />

        <button
          className={`contour-row__expand ${expanded ? 'active' : ''}`}
          onClick={() => setExpanded(!expanded)}
          title="Parameter settings"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points={expanded ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
          </svg>
        </button>

        <button
          className={`contour-row__toggle ${contour.enabled ? 'active' : ''}`}
          onClick={handleToggle}
          title={contour.enabled ? 'Disable curve' : 'Enable curve'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {contour.enabled ? (
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
            ) : (
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
            )}
          </svg>
        </button>

        {canRemove && (
          <button
            className="contour-row__remove"
            onClick={() => onRemove(contour.id)}
            title="Remove curve"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {expanded && (
        <div className="contour-row__params">
          <div className="contour-row__expression">
            <label className="contour-row__param-label">z(t) =</label>
            <div className={`contour-row__input-wrapper ${isFocused ? 'focused' : ''} ${error ? 'error' : ''}`}>
              <input
                type="text"
                className="contour-row__input"
                value={localExpr}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={() => setIsFocused(true)}
                onKeyDown={handleKeyDown}
                placeholder="exp(i * t)"
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </div>
          <div className="contour-row__transform-group">
            <label className="contour-row__param-label">f(γ(t)) =</label>
            <div className={`contour-row__input-wrapper transform ${isTransformFocused ? 'focused' : ''} ${transformError ? 'error' : ''}`}>
              <input
                type="text"
                className="contour-row__input"
                value={localTransform}
                onChange={handleTransformChange}
                onBlur={handleTransformBlur}
                onFocus={() => setIsTransformFocused(true)}
                onKeyDown={handleTransformKeyDown}
                placeholder="z^2, sin(z), etc."
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </div>
          <div className="contour-row__param-row">
            <div className="contour-row__param-group">
              <label className="contour-row__param-label">t ∈</label>
              <span className="contour-row__param-bracket">[</span>
              <input
                type="text"
                className="contour-row__param-input"
                value={localTMin}
                onChange={handleTMinChange}
                spellCheck={false}
                inputMode="decimal"
                placeholder="0"
              />
              <span className="contour-row__param-comma">,</span>
              <input
                type="text"
                className="contour-row__param-input"
                value={localTMax}
                onChange={handleTMaxChange}
                spellCheck={false}
                inputMode="decimal"
                placeholder="2*pi"
              />
              <span className="contour-row__param-bracket">]</span>
            </div>
            {parsedTMin !== null && parsedTMax !== null && (
              <div className="contour-row__param-evaluated">
                t = [{parsedTMin.toFixed(3)}, {parsedTMax.toFixed(3)}]
              </div>
            )}
            {hasTRangeError && (
              <div className="contour-row__param-error">t_min must be less than t_max</div>
            )}
            <div className="contour-row__param-group">
              <label className="contour-row__param-label">Steps</label>
              <select
                className="contour-row__param-select"
                value={contour.tSteps}
                onChange={handleTStepsChange}
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </select>
            </div>
            <button
              className={`contour-row__animate ${isAnimating ? 'active' : ''}`}
              onClick={onToggleAnimation}
              title={isAnimating ? 'Stop animation' : 'Animate this contour'}
            >
              {isAnimating ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
              {isAnimating ? 'Stop' : 'Animate'}
            </button>
          </div>
          <div className="contour-row__speed-row">
            <label className="contour-row__param-label">Speed</label>
            <input
              type="range"
              className="contour-row__speed-slider"
              min="1"
              max="10"
              value={contour.animationSpeed ?? 5}
              onChange={handleAnimationSpeedChange}
            />
            <span className="contour-row__speed-value">{contour.animationSpeed ?? 5}</span>
          </div>
          <div className="contour-row__integral-row">
            <button
              className={`contour-row__integral ${isShowingIntegral ? 'active' : ''}`}
              onClick={onToggleShowIntegral}
              title={isShowingIntegral ? 'Hide integral visualization' : 'Show contour integral ∮f(z)dz'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3c-1.5 0-2.5 1-3 2s-1 3-1 5c0 2 .5 5 1 7s1.5 4 3 4c1.5 0 2.5-1 3-2s1-3 1-5c0-2-.5-5-1-7s-1.5-4-3-4z" />
              </svg>
              {isShowingIntegral ? 'Hide ∮' : 'Show ∮'}
            </button>
            {isShowingIntegral && (
              <span className="contour-row__integral-hint">
                Visualizing ∮f(z)dz
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ContourInput: React.FC<ContourInputProps> = ({
  contours,
  onAdd,
  onRemove,
  onUpdate,
  isAnimatingAll,
  onToggleAnimationAll,
  animatingContourIds,
  onToggleContourAnimation,
  showingIntegralId,
  onToggleShowIntegral,
}) => {
  return (
    <div className="contour-input">
      <div className="contour-input__header">
        <span className="contour-input__title">Contours</span>
        <div className="contour-input__actions">
          <button 
            className={`contour-input__animate ${isAnimatingAll ? 'active' : ''}`} 
            onClick={onToggleAnimationAll} 
            title={isAnimatingAll ? 'Stop all animations' : 'Animate all contours'}
          >
            {isAnimatingAll ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
            {isAnimatingAll ? 'Stop All' : 'Animate All'}
          </button>
          <button className="contour-input__add" onClick={onAdd} title="Add new contour">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add
          </button>
        </div>
      </div>

      <div className="contour-input__list">
        {contours.map((contour, index) => (
          <ContourRow
            key={contour.id}
            contour={contour}
            index={index}
            onUpdate={onUpdate}
            onRemove={onRemove}
            canRemove={contours.length > 1}
            isAnimating={animatingContourIds.has(contour.id)}
            onToggleAnimation={() => onToggleContourAnimation(contour.id)}
            isShowingIntegral={showingIntegralId === contour.id}
            onToggleShowIntegral={() => onToggleShowIntegral(contour.id)}
          />
        ))}
      </div>
    </div>
  );
};

export { CONTOUR_COLORS };
export default ContourInput;
