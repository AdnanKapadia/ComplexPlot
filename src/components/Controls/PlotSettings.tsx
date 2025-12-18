import React from 'react';
import type { PlotMode, ColorMapping } from '../../types/index';
import './PlotSettings.css';

export interface PlotSettingsProps {
  mode: PlotMode;
  // Range settings
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  tMin: number;
  tMax: number;
  // Z-axis clamp for 3D
  zMin?: number;
  zMax?: number;
  // Resolution
  resolution: number;
  tSteps: number;
  // Color settings
  colorBy: ColorMapping;
  heightBy: ColorMapping;
  // Callbacks
  onXRangeChange: (xMin: number, xMax: number) => void;
  onYRangeChange: (yMin: number, yMax: number) => void;
  onTRangeChange: (tMin: number, tMax: number) => void;
  onZRangeChange: (zMin: number | undefined, zMax: number | undefined) => void;
  onResolutionChange: (resolution: number) => void;
  onColorByChange: (colorBy: ColorMapping) => void;
  onHeightByChange: (heightBy: ColorMapping) => void;
}

const resolutionOptions = [
  { value: 64, label: '64 (Fast)' },
  { value: 128, label: '128' },
  { value: 256, label: '256 (Balanced)' },
  { value: 512, label: '512' },
  { value: 1024, label: '1024 (High Quality)' },
];

const tStepOptions = [
  { value: 100, label: '100' },
  { value: 200, label: '200' },
  { value: 500, label: '500' },
  { value: 1000, label: '1000' },
];

const colorMappingOptions: { value: ColorMapping; label: string }[] = [
  { value: 'argument', label: 'Argument (Phase)' },
  { value: 'modulus', label: 'Modulus (|z|)' },
  { value: 'real', label: 'Real Part' },
  { value: 'imaginary', label: 'Imaginary Part' },
];

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  step?: number;
  bounds?: [number, number];
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  label,
  min,
  max,
  onMinChange,
  onMaxChange,
  step = 0.5,
  bounds = [-10, 10],
}) => {
  return (
    <div className="range-slider">
      <div className="range-slider__header">
        <span className="range-slider__label">{label}</span>
        <span className="range-slider__values">
          [{min.toFixed(1)}, {max.toFixed(1)}]
        </span>
      </div>
      <div className="range-slider__controls">
        <div className="range-slider__input-group">
          <label className="range-slider__input-label">Min</label>
          <input
            type="range"
            className="range-slider__slider"
            min={bounds[0]}
            max={bounds[1]}
            step={step}
            value={min}
            onChange={(e) => onMinChange(parseFloat(e.target.value))}
          />
          <input
            type="number"
            className="range-slider__number"
            value={min}
            step={step}
            onChange={(e) => onMinChange(parseFloat(e.target.value) || bounds[0])}
          />
        </div>
        <div className="range-slider__input-group">
          <label className="range-slider__input-label">Max</label>
          <input
            type="range"
            className="range-slider__slider"
            min={bounds[0]}
            max={bounds[1]}
            step={step}
            value={max}
            onChange={(e) => onMaxChange(parseFloat(e.target.value))}
          />
          <input
            type="number"
            className="range-slider__number"
            value={max}
            step={step}
            onChange={(e) => onMaxChange(parseFloat(e.target.value) || bounds[1])}
          />
        </div>
      </div>
    </div>
  );
};

interface SelectProps {
  label: string;
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: (value: string) => void;
}

const Select: React.FC<SelectProps> = ({ label, value, options, onChange }) => {
  return (
    <div className="plot-select">
      <label className="plot-select__label">{label}</label>
      <select
        className="plot-select__dropdown"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export const PlotSettings: React.FC<PlotSettingsProps> = ({
  mode,
  xMin,
  xMax,
  yMin,
  yMax,
  tMin,
  tMax,
  zMin,
  zMax,
  resolution,
  tSteps,
  colorBy,
  heightBy,
  onXRangeChange,
  onYRangeChange,
  onTRangeChange,
  onZRangeChange,
  onResolutionChange,
  onColorByChange,
  onHeightByChange,
}) => {
  const isContour = mode === 'contour';
  const is3D = mode === 'surface3d';

  return (
    <div className="plot-settings">
      <div className="plot-settings__section">
        <h3 className="plot-settings__section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          Domain
        </h3>
        
        {isContour ? (
          <RangeSlider
            label="t (parameter)"
            min={tMin}
            max={tMax}
            onMinChange={(val) => onTRangeChange(val, tMax)}
            onMaxChange={(val) => onTRangeChange(tMin, val)}
            step={0.1}
            bounds={[-10, 20]}
          />
        ) : (
          <>
            <RangeSlider
              label="x (Real axis)"
              min={xMin}
              max={xMax}
              onMinChange={(val) => onXRangeChange(val, xMax)}
              onMaxChange={(val) => onXRangeChange(xMin, val)}
            />
            <RangeSlider
              label="y (Imaginary axis)"
              min={yMin}
              max={yMax}
              onMinChange={(val) => onYRangeChange(val, yMax)}
              onMaxChange={(val) => onYRangeChange(yMin, val)}
            />
          </>
        )}
      </div>

      {is3D && (
        <div className="plot-settings__section">
          <h3 className="plot-settings__section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M2 12h20" />
              <path d="M17 7l-5 5-5-5" />
              <path d="M7 17l5-5 5 5" />
            </svg>
            Z-Axis Clamp
          </h3>
          <p className="plot-settings__hint">Limit Z range to tame poles</p>
          <div className="z-clamp-controls">
            <div className="z-clamp-input">
              <label className="z-clamp-input__label">Min Z</label>
              <div className="z-clamp-input__row">
                <input
                  type="checkbox"
                  checked={zMin !== undefined}
                  onChange={(e) => onZRangeChange(e.target.checked ? -10 : undefined, zMax)}
                  className="z-clamp-input__checkbox"
                />
                <input
                  type="number"
                  className="z-clamp-input__number"
                  value={zMin ?? ''}
                  placeholder="auto"
                  step={0.5}
                  disabled={zMin === undefined}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onZRangeChange(isNaN(val) ? undefined : val, zMax);
                  }}
                />
              </div>
            </div>
            <div className="z-clamp-input">
              <label className="z-clamp-input__label">Max Z</label>
              <div className="z-clamp-input__row">
                <input
                  type="checkbox"
                  checked={zMax !== undefined}
                  onChange={(e) => onZRangeChange(zMin, e.target.checked ? 10 : undefined)}
                  className="z-clamp-input__checkbox"
                />
                <input
                  type="number"
                  className="z-clamp-input__number"
                  value={zMax ?? ''}
                  placeholder="auto"
                  step={0.5}
                  disabled={zMax === undefined}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onZRangeChange(zMin, isNaN(val) ? undefined : val);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="plot-settings__section">
        <h3 className="plot-settings__section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 10v6m-9-9h6m10 0h6" />
          </svg>
          Quality
        </h3>
        
        {isContour ? (
          <Select
            label="Steps"
            value={tSteps}
            options={tStepOptions}
            onChange={(v) => onResolutionChange(parseInt(v))}
          />
        ) : (
          <Select
            label="Resolution"
            value={resolution}
            options={resolutionOptions}
            onChange={(v) => onResolutionChange(parseInt(v))}
          />
        )}
      </div>

      {!isContour && (
        <div className="plot-settings__section">
          <h3 className="plot-settings__section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            Visualization
          </h3>
          
          <Select
            label="Color by"
            value={colorBy}
            options={colorMappingOptions}
            onChange={(v) => onColorByChange(v as ColorMapping)}
          />
          
          {is3D && (
            <Select
              label="Height by"
              value={heightBy}
              options={colorMappingOptions}
              onChange={(v) => onHeightByChange(v as ColorMapping)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PlotSettings;

