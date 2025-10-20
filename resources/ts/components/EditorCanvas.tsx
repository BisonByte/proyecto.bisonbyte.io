import { useEffect, useMemo, useRef, useState } from 'react';
import { Layer, Line, Rect, Stage, Text, Circle, Group } from 'react-konva';
import type Konva from 'konva';
import { GRID_SIZE, type SystemNode, type SystemPipe } from '../model/schema';
import { useModelStore } from '../state/store';

const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;
const PIXELS_PER_METER = 40;

const useStageSize = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 960, height: 620 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setSize({ width: clientWidth, height: clientHeight });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { containerRef, size } as const;
};

const getNodeCenter = (node: SystemNode) => node.position;

const EditorCanvas = (): JSX.Element => {
  const { containerRef, size } = useStageSize();
  const { model, selection, setSelection, updateNode } = useModelStore((state) => ({
    model: state.model,
    selection: state.selection,
    setSelection: state.setSelection,
    updateNode: state.updateNode,
  }));

  const gridLines = useMemo(() => {
    const lines: Array<{ points: number[] }> = [];
    for (let x = GRID_SIZE; x < size.width; x += GRID_SIZE) {
      lines.push({ points: [x, 0, x, size.height] });
    }
    for (let y = GRID_SIZE; y < size.height; y += GRID_SIZE) {
      lines.push({ points: [0, y, size.width, y] });
    }
    return lines;
  }, [size.height, size.width]);

  const handleDragEnd = (node: SystemNode) => (event: Konva.KonvaEventObject<DragEvent>) => {
    const newX = snapToGrid(event.target.x());
    const newY = snapToGrid(event.target.y());
    updateNode(node.id, (current) => ({
      ...current,
      position: { x: newX, y: newY },
    }));
  };

  const renderTank = (node: SystemNode) => {
    if (node.kind !== 'tank') return null;
    const width = node.dimensions.width;
    const height = node.dimensions.height;
    const x = node.position.x;
    const y = node.position.y;
    const fluidHeight = Math.max(
      0,
      Math.min(height - 12, node.properties.fluidLevel * PIXELS_PER_METER),
    );

    return (
      <>
        <Rect
          x={x}
          y={y}
          width={width}
          height={height}
          offset={{ x: width / 2, y: height / 2 }}
          cornerRadius={16}
          stroke={selection?.type === 'node' && selection.id === node.id ? '#38bdf8' : '#475569'}
          strokeWidth={selection?.type === 'node' && selection.id === node.id ? 3 : 2}
          fillLinearGradientStartPoint={{ x: 0, y: height / 2 }}
          fillLinearGradientEndPoint={{ x: 0, y: height }}
          fillLinearGradientColorStops={[0, 'rgba(15,23,42,0.4)', 1, 'rgba(15,23,42,0.75)']}
          draggable
          onDragEnd={handleDragEnd(node)}
          onClick={() => setSelection({ type: 'node', id: node.id })}
          onTap={() => setSelection({ type: 'node', id: node.id })}
        />
        <Rect
          x={x}
          y={y + height / 2 - fluidHeight}
          width={width - 20}
          height={fluidHeight}
          offset={{ x: width / 2 - 10, y: fluidHeight }}
          fill="rgba(56,189,248,0.35)"
          listening={false}
        />
        <Text
          x={x - width / 2}
          y={y - height / 2 - 28}
          text={node.name}
          fontSize={16}
          fontStyle="600"
          fill="#cbd5f5"
        />
      </>
    );
  };

  const renderPump = (node: SystemNode) => {
    if (node.kind !== 'pump') return null;
    const width = 120;
    const height = 64;
    const x = node.position.x;
    const y = node.position.y;

    return (
      <>
        <Rect
          x={x}
          y={y}
          width={width}
          height={height}
          offset={{ x: width / 2, y: height / 2 }}
          cornerRadius={16}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: width, y: height }}
          fillLinearGradientColorStops={[0, '#0f172a', 1, '#1e293b']}
          stroke={selection?.type === 'node' && selection.id === node.id ? '#facc15' : '#1e40af'}
          strokeWidth={selection?.type === 'node' && selection.id === node.id ? 3 : 2}
          shadowColor="rgba(148,163,184,0.35)"
          shadowBlur={12}
          shadowOpacity={0.6}
          draggable
          onDragEnd={handleDragEnd(node)}
          onClick={() => setSelection({ type: 'node', id: node.id })}
          onTap={() => setSelection({ type: 'node', id: node.id })}
        />
        <Rect
          x={x - width / 2 + 12}
          y={y - height / 2 + 12}
          width={width - 24}
          height={height - 24}
          cornerRadius={12}
          stroke="#38bdf8"
          strokeWidth={2}
          opacity={0.4}
          listening={false}
        />
        <Text
          x={x - width / 2}
          y={y + height / 2 + 8}
          width={width}
          align="center"
          text={node.name}
          fontSize={15}
          fill="#f8fafc"
        />
      </>
    );
  };

  const renderJunction = (node: SystemNode) => {
    if (node.kind !== 'junction') return null;
    const radius = 20;
    return (
      <>
        <Circle
          x={node.position.x}
          y={node.position.y}
          radius={radius}
          fill="#0f172a"
          stroke={selection?.type === 'node' && selection.id === node.id ? '#22d3ee' : '#1d4ed8'}
          strokeWidth={selection?.type === 'node' && selection.id === node.id ? 3 : 2}
          draggable
          onDragEnd={handleDragEnd(node)}
          onClick={() => setSelection({ type: 'node', id: node.id })}
          onTap={() => setSelection({ type: 'node', id: node.id })}
        />
        <Text
          x={node.position.x - 60}
          y={node.position.y + radius + 6}
          width={120}
          align="center"
          text={node.name}
          fontSize={14}
          fill="#cbd5f5"
        />
      </>
    );
  };

  const renderPipe = (pipe: SystemPipe) => {
    const from = model.nodes.find((node) => node.id === pipe.from);
    const to = model.nodes.find((node) => node.id === pipe.to);

    if (!from || !to) return null;

    const fromPosition = getNodeCenter(from);
    const toPosition = getNodeCenter(to);

    const isSelected = selection?.type === 'pipe' && selection.id === pipe.id;

    return (
      <Line
        key={pipe.id}
        points={[fromPosition.x, fromPosition.y, toPosition.x, toPosition.y]}
        stroke={isSelected ? '#f97316' : '#94a3b8'}
        strokeWidth={isSelected ? 6 : 4}
        dashEnabled={!isSelected}
        dash={[16, 12]}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={24}
        onClick={() => setSelection({ type: 'pipe', id: pipe.id })}
        onTap={() => setSelection({ type: 'pipe', id: pipe.id })}
      />
    );
  };

  return (
    <div ref={containerRef} className="relative flex flex-1 bg-slate-950" id="system-editor-canvas">
      <Stage
        width={size.width}
        height={size.height}
        id="system-editor-stage"
        className="cursor-crosshair"
        onClick={(event) => {
          if (event.target === event.target.getStage()) {
            setSelection(null);
          }
        }}
        onTap={(event) => {
          if (event.target === event.target.getStage()) {
            setSelection(null);
          }
        }}
      >
        <Layer>
          <Rect x={0} y={0} width={size.width} height={size.height} fill="#020617" />
          {gridLines.map((line, index) => (
            <Line key={`grid-${index}`} points={line.points} stroke="rgba(30,41,59,0.4)" strokeWidth={1} />
          ))}
          {model.pipes.map((pipe) => renderPipe(pipe))}
          {model.nodes.map((node) => (
            <Group key={node.id}>
              {renderTank(node)}
              {renderPump(node)}
              {renderJunction(node)}
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default EditorCanvas;
