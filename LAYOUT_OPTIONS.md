# ELK.js Layout Options

This application uses [ELK.js](https://www.eclipse.org/elk/) (Eclipse Layout Kernel) for graph layout algorithms. ELK provides professional, high-quality graph layouts with extensive customization options.

## Available Layout Algorithms

The application provides several preset layout configurations that can be selected from the UI panel:

### 1. **Hierarchical (Vertical)** - Default
- **Algorithm**: `layered`
- **Direction**: `DOWN` (top to bottom)
- **Best for**: Directed graphs, flowcharts, dependency trees, organizational charts
- **Spacing**: 100px between layers, 80px between nodes

### 2. **Hierarchical (Horizontal)**
- **Algorithm**: `layered`
- **Direction**: `RIGHT` (left to right)
- **Best for**: Process flows, sequence diagrams, horizontal hierarchies
- **Spacing**: 100px between layers, 80px between nodes

### 3. **Force-Directed**
- **Algorithm**: `force`
- **Best for**: General-purpose graphs, networks, organic-looking layouts
- **Spacing**: 100px between nodes
- **Note**: Uses physics simulation to position nodes

### 4. **Stress**
- **Algorithm**: `stress`
- **Best for**: Minimizing edge lengths, creating compact layouts
- **Spacing**: 100px between nodes
- **Note**: Optimizes for minimal stress in the graph

### 5. **Tree**
- **Algorithm**: `mrtree` (Minimum Spanning Tree)
- **Best for**: Tree structures, hierarchical data
- **Spacing**: 80px between nodes
- **Note**: Creates tree-like layouts

### 6. **MR Tree**
- **Algorithm**: `mrtree` (Minimum Spanning Tree)
- **Direction**: `DOWN` (top to bottom)
- **Best for**: Tree structures with explicit direction control
- **Spacing**: 100px between nodes
- **Note**: Similar to Tree layout but with different spacing and explicit direction setting

### 7. **Radial**
- **Algorithm**: `radial`
- **Best for**: Hierarchical structures, organizational charts, network topologies
- **Spacing**: 100px between nodes
- **Note**: Arranges nodes in concentric circles around a central root node, creating a radial tree visualization

### 8. **Remove Overlaps (Spore Overlap)**
- **Algorithm**: `sporeOverlap`
- **Best for**: Post-processing existing layouts to remove node overlaps
- **Spacing**: 100px between nodes
- **Note**: Typically used as a post-processing step to refine layouts by removing overlapping nodes. Can be applied after other layout algorithms to ensure no nodes overlap.

## ELK Algorithm Reference

ELK supports many algorithms. The most commonly used are:

| Algorithm | Description | Use Case |
|-----------|-------------|----------|
| `layered` | Hierarchical layered layout | Directed graphs, flowcharts |
| `force` | Force-directed layout | General graphs, networks |
| `stress` | Stress-minimization layout | Compact layouts |
| `mrtree` | Minimum spanning tree | Tree structures |
| `radial` | Radial layout | Hierarchical structures, concentric circles |
| `sporeOverlap` | Remove node overlaps | Post-processing to eliminate overlaps |
| `disco` | Disco layout | Circular arrangements |
| `box` | Box layout | Rectangular arrangements |
| `fixed` | Fixed positions | Manual positioning |

For complete algorithm documentation, see: [ELK Algorithms Reference](https://www.eclipse.org/elk/reference/algorithms.html)

## ELK Direction Options

For layered layouts, you can specify direction:

| Direction | Description |
|-----------|-------------|
| `DOWN` | Top to bottom (default for vertical) |
| `UP` | Bottom to top |
| `RIGHT` | Left to right (default for horizontal) |
| `LEFT` | Right to left |

## ELK Layout Options

ELK provides extensive configuration options. Common options include:

### Spacing Options
- `elk.spacing.nodeNode`: Spacing between nodes (default: "80")
- `elk.layered.spacing.nodeNodeBetweenLayers`: Spacing between layers in layered layout (default: "100")
- `elk.padding`: Padding around the graph (default: "[top=50,left=50,bottom=50,right=50]")

### Algorithm-Specific Options
- `elk.layered.nodePlacement.strategy`: Node placement strategy for layered layout
- `elk.layered.crossingMinimization.strategy`: Crossing minimization strategy
- `elk.force.iterations`: Number of iterations for force layout
- `elk.stress.epsilon`: Convergence threshold for stress layout

For complete options reference, see: [ELK Options Reference](https://www.eclipse.org/elk/reference/options.html)

## Customizing Layouts

To customize layouts, edit `src/utils/elkLayout.js` and modify the `LAYOUT_PRESETS` object or pass custom options to `getLayoutedElements()`.

Example:
```javascript
const customOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.layered.spacing.nodeNodeBetweenLayers': '150',
  'elk.spacing.nodeNode': '100'
}

const { nodes, edges } = await getLayoutedElements(nodes, edges, customOptions)
```

## Changing Layouts

Layouts can be changed using the control panel in the top-right corner of the application. Simply click on any layout button to apply that layout algorithm to the current graph.

## Notes

- Layout is now controlled entirely by ELK.js, not by the DOT file
- The `layout` attribute in DOT files is ignored
- All layouts use floating edges by default
- The graph automatically fits to view after layout changes
