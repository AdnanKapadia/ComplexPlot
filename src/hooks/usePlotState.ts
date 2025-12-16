import { useState, useCallback, useMemo } from 'react';
import type {
  PlotState,
  PlotMode,
  ContourConfig,
  ContourEntry,
  DomainColoringConfig,
  Surface3DConfig,
  ColorMapping,
} from '../types/index';

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

let contourIdCounter = 0;

function createContourEntry(
  expression: string = '',
  colorIndex: number = 0,
  tMin: number = 0,
  tMax: number = 2 * Math.PI,
  tSteps: number = 200,
  transformFunction: string = '',
  animationSpeed: number = 5
): ContourEntry {
  return {
    id: `contour-${++contourIdCounter}`,
    expression,
    transformFunction,
    color: CONTOUR_COLORS[colorIndex % CONTOUR_COLORS.length],
    enabled: true,
    tMin,
    tMax,
    tSteps,
    animationSpeed,
  };
}

const defaultContour: ContourConfig = {
  contours: [createContourEntry('exp(i * t)', 0)],
};

const defaultDomainColoring: DomainColoringConfig = {
  expression: 'z^2',
  xMin: -2,
  xMax: 2,
  yMin: -2,
  yMax: 2,
  resolution: 256,
  colorBy: 'argument',
};

const defaultSurface3D: Surface3DConfig = {
  expression: 'z^2',
  xMin: -2,
  xMax: 2,
  yMin: -2,
  yMax: 2,
  resolution: 64,
  heightBy: 'modulus',
  colorBy: 'argument',
};

const defaultPlotState: PlotState = {
  mode: 'contour',
  contour: defaultContour,
  domainColoring: defaultDomainColoring,
  surface3d: defaultSurface3D,
};

export interface UsePlotStateReturn {
  state: PlotState;
  setMode: (mode: PlotMode) => void;
  setContour: (config: Partial<ContourConfig>) => void;
  setDomainColoring: (config: Partial<DomainColoringConfig>) => void;
  setSurface3D: (config: Partial<Surface3DConfig>) => void;
  // Contour-specific methods
  addContour: () => void;
  removeContour: (id: string) => void;
  updateContour: (id: string, updates: Partial<ContourEntry>) => void;
  // Generic setters for current mode
  setExpression: (expression: string) => void;
  setXRange: (xMin: number, xMax: number) => void;
  setYRange: (yMin: number, yMax: number) => void;
  setTRange: (tMin: number, tMax: number) => void;
  setResolution: (resolution: number) => void;
  setColorBy: (colorBy: ColorMapping) => void;
  setHeightBy: (heightBy: ColorMapping) => void;
  resetToDefaults: () => void;
  currentConfig: ContourConfig | DomainColoringConfig | Surface3DConfig;
}

export function usePlotState(initialState?: Partial<PlotState>): UsePlotStateReturn {
  const [state, setState] = useState<PlotState>({
    ...defaultPlotState,
    ...initialState,
  });

  const setMode = useCallback((mode: PlotMode) => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  const setContour = useCallback((config: Partial<ContourConfig>) => {
    setState((prev) => ({
      ...prev,
      contour: { ...prev.contour, ...config },
    }));
  }, []);

  const setDomainColoring = useCallback((config: Partial<DomainColoringConfig>) => {
    setState((prev) => ({
      ...prev,
      domainColoring: { ...prev.domainColoring, ...config },
    }));
  }, []);

  const setSurface3D = useCallback((config: Partial<Surface3DConfig>) => {
    setState((prev) => ({
      ...prev,
      surface3d: { ...prev.surface3d, ...config },
    }));
  }, []);

  // Contour-specific: add new contour (copies t-range from last contour if exists)
  const addContour = useCallback(() => {
    setState((prev) => {
      const lastContour = prev.contour.contours[prev.contour.contours.length - 1];
      const newEntry = createContourEntry(
        '',
        prev.contour.contours.length,
        lastContour?.tMin ?? 0,
        lastContour?.tMax ?? 2 * Math.PI,
        lastContour?.tSteps ?? 200
      );
      return {
        ...prev,
        contour: {
          ...prev.contour,
          contours: [...prev.contour.contours, newEntry],
        },
      };
    });
  }, []);

  // Contour-specific: remove contour by id
  const removeContour = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      contour: {
        ...prev.contour,
        contours: prev.contour.contours.filter((c) => c.id !== id),
      },
    }));
  }, []);

  // Contour-specific: update a contour entry
  const updateContour = useCallback((id: string, updates: Partial<ContourEntry>) => {
    setState((prev) => ({
      ...prev,
      contour: {
        ...prev.contour,
        contours: prev.contour.contours.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      },
    }));
  }, []);

  // Generic expression setter (for domain coloring and surface3d)
  const setExpression = useCallback((expression: string) => {
    setState((prev) => {
      switch (prev.mode) {
        case 'contour':
          // For contour mode, this updates the first contour
          if (prev.contour.contours.length > 0) {
            const updatedContours = [...prev.contour.contours];
            updatedContours[0] = { ...updatedContours[0], expression };
            return { ...prev, contour: { ...prev.contour, contours: updatedContours } };
          }
          return prev;
        case 'domainColoring':
          return { ...prev, domainColoring: { ...prev.domainColoring, expression } };
        case 'surface3d':
          return { ...prev, surface3d: { ...prev.surface3d, expression } };
      }
    });
  }, []);

  const setXRange = useCallback((xMin: number, xMax: number) => {
    setState((prev) => {
      switch (prev.mode) {
        case 'contour':
          return prev;
        case 'domainColoring':
          return { ...prev, domainColoring: { ...prev.domainColoring, xMin, xMax } };
        case 'surface3d':
          return { ...prev, surface3d: { ...prev.surface3d, xMin, xMax } };
      }
    });
  }, []);

  const setYRange = useCallback((yMin: number, yMax: number) => {
    setState((prev) => {
      switch (prev.mode) {
        case 'contour':
          return prev;
        case 'domainColoring':
          return { ...prev, domainColoring: { ...prev.domainColoring, yMin, yMax } };
        case 'surface3d':
          return { ...prev, surface3d: { ...prev.surface3d, yMin, yMax } };
      }
    });
  }, []);

  // For contour mode, t-range is set per-contour via updateContour
  const setTRange = useCallback((_tMin: number, _tMax: number) => {
    // No-op: each contour has its own t-range now
  }, []);

  const setResolution = useCallback((resolution: number) => {
    setState((prev) => {
      switch (prev.mode) {
        case 'contour':
          return { ...prev, contour: { ...prev.contour, tSteps: resolution } };
        case 'domainColoring':
          return { ...prev, domainColoring: { ...prev.domainColoring, resolution } };
        case 'surface3d':
          return { ...prev, surface3d: { ...prev.surface3d, resolution } };
      }
    });
  }, []);

  const setColorBy = useCallback((colorBy: ColorMapping) => {
    setState((prev) => {
      switch (prev.mode) {
        case 'contour':
          return prev;
        case 'domainColoring':
          return { ...prev, domainColoring: { ...prev.domainColoring, colorBy } };
        case 'surface3d':
          return { ...prev, surface3d: { ...prev.surface3d, colorBy } };
      }
    });
  }, []);

  const setHeightBy = useCallback((heightBy: ColorMapping) => {
    setState((prev) => ({
      ...prev,
      surface3d: { ...prev.surface3d, heightBy },
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    // Reset the counter for fresh IDs
    contourIdCounter = 0;
    setState({
      ...defaultPlotState,
      contour: {
        ...defaultContour,
        contours: [createContourEntry('exp(i * t)', 0)],
      },
    });
  }, []);

  const currentConfig = useMemo(() => {
    switch (state.mode) {
      case 'contour':
        return state.contour;
      case 'domainColoring':
        return state.domainColoring;
      case 'surface3d':
        return state.surface3d;
    }
  }, [state]);

  return {
    state,
    setMode,
    setContour,
    setDomainColoring,
    setSurface3D,
    addContour,
    removeContour,
    updateContour,
    setExpression,
    setXRange,
    setYRange,
    setTRange,
    setResolution,
    setColorBy,
    setHeightBy,
    resetToDefaults,
    currentConfig,
  };
}

export default usePlotState;
