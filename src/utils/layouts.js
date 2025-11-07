/**
 * Layout algorithms for positioning nodes in React Flow
 */

// Default spacing configuration
export const DEFAULT_SPACING = {
  nodeSpacing: 80, // Horizontal spacing between nodes
  levelSpacing: 120, // Vertical spacing between levels (hierarchical)
  radiusStep: 200, // Radius increment for radial layouts
  minRadius: 250, // Minimum radius for circular layouts
  gridSpacing: 200, // Spacing for grid layout
  forceRepulsion: 1.5 // Repulsion multiplier for force layout
}

/**
 * Calculate minimum spacing based on node dimensions to prevent overlap
 */
function calculateMinSpacing (nodes, baseSpacing = DEFAULT_SPACING.nodeSpacing) {
  if (nodes.length === 0) return baseSpacing

  // Get maximum node dimensions to ensure no overlap
  const maxWidth = Math.max(
    ...nodes.map(n => n.width || 150),
    150 // fallback minimum
  )

  // Ensure spacing is at least max node width + padding to prevent overlap
  const minSpacing = Math.max(baseSpacing, maxWidth + 30)
  return minSpacing
}

/**
 * Circular layout - arranges nodes in a circle
 */
export function circularLayout (
  nodes,
  centerX = 400,
  centerY = 400,
  spacing = DEFAULT_SPACING
) {
  // Find the blue node (node with lightskyblue background)
  const blueNode = nodes.find(
    node =>
      node.style?.background === 'lightskyblue' ||
      node.data?.label === 'Front Shock'
  )

  const otherNodes = nodes.filter(node => node.id !== blueNode?.id)
  const nodeCount = otherNodes.length

  // Calculate radius based on spacing and node count
  const minSpacing = calculateMinSpacing(nodes, spacing.nodeSpacing)
  const radius = Math.max(
    spacing.minRadius,
    (minSpacing * nodeCount) / (2 * Math.PI)
  )

  return nodes.map(node => {
    // Place blue node at center
    if (blueNode && node.id === blueNode.id) {
      return {
        ...node,
        position: { x: centerX, y: centerY }
      }
    }

    // Place other nodes in a circle around the center
    const index = otherNodes.findIndex(n => n.id === node.id)
    const angle = (2 * Math.PI * index) / nodeCount
    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      }
    }
  })
}

/**
 * Hierarchical/Tree layout - arranges nodes top to bottom
 * Positions children relative to their parent's x position
 */
export function hierarchicalLayout (
  nodes,
  edges,
  direction = 'TB',
  spacing = DEFAULT_SPACING
) {
  const adjacency = new Map()
  const inDegree = new Map()
  const children = new Map()

  // Initialize
  nodes.forEach(node => {
    adjacency.set(node.id, [])
    children.set(node.id, [])
    inDegree.set(node.id, 0)
  })

  // Build graph structure
  edges.forEach(edge => {
    adjacency.get(edge.source).push(edge.target)
    children.get(edge.source).push(edge.target)
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
  })

  // Find root nodes (nodes with no incoming edges)
  const roots = nodes.filter(node => (inDegree.get(node.id) || 0) === 0)
  if (roots.length === 0) {
    roots.push(nodes[0])
  }

  // Assign levels using BFS
  const levels = new Map()
  const visited = new Set()
  const queue = []

  roots.forEach(root => {
    levels.set(root.id, 0)
    visited.add(root.id)
    queue.push(root.id)
  })

  while (queue.length > 0) {
    const currentId = queue.shift()
    const currentLevel = levels.get(currentId) || 0
    const neighbors = adjacency.get(currentId) || []

    neighbors.forEach(neighborId => {
      if (!visited.has(neighborId)) {
        visited.add(neighborId)
        levels.set(neighborId, currentLevel + 1)
        queue.push(neighborId)
      } else {
        const existingLevel = levels.get(neighborId) || 0
        if (currentLevel + 1 > existingLevel) {
          levels.set(neighborId, currentLevel + 1)
        }
      }
    })
  }

  // Position nodes - children relative to parents
  const positions = new Map()
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const nodeSpacing = calculateMinSpacing(nodes, spacing.nodeSpacing)
  const levelSpacing = spacing.levelSpacing
  const startY = 100
  const centerX = 400

  // Position root nodes
  if (roots.length === 1) {
    positions.set(roots[0].id, { x: centerX, y: startY })
  } else {
    // Multiple roots - spread them out
    const totalWidth = (roots.length - 1) * nodeSpacing
    const startX = centerX - totalWidth / 2
    roots.forEach((root, index) => {
      positions.set(root.id, {
        x: startX + index * nodeSpacing,
        y: startY
      })
    })
  }

  // Helper function to check if a position would overlap with existing nodes
  function wouldOverlap (x, y, nodeId, level) {
    const nodeWidth = nodeMap.get(nodeId)?.width || 150

    for (const [existingId, existingPos] of positions.entries()) {
      if (existingId === nodeId) continue
      const existingLevel = levels.get(existingId) || 0
      // Only check overlap with nodes at the same level
      if (existingLevel !== level) continue

      const existingWidth = nodeMap.get(existingId)?.width || 150

      // Check horizontal overlap (with padding)
      const horizontalGap = Math.abs(x - existingPos.x)
      const minHorizontalGap = (nodeWidth + existingWidth) / 2 + 10

      if (horizontalGap < minHorizontalGap) {
        return true
      }
    }
    return false
  }

  // Position children relative to their parents
  function positionChildren (parentId) {
    const nodeChildren = children.get(parentId) || []
    if (nodeChildren.length === 0) return

    const parentPos = positions.get(parentId)
    if (!parentPos) return

    const parentLevel = levels.get(parentId) || 0
    const childLevel = parentLevel + 1

    // Position children centered around parent's x position
    const totalWidth = (nodeChildren.length - 1) * nodeSpacing
    const startX = parentPos.x - totalWidth / 2

    nodeChildren.forEach((childId, index) => {
      // Only position if not already positioned (handle multiple parents)
      if (!positions.has(childId)) {
        let childX = startX + index * nodeSpacing

        // Adjust position if it would overlap with existing nodes
        let attempts = 0
        while (
          wouldOverlap(
            childX,
            startY + childLevel * levelSpacing,
            childId,
            childLevel
          ) &&
          attempts < 10
        ) {
          // Try moving right
          childX += nodeSpacing / 2
          attempts++
        }

        positions.set(childId, {
          x: childX,
          y: startY + childLevel * levelSpacing
        })
        // Recursively position this child's children
        positionChildren(childId)
      }
    })
  }

  // Position all nodes starting from roots
  roots.forEach(root => {
    positionChildren(root.id)
  })

  // Apply positions to nodes (use level-based fallback for unpositioned nodes)
  return nodes.map(node => {
    const pos = positions.get(node.id)
    if (pos) {
      return {
        ...node,
        position: pos
      }
    }
    // Fallback for nodes not reached (shouldn't happen in a connected graph)
    const level = levels.get(node.id) || 0
    return {
      ...node,
      position: {
        x: centerX,
        y: startY + level * levelSpacing
      }
    }
  })
}

/**
 * Force-directed layout simulation (simplified)
 */
export function forceDirectedLayout (
  nodes,
  edges,
  iterations = 50,
  spacing = DEFAULT_SPACING
) {
  // Find the blue node (node with lightskyblue background)
  const blueNode = nodes.find(
    node =>
      node.style?.background === 'lightskyblue' ||
      node.data?.label === 'Front Shock'
  )

  const centerX = 400
  const centerY = 400

  const nodeMap = new Map()
  nodes.forEach(node => {
    // Place blue node at center, others randomly
    if (blueNode && node.id === blueNode.id) {
      nodeMap.set(node.id, {
        ...node,
        x: centerX,
        y: centerY,
        vx: 0,
        vy: 0,
        fixed: true // Pin the blue node
      })
    } else {
      nodeMap.set(node.id, {
        ...node,
        x: node.position?.x || Math.random() * 800,
        y: node.position?.y || Math.random() * 600,
        vx: 0,
        vy: 0,
        fixed: false
      })
    }
  })

  // Calculate repulsion based on desired spacing
  const minSpacing = calculateMinSpacing(nodes, spacing.nodeSpacing)
  const k = minSpacing * spacing.forceRepulsion
  const repulsionStrength = k * k
  const attractionStrength = 0.1

  for (let iter = 0; iter < iterations; iter++) {
    // Reset forces
    nodeMap.forEach(node => {
      node.vx = 0
      node.vy = 0
    })

    // Repulsion between all nodes
    const nodeArray = Array.from(nodeMap.values())
    for (let i = 0; i < nodeArray.length; i++) {
      for (let j = i + 1; j < nodeArray.length; j++) {
        const a = nodeArray[i]
        const b = nodeArray[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1
        const force = repulsionStrength / (distance * distance)

        a.vx -= (dx / distance) * force
        a.vy -= (dy / distance) * force
        b.vx += (dx / distance) * force
        b.vy += (dy / distance) * force
      }
    }

    // Attraction along edges
    edges.forEach(edge => {
      const source = nodeMap.get(edge.source)
      const target = nodeMap.get(edge.target)
      if (source && target) {
        const dx = target.x - source.x
        const dy = target.y - source.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1
        const force = distance * attractionStrength

        source.vx += (dx / distance) * force
        source.vy += (dy / distance) * force
        target.vx -= (dx / distance) * force
        target.vy -= (dy / distance) * force
      }
    })

    // Apply forces with damping
    const damping = 0.9
    nodeMap.forEach(node => {
      // Don't move fixed nodes (like the blue center node)
      if (node.fixed) {
        node.x = centerX
        node.y = centerY
        return
      }

      node.x += node.vx * damping
      node.y += node.vy * damping
      // Keep nodes in bounds
      node.x = Math.max(50, Math.min(750, node.x))
      node.y = Math.max(50, Math.min(550, node.y))
    })
  }

  return Array.from(nodeMap.values()).map(node => ({
    ...node,
    position: { x: node.x, y: node.y }
  }))
}

/**
 * Grid layout - arranges nodes in a grid
 */
export function gridLayout (nodes, columns = null, spacing = DEFAULT_SPACING) {
  const nodeCount = nodes.length
  const cols = columns || Math.ceil(Math.sqrt(nodeCount))

  const nodeSpacing = calculateMinSpacing(nodes, spacing.gridSpacing)

  const startX = 100
  const startY = 100

  return nodes.map((node, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols

    return {
      ...node,
      position: {
        x: startX + col * nodeSpacing,
        y: startY + row * nodeSpacing
      }
    }
  })
}

/**
 * Radial/Twopi layout - arranges nodes in concentric circles
 * Similar to Graphviz twopi
 */
export function radialLayout (
  nodes,
  edges,
  centerNodeId = null,
  spacing = DEFAULT_SPACING
) {
  // Find center node - prioritize blue node, then node with most connections, or specified
  let center = centerNodeId
  if (!center) {
    // First, try to find the blue node
    const blueNode = nodes.find(
      node =>
        node.style?.background === 'lightskyblue' ||
        node.data?.label === 'Front Shock'
    )

    if (blueNode) {
      center = blueNode.id
    } else {
      // Fall back to node with most connections
      const connections = new Map()
      nodes.forEach(node => connections.set(node.id, 0))
      edges.forEach(edge => {
        connections.set(edge.source, (connections.get(edge.source) || 0) + 1)
        connections.set(edge.target, (connections.get(edge.target) || 0) + 1)
      })
      center =
        Array.from(connections.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
        nodes[0]?.id
    }
  }

  // Build levels from center using directed edges only
  const levels = new Map()
  const visited = new Set()
  const queue = [{ id: center, level: 0 }]
  levels.set(center, 0)
  visited.add(center)

  // Build forward adjacency (only source -> target, not reverse)
  const adjacency = new Map()
  nodes.forEach(node => adjacency.set(node.id, []))
  edges.forEach(edge => {
    // Only add forward edges (source -> target)
    adjacency.get(edge.source).push(edge.target)
  })

  // BFS from center following only forward edges
  while (queue.length > 0) {
    const { id, level } = queue.shift()
    const neighbors = adjacency.get(id) || []
    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        levels.set(neighbor, level + 1)
        queue.push({ id: neighbor, level: level + 1 })
      } else {
        // If already visited, update level if we found a longer path
        const existingLevel = levels.get(neighbor) || 0
        if (level + 1 > existingLevel) {
          levels.set(neighbor, level + 1)
        }
      }
    })
  }

  // Position nodes
  const centerX = 400
  const centerY = 400
  const minSpacing = calculateMinSpacing(nodes, spacing.nodeSpacing)
  const baseRadius = minSpacing
  const radiusStep = spacing.radiusStep

  const levelGroups = new Map()
  nodes.forEach(node => {
    const level = levels.get(node.id) || 0
    if (!levelGroups.has(level)) {
      levelGroups.set(level, [])
    }
    levelGroups.get(level).push(node)
  })

  // Build parent-child relationships for ordering
  const parents = new Map()
  edges.forEach(edge => {
    const sourceLevel = levels.get(edge.source) || 0
    const targetLevel = levels.get(edge.target) || 0
    // If target is one level deeper, source is parent of target
    if (targetLevel === sourceLevel + 1) {
      if (!parents.has(edge.target)) {
        parents.set(edge.target, [])
      }
      parents.get(edge.target).push(edge.source)
    }
  })

  // Calculate angles for nodes to minimize crossings
  const nodeAngles = new Map()

  // Center node at angle 0
  nodeAngles.set(center, 0)

  // Process levels from center outward
  const maxLevel = Math.max(...Array.from(levels.values()))

  for (let level = 1; level <= maxLevel; level++) {
    const levelNodes = levelGroups.get(level) || []
    if (levelNodes.length === 0) continue

    // Calculate barycenter (average angle) for each node based on its parents
    // Handle circular angles properly
    const nodeBarycenters = new Map()

    levelNodes.forEach(node => {
      const nodeParents = parents.get(node.id) || []
      if (nodeParents.length > 0) {
        const parentAngles = []
        nodeParents.forEach(parentId => {
          const parentAngle = nodeAngles.get(parentId)
          if (parentAngle !== undefined) {
            parentAngles.push(parentAngle)
          }
        })

        if (parentAngles.length > 0) {
          // Calculate circular mean of angles
          // Convert to unit vectors, average, then convert back to angle
          let sumSin = 0
          let sumCos = 0
          parentAngles.forEach(angle => {
            sumSin += Math.sin(angle)
            sumCos += Math.cos(angle)
          })
          const meanAngle = Math.atan2(
            sumSin / parentAngles.length,
            sumCos / parentAngles.length
          )
          // Normalize to [0, 2π)
          const normalizedAngle =
            meanAngle < 0 ? meanAngle + 2 * Math.PI : meanAngle
          nodeBarycenters.set(node.id, normalizedAngle)
        }
      }
    })

    // Sort nodes by barycenter (median method for better results)
    const sortedNodes = [...levelNodes].sort((a, b) => {
      const baryA = nodeBarycenters.get(a.id)
      const baryB = nodeBarycenters.get(b.id)

      // If both have barycenters, sort by them
      if (baryA !== undefined && baryB !== undefined) {
        return baryA - baryB
      }
      // If only one has barycenter, prioritize it
      if (baryA !== undefined) return -1
      if (baryB !== undefined) return 1
      // If neither has barycenter, maintain original order
      return 0
    })

    // Assign angles evenly around circle, but in sorted order
    sortedNodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / levelNodes.length
      nodeAngles.set(node.id, angle)
    })
  }

  // Position nodes using calculated angles
  return nodes.map(node => {
    const level = levels.get(node.id) || 0
    const levelNodes = levelGroups.get(level) || []
    const nodesInLevel = levelNodes.length

    // Calculate radius ensuring proper spacing
    let radius = baseRadius + level * radiusStep
    if (level > 0 && nodesInLevel > 0) {
      // Ensure circumference is large enough for all nodes
      const circumference = nodesInLevel * minSpacing
      const requiredRadius = circumference / (2 * Math.PI)
      radius = Math.max(radius, requiredRadius)
    }

    // Use calculated angle (or default to 0 for center)
    const angle = nodeAngles.get(node.id) || 0

    return {
      ...node,
      position: {
        x: centerX + (level === 0 ? 0 : radius * Math.cos(angle)),
        y: centerY + (level === 0 ? 0 : radius * Math.sin(angle))
      }
    }
  })
}

/**
 * Apply layout based on layout name
 */
export function applyLayout (
  layoutName,
  nodes,
  edges,
  spacing = DEFAULT_SPACING
) {
  const layout = layoutName?.toLowerCase() || 'circular'

  switch (layout) {
    case 'hierarchical':
    case 'dot':
      return hierarchicalLayout(nodes, edges, 'TB', spacing)
    case 'force':
    case 'fdp':
    case 'neato':
      return forceDirectedLayout(nodes, edges, 50, spacing)
    case 'radial':
    case 'twopi':
      return radialLayout(nodes, edges, null, spacing)
    case 'grid':
      return gridLayout(nodes, null, spacing)
    case 'circular':
    case 'circo':
    default:
      return circularLayout(nodes, 400, 400, spacing)
  }
}
