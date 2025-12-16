import React from 'react';
import type { PlotMode } from '../../types/index';
import './ModeSelector.css';

export interface ModeSelectorProps {
  mode: PlotMode;
  onChange: (mode: PlotMode) => void;
}

interface ModeOption {
  value: PlotMode;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const modeOptions: ModeOption[] = [
  {
    value: 'contour',
    label: 'Contour',
    description: 'Parametric curves z(t)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
      </svg>
    ),
  },
  {
    value: 'domainColoring',
    label: 'Domain',
    description: '2D color mapping f(z)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    value: 'surface3d',
    label: '3D Surface',
    description: '3D height visualization',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3L2 12l10 9 10-9z" />
        <path d="M2 12l10 9" />
        <path d="M22 12l-10 9" />
        <path d="M12 21V12" />
        <path d="M12 3v9" />
      </svg>
    ),
  },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, onChange }) => {
  return (
    <div className="mode-selector">
      <div className="mode-selector__tabs">
        {modeOptions.map((option) => (
          <button
            key={option.value}
            className={`mode-selector__tab ${mode === option.value ? 'active' : ''}`}
            onClick={() => onChange(option.value)}
            title={option.description}
          >
            <span className="mode-selector__icon">{option.icon}</span>
            <span className="mode-selector__label">{option.label}</span>
          </button>
        ))}
        <div
          className="mode-selector__indicator"
          style={{
            transform: `translateX(${modeOptions.findIndex((o) => o.value === mode) * 100}%)`,
          }}
        />
      </div>
      <p className="mode-selector__description">
        {modeOptions.find((o) => o.value === mode)?.description}
      </p>
    </div>
  );
};

export default ModeSelector;

