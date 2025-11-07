import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow
} from 'reactflow'
import 'reactflow/dist/style.css'
import OrthogonalEdge from './components/OrthogonalEdge'
import SimpleFloatingEdge from './components/SimpleFloatingEdge'
import { parseDotToReactFlow } from './utils/dotParser'
import { getLayoutedElements, LAYOUT_PRESETS } from './utils/elkLayout'

const edgeTypes = {
  floating: SimpleFloatingEdge,
  orthogonal: OrthogonalEdge
}

function App () {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [error, setError] = useState(null)
  const [currentLayout, setCurrentLayout] = useState('hierarchical')
  const reactFlowInstance = useReactFlow()
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)

  // Keep refs in sync with state
  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    edgesRef.current = edges
  }, [edges])

  // Apply ELK layout
  const applyElkLayout = useCallback(
    async (layoutName, nodesToLayout, edgesToLayout, shouldFitView = false) => {
      try {
        const layoutOptions =
          LAYOUT_PRESETS[layoutName] || LAYOUT_PRESETS.hierarchical
        const { nodes: layoutedNodes, edges: layoutedEdges } =
          await getLayoutedElements(nodesToLayout, edgesToLayout, layoutOptions)

        setNodes(layoutedNodes)
        setEdges(layoutedEdges)
        setCurrentLayout(layoutName)

        // Only fit view if explicitly requested (e.g., on initial load or layout button click)
        if (shouldFitView && reactFlowInstance && reactFlowInstance.fitView) {
          requestAnimationFrame(() => {
            setTimeout(() => {
              reactFlowInstance.fitView({ padding: 0.1, duration: 0 })
            }, 0)
          })
        }
      } catch (err) {
        console.error('Layout error:', err)
        setError(`Error applying layout: ${err.message}`)
      }
    },
    [setNodes, setEdges, reactFlowInstance]
  )

  // Load and parse the DOT file from public folder
  useEffect(() => {
    fetch('/graph.dot')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load graph.dot: ${response.statusText}`)
        }
        return response.text()
      })
      .then(async text => {
        try {
          const { nodes: parsedNodes, edges: parsedEdges } =
            parseDotToReactFlow(text)

          // Disable connections on all nodes
          const nodesWithConnectionsDisabled = parsedNodes.map(node => ({
            ...node,
            connectable: false
          }))

          // Set edge markers
          const edgesWithMarkers = parsedEdges.map(edge => {
            if (!edge.markerEnd) {
              edge.markerEnd = { type: MarkerType.ArrowClosed }
            }
            return edge
          })

          // Apply initial layout with default hierarchical layout (fit view on initial load)
          await applyElkLayout(
            'hierarchical',
            nodesWithConnectionsDisabled,
            edgesWithMarkers,
            true // fit view on initial load
          )
          setError(null)
        } catch (err) {
          setError(`Error parsing DOT file: ${err.message}`)
          console.error('Parse error:', err)
        }
      })
      .catch(err => {
        setError(`Error loading DOT file: ${err.message}`)
        console.error('Load error:', err)
      })
  }, [applyElkLayout])

  const handleLayoutChange = useCallback(
    layoutName => {
      // Only fit view when explicitly changing layouts via button
      // Use current nodes and edges from refs to avoid dependency issues
      applyElkLayout(layoutName, nodesRef.current, edgesRef.current, true)
    },
    [applyElkLayout]
  )

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        edgeTypes={edgeTypes}
        nodesConnectable={false}
        nodesDraggable={true}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomActivationKeyCode={null}
        panOnScroll={false}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel
          position='top-right'
          style={{
            background: 'white',
            padding: '10px',
            borderRadius: '5px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            pointerEvents: 'auto',
            zIndex: 10
          }}
        >
          <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
            Layout Algorithm
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              pointerEvents: 'auto'
            }}
          >
            <button
              onClick={e => {
                e.stopPropagation()
                handleLayoutChange('hierarchical')
              }}
              style={{
                padding: '8px 12px',
                border:
                  currentLayout === 'hierarchical'
                    ? '2px solid #007bff'
                    : '1px solid #ccc',
                borderRadius: '4px',
                background:
                  currentLayout === 'hierarchical' ? '#e7f3ff' : 'white',
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
            >
              Hierarchical (Vertical)
            </button>
            <button
              onClick={e => {
                e.stopPropagation()
                handleLayoutChange('hierarchicalHorizontal')
              }}
              style={{
                padding: '8px 12px',
                border:
                  currentLayout === 'hierarchicalHorizontal'
                    ? '2px solid #007bff'
                    : '1px solid #ccc',
                borderRadius: '4px',
                background:
                  currentLayout === 'hierarchicalHorizontal'
                    ? '#e7f3ff'
                    : 'white',
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
            >
              Hierarchical (Horizontal)
            </button>
            <button
              onClick={e => {
                e.stopPropagation()
                handleLayoutChange('force')
              }}
              style={{
                padding: '8px 12px',
                border:
                  currentLayout === 'force'
                    ? '2px solid #007bff'
                    : '1px solid #ccc',
                borderRadius: '4px',
                background: currentLayout === 'force' ? '#e7f3ff' : 'white',
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
            >
              Force-Directed
            </button>
            <button
              onClick={e => {
                e.stopPropagation()
                handleLayoutChange('stress')
              }}
              style={{
                padding: '8px 12px',
                border:
                  currentLayout === 'stress'
                    ? '2px solid #007bff'
                    : '1px solid #ccc',
                borderRadius: '4px',
                background: currentLayout === 'stress' ? '#e7f3ff' : 'white',
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
            >
              Stress
            </button>
            <button
              onClick={e => {
                e.stopPropagation()
                handleLayoutChange('tree')
              }}
              style={{
                padding: '8px 12px',
                border:
                  currentLayout === 'tree'
                    ? '2px solid #007bff'
                    : '1px solid #ccc',
                borderRadius: '4px',
                background: currentLayout === 'tree' ? '#e7f3ff' : 'white',
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
            >
              Tree
            </button>
            <button
              onClick={e => {
                e.stopPropagation()
                handleLayoutChange('mrtree')
              }}
              style={{
                padding: '8px 12px',
                border:
                  currentLayout === 'mrtree'
                    ? '2px solid #007bff'
                    : '1px solid #ccc',
                borderRadius: '4px',
                background: currentLayout === 'mrtree' ? '#e7f3ff' : 'white',
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
            >
              MR Tree
            </button>
            <button
              onClick={e => {
                e.stopPropagation()
                handleLayoutChange('radial')
              }}
              style={{
                padding: '8px 12px',
                border:
                  currentLayout === 'radial'
                    ? '2px solid #007bff'
                    : '1px solid #ccc',
                borderRadius: '4px',
                background: currentLayout === 'radial' ? '#e7f3ff' : 'white',
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
            >
              Radial
            </button>
            <button
              onClick={e => {
                e.stopPropagation()
                handleLayoutChange('sporeOverlap')
              }}
              style={{
                padding: '8px 12px',
                border:
                  currentLayout === 'sporeOverlap'
                    ? '2px solid #007bff'
                    : '1px solid #ccc',
                borderRadius: '4px',
                background:
                  currentLayout === 'sporeOverlap' ? '#e7f3ff' : 'white',
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
            >
              Remove Overlaps
            </button>
          </div>
        </Panel>
      </ReactFlow>
      {error && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'red',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}

function AppWithProvider () {
  return (
    <ReactFlowProvider>
      <App />
    </ReactFlowProvider>
  )
}

export default AppWithProvider
