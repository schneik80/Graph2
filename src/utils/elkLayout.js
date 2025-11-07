/**
 * ELK.js layout engine integration
 * Based on React Flow example: https://reactflow.dev/examples/layout/elkjs
 */
import ELK from 'elkjs/lib/elk.bundled.js'

const elk = new ELK()

/**
 * ELK layout algorithm options
 * See: https://www.eclipse.org/elk/reference/algorithms.html
 */
export const ELK_ALGORITHMS = {
  LAYERED: 'layered', // Hierarchical layout (like Graphviz dot)
  FORCE: 'force', // Force-directed layout
  STRESS: 'stress', // Stress-based layout
  MRTREE: 'mrtree', // Minimum spanning tree
  DISCO: 'disco', // Disco layout
  BOX: 'box', // Box layout
  FIXED: 'fixed' // Fixed positions
}

/**
 * ELK direction options
 */
export const ELK_DIRECTIONS = {
  DOWN: 'DOWN', // Top to bottom
  UP: 'UP', // Bottom to top
  RIGHT: 'RIGHT', // Left to right
  LEFT: 'LEFT' // Right to left
}

/**
 * Default ELK options
 */
const DEFAULT_ELK_OPTIONS = {
  'elk.algorithm': ELK_ALGORITHMS.LAYERED,
  'elk.direction': ELK_DIRECTIONS.DOWN,
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.nodeNode': '80',
  'elk.padding': '[top=50,left=50,bottom=50,right=50]'
}

/**
 * Get layouted elements using ELK.js
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @param {Object} options - ELK layout options
 * @returns {Promise<Object>} - Promise resolving to { nodes, edges }
 */
export async function getLayoutedElements (nodes, edges, options = {}) {
  const elkOptions = { ...DEFAULT_ELK_OPTIONS, ...options }

  const graph = {
    id: 'root',
    layoutOptions: elkOptions,
    children: nodes.map(node => ({
      id: node.id,
      // Use node dimensions or defaults
      width: node.width || 150,
      height: node.height || 40
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target]
    }))
  }

  try {
    const layoutedGraph = await elk.layout(graph)

    return {
      nodes: layoutedGraph.children.map(layoutedNode => {
        // Find original node to preserve all properties
        const originalNode = nodes.find(n => n.id === layoutedNode.id) || {}
        return {
          ...originalNode,
          // Preserve ELK layout position
          position: { x: layoutedNode.x, y: layoutedNode.y },
          // Preserve width and height from ELK or original
          width: layoutedNode.width || originalNode.width,
          height: layoutedNode.height || originalNode.height
        }
      }),
      edges: layoutedGraph.edges.map(layoutedEdge => {
        // Find original edge to preserve properties
        const originalEdge = edges.find(e => e.id === layoutedEdge.id) || {}
        return {
          ...originalEdge,
          // Preserve ELK edge properties but keep original edge type and markers
          id: layoutedEdge.id,
          source: layoutedEdge.sources[0],
          target: layoutedEdge.targets[0]
        }
      })
    }
  } catch (error) {
    console.error('ELK layout error:', error)
    throw error
  }
}

/**
 * Preset layout configurations
 */
export const LAYOUT_PRESETS = {
  hierarchical: {
    'elk.algorithm': ELK_ALGORITHMS.LAYERED,
    'elk.direction': ELK_DIRECTIONS.DOWN,
    'elk.layered.spacing.nodeNodeBetweenLayers': '100',
    'elk.spacing.nodeNode': '80'
  },
  hierarchicalHorizontal: {
    'elk.algorithm': ELK_ALGORITHMS.LAYERED,
    'elk.direction': ELK_DIRECTIONS.RIGHT,
    'elk.layered.spacing.nodeNodeBetweenLayers': '100',
    'elk.spacing.nodeNode': '80'
  },
  force: {
    'elk.algorithm': ELK_ALGORITHMS.FORCE,
    'elk.spacing.nodeNode': '100'
  },
  stress: {
    'elk.algorithm': ELK_ALGORITHMS.STRESS,
    'elk.spacing.nodeNode': '100'
  },
  tree: {
    'elk.algorithm': ELK_ALGORITHMS.MRTREE,
    'elk.spacing.nodeNode': '80'
  }
}
