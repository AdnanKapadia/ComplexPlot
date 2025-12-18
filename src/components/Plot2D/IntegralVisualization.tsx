import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import Plot from 'react-plotly.js';
import type { ContourIntegralData, ComplexPoint } from '../../types';
import './IntegralVisualization.css';

export interface IntegralVisualizationProps {
  /** Contour integral data with integrand vectors and running sum */
  integralData: ContourIntegralData;
  /** Current animation progress (0 to 1) - externally controlled */
  animationProgress: number;
  /** Whether animation is active */
  isAnimating: boolean;
}

/**
 * Format a complex number for display
 */
function formatComplex(z: ComplexPoint, precision = 3): string {
  const re = z.re.toFixed(precision);
  const im = Math.abs(z.im).toFixed(precision);
  const sign = z.im >= 0 ? '+' : '-';
  return `${re} ${sign} ${im}i`;
}

/**
 * Get the magnitude of a complex number
 */
function magnitude(z: ComplexPoint): number {
  return Math.sqrt(z.re * z.re + z.im * z.im);
}

export const IntegralVisualization: React.FC<IntegralVisualizationProps> = ({
  integralData,
  animationProgress,
  isAnimating,
}) => {
  const { integrandVectors, runningSum, finalValue, color, tValues, transformFunction } = integralData;
  
  const integrandPlotRef = useRef<Plot | null>(null);
  const runningSumPlotRef = useRef<Plot | null>(null);
  
  // Current index based on animation progress
  const currentIndex = useMemo(() => {
    if (runningSum.length === 0) return 0;
    return Math.min(
      Math.floor(animationProgress * (runningSum.length - 1)),
      runningSum.length - 1
    );
  }, [animationProgress, runningSum.length]);

  // Current values
  const currentIntegrand = integrandVectors[currentIndex] || { re: 0, im: 0 };
  const currentSum = runningSum[currentIndex] || { re: 0, im: 0 };
  const currentT = tValues[currentIndex] || 0;

  // Compute scale for integrand plot to show arrow nicely
  const maxIntegrandMag = useMemo(() => {
    let max = 0;
    for (const v of integrandVectors) {
      const m = magnitude(v);
      if (m > max) max = m;
    }
    return Math.max(max, 0.1); // Minimum scale
  }, [integrandVectors]);

  // Compute bounds for running sum plot
  const sumBounds = useMemo(() => {
    let minRe = 0, maxRe = 0, minIm = 0, maxIm = 0;
    for (const s of runningSum) {
      minRe = Math.min(minRe, s.re);
      maxRe = Math.max(maxRe, s.re);
      minIm = Math.min(minIm, s.im);
      maxIm = Math.max(maxIm, s.im);
    }
    // Add padding
    const reRange = maxRe - minRe || 1;
    const imRange = maxIm - minIm || 1;
    const padding = Math.max(reRange, imRange) * 0.15;
    return {
      minRe: minRe - padding,
      maxRe: maxRe + padding,
      minIm: minIm - padding,
      maxIm: maxIm + padding,
    };
  }, [runningSum]);

  // Animation frame update for smooth tracer updates via Plotly.restyle
  const animationFrameRef = useRef<number | null>(null);
  const lastProgressRef = useRef<number>(0);

  const updateTracers = useCallback(() => {
    if (Math.abs(animationProgress - lastProgressRef.current) < 0.001) {
      return;
    }
    lastProgressRef.current = animationProgress;

    const idx = Math.min(
      Math.floor(animationProgress * (runningSum.length - 1)),
      runningSum.length - 1
    );
    
    const integrand = integrandVectors[idx] || { re: 0, im: 0 };
    const sum = runningSum[idx] || { re: 0, im: 0 };

    // Update integrand arrow
    const integrandEl = integrandPlotRef.current?.el;
    if (integrandEl) {
      (window as any).Plotly?.restyle(integrandEl, {
        x: [[0, integrand.re]],
        y: [[0, integrand.im]],
      }, [0]);
      (window as any).Plotly?.restyle(integrandEl, {
        x: [[integrand.re]],
        y: [[integrand.im]],
      }, [1]);
    }

    // Update running sum tracer
    const sumEl = runningSumPlotRef.current?.el;
    if (sumEl) {
      // Update visible portion of path
      const visibleX = runningSum.slice(0, idx + 1).map(p => p.re);
      const visibleY = runningSum.slice(0, idx + 1).map(p => p.im);
      (window as any).Plotly?.restyle(sumEl, {
        x: [visibleX],
        y: [visibleY],
      }, [0]);
      // Update current point marker
      (window as any).Plotly?.restyle(sumEl, {
        x: [[sum.re]],
        y: [[sum.im]],
      }, [1]);
    }
  }, [animationProgress, integrandVectors, runningSum]);

  useEffect(() => {
    if (isAnimating) {
      const animate = () => {
        updateTracers();
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Final update when not animating
      updateTracers();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, updateTracers]);

  // Integrand vector plot traces
  const integrandTraces: Plotly.Data[] = useMemo(() => [
    // Arrow line from origin to current integrand
    {
      type: 'scatter',
      mode: 'lines',
      x: [0, currentIntegrand.re],
      y: [0, currentIntegrand.im],
      line: { color: color, width: 3 },
      hoverinfo: 'skip',
      name: 'f(γ(t))·γ\'(t)',
    },
    // Arrow head marker
    {
      type: 'scatter',
      mode: 'markers',
      x: [currentIntegrand.re],
      y: [currentIntegrand.im],
      marker: {
        size: 12,
        color: color,
        symbol: 'triangle-up',
        angle: Math.atan2(currentIntegrand.im, currentIntegrand.re) * 180 / Math.PI - 90,
      },
      hovertemplate: `f(γ(t))·γ'(t) = ${formatComplex(currentIntegrand)}<extra></extra>`,
      name: 'Current',
      showlegend: false,
    },
    // Origin marker
    {
      type: 'scatter',
      mode: 'markers',
      x: [0],
      y: [0],
      marker: { size: 6, color: '#8b949e', symbol: 'circle' },
      hoverinfo: 'skip',
      name: 'Origin',
      showlegend: false,
    },
  ], [currentIntegrand, color]);

  // Running sum plot traces
  const runningSumTraces: Plotly.Data[] = useMemo(() => {
    // Only show path up to current index for animation
    const visiblePath = runningSum.slice(0, currentIndex + 1);
    
    return [
      // Full path traced so far
      {
        type: 'scatter',
        mode: 'lines',
        x: visiblePath.map(p => p.re),
        y: visiblePath.map(p => p.im),
        line: { color: color, width: 2 },
        hoverinfo: 'skip',
        name: '∫f(z)dz path',
      },
      // Current point marker
      {
        type: 'scatter',
        mode: 'markers',
        x: [currentSum.re],
        y: [currentSum.im],
        marker: {
          size: 14,
          color: '#fff',
          symbol: 'circle',
          line: { color: color, width: 3 },
        },
        hovertemplate: `∫f(z)dz = ${formatComplex(currentSum)}<extra></extra>`,
        name: 'Current integral',
        showlegend: false,
      },
      // Origin marker
      {
        type: 'scatter',
        mode: 'markers',
        x: [0],
        y: [0],
        marker: { size: 8, color: '#8b949e', symbol: 'x' },
        hovertemplate: 'Origin<extra></extra>',
        name: 'Origin',
        showlegend: false,
      },
      // Final value marker (ghost, shown faintly)
      {
        type: 'scatter',
        mode: 'markers',
        x: [finalValue.re],
        y: [finalValue.im],
        marker: {
          size: 10,
          color: color,
          symbol: 'diamond',
          opacity: 0.3,
          line: { color: '#fff', width: 1 },
        },
        hovertemplate: `Final: ${formatComplex(finalValue)}<extra></extra>`,
        name: 'Final value',
        showlegend: false,
      },
    ];
  }, [runningSum, currentIndex, currentSum, finalValue, color]);

  // Integrand layout
  const integrandLayout = useMemo(() => ({
    xaxis: {
      title: { text: 'Re', standoff: 5, font: { color: '#8b949e', size: 11 } },
      range: [-maxIntegrandMag * 1.2, maxIntegrandMag * 1.2],
      scaleanchor: 'y' as const,
      scaleratio: 1,
      gridcolor: 'rgba(128, 128, 128, 0.2)',
      zerolinecolor: 'rgba(100, 180, 255, 0.4)',
      zerolinewidth: 1,
      tickfont: { color: '#8b949e', size: 10 },
      color: '#8b949e',
    },
    yaxis: {
      title: { text: 'Im', standoff: 5, font: { color: '#8b949e', size: 11 } },
      range: [-maxIntegrandMag * 1.2, maxIntegrandMag * 1.2],
      gridcolor: 'rgba(128, 128, 128, 0.2)',
      zerolinecolor: 'rgba(100, 180, 255, 0.4)',
      zerolinewidth: 1,
      tickfont: { color: '#8b949e', size: 10 },
      color: '#8b949e',
    },
    autosize: true,
    margin: { l: 40, r: 10, t: 30, b: 35 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    showlegend: false,
    title: {
      text: `f(γ(t))·γ'(t)`,
      font: { color: '#e6edf3', size: 13 },
      x: 0.5,
      y: 0.97,
    },
    annotations: [{
      x: 0.5,
      y: -0.15,
      xref: 'paper' as const,
      yref: 'paper' as const,
      text: `t = ${currentT.toFixed(3)}`,
      showarrow: false,
      font: { color: '#8b949e', size: 11 },
    }],
    uirevision: 'integrand',
  }), [maxIntegrandMag, currentT]);

  // Running sum layout
  const runningSumLayout = useMemo(() => ({
    xaxis: {
      title: { text: 'Re', standoff: 5, font: { color: '#8b949e', size: 11 } },
      range: [sumBounds.minRe, sumBounds.maxRe],
      scaleanchor: 'y' as const,
      scaleratio: 1,
      gridcolor: 'rgba(128, 128, 128, 0.2)',
      zerolinecolor: 'rgba(100, 180, 255, 0.4)',
      zerolinewidth: 1,
      tickfont: { color: '#8b949e', size: 10 },
      color: '#8b949e',
    },
    yaxis: {
      title: { text: 'Im', standoff: 5, font: { color: '#8b949e', size: 11 } },
      range: [sumBounds.minIm, sumBounds.maxIm],
      gridcolor: 'rgba(128, 128, 128, 0.2)',
      zerolinecolor: 'rgba(100, 180, 255, 0.4)',
      zerolinewidth: 1,
      tickfont: { color: '#8b949e', size: 10 },
      color: '#8b949e',
    },
    autosize: true,
    margin: { l: 40, r: 10, t: 30, b: 35 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    showlegend: false,
    title: {
      text: '∫f(z)dz',
      font: { color: '#e6edf3', size: 13 },
      x: 0.5,
      y: 0.97,
    },
    uirevision: 'runningSum',
  }), [sumBounds]);

  const plotConfig = {
    responsive: true,
    displayModeBar: false,
    staticPlot: false,
  };

  return (
    <div className="integral-visualization">
      <div className="integral-visualization__header">
        <span className="integral-visualization__title">
          Contour Integral: ∮ {transformFunction}(z) dz
        </span>
      </div>
      
      <div className="integral-visualization__panels">
        {/* Integrand Vector Panel */}
        <div className="integral-visualization__panel">
          <Plot
            ref={integrandPlotRef}
            data={integrandTraces}
            layout={integrandLayout}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
            config={plotConfig}
          />
        </div>
        
        {/* Running Sum Panel */}
        <div className="integral-visualization__panel">
          <Plot
            ref={runningSumPlotRef}
            data={runningSumTraces}
            layout={runningSumLayout}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
            config={plotConfig}
          />
        </div>
      </div>
      
      {/* Final Value Display */}
      <div className="integral-visualization__result">
        <span className="integral-visualization__label">Final:</span>
        <span className="integral-visualization__value" style={{ color }}>
          ∮f(z)dz = {formatComplex(finalValue, 4)}
        </span>
        <span className="integral-visualization__magnitude">
          |∮| = {magnitude(finalValue).toFixed(4)}
        </span>
      </div>
    </div>
  );
};

export default IntegralVisualization;

