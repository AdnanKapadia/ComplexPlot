# Complex Plotter

An interactive web application for visualizing complex functions. Built with React, TypeScript, and Plotly.js.

![Complex Plotter](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Vite](https://img.shields.io/badge/Vite-7-purple)

## Features

### Three Visualization Modes

- **Contour Plot** — Plot parametric curves `z(t)` in the complex plane
- **Domain Coloring** — Classic 2D visualization of complex functions `f(z)` using color mapping
- **3D Surface** — Interactive 3D surface plots showing the magnitude/phase of complex functions

### Color Mappings

Choose how to color your visualizations:
- **Modulus** — Color by `|f(z)|`
- **Argument** — Color by `arg(f(z))`  
- **Real Part** — Color by `Re(f(z))`
- **Imaginary Part** — Color by `Im(f(z))`

### Expression Parser

Supports standard mathematical notation powered by [math.js](https://mathjs.org/):
- Basic operations: `z^2`, `z + 1`, `z * (z - 1)`
- Complex functions: `sin(z)`, `cos(z)`, `exp(z)`, `log(z)`
- Square roots and powers: `sqrt(z)`, `z^(1/3)`
- Constants: `i`, `pi`, `e`

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd complex_plot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in your terminal).

### Building for Production

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Usage Examples

Try these expressions to get started:

| Mode | Expression | Description |
|------|------------|-------------|
| Domain Coloring | `z^2` | Simple quadratic |
| Domain Coloring | `(z^2 - 1) / (z^2 + 1)` | Rational function with poles and zeros |
| Domain Coloring | `sin(z)` | Complex sine function |
| Contour | `exp(i * t)` | Unit circle |
| Contour | `cos(t) + i * sin(2*t)` | Lissajous curve |
| 3D Surface | `z^3 - 1` | Cubic with three roots |

## Tech Stack

- **React 19** — UI framework
- **TypeScript** — Type safety
- **Vite** — Build tool and dev server
- **Plotly.js** — Interactive plotting library
- **math.js** — Mathematical expression parsing and evaluation

## Project Structure

```
src/
├── components/
│   ├── Controls/     # Input fields, settings, mode selector
│   ├── Plot2D/       # Contour and domain coloring plots
│   └── Plot3D/       # 3D surface plots
├── hooks/            # React hooks (plot state management)
├── math/             # Math engine (parser, evaluator, generators)
├── types/            # TypeScript type definitions
├── App.tsx           # Main application component
└── main.tsx          # Entry point
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## License

MIT
