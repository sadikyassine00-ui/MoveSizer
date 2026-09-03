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
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
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
  const [dimensions, setDimensions] = useState({ width: 900, height: 580 });

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

    // =========================================================================
    // DIMENSIONS & BOUNDING BOX CALCULATION
    // =========================================================================
    const truckL = truck.length;
    const truckW = truck.width;
    const truckH = truck.height;

    // Vehicle constants
    const cabFrontX = -55;       // Cab nose at X = -55"
    const chassisDropY = -18;    // Chassis rails drop 18" below cargo floor
    const groundY = -34;         // Ground level where tires touch
    const cabRoofY = Math.min(50, truck.hasAttic ? truckH - 30 : 50);
    const hoodTopY = 30;

    // Axle positions
    const frontAxleX = -35;
    const rearAxleX = Math.round(truckL * 0.74);
    const hasDualRear = truckL >= 300;
    const rearAxles = hasDualRear ? [rearAxleX - 18, rearAxleX + 18] : [rearAxleX];

    // Framing envelope in 3D:
    const envelope = [
      { x: cabFrontX, y: groundY, z: 0 },
      { x: truckL, y: groundY, z: 0 },
      { x: truckL, y: groundY, z: truckW },
      { x: cabFrontX, y: groundY, z: truckW },
      { x: cabFrontX, y: truckH, z: 0 },
      { x: truckL, y: truckH, z: 0 },
      { x: truckL, y: truckH, z: truckW },
      { x: cabFrontX, y: truckH, z: truckW },
    ];

    let minProjX = Infinity, maxProjX = -Infinity;
    let minProjY = Infinity, maxProjY = -Infinity;

    for (const c of envelope) {
      const px = (c.x - c.z) * COS30;
      const py = (c.x + c.z) * SIN30 - c.y;
      if (px < minProjX) minProjX = px;
      if (px > maxProjX) maxProjX = px;
      if (py < minProjY) minProjY = py;
      if (py > maxProjY) maxProjY = py;
    }

    const marginX = 55;
    const marginY = 55;
    const availWidth = width - marginX * 2;
    const availHeight = height - marginY * 2;

    const scale = Math.min(availWidth / (maxProjX - minProjX), availHeight / (maxProjY - minProjY));

    const midX = (minProjX + maxProjX) / 2;
    const midY = (minProjY + maxProjY) / 2;

    const offsetX = width / 2 - midX * scale;
    const offsetY = height / 2 - midY * scale + 15;

    const proj = (x: number, y: number, z: number) =>
      project3DTo2D(x, y, z, scale, offsetX, offsetY);

    // =========================================================================
    // HELPER: DRAW 3D PRISM
    // =========================================================================
    const drawPrism = (
      x: number,
      y: number,
      z: number,
      l: number,
      h: number,
      w: number,
      colors: { top: string; right: string; front: string; stroke?: string; lineWidth?: number }
    ) => {
      const v1 = proj(x + l, y, z);
      const v2 = proj(x + l, y, z + w);
      const v3 = proj(x, y, z + w);
      const v4 = proj(x, y + h, z);
      const v5 = proj(x + l, y + h, z);
      const v6 = proj(x + l, y + h, z + w);
      const v7 = proj(x, y + h, z + w);

      const stroke = colors.stroke || 'rgba(0,0,0,0.4)';
      const lw = colors.lineWidth || 1;

      // Right Face (along X)
      ctx.beginPath();
      ctx.moveTo(v1.x, v1.y);
      ctx.lineTo(v2.x, v2.y);
      ctx.lineTo(v6.x, v6.y);
      ctx.lineTo(v5.x, v5.y);
      ctx.closePath();
      ctx.fillStyle = colors.right;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.stroke();

      // Front Face (along Z)
      ctx.beginPath();
      ctx.moveTo(v2.x, v2.y);
      ctx.lineTo(v3.x, v3.y);
      ctx.lineTo(v7.x, v7.y);
      ctx.lineTo(v6.x, v6.y);
      ctx.closePath();
      ctx.fillStyle = colors.front;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.stroke();

      // Top Face (along Y)
      ctx.beginPath();
      ctx.moveTo(v4.x, v4.y);
      ctx.lineTo(v5.x, v5.y);
      ctx.lineTo(v6.x, v6.y);
      ctx.lineTo(v7.x, v7.y);
      ctx.closePath();
      ctx.fillStyle = colors.top;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.stroke();
    };

    // =========================================================================
    // HELPER: DRAW ISOMETRIC WHEEL
    // =========================================================================
    const drawIsometricWheel = (axleX: number, zPosition: number, isNearSide: boolean) => {
      const wheelRadius = 15.5;
      const wheelWidth = 7.5;
      const centerY = -18.5; // Axle centerline
      const segments = 24;

      const zOuter = isNearSide ? zPosition : zPosition;
      const zInner = isNearSide ? zPosition + wheelWidth : zPosition - wheelWidth;

      // Outer & Inner perimeter points
      const outerPts: Point2D[] = [];
      const innerPts: Point2D[] = [];

      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const wx = axleX + wheelRadius * Math.cos(theta);
        const wy = centerY + wheelRadius * Math.sin(theta);
        outerPts.push(proj(wx, wy, zOuter));
        innerPts.push(proj(wx, wy, zInner));
      }

      // Draw Tread Sleeve (connecting outer and inner discs)
      ctx.fillStyle = '#101215';
      ctx.strokeStyle = '#1F242F';
      ctx.lineWidth = 1;

      for (let i = 0; i < segments; i++) {
        const next = (i + 1) % segments;
        const o1 = outerPts[i];
        const o2 = outerPts[next];
        const i1 = innerPts[i];
        const i2 = innerPts[next];

        ctx.beginPath();
        ctx.moveTo(o1.x, o1.y);
        ctx.lineTo(o2.x, o2.y);
        ctx.lineTo(i2.x, i2.y);
        ctx.lineTo(i1.x, i1.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Draw Outer Face Tire (Dark charcoal with rubber texture)
      ctx.beginPath();
      ctx.moveTo(outerPts[0].x, outerPts[0].y);
      for (let i = 1; i < segments; i++) {
        ctx.lineTo(outerPts[i].x, outerPts[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = isNearSide ? '#181A20' : '#121418';
      ctx.fill();
      ctx.strokeStyle = '#272B35';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Steel Rim Disc (Industrial gray)
      const rimRadius = wheelRadius * 0.62;
      const rimPts: Point2D[] = [];
      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const rx = axleX + rimRadius * Math.cos(theta);
        const ry = centerY + rimRadius * Math.sin(theta);
        rimPts.push(proj(rx, ry, zOuter));
      }

      ctx.beginPath();
      ctx.moveTo(rimPts[0].x, rimPts[0].y);
      for (let i = 1; i < segments; i++) {
        ctx.lineTo(rimPts[i].x, rimPts[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = isNearSide ? '#4B5563' : '#374151';
      ctx.fill();
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Hub Cap & Center Bolt Circle
      const hubCenter = proj(axleX, centerY, zOuter);
      ctx.beginPath();
      ctx.arc(hubCenter.x, hubCenter.y, Math.max(2.5, scale * 3), 0, Math.PI * 2);
      ctx.fillStyle = '#111827';
      ctx.fill();

      // 6 Lug Bolts around hub
      const boltRadius = rimRadius * 0.45;
      for (let b = 0; b < 6; b++) {
        const bTheta = (b / 6) * Math.PI * 2;
        const bx = axleX + boltRadius * Math.cos(bTheta);
        const by = centerY + boltRadius * Math.sin(bTheta);
        const bp = proj(bx, by, zOuter);

        ctx.beginPath();
        ctx.arc(bp.x, bp.y, Math.max(1, scale * 0.9), 0, Math.PI * 2);
        ctx.fillStyle = '#D1D5DB';
        ctx.fill();
      }
    };

    // =========================================================================
    // PIPELINE STAGE 1: FAR-SIDE WHEELS (Z = usableWidth)
    // =========================================================================
    drawIsometricWheel(frontAxleX, truckW, false);
    for (const rAxle of rearAxles) {
      drawIsometricWheel(rAxle, truckW, false);
    }

    // =========================================================================
    // PIPELINE STAGE 2: FAR CHASSIS RAIL (Z = usableWidth - 12")
    // =========================================================================
    const railStartZ = truckW - 14;
    const railWidth = 4;
    const railHeight = 16;
    const railStartLength = truckL + 45; // from X = -45 to truckL
    drawPrism(-45, chassisDropY, railStartZ, railStartLength, railHeight, railWidth, {
      top: '#242933',
      right: '#181B22',
      front: '#101318',
      stroke: '#2F3646',
    });

    // Cross-member beams under floor
    for (let cx = 0; cx <= truckL; cx += 48) {
      drawPrism(cx, chassisDropY + 4, 14, 4, 8, truckW - 28, {
        top: '#1E232B',
        right: '#14181F',
        front: '#101217',
        stroke: '#282F3B',
      });
    }

    // =========================================================================
    // PIPELINE STAGE 3: DRIVER CABIN, HOOD, SLOPED WINDSHIELD, BUMPER (X < 0)
    // =========================================================================
    const cabWidth = truckW - 10;
    const cabZ = 5;

    // 1. Cab Lower Base & Doors (from X = -25 to 0, Y = chassisDropY to cabRoofY)
    drawPrism(-25, chassisDropY, cabZ, 25, cabRoofY - chassisDropY, cabWidth, {
      top: '#2A303C',
      right: '#1E232C',
      front: '#161920',
      stroke: '#363D4D',
    });

    // Side Door Panel details & handle
    const doorBottom = proj(-20, -4, cabZ);
    const doorTop = proj(-20, 24, cabZ);
    ctx.strokeStyle = '#363D4D';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(doorBottom.x, doorBottom.y);
    ctx.lineTo(doorTop.x, doorTop.y);
    ctx.stroke();

    // Side window on cab
    const sw1 = proj(-22, 28, cabZ);
    const sw2 = proj(-4, 28, cabZ);
    const sw3 = proj(-4, 45, cabZ);
    const sw4 = proj(-22, 45, cabZ);
    ctx.beginPath();
    ctx.moveTo(sw1.x, sw1.y);
    ctx.lineTo(sw2.x, sw2.y);
    ctx.lineTo(sw3.x, sw3.y);
    ctx.lineTo(sw4.x, sw4.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(14, 165, 233, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. Engine Hood (from X = -55 to -25, Y = chassisDropY to hoodTopY)
    drawPrism(cabFrontX, chassisDropY, cabZ, 30, hoodTopY - chassisDropY, cabWidth, {
      top: '#2D3441',
      right: '#1E232C',
      front: '#151820',
      stroke: '#3A4254',
    });

    // 3. Sloped Windshield Assembly
    // Connects (X = -25, Y = cabRoofY) down to (X = -45, Y = hoodTopY) across Z
    const wsTopNear = proj(-25, cabRoofY, cabZ + 3);
    const wsTopFar = proj(-25, cabRoofY, cabZ + cabWidth - 3);
    const wsBottomFar = proj(-42, hoodTopY, cabZ + cabWidth - 3);
    const wsBottomNear = proj(-42, hoodTopY, cabZ + 3);

    ctx.beginPath();
    ctx.moveTo(wsTopNear.x, wsTopNear.y);
    ctx.lineTo(wsTopFar.x, wsTopFar.y);
    ctx.lineTo(wsBottomFar.x, wsBottomFar.y);
    ctx.lineTo(wsBottomNear.x, wsBottomNear.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(14, 165, 233, 0.28)';
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Windshield Specular Reflection Line
    const spec1 = proj(-27, cabRoofY - 3, cabZ + cabWidth * 0.35);
    const spec2 = proj(-40, hoodTopY + 2, cabZ + cabWidth * 0.35);
    ctx.beginPath();
    ctx.moveTo(spec1.x, spec1.y);
    ctx.lineTo(spec2.x, spec2.y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 4. Front Bumper, Grille & Indicator Lights at X = cabFrontX (-55)
    // Front Bumper (heavy duty steel bar)
    drawPrism(cabFrontX - 4, chassisDropY, cabZ - 2, 4, 16, cabWidth + 4, {
      top: '#374151',
      right: '#1F2937',
      front: '#111827',
      stroke: '#4B5563',
    });

    // Grille Slats at front nose
    for (let gy = 8; gy <= 24; gy += 4) {
      const gStart = proj(cabFrontX, gy, cabZ + 8);
      const gEnd = proj(cabFrontX, gy, cabZ + cabWidth - 8);
      ctx.beginPath();
      ctx.moveTo(gStart.x, gStart.y);
      ctx.lineTo(gEnd.x, gEnd.y);
      ctx.strokeStyle = '#0F1217';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Amber Corner Running Lights
    const amberNear = proj(cabFrontX, 24, cabZ + 2);
    ctx.beginPath();
    ctx.arc(amberNear.x, amberNear.y, Math.max(2, scale * 1.5), 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    const amberFar = proj(cabFrontX, 24, cabZ + cabWidth - 2);
    ctx.beginPath();
    ctx.arc(amberFar.x, amberFar.y, Math.max(2, scale * 1.5), 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    // =========================================================================
    // PIPELINE STAGE 4: CARGO FLOOR DECK & MEASUREMENT GRID (X >= 0, Y = 0)
    // =========================================================================
    const p0 = proj(0, 0, 0);
    const pL = proj(truckL, 0, 0);
    const pLW = proj(truckL, 0, truckW);
    const pW = proj(0, 0, truckW);

    // Floor deck surface
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(pL.x, pL.y);
    ctx.lineTo(pLW.x, pLW.y);
    ctx.lineTo(pW.x, pW.y);
    ctx.closePath();
    ctx.fillStyle = '#0E1015';
    ctx.fill();
    ctx.strokeStyle = '#1F242F';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 1-foot (12") measurement grid along X
    for (let x = 12; x < truckL; x += 12) {
      const a = proj(x, 0, 0);
      const b = proj(x, 0, truckW);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // 1-foot (12") measurement grid along Z
    for (let z = 12; z < truckW; z += 12) {
      const a = proj(0, 0, z);
      const b = proj(truckL, 0, z);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // =========================================================================
    // PIPELINE STAGE 5: CARGO ITEMS (SORTED BY DEPTH KEY: x + z + y)
    // =========================================================================
    const sortedBlocks = [...blocks].sort(
      (a, b) => a.x + a.z + a.y - (b.x + b.z + b.y)
    );

    const projectedFacesList: BlockProjectedFaces[] = [];

    for (const b of sortedBlocks) {
      const isSelected = selectedBlockId === b.id;
      const isHovered = hoveredBlock?.id === b.id;

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

      // Shading: Top (+22%), Right (+5%), Front (-25%)
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

      drawFace(rightFace, rightColor);
      drawFace(frontFace, frontColor);
      drawFace(topFace, topColor);

      // Highlight perimeter if hovered/selected
      if (isHovered || isSelected) {
        ctx.save();
        ctx.shadowColor = '#0066FF';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#0066FF';
        ctx.lineWidth = 2.5;

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
        ctx.font = `bold ${fontSize}px var(--font-ibm-plex-mono), monospace`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 3;

        let displayLabel = b.label;
        if (displayLabel.length > 12 && projectedWidth < 80) {
          displayLabel = displayLabel.slice(0, 10) + '..';
        }

        ctx.fillText(displayLabel, topCenterX, topCenterY);
        ctx.restore();
      }
    }

    projectedCacheRef.current = projectedFacesList;

    // =========================================================================
    // PIPELINE STAGE 6: TRANSPARENT WIREFRAME WALLS & MOM'S ATTIC OVERHANG
    // =========================================================================
    // Front Bulkhead (X = 0)
    const pBulkTopLeft = proj(0, truckH, 0);
    const pBulkTopRight = proj(0, truckH, truckW);

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(pBulkTopLeft.x, pBulkTopLeft.y);
    ctx.lineTo(pBulkTopRight.x, pBulkTopRight.y);
    ctx.lineTo(pW.x, pW.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(17, 19, 24, 0.7)';
    ctx.fill();
    ctx.strokeStyle = '#282F3E';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Left Wall (Z = 0)
    const pLeftTopRear = proj(truckL, truckH, 0);

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(pL.x, pL.y);
    ctx.lineTo(pLeftTopRear.x, pLeftTopRear.y);
    ctx.lineTo(pBulkTopLeft.x, pBulkTopLeft.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(14, 16, 21, 0.55)';
    ctx.fill();
    ctx.strokeStyle = '#282F3E';
    ctx.stroke();

    // Vertical structural ribs every 24"
    ctx.strokeStyle = 'rgba(31, 36, 47, 0.6)';
    for (let x = 24; x < truckL; x += 24) {
      const b = proj(x, 0, 0);
      const t = proj(x, truckH, 0);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    }

    // Mom's Attic Shelf Overhang
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

      const labelPos = proj(attL / 2, attFloorY + 2, attStartZ + attW / 2);
      ctx.font = '10px var(--font-ibm-plex-mono), monospace';
      ctx.fillStyle = '#FF8844';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("MOM'S ATTIC", labelPos.x, labelPos.y);
    }

    // Cutaway ceiling rails
    const pCeilRearRight = proj(truckL, truckH, truckW);
    ctx.strokeStyle = 'rgba(40, 47, 62, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    ctx.beginPath();
    ctx.moveTo(pLeftTopRear.x, pLeftTopRear.y);
    ctx.lineTo(pCeilRearRight.x, pCeilRearRight.y);
    ctx.lineTo(pBulkTopRight.x, pBulkTopRight.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pLW.x, pLW.y);
    ctx.lineTo(pCeilRearRight.x, pCeilRearRight.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // =========================================================================
    // PIPELINE STAGE 7: NEAR CHASSIS RAIL & REAR CRASH BUMPER
    // =========================================================================
    // Near Chassis Rail at Z = 10
    drawPrism(-45, chassisDropY, 10, railStartLength, railHeight, railWidth, {
      top: '#2F3646',
      right: '#242A35',
      front: '#171B22',
      stroke: '#3B4457',
    });

    // Rear Underrun Crash Bumper at X = truckL
    drawPrism(truckL, chassisDropY, 4, 4, 10, truckW - 8, {
      top: '#374151',
      right: '#1F2937',
      front: '#111827',
      stroke: '#4B5563',
    });

    // DOT Safety Chevron Stripes on rear bumper face
    const bumpTopL = proj(truckL + 4, chassisDropY + 8, 8);
    const bumpTopR = proj(truckL + 4, chassisDropY + 8, truckW - 8);
    ctx.beginPath();
    ctx.moveTo(bumpTopL.x, bumpTopL.y);
    ctx.lineTo(bumpTopR.x, bumpTopR.y);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Wheel Well cutout above rear tires along bottom rail
    for (const rAxle of rearAxles) {
      const wwL = proj(rAxle - 20, 0, 0);
      const wwPeak = proj(rAxle, 6, 0);
      const wwR = proj(rAxle + 20, 0, 0);

      ctx.beginPath();
      ctx.moveTo(wwL.x, wwL.y);
      ctx.quadraticCurveTo(wwPeak.x, wwPeak.y, wwR.x, wwR.y);
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // =========================================================================
    // PIPELINE STAGE 8: NEAR-SIDE WHEELS (Z = 0)
    // =========================================================================
    drawIsometricWheel(frontAxleX, 0, true);
    for (const rAxle of rearAxles) {
      drawIsometricWheel(rAxle, 0, true);
    }

    // Ground shadow line under vehicle
    const gFront = proj(cabFrontX - 8, groundY, truckW / 2);
    const gRear = proj(truckL + 12, groundY, truckW / 2);
    ctx.beginPath();
    ctx.moveTo(gFront.x, gFront.y);
    ctx.lineTo(gRear.x, gRear.y);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = Math.max(4, scale * 12);
    ctx.stroke();

    // =========================================================================
    // DIMENSION LABELS
    // =========================================================================
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '11px var(--font-ibm-plex-mono), monospace';
    ctx.fillText(`${truck.length}″ Interior Cargo Length`, pL.x - 40, pL.y + 26);
    ctx.fillText(`${truck.width}″ Width`, pW.x - 55, pW.y + 16);
    ctx.fillText(`${truck.height}″ Height`, pBulkTopLeft.x - 70, (p0.y + pBulkTopLeft.y) / 2);
  }, [truck, blocks, selectedBlockId, hoveredBlock, dimensions]);

  // Re-render when dependencies change
  useEffect(() => {
    render();
  }, [render]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mousePoint: Point2D = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    setMousePos(mousePoint);

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
      className={`relative w-full h-full min-h-[440px] bg-[#090A0C] overflow-hidden select-none ${className}`}
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
          className="absolute pointer-events-none z-30 px-3.5 py-2.5 bg-[#111318]/95 border border-[#0066FF] shadow-2xl backdrop-blur-md rounded-lg text-xs font-mono transition-transform duration-75 text-white"
          style={{
            left: Math.min(mousePos.x + 15, dimensions.width - 220),
            top: Math.max(10, Math.min(mousePos.y - 45, dimensions.height - 130)),
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-1.5 border-b border-[#1F242F] pb-1">
            <span className="font-bold text-[#F8F9FA] tracking-wide font-display uppercase text-sm">
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
            <div className="flex justify-between gap-4 text-[10px] text-gray-400 pt-1 border-t border-[#1F242F]/60">
              <span>Pos [X, Y, Z]:</span>
              <span>{hoveredBlock.x}″, {hoveredBlock.y}″, {hoveredBlock.z}″</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Left Truck Legend Badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#111318]/90 border border-[#1F242F] backdrop-blur-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-sm font-display font-bold uppercase tracking-wider text-white">
            {truck.name} ({truck.volumeCuFt} CU FT)
          </span>
        </div>
        <div className="text-[11px] font-mono text-gray-400 px-1">
          {blocks.length} Items Packed • Chassis Rails & Cabin Active
        </div>
      </div>

      {/* Controls / Perspective Tag Bottom Right */}
      <div className="absolute bottom-3 right-4 z-10 text-[10px] font-mono text-gray-500 pointer-events-none">
        30° ISOMETRIC BLUEPRINT • 1FT GRID • INDUSTRIAL CHASSIS
      </div>
    </div>
  );
}
