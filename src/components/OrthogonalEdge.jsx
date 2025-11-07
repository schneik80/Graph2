import { getSmoothStepPath, BaseEdge, useNodes } from 'reactflow';

function OrthogonalEdge({ id, source, target, sourcePosition = 'bottom', targetPosition = 'top', markerEnd, style }) {
  const nodes = useNodes();
  const sourceNode = nodes.find((node) => node.id === source);
  const targetNode = nodes.find((node) => node.id === target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  // Calculate connection points at top/bottom of nodes
  const sourceWidth = sourceNode.width || 150;
  const sourceHeight = sourceNode.height || 40;
  const targetWidth = targetNode.width || 150;
  const targetHeight = targetNode.height || 40;

  let sourceX, sourceY, targetX, targetY;

  // Source node - connect from bottom
  if (sourcePosition === 'bottom') {
    sourceX = sourceNode.position.x + sourceWidth / 2;
    sourceY = sourceNode.position.y + sourceHeight;
  } else {
    sourceX = sourceNode.position.x + sourceWidth / 2;
    sourceY = sourceNode.position.y;
  }

  // Target node - connect to top
  if (targetPosition === 'top') {
    targetX = targetNode.position.x + targetWidth / 2;
    targetY = targetNode.position.y;
  } else {
    targetX = targetNode.position.x + targetWidth / 2;
    targetY = targetNode.position.y + targetHeight;
  }

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
  );
}

export default OrthogonalEdge;

