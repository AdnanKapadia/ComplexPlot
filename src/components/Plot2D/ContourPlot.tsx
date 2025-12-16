import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { ContourData } from '../../types';

export interface ContourPlotProps {
  /** Array of contour data objects, each with points and styling */
  contours: ContourData[];
  /** X-axis range [min, max] for Re(z) */
  xRange?: [number, number];
  /** Y-axis range [min, max] for Im(z) */
  yRange?: [number, number];
  /** Whether all contours are animating */
  isAnimatingAll?: boolean;
  /** Set of contour IDs that are individually animating */
  animatingContourIds?: Set<string>;
}

export const ContourPlot: React.FC<ContourPlotProps> = ({
  contours,
  isAnimatingAll = false,
  animatingContourIds = new Set(),
}) => {
  const plotDivRef = useRef<Plot | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  // Per-contour progress tracking
  const progressMapRef = useRef<Map<string, number>>(new Map());

  // Check if any animation is active
  const hasAnyAnimation = isAnimatingAll || animatingContourIds.size > 0;

  // Build trace indices for tracers (one per contour that can be animated)
  const tracerInfo = useMemo(() => {
    const info: { contourId: string; contourIndex: number; traceIndex: number; points: { x: number; y: number }[]; tMin: number; tMax: number; color: string; animationSpeed: number }[] = [];
    let traceIndex = 0;
    
    contours.forEach((contour, contourIndex) => {
      if (contour.points.length === 0) return;
      
      // Main curve trace
      traceIndex++;
      // Start point marker
      traceIndex++;
      // End point marker (if more than 1 point)
      if (contour.points.length > 1) {
        traceIndex++;
      }
      
      // Tracer point
      if (contour.points.length > 1) {
        info.push({
          contourId: contour.id,
          contourIndex,
          traceIndex,
          points: contour.points.map(p => ({ x: p.re, y: p.im })),
          tMin: contour.tMin,
          tMax: contour.tMax,
          color: contour.color,
          animationSpeed: contour.animationSpeed,
        });
        traceIndex++;
      }
    });
    
    return info;
  }, [contours]);

  // Animation loop - uses Plotly.restyle directly to avoid React re-renders
  const animate = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp;
    }
    
    const elapsed = timestamp - lastTimeRef.current;
    
    // Update at ~60fps
    if (elapsed >= 16) {
      lastTimeRef.current = timestamp;
      
      // Update all tracer positions in a single batched Plotly call
      const plotElement = plotDivRef.current?.el;
      if (plotElement && tracerInfo.length > 0) {
        const updates: { x: number[][]; y: number[][]; visible: boolean[] } = {
          x: [],
          y: [],
          visible: [],
        };
        const traceIndices: number[] = [];
        
        tracerInfo.forEach((info) => {
          const isThisAnimating = isAnimatingAll || animatingContourIds.has(info.contourId);
          const tRange = info.tMax - info.tMin;
          
          // Get or initialize current t value for this contour (starts at tMin)
          let currentT = progressMapRef.current.get(info.contourId) ?? info.tMin;
          
          if (isThisAnimating) {
            // Speed is actual rate through t: speed 1 = 0.02 t-units/frame, speed 10 = 0.2 t-units/frame
            // At 60fps: speed 1 ≈ 1.2 t-units/sec, speed 10 ≈ 12 t-units/sec
            const tIncrement = 0.02 * info.animationSpeed;
            currentT += tIncrement;
            
            // Loop back to start when reaching end
            if (currentT >= info.tMax) {
              currentT = info.tMin + (currentT - info.tMax);
            }
            progressMapRef.current.set(info.contourId, currentT);
          }
          
          // Convert t to point index
          const normalizedT = (currentT - info.tMin) / tRange;
          const pointIndex = Math.min(
            Math.floor(normalizedT * (info.points.length - 1)),
            info.points.length - 1
          );
          const point = info.points[Math.max(0, pointIndex)];
          
          updates.x.push([point.x]);
          updates.y.push([point.y]);
          updates.visible.push(isThisAnimating);
          traceIndices.push(info.traceIndex);
        });
        
        // Single batched restyle call for all tracers
        if (traceIndices.length > 0) {
          (window as any).Plotly?.restyle(plotElement, updates, traceIndices);
        }
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [tracerInfo, isAnimatingAll, animatingContourIds]);

  // Track if animation was previously active (to know when to hide tracers)
  const wasAnimatingRef = useRef(false);

  // Start/stop animation
  useEffect(() => {
    if (hasAnyAnimation) {
      wasAnimatingRef.current = true;
      // Reset progress for contours that are starting to animate
      progressMapRef.current.clear();
      lastTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Only hide tracers if we were previously animating (not on initial mount)
      if (wasAnimatingRef.current) {
        wasAnimatingRef.current = false;
        progressMapRef.current.clear();
        const plotElement = plotDivRef.current?.el;
        if (plotElement && tracerInfo.length > 0) {
          const traceIndices = tracerInfo.map(info => info.traceIndex);
          const visible = tracerInfo.map(() => false);
          (window as any).Plotly?.restyle(plotElement, { visible }, traceIndices);
        }
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [hasAnyAnimation, animate, tracerInfo]);

  // Build static traces (memoized - only changes when contours change)
  const traces = useMemo(() => {
    const result: Plotly.Data[] = [];

    contours.forEach((contour, contourIndex) => {
      if (contour.points.length === 0) return;

      const xValues = contour.points.map((p) => p.re);
      const yValues = contour.points.map((p) => p.im);
      
      const tValues = contour.points.map((_, i) => {
        const normalized = i / (contour.points.length - 1 || 1);
        return contour.tMin + normalized * (contour.tMax - contour.tMin);
      });

      // Main curve trace
      result.push({
        type: 'scatter',
        mode: 'lines',
        x: xValues,
        y: yValues,
        line: {
          color: contour.color,
          width: 2.5,
          shape: 'spline',
          smoothing: 0.8,
        },
        customdata: tValues,
        hovertemplate:
          `<b>z<sub>${contourIndex + 1}</sub>(t)</b><br>` +
          't = %{customdata:.3f}<br>' +
          'z = %{x:.3f} + %{y:.3f}i<extra></extra>',
        name: `z${contourIndex + 1}(t) = ${contour.expression}`,
        legendgroup: contour.id,
      });

      // Start point marker
      result.push({
        type: 'scatter',
        mode: 'markers',
        x: [xValues[0]],
        y: [yValues[0]],
        marker: {
          size: 8,
          color: contour.color,
          symbol: 'circle',
          line: { color: 'rgba(255,255,255,0.8)', width: 2 },
        },
        hovertemplate: `Start (t=${contour.tMin.toFixed(2)})<br>z = %{x:.3f} + %{y:.3f}i<extra></extra>`,
        name: `Start`,
        legendgroup: contour.id,
        showlegend: false,
      });

      // End point marker
      if (xValues.length > 1) {
        result.push({
          type: 'scatter',
          mode: 'markers',
          x: [xValues[xValues.length - 1]],
          y: [yValues[yValues.length - 1]],
          marker: {
            size: 8,
            color: contour.color,
            symbol: 'diamond',
            line: { color: 'rgba(255,255,255,0.8)', width: 2 },
          },
          hovertemplate: `End (t=${contour.tMax.toFixed(2)})<br>z = %{x:.3f} + %{y:.3f}i<extra></extra>`,
          name: `End`,
          legendgroup: contour.id,
          showlegend: false,
        });
      }

      // Tracer point placeholder (initially hidden, will be updated via restyle)
      if (contour.points.length > 1) {
        result.push({
          type: 'scatter',
          mode: 'markers',
          x: [xValues[0]],
          y: [yValues[0]],
          marker: {
            size: 14,
            color: '#fff',
            symbol: 'circle',
            line: { color: contour.color, width: 3 },
          },
          hoverinfo: 'skip',
          name: `Tracer`,
          legendgroup: contour.id,
          showlegend: false,
          visible: false, // Hidden by default
        });
      }
    });

    return result;
  }, [contours]);

  const layout = useMemo(() => ({
    xaxis: {
      title: { text: 'Re(z)', standoff: 10, font: { color: '#8b949e' } },
      scaleanchor: 'y' as const,
      scaleratio: 1,
      gridcolor: 'rgba(128, 128, 128, 0.2)',
      zerolinecolor: 'rgba(100, 180, 255, 0.4)',
      zerolinewidth: 2,
      tickfont: { color: '#8b949e' },
      color: '#8b949e',
    },
    yaxis: {
      title: { text: 'Im(z)', standoff: 10, font: { color: '#8b949e' } },
      gridcolor: 'rgba(128, 128, 128, 0.2)',
      zerolinecolor: 'rgba(100, 180, 255, 0.4)',
      zerolinewidth: 2,
      tickfont: { color: '#8b949e' },
      color: '#8b949e',
    },
    autosize: true,
    margin: { l: 60, r: 50, t: 30, b: 50 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    showlegend: contours.length > 0,
    legend: {
      x: 1,
      xanchor: 'right' as const,
      y: 1,
      bgcolor: 'rgba(22, 27, 34, 0.95)',
      bordercolor: 'rgba(128, 128, 128, 0.3)',
      borderwidth: 1,
      font: { color: '#e6edf3', size: 11 },
    },
    hovermode: 'closest' as const,
    dragmode: 'pan' as const,
    uirevision: 'true', // Keep static to preserve user interactions
  }), [contours.length]);

  return (
    <Plot
      ref={plotDivRef}
      data={traces}
      layout={layout}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler={true}
      config={{
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        displaylogo: false,
        scrollZoom: true,
      }}
    />
  );
};

export default ContourPlot;
