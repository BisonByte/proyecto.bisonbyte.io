import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layer, Line, Stage, Text, Circle } from 'react-konva';
import type Konva from 'konva';
import { GRID_SIZE, type SystemNode } from '../../model/schema';
import { useDesignerStore } from '../state/store';

const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

const useStageSize = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 960, height: 620 });

  const updateSize = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    setSize({ width: clientWidth, height: clientHeight });
  }, []);

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateSize]);

  return { containerRef, size, updateSize } as const;
};

const getNodeColor = (node: SystemNode) => {
  if (node.kind === 'pump') return '#facc15';
  if (node.kind === 'tank') return '#38bdf8';
  return '#22c55e';
};

export const Canvas = (): JSX.Element => {
  const { containerRef, size } = useStageSize();
  const { model, selection, select, setNodePosition } = useDesignerStore((state) => ({
    model: state.model,
    selection: state.selection,
    select: state.select,
    setNodePosition: state.setNodePosition,
  }));

  const grid = useMemo(() => {
    const lines: number[][] = [];
    for (let x = GRID_SIZE; x < size.width; x += GRID_SIZE) {
      lines.push([x, 0, x, size.height]);
    }
    for (let y = GRID_SIZE; y < size.height; y += GRID_SIZE) {
      lines.push([0, y, size.width, y]);
    }
    return lines;
  }, [size.height, size.width]);

  const handleDragEnd = useCallback(
    (node: SystemNode) => (event: Konva.KonvaEventObject<DragEvent>) => {
      const nextX = snapToGrid(event.target.x());
      const nextY = snapToGrid(event.target.y());
      event.target.position({ x: nextX, y: nextY });
      setNodePosition(node.id, { x: nextX, y: nextY });
    },
    [setNodePosition],
  );

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-slate-950">
      <Stage width={size.width} height={size.height} className="bg-slate-900">
        <Layer listening={false}>
          {grid.map((points, index) => (
            <Line key={`grid-${index}`} points={points} stroke="#1e293b" strokeWidth={1} opacity={0.2} />
          ))}
        </Layer>
        <Layer>
          {model.pipes.map((pipe) => {
            const from = model.nodes.find((node) => node.id === pipe.from);
            const to = model.nodes.find((node) => node.id === pipe.to);
            if (!from || !to) return null;
            const isSelected = selection?.type === 'pipe' && selection.id === pipe.id;
            return (
              <Line
                key={pipe.id}
                points={[from.position.x, from.position.y, to.position.x, to.position.y]}
                stroke={isSelected ? '#38bdf8' : '#94a3b8'}
                strokeWidth={isSelected ? 4 : 3}
                onClick={() => select({ type: 'pipe', id: pipe.id })}
                onTap={() => select({ type: 'pipe', id: pipe.id })}
              />
            );
          })}
          {model.nodes.map((node) => {
            const isSelected = selection?.type === 'node' && selection.id === node.id;
            return (
              <Fragment key={node.id}>
                <Circle
                  x={node.position.x}
                  y={node.position.y}
                  radius={18}
                  fill={isSelected ? '#0ea5e9' : getNodeColor(node)}
                  stroke={isSelected ? '#38bdf8' : '#1f2937'}
                  strokeWidth={3}
                  draggable
                  onDragEnd={handleDragEnd(node)}
                  onClick={() => select({ type: 'node', id: node.id })}
                  onTap={() => select({ type: 'node', id: node.id })}
                />
                <Text
                  x={node.position.x - 40}
                  y={node.position.y - 32}
                  width={80}
                  align="center"
                  text={node.name}
                  fontSize={14}
                  fill="#e2e8f0"
                />
              </Fragment>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;
