import { useMemo, useState, useCallback } from 'react';
import './App.css';
import { usePlotState } from './hooks/usePlotState';
import { FunctionInput, PlotSettings, ModeSelector, ContourInput } from './components/Controls';
import { DomainColoring, ContourPlot } from './components/Plot2D';
import { Surface3D } from './components/Plot3D';
import { mathEngine } from './math';

function App() {
  const {
    state,
    setMode,
    setExpression,
    setXRange,
    setYRange,
    setTRange,
    setResolution,
    setColorBy,
    setHeightBy,
    resetToDefaults,
    currentConfig,
    // Contour-specific
    addContour,
    removeContour,
    updateContour,
  } = usePlotState();

  // Animation state for contour mode
  const [isAnimatingAll, setIsAnimatingAll] = useState(false);
  const [animatingContourIds, setAnimatingContourIds] = useState<Set<string>>(new Set());
  
  const toggleAnimationAll = useCallback(() => {
    setIsAnimatingAll(prev => !prev);
    // Stop individual animations when toggling all
    if (!isAnimatingAll) {
      setAnimatingContourIds(new Set());
    }
  }, [isAnimatingAll]);

  const toggleContourAnimation = useCallback((id: string) => {
    setAnimatingContourIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    // Stop "all" animation when starting individual
    setIsAnimatingAll(false);
  }, []);

  // Stop animation when switching modes
  const handleModeChange = useCallback((mode: typeof state.mode) => {
    setIsAnimatingAll(false);
    setAnimatingContourIds(new Set());
    setMode(mode);
  }, [setMode]);

  // Get values based on current mode
  const xMin = 'xMin' in currentConfig ? currentConfig.xMin : -2;
  const xMax = 'xMax' in currentConfig ? currentConfig.xMax : 2;
  const yMin = 'yMin' in currentConfig ? currentConfig.yMin : -2;
  const yMax = 'yMax' in currentConfig ? currentConfig.yMax : 2;
  const resolution = 'resolution' in currentConfig ? currentConfig.resolution : 256;
  const colorBy = 'colorBy' in currentConfig ? currentConfig.colorBy : 'argument';
  const heightBy = state.surface3d.heightBy;

  // Generate plot data based on current mode
  const contourData = useMemo(() => {
    if (state.mode !== 'contour') return [];
    return mathEngine.evaluateContour(state.contour);
  }, [state.mode, state.contour]);

  const domainColoringData = useMemo(() => {
    if (state.mode !== 'domainColoring') return { z: [], colors: [] };
    return mathEngine.evaluateDomainColoring(state.domainColoring);
  }, [state.mode, state.domainColoring]);

  const surface3DData = useMemo(() => {
    if (state.mode !== 'surface3d') return { x: [], y: [], z: [], colors: [] };
    return mathEngine.evaluateSurface3D(state.surface3d);
  }, [state.mode, state.surface3d]);

  // Render the appropriate plot based on mode
  const renderPlot = () => {
    switch (state.mode) {
      case 'contour':
        return (
          <ContourPlot
            contours={contourData}
            xRange={[-4, 4]}
            yRange={[-4, 4]}
            isAnimatingAll={isAnimatingAll}
            animatingContourIds={animatingContourIds}
          />
        );

      case 'domainColoring':
        if (domainColoringData.colors.length === 0) {
          return (
            <div className="plot-placeholder">
              <p>Enter a valid expression like <code>z^2</code></p>
            </div>
          );
        }
        return (
          <DomainColoring
            z={domainColoringData.z}
            colors={domainColoringData.colors}
            xRange={[state.domainColoring.xMin, state.domainColoring.xMax]}
            yRange={[state.domainColoring.yMin, state.domainColoring.yMax]}
            colorBy={state.domainColoring.colorBy}
            title={`f(z) = ${state.domainColoring.expression}`}
          />
        );

      case 'surface3d':
        if (surface3DData.z.length === 0) {
          return (
            <div className="plot-placeholder">
              <p>Enter a valid expression like <code>z^2</code></p>
            </div>
          );
        }
        return (
          <Surface3D
            data={surface3DData}
            config={state.surface3d}
          />
        );

      default:
        return null;
    }
  };

  // Render the input section based on mode
  const renderInputSection = () => {
    if (state.mode === 'contour') {
      return (
        <ContourInput
          contours={state.contour.contours}
          onAdd={addContour}
          onRemove={removeContour}
          onUpdate={updateContour}
          isAnimatingAll={isAnimatingAll}
          onToggleAnimationAll={toggleAnimationAll}
          animatingContourIds={animatingContourIds}
          onToggleContourAnimation={toggleContourAnimation}
        />
      );
    }

    // For domain coloring and surface3d, use the single expression input
    const expression = 'expression' in currentConfig ? currentConfig.expression : '';
    return (
      <FunctionInput
        expression={expression}
        mode={state.mode}
        onChange={setExpression}
      />
    );
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__brand">
          <svg className="app-header__logo" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
            <path d="M8 12a4 4 0 0 0 8 0" strokeDasharray="2 2" />
          </svg>
          <h1 className="app-header__title">Complex Plotter</h1>
        </div>
        <button className="app-header__reset" onClick={resetToDefaults} title="Reset to defaults">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Reset
        </button>
      </header>

      <div className="app-content">
        {/* Sidebar Controls */}
        <aside className="app-sidebar">
          <div className="sidebar-section">
            <ModeSelector mode={state.mode} onChange={handleModeChange} />
          </div>

          <div className="sidebar-section">
            {renderInputSection()}
          </div>

          {state.mode !== 'contour' && (
            <div className="sidebar-section">
              <PlotSettings
                mode={state.mode}
                xMin={xMin}
                xMax={xMax}
                yMin={yMin}
                yMax={yMax}
                tMin={0}
                tMax={2 * Math.PI}
                resolution={resolution}
                tSteps={200}
                colorBy={colorBy}
                heightBy={heightBy}
                onXRangeChange={setXRange}
                onYRangeChange={setYRange}
                onTRangeChange={setTRange}
                onResolutionChange={setResolution}
                onColorByChange={setColorBy}
                onHeightByChange={setHeightBy}
              />
            </div>
          )}
        </aside>

        {/* Main Plot Area */}
        <main className="app-main">
          <div className="plot-container">
            {renderPlot()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
