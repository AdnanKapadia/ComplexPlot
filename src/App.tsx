import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import './App.css';
import { usePlotState } from './hooks/usePlotState';
import { FunctionInput, PlotSettings, ModeSelector, ContourInput } from './components/Controls';
import { DomainColoring, ContourPlot, IntegralVisualization } from './components/Plot2D';
import { Surface3D } from './components/Plot3D';
import { mathEngine } from './math';
import type { ContourIntegralData } from './types';

function App() {
  const {
    state,
    setMode,
    setExpression,
    setXRange,
    setYRange,
    setTRange,
    setZRange,
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
  
  // Integral visualization state
  const [showingIntegralId, setShowingIntegralId] = useState<string | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
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

  const toggleShowIntegral = useCallback((id: string) => {
    setShowingIntegralId(prev => {
      if (prev === id) {
        return null;
      }
      // Reset animation progress when starting new integral view
      setAnimationProgress(0);
      // Auto-start animation for the integral
      setAnimatingContourIds(new Set([id]));
      setIsAnimatingAll(false);
      return id;
    });
  }, []);

  // Stop animation when switching modes
  const handleModeChange = useCallback((mode: typeof state.mode) => {
    setIsAnimatingAll(false);
    setAnimatingContourIds(new Set());
    setShowingIntegralId(null);
    setMode(mode);
  }, [setMode]);
  
  // Get the contour entry for integral visualization
  const integralContour = useMemo(() => {
    if (!showingIntegralId) return null;
    return state.contour.contours.find(c => c.id === showingIntegralId) || null;
  }, [showingIntegralId, state.contour.contours]);
  
  // Compute integral data
  const integralData: ContourIntegralData | null = useMemo(() => {
    if (!integralContour) return null;
    return mathEngine.evaluateContourIntegral(integralContour);
  }, [integralContour]);
  
  // Animation loop for integral visualization
  const isIntegralAnimating = showingIntegralId !== null && 
    (isAnimatingAll || animatingContourIds.has(showingIntegralId));
  
  useEffect(() => {
    if (!isIntegralAnimating || !integralContour) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }
    
    const speed = integralContour.animationSpeed ?? 5;
    const tRange = integralContour.tMax - integralContour.tMin;
    
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - lastTimeRef.current;
      
      // Update at ~60fps
      if (elapsed >= 16) {
        lastTimeRef.current = timestamp;
        
        // Progress increment based on speed and tRange
        // Speed 1 = 0.02 t-units/frame, speed 10 = 0.2 t-units/frame
        const tIncrement = 0.02 * speed;
        const progressIncrement = tIncrement / tRange;
        
        setAnimationProgress(prev => {
          const next = prev + progressIncrement;
          return next >= 1 ? 0 : next; // Loop back to start
        });
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    lastTimeRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isIntegralAnimating, integralContour]);

  // Get values based on current mode
  const xMin = 'xMin' in currentConfig ? currentConfig.xMin : -2;
  const xMax = 'xMax' in currentConfig ? currentConfig.xMax : 2;
  const yMin = 'yMin' in currentConfig ? currentConfig.yMin : -2;
  const yMax = 'yMax' in currentConfig ? currentConfig.yMax : 2;
  const resolution = 'resolution' in currentConfig ? currentConfig.resolution : 256;
  const colorBy = 'colorBy' in currentConfig ? currentConfig.colorBy : 'argument';
  const heightBy = state.surface3d.heightBy;
  const zMin = state.surface3d.zMin;
  const zMax = state.surface3d.zMax;

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
          showingIntegralId={showingIntegralId}
          onToggleShowIntegral={toggleShowIntegral}
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
  
  // Whether to show split view for integral visualization
  const showIntegralSplit = state.mode === 'contour' && integralData !== null;

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
                zMin={zMin}
                zMax={zMax}
                resolution={resolution}
                tSteps={200}
                colorBy={colorBy}
                heightBy={heightBy}
                onXRangeChange={setXRange}
                onYRangeChange={setYRange}
                onTRangeChange={setTRange}
                onZRangeChange={setZRange}
                onResolutionChange={setResolution}
                onColorByChange={setColorBy}
                onHeightByChange={setHeightBy}
              />
            </div>
          )}
        </aside>

        {/* Main Plot Area */}
        <main className={`app-main ${showIntegralSplit ? 'split' : ''}`}>
          <div className={`plot-container ${showIntegralSplit ? 'split-left' : ''}`}>
            {renderPlot()}
          </div>
          {showIntegralSplit && integralData && (
            <div className="plot-container split-right">
              <IntegralVisualization
                integralData={integralData}
                animationProgress={animationProgress}
                isAnimating={isIntegralAnimating}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
