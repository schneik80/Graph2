# Graph2 - React Flow DOT File Visualizer

This React application visualizes graphs defined in DOT file format using React Flow.

## Features

- Parses DOT (Graphviz) file format
- Renders graphs using React Flow
- Interactive graph visualization with zoom, pan, and controls
- Supports both directed (`digraph`) and undirected (`graph`) graphs

## Installation

```bash
npm install
```

## Usage

1. Place your DOT file in the `public` directory as `graph.dot` (or update the fetch path in `App.js`)
2. Run the development server:

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## DOT File Format

The parser supports basic DOT syntax:

- Directed graphs: `digraph G { A -> B; }`
- Undirected graphs: `graph G { A -- B; }`
- Node attributes: `A [label="Node A", color=red];`
- Edge attributes: `A -> B [label="Edge"];`

## Example DOT File

See `public/graph.dot` for an example. You can replace this file with your own DOT file.

