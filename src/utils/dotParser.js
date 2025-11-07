/**
 * Parser for DOT file format to convert to React Flow nodes and edges
 * Layout is now handled by ELK.js, not from DOT file
 */
export function parseDotToReactFlow (dotContent) {
  const edges = []
  const nodeMap = new Map()
  let nodeIdCounter = 0

  // Remove comments and clean up the content
  let cleaned = dotContent
    .replace(/\/\/.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .trim()

  // Determine if it's a directed or undirected graph
  const isDirected = cleaned.includes('digraph')
  const graphType = isDirected ? 'digraph' : 'graph'

  // Remove the graph declaration line
  cleaned = cleaned.replace(new RegExp(`${graphType}\\s+\\w*\\s*\\{`), '{')

  // Remove graph-level attributes that shouldn't be treated as nodes
  // These are: layout (no longer used), node, ranksep, concentrate, overlap, splines, and other graph attributes
  const graphAttributePatterns = [
    /layout\s*=\s*"[^"]*"\s*;/gi,
    /layout\s*=\s*\w+\s*;/gi,
    /node\s*\[[^\]]*\]\s*;/gi,
    /ranksep\s*=\s*[^;]+;/gi,
    /concentrate\s*=\s*[^;]+;/gi,
    /overlap\s*=\s*"[^"]*"\s*;/gi,
    /overlap\s*=\s*\w+\s*;/gi,
    /splines\s*=\s*\w+\s*;/gi,
    /nodesep\s*=\s*[^;]+;/gi,
    /rankdir\s*=\s*[^;]+;/gi,
    /size\s*=\s*"[^"]*"\s*;/gi,
    /ratio\s*=\s*[^;]+;/gi
  ]

  graphAttributePatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '')
  })

  // Extract all node definitions and edges
  // Handle both quoted strings ("Node Name") and unquoted identifiers (NodeName)
  const edgePattern = isDirected
    ? /("([^"]+)"|(\w+))\s*->\s*("([^"]+)"|(\w+))(?:\s*\[(.*?)\])?/g
    : /("([^"]+)"|(\w+))\s*--\s*("([^"]+)"|(\w+))(?:\s*\[(.*?)\])?/g

  // First, process all node definitions (with or without attributes)
  // This pattern matches: "Node Name" [attributes]; or NodeName [attributes];
  // But we need to be more careful - only match if it's not part of an attribute assignment
  const nodeDefPattern = /("([^"]+)"|(\w+))(?:\s*\[(.*?)\])?\s*;/g
  let nodeDefMatch
  const processedNodeDefs = new Set()

  while ((nodeDefMatch = nodeDefPattern.exec(cleaned)) !== null) {
    const nodeId = nodeDefMatch[2] || nodeDefMatch[3] || nodeDefMatch[1]
    const attributes = nodeDefMatch[4] || ''

    // Skip if this looks like a graph attribute value (not a node)
    // Check if the text before this match contains an assignment operator
    const beforeMatch = cleaned.substring(0, nodeDefMatch.index)
    const lastLine = beforeMatch.split('\n').pop() || ''

    // Skip if this appears to be a value in an assignment (has = before it on the same line)
    if (lastLine.includes('=') && !lastLine.match(/->|--/)) {
      // This is likely a graph attribute value, not a node
      continue
    }

    // Skip common graph attribute keywords
    const graphKeywords = ['node', 'edge', 'graph', 'digraph', 'subgraph']
    if (graphKeywords.includes(nodeId.toLowerCase()) && !attributes) {
      continue
    }

    // Create a unique key for this node definition
    const defKey = `${nodeId}-${nodeDefMatch.index}`
    if (processedNodeDefs.has(defKey)) continue
    processedNodeDefs.add(defKey)

    // Process node definition if it doesn't exist, or if it has attributes to apply
    if (!nodeMap.has(nodeId) || attributes) {
      const nodeAttrs = parseAttributes(attributes)
      const nodeData = {
        id: nodeId,
        position: { x: 0, y: 0 },
        data: { label: nodeAttrs.label || nodeId },
        width: 150, // Default width for floating edges
        height: 40 // Default height for floating edges
      }

      // Apply style attributes
      if (nodeAttrs.style) {
        nodeData.style = nodeAttrs.style
      }

      // If node exists, update it; otherwise create it
      if (nodeMap.has(nodeId)) {
        const existing = nodeMap.get(nodeId)
        if (nodeAttrs.style) {
          existing.style = { ...existing.style, ...nodeAttrs.style }
        }
        if (nodeAttrs.label) {
          existing.data.label = nodeAttrs.label
        }
        // Ensure width and height exist
        if (!existing.width) existing.width = 150
        if (!existing.height) existing.height = 40
      } else {
        nodeMap.set(nodeId, nodeData)
      }
    }
  }

  // Then, process edges (nodes may already exist from node definitions above)
  let edgeMatch
  while ((edgeMatch = edgePattern.exec(cleaned)) !== null) {
    // Extract source and target - handle both quoted and unquoted
    const source = edgeMatch[2] || edgeMatch[3] || edgeMatch[1] // quoted string or unquoted
    const target = edgeMatch[5] || edgeMatch[6] || edgeMatch[4] // quoted string or unquoted
    const attributes = edgeMatch[7] || ''

    // Create nodes if they don't exist (they may already exist from node definitions)
    if (!nodeMap.has(source)) {
      nodeMap.set(source, {
        id: source,
        position: { x: 0, y: 0 },
        data: { label: source },
        width: 150, // Default width for floating edges
        height: 40 // Default height for floating edges
      })
    }
    if (!nodeMap.has(target)) {
      nodeMap.set(target, {
        id: target,
        position: { x: 0, y: 0 },
        data: { label: target },
        width: 150, // Default width for floating edges
        height: 40 // Default height for floating edges
      })
    }

    // Parse edge attributes
    const edgeAttrs = parseAttributes(attributes)
    const edge = {
      id: `e${source}-${target}-${nodeIdCounter++}`,
      source: source,
      target: target,
      ...edgeAttrs
    }
    edges.push(edge)
  }

  // Convert map to array - nodes without layout (layout will be applied by ELK.js)
  const nodeArray = Array.from(nodeMap.values())

  // Set default edge type to floating
  const edgesWithTypes = edges.map(edge => {
    if (!edge.type) {
      edge.type = 'floating'
    }
    return edge
  })

  return { nodes: nodeArray, edges: edgesWithTypes }
}

/**
 * Parses DOT attributes string (e.g., "label=\"Node 1\", color=red")
 * @param {string} attrString - The attributes string
 * @returns {Object} - Parsed attributes object
 */
function parseAttributes (attrString) {
  const attrs = {}
  if (!attrString) return attrs

  // Match key=value pairs, handling both quoted and unquoted values
  // Also handle cases like "style = filled; fillcolor = lightskyblue;"
  const attrPattern = /(\w+)\s*=\s*"([^"]*)"|(\w+)\s*=\s*([^;,\]]+)/g
  let match
  while ((match = attrPattern.exec(attrString)) !== null) {
    const key = (match[1] || match[3]).trim()
    const value = (match[2] || match[4]).trim()

    // Map common DOT attributes to React Flow properties
    switch (key) {
      case 'label':
        attrs.label = value
        break
      case 'color':
        if (!attrs.style) attrs.style = {}
        attrs.style.stroke = value
        break
      case 'fillcolor':
        if (!attrs.style) attrs.style = {}
        attrs.style.background = value
        break
      case 'style':
        if (!attrs.style) attrs.style = {}
        if (value === 'filled') {
          attrs.style = {
            ...attrs.style,
            background: attrs.style.background || '#fff'
          }
        }
        attrs._style = value // Store the style value for later use
        break
      case 'shape':
        // React Flow doesn't directly support shapes, but we can use style
        attrs.shape = value
        break
      default:
        attrs[key] = value
    }
  }

  return attrs
}
