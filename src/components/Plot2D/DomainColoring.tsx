import React from 'react';
import Plot from 'react-plotly.js';
import type { ColorMapping } from '../../types';

export interface DomainColoringProps {
  /** 2D array of z values (grid) */
  z: number[][];
  /** 2D array of color values (modulus, argument, etc.) */
  colors: number[][];
  /** X-axis range [min, max] for Re(z) */
  xRange: [number, number];
  /** Y-axis range [min, max] for Im(z) */
  yRange: [number, number];
  /** What the color represents */
  colorBy: ColorMapping;
  /** Optional title */
  title?: string;
}

const colorScaleMap: Record<ColorMapping, string> = {
  modulus: 'Viridis',
  argument: 'HSV',
  real: 'RdBu',
  imaginary: 'PiYG',
};

const colorBarTitleMap: Record<ColorMapping, string> = {
  modulus: '|f(z)|',
  argument: 'arg(f(z))',
  real: 'Re(f(z))',
  imaginary: 'Im(f(z))',
};

export const DomainColoring: React.FC<DomainColoringProps> = ({
  z: _z,
  colors,
  xRange,
  yRange,
  colorBy,
  title,
}) => {
  // Note: z is passed for potential future use but colors is used for the heatmap
  void _z;
  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange;

  // Calculate x and y tick values based on the grid dimensions
  const numRows = colors.length;
  const numCols = colors[0]?.length || 0;

  const xValues = Array.from({ length: numCols }, (_, i) =>
    xMin + (i / (numCols - 1)) * (xMax - xMin)
  );
  const yValues = Array.from({ length: numRows }, (_, i) =>
    yMin + (i / (numRows - 1)) * (yMax - yMin)
  );

  return (
    <Plot
      data={[
        {
          type: 'heatmap',
          z: colors,
          x: xValues,
          y: yValues,
          colorscale: colorScaleMap[colorBy],
          colorbar: {
            title: {
              text: colorBarTitleMap[colorBy],
              side: 'right',
            },
            thickness: 15,
            len: 0.9,
          },
          hoverongaps: false,
          hovertemplate:
            'Re(z): %{x:.3f}<br>Im(z): %{y:.3f}<br>' +
            colorBarTitleMap[colorBy] +
            ': %{z:.3f}<extra></extra>',
        },
      ]}
      layout={{
        title: title ? { text: title, font: { size: 16 } } : undefined,
        xaxis: {
          title: { text: 'Re(z)', standoff: 10 },
          scaleanchor: 'y',
          scaleratio: 1,
          range: xRange,
          gridcolor: 'rgba(128, 128, 128, 0.3)',
          zerolinecolor: 'rgba(128, 128, 128, 0.5)',
          zerolinewidth: 2,
        },
        yaxis: {
          title: { text: 'Im(z)', standoff: 10 },
          range: yRange,
          gridcolor: 'rgba(128, 128, 128, 0.3)',
          zerolinecolor: 'rgba(128, 128, 128, 0.5)',
          zerolinewidth: 2,
        },
        autosize: true,
        margin: { l: 60, r: 50, t: title ? 50 : 30, b: 50 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
      }}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler={true}
      config={{
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        displaylogo: false,
      }}
    />
  );
};

export default DomainColoring;

