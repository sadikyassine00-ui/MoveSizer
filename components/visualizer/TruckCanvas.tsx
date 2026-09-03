'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TruckSpec } from '@/lib/constants/trucks';
import { DrawableBlock } from '@/lib/engine/packEngine';

interface TruckCanvasProps {
  truck: TruckSpec;
  blocks: DrawableBlock[];
  selectedBlockId?: string | null;
  onSelectBlock?: (block: DrawableBlock | null) => void;
  className?: string;
}

interface Point2D {
  x: number;
  y: number;
}

interface Polygon2D {
  points: Point2D[];
}

interface BlockProjectedFaces {
  block: DrawableBlock;
  topFace: Point2D[];
  rightFace: Point2D[];
  frontFace: Point2D[];
  allPoints: Point2D[];
  depthKey: number;
}

const COS30 = 0.86602540378;
const SIN30 = 0.5;

function project3DTo2D(
  x: number,
  y: number,
  z: number,
  scale: number,
  offsetX: number,
  offsetY: number
): Point2D {
  return {
    x: (x - z) * COS30 * scale + offsetX,
    y: ((x + z) * SIN30 - y) * scale + offsetY,
  };
}

function isPointInPolygon(point: Point2D, vs: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].x, yi = vs[i].y;
    const xj = vs[j].x, yj = vs[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;
  const r = Math.min(255, Math.max(0, Math.round(((num >> 16) & 255) * (1 + percent))));
  const g = Math.min(255, Math.max(0, Math.round(((num >> 8) & 255) * (1 + percent))));
  const b = Math.min(255, Math.max(0, Math.round((num & 255) * (1 + percent))));
  return `rgb(${r}, ${g}, ${b})`;
}

export function TruckCanvas({
  truck,
  blocks,
  selectedBlockId,
  onSelectBlock,
  className = '',
}: TruckCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hoveredBlock, setHoveredBlock] = useState<DrawableBlock | null>(null);
  const [mousePos, setMousePos] = useState<Point2D | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 550 });

  const projectedCacheRef = useRef<BlockProjectedFaces[]>([]);

  // Update canvas sizing based on container
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setDimensions({
            width: Math.floor(rect.width),
            height: Math.floor(rect.height),
          });
        }
      }
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = dimensions.width;
    const height = dimensions.height;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Dynamic Scale and Center Calculation
    const truckL = truck.length;
    const truckW = truck.width;
    const truckH = truck.height;

    // Corner vertices of truck bounds in 3D:
    const corners = [
      { x: 0, y: 0, z: 0 },
      { x: truckL, y: 0, z: 0 },
      { x: truckL, y: 0, z: truckW },
      { x: 0, y: 0, z: truckW },
      { x: 0, y: truckH, z: 0 },
      { x: truckL, y: truckH, z: 0 },
      { x: truckL, y: truckH, z: truckW },
      { x: 0, y: truckH, z: truckW },
    ];

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const c of corners) {
      const px = (c.x - c.z) * COS30;
      const py = (c.x + c.z) * SIN30 - c.y;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }

    const margin = 50;
    const availWidth = width - margin * 2;
    const availHeight = height - margin * 2;

    const scaleX = availWidth / (maxX - minX);
    const scaleY = availHeight / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const offsetX = width / 2 - midX * scale;
    const offsetY = height / 2 - midY * scale + 10;

    const proj = (x: number, y: number, z: number) =>
      project3DTo2D(x, y, z, scale, offsetX, offsetY);

    // =========================================================================
    // 1. TRUCK SHELL RENDERING
    // =========================================================================

    // Floor deck grid (12" = 1 foot increments)
    ctx.strokeStyle = '#1F242F';
    ctx.lineWidth = 1;

    // Floor background fill
    const p0 = proj(0, 0, 0);
    const pL = proj(truckL, 0, 0);
    const pLW = proj(truckL, 0, truckW);
    const pW = proj(0, 0, truckW);

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(pL.x, pL.y);
    ctx.lineTo(pLW.x, pLW.y);
    ctx.lineTo(pW.x, pW.y);
    ctx.closePath();
    ctx.fillStyle = '#0E1015';
    ctx.fill();
    ctx.stroke();

    // 1-foot grid lines along X
    for (let x = 12; x < truckL; x += 12) {
      const a = proj(x, 0, 0);
      const b = proj(x, 0, truckW);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // 1-foot grid lines along Z
    for (let z = 12; z < truckW; z += 12) {
      const a = proj(0, 0, z);
      const b = proj(truckL, 0, z);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // Front Bulkhead (X = 0 wall)
    const pBulkTopLeft = proj(0, truckH, 0);
    const pBulkTopRight = proj(0, truckH, truckW);

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(pBulkTopLeft.x, pBulkTopLeft.y);
    ctx.lineTo(pBulkTopRight.x, pBulkTopRight.y);
    ctx.lineTo(pW.x, pW.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(17, 19, 24, 0.75)';
    ctx.fill();
    ctx.strokeStyle = '#282F3E';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Left Wall (Z = 0 wall)
    const pLeftTopRear = proj(truckL, truckH, 0);

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(pL.x, pL.y);
    ctx.lineTo(pLeftTopRear.x, pLeftTopRear.y);
    ctx.lineTo(pBulkTopLeft.x, pBulkTopLeft.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(14, 16, 21, 0.65)';
    ctx.fill();
    ctx.strokeStyle = '#282F3E';
    ctx.stroke();

    // Vertical structural ribs along left wall (every 24")
    ctx.strokeStyle = 'rgba(31, 36, 47, 0.7)';
    for (let x = 24; x < truckL; x += 24) {
      const b = proj(x, 0, 0);
      const t = proj(x, truckH, 0);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    }

    // Elevated Mom's Attic Shelf (if truck has attic)
    if (truck.hasAttic && truck.attic) {
      const attL = truck.attic.length;
      const attW = truck.attic.width;
      const attH = truck.attic.height;
      const attFloorY = truckH - attH;
      const attStartZ = Math.max(0, Math.floor((truckW - attW) / 2));

      const a1 = proj(0, attFloorY, attStartZ);
      const a2 = proj(attL, attFloorY, attStartZ);
      const a3 = proj(attL, attFloorY, attStartZ + attW);
      const a4 = proj(0, attFloorY, attStartZ + attW);

      ctx.beginPath();
      ctx.moveTo(a1.x, a1.y);
      ctx.lineTo(a2.x, a2.y);
      ctx.lineTo(a3.x, a3.y);
      ctx.lineTo(a4.x, a4.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 85, 0, 0.08)';
      ctx.fill();
      ctx.strokeStyle = '#FF5500';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Shelf label
      const labelPos = proj(attL / 2, attFloorY + 2, attStartZ + attW / 2);
      ctx.font = '10px var(--font-mono), monospace';
      ctx.fillStyle = '#FF8844';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("MOM'S ATTIC", labelPos.x, labelPos.y);
    }

    // Outer cutaway guide rails (top edges)
    ctx.strokeStyle = 'rgba(40, 47, 62, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    // Ceiling outline
    const pCeilRearRight = proj(truckL, truckH, truckW);
    ctx.beginPath();
    ctx.moveTo(pLeftTopRear.x, pLeftTopRear.y);
    ctx.lineTo(pCeilRearRight.x, pCeilRearRight.y);
    ctx.lineTo(pBulkTopRight.x, pBulkTopRight.y);
    ctx.stroke();

    // Right rear corner post
    ctx.beginPath();
    ctx.moveTo(pLW.x, pLW.y);
    ctx.lineTo(pCeilRearRight.x, pCeilRearRight.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // =========================================================================
    // 2. PAINTER'S ALGORITHM DEPTH SORTING & BLOCK RENDERING
    // Depth Key = x + z + y (lowest to highest)
    // =========================================================================
    const sortedBlocks = [...blocks].sort(
      (a, b) => a.x + a.z + a.y - (b.x + b.z + b.y)
    );

    const projectedFacesList: BlockProjectedFaces[] = [];

    for (const b of sortedBlocks) {
      const isSelected = selectedBlockId === b.id;
      const isHovered = hoveredBlock?.id === b.id;

      // 8 Vertices of the 3D block
      // 0: (x, y, z)
      // 1: (x + l, y, z)
      // 2: (x + l, y, z + w)
      // 3: (x, y, z + w)
      // 4: (x, y + h, z)
      // 5: (x + l, y + h, z)
      // 6: (x + l, y + h, z + w)
      // 7: (x, y + h, z + w)
      const v0 = proj(b.x, b.y, b.z);
      const v1 = proj(b.x + b.length, b.y, b.z);
      const v2 = proj(b.x + b.length, b.y, b.z + b.width);
      const v3 = proj(b.x, b.y, b.z + b.width);
      const v4 = proj(b.x, b.y + b.height, b.z);
      const v5 = proj(b.x + b.length, b.y + b.height, b.z);
      const v6 = proj(b.x + b.length, b.y + b.height, b.z + b.width);
      const v7 = proj(b.x, b.y + b.height, b.z + b.width);

      const topFace = [v4, v5, v6, v7];
      const rightFace = [v1, v2, v6, v5];
      const frontFace = [v2, v3, v7, v6];

      projectedFacesList.push({
        block: b,
        topFace,
        rightFace,
        frontFace,
        allPoints: [v0, v1, v2, v3, v4, v5, v6, v7],
        depthKey: b.x + b.z + b.y,
      });

      // Shading: Top (brightest), Right (medium), Front/Left (darkest)
      const baseColor = b.color;
      const topColor = adjustBrightness(baseColor, 0.22);
      const rightColor = adjustBrightness(baseColor, 0.05);
      const frontColor = adjustBrightness(baseColor, -0.25);

      const drawFace = (pts: Point2D[], fillColor: string) => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();

        ctx.strokeStyle = isHovered || isSelected ? '#0066FF' : 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = isHovered || isSelected ? 2.5 : 1;
        ctx.stroke();
      };

      // Draw Right Face (along X)
      drawFace(rightFace, rightColor);
      // Draw Front Face (along Z)
      drawFace(frontFace, frontColor);
      // Draw Top Face (along Y)
      drawFace(topFace, topColor);

      // Highlight perimeter if hovered or selected
      if (isHovered || isSelected) {
        ctx.save();
        ctx.shadowColor = '#0066FF';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#0066FF';
        ctx.lineWidth = 2.5;

        // Trace outer boundary
        ctx.beginPath();
        ctx.moveTo(v4.x, v4.y);
        ctx.lineTo(v5.x, v5.y);
        ctx.lineTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);
        ctx.lineTo(v3.x, v3.y);
        ctx.lineTo(v7.x, v7.y);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // Block Label (Uppercase monospace)
      const topCenterX = (v4.x + v5.x + v6.x + v7.x) / 4;
      const topCenterY = (v4.y + v5.y + v6.y + v7.y) / 4;

      const projectedWidth = Math.abs(v6.x - v4.x);
      if (projectedWidth > 28) {
        ctx.save();
        const fontSize = Math.max(9, Math.min(12, Math.floor(projectedWidth / 7)));
        ctx.font = `bold ${fontSize}px var(--font-mono), monospace`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 3;

        // Truncate label if too long for projected face
        let displayLabel = b.label;
        if (displayLabel.length > 12 && projectedWidth < 80) {
          displayLabel = displayLabel.slice(0, 10) + '..';
        }

        ctx.fillText(displayLabel, topCenterX, topCenterY);
        ctx.restore();
      }
    }

    projectedCacheRef.current = projectedFacesList;

    // Dimension axis indicators
    ctx.fillStyle = '#6B7280';
    ctx.font = '11px var(--font-mono), monospace';
    ctx.fillText(`${truck.length}″ Length`, pL.x - 20, pL.y + 24);
    ctx.fillText(`${truck.width}″ Width`, pW.x - 50, pW.y + 16);
    ctx.fillText(`${truck.height}″ Height`, pBulkTopLeft.x - 65, (p0.y + pBulkTopLeft.y) / 2);
  }, [truck, blocks, selectedBlockId, hoveredBlock, dimensions]);

  // Re-render when dependencies change
  useEffect(() => {
    render();
  }, [render]);

  // Handle Mouse Move for Raycasting / Hover Detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mousePoint: Point2D = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    setMousePos(mousePoint);

    // Check hit against projected blocks from highest depth to lowest
    // (front to back so closest item is picked)
    const reversed = [...projectedCacheRef.current].reverse();
    let hitBlock: DrawableBlock | null = null;

    for (const item of reversed) {
      if (
        isPointInPolygon(mousePoint, item.topFace) ||
        isPointInPolygon(mousePoint, item.rightFace) ||
        isPointInPolygon(mousePoint, item.frontFace)
      ) {
        hitBlock = item.block;
        break;
      }
    }

    if (hitBlock?.id !== hoveredBlock?.id) {
      setHoveredBlock(hitBlock);
    }
  };

  const handleMouseLeave = () => {
    setHoveredBlock(null);
    setMousePos(null);
  };

  const handleClick = () => {
    if (onSelectBlock) {
      onSelectBlock(hoveredBlock);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[420px] bg-[#090A0C] overflow-hidden select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Dimensional Tooltip HUD */}
      {hoveredBlock && mousePos && (
        <div
          className="absolute pointer-events-none z-30 px-3.5 py-2.5 bg-[#111318]/95 border border-[#0066FF] shadow-xl backdrop-blur-md rounded-lg text-xs font-mono transition-transform duration-75 text-white"
          style={{
            left: Math.min(mousePos.x + 15, dimensions.width - 220),
            top: Math.max(10, Math.min(mousePos.y - 45, dimensions.height - 120)),
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-1 border-b border-[#1F242F] pb-1">
            <span className="font-bold text-[#F8F9FA] tracking-wide">
              {hoveredBlock.label}
            </span>
            {hoveredBlock.isAttic && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF5500]/20 text-[#FF5500] font-semibold">
                ATTIC
              </span>
            )}
          </div>
          <div className="space-y-0.5 text-gray-300">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Bounds:</span>
              <span className="text-gray-200">{hoveredBlock.dimensionsText}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Volume:</span>
              <span className="text-[#0066FF] font-semibold">{hoveredBlock.volumeCuFt} cu ft</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Weight:</span>
              <span className="text-gray-200">~{hoveredBlock.weightLbs} lbs</span>
            </div>
            <div className="flex justify-between gap-4 text-[10px] text-gray-400 pt-0.5">
              <span>Pos [X, Y, Z]:</span>
              <span>{hoveredBlock.x}″, {hoveredBlock.y}″, {hoveredBlock.z}″</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Left Truck Legend Badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#111318]/90 border border-[#1F242F] backdrop-blur-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-xs font-mono font-bold text-white tracking-wider">
            {truck.name} ({truck.volumeCuFt} CU FT)
          </span>
        </div>
        <div className="text-[11px] font-mono text-gray-400 px-1">
          {blocks.length} Items Loaded
        </div>
      </div>

      {/* Controls / Perspective Tag Bottom Right */}
      <div className="absolute bottom-3 right-4 z-10 text-[10px] font-mono text-gray-500 pointer-events-none">
        30° ISOMETRIC VIEW • 1FT GRID
      </div>
    </div>
  );
}
