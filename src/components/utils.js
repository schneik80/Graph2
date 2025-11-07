// Utility functions for floating edges

// returns the position (top,right,bottom or right) passed node compared to the intersection point
function getParams(nodeA, nodeB) {
  const centerA = getNodeCenter(nodeA);
  const centerB = getNodeCenter(nodeB);

  const horizontalDiff = Math.abs(centerA.x - centerB.x);
  const verticalDiff = Math.abs(centerA.y - centerB.y);

  // Use measured dimensions if available, otherwise use defaults
  const widthA = nodeA.width || nodeA.measured?.width || 150;
  const heightA = nodeA.height || nodeA.measured?.height || 40;

  if (horizontalDiff > verticalDiff) {
    return centerA.x > centerB.x
      ? { pos: 'left', x: nodeA.position.x, y: centerA.y }
      : { pos: 'right', x: nodeA.position.x + widthA, y: centerA.y };
  } else {
    return centerA.y > centerB.y
      ? { pos: 'top', x: centerA.x, y: nodeA.position.y }
      : { pos: 'bottom', x: centerA.x, y: nodeA.position.y + heightA };
  }
}

function getNodeCenter(node) {
  // Use measured dimensions if available, otherwise use defaults
  const width = node.width || node.measured?.width || 150;
  const height = node.height || node.measured?.height || 40;
  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
  };
}

// returns the position of the handle
export function getHandlePosition(node, handle, handleBounds) {
  // all handles are from type source, that's why we use handleBounds.source here
  const handleY = handleBounds?.source?.find((h) => h.id === handle)?.y || 0;
  const handleX = handleBounds?.source?.find((h) => h.id === handle)?.x || 0;

  return {
    x: node.position.x + handleX,
    y: node.position.y + handleY,
  };
}

export function getEdgeParams(sourceNode, targetNode) {
  const sourceParams = getParams(sourceNode, targetNode);
  const targetParams = getParams(targetNode, sourceNode);

  const sourcePos = getPosition(sourceParams.pos);
  const targetPos = getPosition(targetParams.pos);

  return {
    sx: sourceParams.x,
    sy: sourceParams.y,
    tx: targetParams.x,
    ty: targetParams.y,
    sourcePos,
    targetPos,
  };
}

function getPosition(pos) {
  const positionMap = {
    left: 'right',
    right: 'left',
    top: 'bottom',
    bottom: 'top',
  };

  return positionMap[pos];
}

export function getBezierPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}) {
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;

  const curvature = 0.3;

  let path = '';

  if (sourcePosition === 'left' || sourcePosition === 'right') {
    path = `M${sourceX},${sourceY} C${sourceX + (targetX - sourceX) * curvature},${sourceY} ${targetX - (targetX - sourceX) * curvature},${targetY} ${targetX},${targetY}`;
  } else {
    path = `M${sourceX},${sourceY} C${sourceX},${sourceY + (targetY - sourceY) * curvature} ${targetX},${targetY - (targetY - sourceY) * curvature} ${targetX},${targetY}`;
  }

  return [path];
}

