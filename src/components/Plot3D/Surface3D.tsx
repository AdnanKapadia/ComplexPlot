/**
 * Surface3D - 3D surface visualization for complex functions
 * Uses Plotly.js to render surfaces where height and color represent complex values
 */

import Plot from 'react-plotly.js';
import type { ColorMapping, Surface3DConfig } from '../../types';

interface Surface3DData {
  x: number[];
  y: number[];
  z: number[][];
  colors: number[][];
}

interface Surface3DProps {
  /** Pre-computed data arrays from math engine */
  data: Surface3DData;
  /** Configuration for the surface plot */
  config: Surface3DConfig;
  /** Width of the plot in pixels */
  width?: number;
  /** Height of the plot in pixels */
  height?: number;
}

/**
 * Get human-readable label for a color mapping
 */
function getMappingLabel(mapping: ColorMapping): string {
  switch (mapping) {
    case 'modulus':
      return '|f(z)|';
    case 'argument':
      return 'arg(f(z))';
    case 'real':
      return 'Re(f(z))';
    case 'imaginary':
      return 'Im(f(z))';
    default:
      return mapping;
  }
}

/**
 * Get appropriate colorscale based on mapping type
 */
function getColorScale(mapping: ColorMapping): Plotly.ColorScale {
  switch (mapping) {
    case 'modulus':
      // Viridis works well for magnitude - perceptually uniform
      return 'Viridis';
    case 'argument':
      // HSL-based for cyclic phase values (-π to π)
      return [
        [0, 'hsl(0, 80%, 50%)'],      // -π: red
        [0.167, 'hsl(60, 80%, 50%)'],  // -π/3: yellow
        [0.333, 'hsl(120, 80%, 50%)'], // π/3: green
        [0.5, 'hsl(180, 80%, 50%)'],   // 0: cyan
        [0.667, 'hsl(240, 80%, 50%)'], // π/3: blue
        [0.833, 'hsl(300, 80%, 50%)'], // 2π/3: magenta
        [1, 'hsl(360, 80%, 50%)'],     // π: red (cyclic)
      ];
    case 'real':
      // Diverging colorscale centered at 0
      return 'RdBu';
    case 'imaginary':
      // Different diverging colorscale for imaginary
      return 'PiYG';
    default:
      return 'Viridis';
  }
}

/**
 * Surface3D Component
 * 
 * Renders a 3D surface plot for complex function visualization:
 * - x-axis: Real part of input z
 * - y-axis: Imaginary part of input z  
 * - z-axis: Chosen property (modulus, argument, real, or imaginary part) of f(z)
 * - Color: Independently chosen property of f(z)
 */
export function Surface3D({ 
  data, 
  config, 
  width = 700, 
  height = 600 
}: Surface3DProps) {
  const { x, y, z, colors } = data;
  const { heightBy, colorBy, expression } = config;

  // Validate data
  if (!x.length || !y.length || !z.length || !colors.length) {
    return (
      <div 
        style={{ 
          width, 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#1a1a2e',
          color: '#e0e0e0',
          borderRadius: '8px',
          fontFamily: 'system-ui, sans-serif'
        }}
      >
        No data to display. Enter a valid expression.
      </div>
    );
  }

  const surfaceData: Plotly.Data[] = [
    {
      type: 'surface',
      x: x,
      y: y,
      z: z,
      surfacecolor: colors,
      colorscale: getColorScale(colorBy),
      colorbar: {
        title: {
          text: getMappingLabel(colorBy),
          side: 'right',
          font: { color: '#e0e0e0', size: 14 }
        },
        tickfont: { color: '#e0e0e0' },
        bgcolor: 'rgba(30, 30, 50, 0.8)',
        bordercolor: '#444',
        borderwidth: 1,
        len: 0.75,
        thickness: 20,
      },
      contours: {
        z: {
          show: true,
          usecolormap: true,
          highlightcolor: '#fff',
          project: { z: false }
        }
      },
      lighting: {
        ambient: 0.6,
        diffuse: 0.8,
        specular: 0.3,
        roughness: 0.5,
        fresnel: 0.2
      },
      lightposition: {
        x: 100,
        y: 200,
        z: 0
      },
      hovertemplate: 
        'Re(z): %{x:.3f}<br>' +
        'Im(z): %{y:.3f}<br>' +
        `${getMappingLabel(heightBy)}: %{z:.3f}<br>` +
        '<extra></extra>',
    } as Plotly.Data
  ];

  const layout: Partial<Plotly.Layout> = {
    title: {
      text: `f(z) = ${expression}`,
      font: { 
        color: '#e0e0e0', 
        size: 18,
        family: 'Georgia, serif'
      },
      x: 0.5,
      xanchor: 'center'
    },
    autosize: false,
    width: width,
    height: height,
    paper_bgcolor: '#0f0f1a',
    plot_bgcolor: '#0f0f1a',
    margin: {
      l: 50,
      r: 50,
      t: 80,
      b: 50
    },
    scene: {
      xaxis: {
        title: {
          text: 'Re(z)',
          font: { color: '#e0e0e0', size: 14 }
        },
        tickfont: { color: '#b0b0b0' },
        gridcolor: '#333',
        zerolinecolor: '#666',
        backgroundcolor: '#0f0f1a',
        showspikes: false,
      },
      yaxis: {
        title: {
          text: 'Im(z)',
          font: { color: '#e0e0e0', size: 14 }
        },
        tickfont: { color: '#b0b0b0' },
        gridcolor: '#333',
        zerolinecolor: '#666',
        backgroundcolor: '#0f0f1a',
        showspikes: false,
      },
      zaxis: {
        title: {
          text: getMappingLabel(heightBy),
          font: { color: '#e0e0e0', size: 14 }
        },
        tickfont: { color: '#b0b0b0' },
        gridcolor: '#333',
        zerolinecolor: '#666',
        backgroundcolor: '#0f0f1a',
        showspikes: false,
      },
      bgcolor: '#0f0f1a',
      camera: {
        eye: { x: 1.5, y: 1.5, z: 1.2 },
        center: { x: 0, y: 0, z: -0.1 },
        up: { x: 0, y: 0, z: 1 }
      },
      aspectmode: 'manual',
      aspectratio: { x: 1, y: 1, z: 0.8 },
      dragmode: 'orbit',
    },
  };

  const plotConfig: Partial<Plotly.Config> = {
    displayModeBar: true,
    modeBarButtonsToRemove: [
      'toImage',
      'sendDataToCloud',
      'lasso2d',
      'select2d',
    ],
    modeBarButtonsToAdd: [],
    displaylogo: false,
    responsive: true,
    scrollZoom: true,
  };

  return (
    <div 
      style={{ 
        borderRadius: '8px', 
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)'
      }}
    >
      <Plot
        data={surfaceData}
        layout={layout}
        config={plotConfig}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

export default Surface3D;

