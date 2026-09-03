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
    const xi = vs[i].x,
      yi = vs[i].y;
    const xj = vs[j].x,
      yj = vs[j].y;
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
    // DIMENSIONS & PROJECTION ENVELOPE
    // In 30° Isometric View:
    // - Z = 0 is the far/back left wall.
    // - Z = truckW is the FOREGROUND / NEAR-SIDE facing the camera directly.
    // - The visible wheels MUST sit at Z = truckW (foreground), below floor deck (Y < 0).
    // - The far-side wheels at Z = 0 are occluded and CULLED.
    // =========================================================================
    const truckL = truck.length;
    const truckW = truck.width;
    const truckH = truck.height;

    // Vehicle constants in inches
    const cabFrontX = -55;       // Cab bumper at X = -55"
    const chassisDropY = -18;    // Steel I-beam depth under cargo floor
    const groundY = -34;         // Ground plane (tires touch ground at Y = -34")
    const cabRoofY = Math.min(50, truck.hasAttic ? truckH - 30 : 50);
    const hoodTopY = 30;

    // Axle positions
    const frontAxleX = -35;
    const rearAxleX = Math.round(truckL * 0.74);
    const hasDualRear = truckL >= 300;
    const rearAxles = hasDualRear ? [rearAxleX - 18, rearAxleX + 18] : [rearAxleX];

    // Framing envelope in 3D:
    const envelope = [
      { x: cabFrontX - 10, y: groundY - 5, z: 0 },
      { x: truckL + 15, y: groundY - 5, z: 0 },
      { x: truckL + 15, y: groundY - 5, z: truckW + 5 },
      { x: cabFrontX - 10, y: groundY - 5, z: truckW + 5 },
      { x: cabFrontX - 10, y: truckH + 10, z: 0 },
      { x: truckL + 15, y: truckH + 10, z: 0 },
      { x: truckL + 15, y: truckH + 10, z: truckW + 5 },
      { x: cabFrontX - 10, y: truckH + 10, z: truckW + 5 },
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

    const marginX = 65;
    const marginY = 65;
    const availWidth = width - marginX * 2;
    const availHeight = height - marginY * 2;

    const scale = Math.min(availWidth / (maxProjX - minProjX), availHeight / (maxProjY - minProjY));

    const midX = (minProjX + maxProjX) / 2;
    const midY = (minProjY + maxProjY) / 2;

    const offsetX = width / 2 - midX * scale;
    const offsetY = height / 2 - midY * scale + 15;

    const proj = (x: number, y: number, z: number) =>
      project3DTo2D(x, y, z, scale, offsetX, offsetY);

    // Helper: Draw 3D Prism
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

      const stroke = colors.stroke || '#27272A';
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
    // STAGE 1: GROUND DROP SHADOW (Asphalt Ground Plane Y = -34)
    // =========================================================================
    const gP0 = proj(cabFrontX - 8, groundY, 0);
    const gPL = proj(truckL + 12, groundY, 0);
    const gPLW = proj(truckL + 12, groundY, truckW + 8);
    const gPW = proj(cabFrontX - 8, groundY, truckW + 8);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(gP0.x, gP0.y);
    ctx.lineTo(gPL.x, gPL.y);
    ctx.lineTo(gPLW.x, gPLW.y);
    ctx.lineTo(gPW.x, gPW.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.filter = 'blur(12px)';
    ctx.fill();
    ctx.filter = 'none';
    ctx.restore();

    // Contact patch shadows directly under near-side tires (Z = truckW)
    const drawTirePatch = (axleX: number) => {
      const pNear = proj(axleX, groundY, truckW);
      ctx.beginPath();
      ctx.ellipse(pNear.x, pNear.y, 14 * scale, 4 * scale, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fill();
    };
    drawTirePatch(frontAxleX);
    for (const rAxle of rearAxles) {
      drawTirePatch(rAxle);
    }

    // =========================================================================
    // STAGE 2: UNDER-FLOOR CHASSIS RAILS (Steel I-Beams Y < 0)
    // - Far chassis rail at Z = 10 (far side, under deck)
    // - Far wheels (Z = 0) are occluded by the solid floor and body, so they are CULLED!
    // =========================================================================
    const railWidth = 4;
    const railHeight = 16;
    const railStartLength = truckL + 45; // from X = -45 to truckL

    // Far chassis rail (under floor at Z = 10)
    drawPrism(-45, chassisDropY, 10, railStartLength, railHeight, railWidth, {
      top: '#1E222A',
      right: '#14171D',
      front: '#0E1014',
      stroke: '#272C38',
    });

    // Cross-members connecting rails under the floor deck
    for (let cx = 12; cx < truckL; cx += 48) {
      drawPrism(cx, chassisDropY + 4, 12, 4, 8, truckW - 24, {
        top: '#191D24',
        right: '#12151A',
        front: '#0D0F13',
        stroke: '#242935',
      });
    }

    // Near chassis rail (under floor at Z = truckW - 14)
    drawPrism(-45, chassisDropY, truckW - 14, railStartLength, railHeight, railWidth, {
      top: '#242933',
      right: '#181B22',
      front: '#101318',
      stroke: '#2F3646',
    });

    // =========================================================================
    // STAGE 3: SOLID CARGO FLOOR DECK (Solid Opaque Plate at Y = 0)
    // Perfectly covers and isolates undercarriage from cargo
    // =========================================================================
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
    ctx.fillStyle = '#0D0E12'; // Solid opaque floor
    ctx.fill();
    ctx.strokeStyle = '#27272A';
    ctx.lineWidth = 1;
    ctx.stroke();

    // =========================================================================
    // STAGE 4: FLOOR MEASUREMENT GRID (1-Foot Hairline Increments on Deck)
    // =========================================================================
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    for (let x = 12; x < truckL; x += 12) {
      const a = proj(x, 0, 0);
      const b = proj(x, 0, truckW);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    for (let z = 12; z < truckW; z += 12) {
      const a = proj(0, 0, z);
      const b = proj(truckL, 0, z);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // =========================================================================
    // STAGE 5: DRIVER CABIN, HOOD & WIND DEFLECTOR (X < 0)
    // Drawn BEFORE cargo items so cargo at bulkhead stays cleanly inside
    // =========================================================================
    const cabWidth = truckW - 10;
    const cabZ = 5;

    // 1. Cab Lower Base & Doors (X = -25 to 0, Y = chassisDropY to cabRoofY)
    drawPrism(-25, chassisDropY, cabZ, 25, cabRoofY - chassisDropY, cabWidth, {
      top: '#232730',
      right: '#1A1D24',
      front: '#121419',
      stroke: '#2E3442',
    });

    // 2. Aerodynamic Cab-Over Wind Deflector
    const fairingTopY = truck.hasAttic ? truckH - (truck.attic?.height || 30) : Math.min(cabRoofY + 24, truckH);
    if (fairingTopY > cabRoofY) {
      const fTopNear = proj(0, fairingTopY, cabZ + cabWidth);
      const fTopFar = proj(0, fairingTopY, cabZ);
      const fRoofFar = proj(-25, cabRoofY, cabZ);
      const fRoofNear = proj(-25, cabRoofY, cabZ + cabWidth);

      // Sloped Fairing Surface
      ctx.beginPath();
      ctx.moveTo(fRoofFar.x, fRoofFar.y);
      ctx.lineTo(fRoofNear.x, fRoofNear.y);
      ctx.lineTo(fTopNear.x, fTopNear.y);
      ctx.lineTo(fTopFar.x, fTopFar.y);
      ctx.closePath();
      ctx.fillStyle = '#2A2F3B';
      ctx.fill();
      ctx.strokeStyle = '#363D4D';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Side Triangle Panel (Near Side, Z = cabZ + cabWidth)
      const fBaseNear = proj(0, cabRoofY, cabZ + cabWidth);
      ctx.beginPath();
      ctx.moveTo(fRoofNear.x, fRoofNear.y);
      ctx.lineTo(fTopNear.x, fTopNear.y);
      ctx.lineTo(fBaseNear.x, fBaseNear.y);
      ctx.closePath();
      ctx.fillStyle = '#1D2128';
      ctx.fill();
      ctx.strokeStyle = '#2E3442';
      ctx.stroke();
    }

    // Side Door & Window on NEAR side of cab (Z = cabZ + cabWidth = truckW - 5, facing camera)
    const nearCabZ = cabZ + cabWidth;
    const sw1 = proj(-22, 28, nearCabZ);
    const sw2 = proj(-4, 28, nearCabZ);
    const sw3 = proj(-4, 45, nearCabZ);
    const sw4 = proj(-22, 45, nearCabZ);
    ctx.beginPath();
    ctx.moveTo(sw1.x, sw1.y);
    ctx.lineTo(sw2.x, sw2.y);
    ctx.lineTo(sw3.x, sw3.y);
    ctx.lineTo(sw4.x, sw4.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Door seam line on near cab side
    const ds1 = proj(-23, chassisDropY, nearCabZ);
    const ds2 = proj(-23, 26, nearCabZ);
    ctx.beginPath();
    ctx.moveTo(ds1.x, ds1.y);
    ctx.lineTo(ds2.x, ds2.y);
    ctx.strokeStyle = '#272B35';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 3. Engine Hood (X = -55 to -25, Y = chassisDropY to hoodTopY)
    drawPrism(cabFrontX, chassisDropY, cabZ, 30, hoodTopY - chassisDropY, cabWidth, {
      top: '#262B35',
      right: '#1A1D24',
      front: '#121419',
      stroke: '#32394A',
    });

    // 4. Sloped Windshield
    const wsTopNear = proj(-25, cabRoofY, nearCabZ - 2);
    const wsTopFar = proj(-25, cabRoofY, cabZ + 2);
    const wsBottomFar = proj(-42, hoodTopY, cabZ + 2);
    const wsBottomNear = proj(-42, hoodTopY, nearCabZ - 2);

    ctx.beginPath();
    ctx.moveTo(wsTopFar.x, wsTopFar.y);
    ctx.lineTo(wsTopNear.x, wsTopNear.y);
    ctx.lineTo(wsBottomNear.x, wsBottomNear.y);
    ctx.lineTo(wsBottomFar.x, wsBottomFar.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Specular diagonal line across windshield
    const spec1 = proj(-27, cabRoofY - 3, cabZ + cabWidth * 0.4);
    const spec2 = proj(-40, hoodTopY + 2, cabZ + cabWidth * 0.4);
    ctx.beginPath();
    ctx.moveTo(spec1.x, spec1.y);
    ctx.lineTo(spec2.x, spec2.y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 5. Front Bumper & Grille (X = cabFrontX)
    drawPrism(cabFrontX - 4, chassisDropY, cabZ - 2, 4, 16, cabWidth + 4, {
      top: '#2E333D',
      right: '#1B1E24',
      front: '#111317',
      stroke: '#3B4250',
    });

    for (let gy = 8; gy <= 24; gy += 4) {
      const gStart = proj(cabFrontX, gy, cabZ + 8);
      const gEnd = proj(cabFrontX, gy, cabZ + cabWidth - 8);
      ctx.beginPath();
      ctx.moveTo(gStart.x, gStart.y);
      ctx.lineTo(gEnd.x, gEnd.y);
      ctx.strokeStyle = '#0B0C0F';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Amber Indicator Micro-Dots
    const amberNear = proj(cabFrontX, 24, nearCabZ - 1);
    ctx.beginPath();
    ctx.arc(amberNear.x, amberNear.y, Math.max(1.5, scale * 1.2), 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();

    const amberFar = proj(cabFrontX, 24, cabZ + 1);
    ctx.beginPath();
    ctx.arc(amberFar.x, amberFar.y, Math.max(1.5, scale * 1.2), 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();

    // =========================================================================
    // STAGE 6: CARGO ITEMS (DEPTH-SORTED BACK-TO-FRONT: x + z + y)
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

      const baseColor = b.color;
      const topColor = adjustBrightness(baseColor, 0.2);
      const rightColor = adjustBrightness(baseColor, 0.04);
      const frontColor = adjustBrightness(baseColor, -0.22);

      const drawFace = (pts: Point2D[], fillColor: string) => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();

        ctx.strokeStyle = isHovered || isSelected ? '#0066FF' : 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = isHovered || isSelected ? 2 : 1;
        ctx.stroke();
      };

      drawFace(rightFace, rightColor);
      drawFace(frontFace, frontColor);
      drawFace(topFace, topColor);

      if (isHovered || isSelected) {
        ctx.save();
        ctx.shadowColor = '#0066FF';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#0066FF';
        ctx.lineWidth = 2;

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

      // Block Label (Clean Swiss Sans)
      const topCenterX = (v4.x + v5.x + v6.x + v7.x) / 4;
      const topCenterY = (v4.y + v5.y + v6.y + v7.y) / 4;

      const projectedWidth = Math.abs(v6.x - v4.x);
      if (projectedWidth > 28) {
        ctx.save();
        const fontSize = Math.max(9, Math.min(11, Math.floor(projectedWidth / 7.5)));
        ctx.font = `600 ${fontSize}px var(--font-sans), sans-serif`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
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
    // STAGE 7: TRANSPARENT CARGO SHELL, RIBS, ROLL-UP DOOR & MOM'S ATTIC
    // =========================================================================
    const pBulkTopLeft = proj(0, truckH, 0);
    const pBulkTopRight = proj(0, truckH, truckW);

    // Front Bulkhead (X = 0, Z = 0 to truckW)
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(pBulkTopLeft.x, pBulkTopLeft.y);
    ctx.lineTo(pBulkTopRight.x, pBulkTopRight.y);
    ctx.lineTo(pW.x, pW.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.fill();
    ctx.strokeStyle = '#27272A';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Left Wall (Z = 0)
    const pLeftTopRear = proj(truckL, truckH, 0);

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(pL.x, pL.y);
    ctx.lineTo(pLeftTopRear.x, pLeftTopRear.y);
    ctx.lineTo(pBulkTopLeft.x, pBulkTopLeft.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.fill();
    ctx.strokeStyle = '#27272A';
    ctx.stroke();

    // 4-Foot (48") Vertical Structural Ribs along Left Wall
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let x = 48; x < truckL; x += 48) {
      const b = proj(x, 0, 0);
      const t = proj(x, truckH, 0);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    }

    // Rear Roll-Up Door Frame at X = truckL
    const pCeilRearRight = proj(truckL, truckH, truckW);

    ctx.beginPath();
    ctx.moveTo(pLeftTopRear.x, pLeftTopRear.y);
    ctx.lineTo(pCeilRearRight.x, pCeilRearRight.y);
    ctx.strokeStyle = '#3F3F46';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pLW.x, pLW.y);
    ctx.lineTo(pCeilRearRight.x, pCeilRearRight.y);
    ctx.strokeStyle = '#3F3F46';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Corner Grab Handles on rear posts
    const gh1 = proj(truckL, 20, 0);
    const gh2 = proj(truckL, 40, 0);
    ctx.beginPath();
    ctx.moveTo(gh1.x, gh1.y);
    ctx.lineTo(gh2.x, gh2.y);
    ctx.strokeStyle = '#71717A';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Open Cross-section ceiling guide rail (dashed)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(pBulkTopRight.x, pBulkTopRight.y);
    ctx.lineTo(pCeilRearRight.x, pCeilRearRight.y);
    ctx.stroke();
    ctx.setLineDash([]);

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
      ctx.fillStyle = 'rgba(255, 85, 0, 0.05)';
      ctx.fill();
      ctx.strokeStyle = '#FF5500';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      const labelPos = proj(attL / 2, attFloorY + 2, attStartZ + attW / 2);
      ctx.font = '500 10px var(--font-sans), sans-serif';
      ctx.fillStyle = '#FF8844';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("MOM'S ATTIC", labelPos.x, labelPos.y);
    }

    // Rear Underrun Crash Bumper at X = truckL
    drawPrism(truckL, chassisDropY, 4, 4, 10, truckW - 8, {
      top: '#27272A',
      right: '#18181B',
      front: '#09090B',
      stroke: '#3F3F46',
    });

    // =========================================================================
    // STAGE 8: VISIBLE NEAR-SIDE WHEELS (Z = truckW, FACING THE CAMERA)
    // - Anchored strictly at Y < 0 (below floor deck line)
    // - Outer tire face is at Z = truckW (the camera-facing near side)
    // - Extruded inward along Z towards truckW - 7
    // - Never overlaps cargo, positioned on the correct visible side of truck
    // =========================================================================
    const drawNearForegroundWheel = (axleX: number) => {
      const wheelRadius = 15.5;
      const wheelWidth = 7;
      const centerY = -18.5; // Centerline of axle below deck
      const segments = 28;

      const outerPts: Point2D[] = [];
      const innerPts: Point2D[] = [];

      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const wx = axleX + wheelRadius * Math.cos(theta);
        const wy = centerY + wheelRadius * Math.sin(theta);
        // Outer face at Z = truckW (facing camera)
        outerPts.push(proj(wx, wy, truckW));
        // Inner face extruded inward to Z = truckW - wheelWidth
        innerPts.push(proj(wx, wy, truckW - wheelWidth));
      }

      // Tread sleeve connecting outer and inner rims
      ctx.fillStyle = '#0F1115';
      ctx.strokeStyle = '#181A20';
      ctx.lineWidth = 1;

      for (let i = 0; i < segments; i++) {
        const next = (i + 1) % segments;
        ctx.beginPath();
        ctx.moveTo(outerPts[i].x, outerPts[i].y);
        ctx.lineTo(outerPts[next].x, outerPts[next].y);
        ctx.lineTo(innerPts[next].x, innerPts[next].y);
        ctx.lineTo(innerPts[i].x, innerPts[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Outer Face Tire
      ctx.beginPath();
      ctx.moveTo(outerPts[0].x, outerPts[0].y);
      for (let i = 1; i < segments; i++) {
        ctx.lineTo(outerPts[i].x, outerPts[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = '#14161B';
      ctx.fill();
      ctx.strokeStyle = '#27272A';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Steel Rim Disc
      const rimRadius = wheelRadius * 0.62;
      const rimPts: Point2D[] = [];
      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const rx = axleX + rimRadius * Math.cos(theta);
        const ry = centerY + rimRadius * Math.sin(theta);
        rimPts.push(proj(rx, ry, truckW));
      }

      ctx.beginPath();
      ctx.moveTo(rimPts[0].x, rimPts[0].y);
      for (let i = 1; i < segments; i++) {
        ctx.lineTo(rimPts[i].x, rimPts[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = '#3F3F46';
      ctx.fill();
      ctx.strokeStyle = '#27272A';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Hub Cap & 6 Lug Bolt Micro-Dots on outer rim face
      const hubCenter = proj(axleX, centerY, truckW);
      ctx.beginPath();
      ctx.arc(hubCenter.x, hubCenter.y, Math.max(2, scale * 2.8), 0, Math.PI * 2);
      ctx.fillStyle = '#18181B';
      ctx.fill();

      const boltRadius = rimRadius * 0.45;
      for (let b = 0; b < 6; b++) {
        const bTheta = (b / 6) * Math.PI * 2;
        const bx = axleX + boltRadius * Math.cos(bTheta);
        const by = centerY + boltRadius * Math.sin(bTheta);
        const bp = proj(bx, by, truckW);

        ctx.beginPath();
        ctx.arc(bp.x, bp.y, Math.max(1, scale * 0.8), 0, Math.PI * 2);
        ctx.fillStyle = '#A1A1AA';
        ctx.fill();
      }

      // Arched Wheel Well Cutout in the chassis skirt at Z = truckW
      const wwL = proj(axleX - 19, 0, truckW);
      const wwPeak = proj(axleX, 4, truckW);
      const wwR = proj(axleX + 19, 0, truckW);

      ctx.beginPath();
      ctx.moveTo(wwL.x, wwL.y);
      ctx.quadraticCurveTo(wwPeak.x, wwPeak.y, wwR.x, wwR.y);
      ctx.strokeStyle = '#27272A';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    };

    // Draw visible foreground wheels facing the camera (Z = truckW)
    drawNearForegroundWheel(frontAxleX);
    for (const rAxle of rearAxles) {
      drawNearForegroundWheel(rAxle);
    }

    // =========================================================================
    // ARCHITECTURAL DIMENSION CALLOUT LINES (CAD Blueprint Style)
    // =========================================================================
    ctx.fillStyle = '#71717A';
    ctx.strokeStyle = '#27272A';
    ctx.lineWidth = 1;
    ctx.font = '500 10px var(--font-sans), sans-serif';

    // Length callout line below the floor at Z = truckW
    const dimLStart = proj(0, groundY - 8, truckW);
    const dimLEnd = proj(truckL, groundY - 8, truckW);
    ctx.beginPath();
    ctx.moveTo(dimLStart.x, dimLStart.y);
    ctx.lineTo(dimLEnd.x, dimLEnd.y);
    ctx.stroke();

    // Tick marks
    ctx.beginPath();
    ctx.moveTo(dimLStart.x, dimLStart.y - 3);
    ctx.lineTo(dimLStart.x, dimLStart.y + 3);
    ctx.moveTo(dimLEnd.x, dimLEnd.y - 3);
    ctx.lineTo(dimLEnd.x, dimLEnd.y + 3);
    ctx.stroke();

    const dimLMid = proj(truckL / 2, groundY - 8, truckW);
    ctx.fillText(`${truck.length}″ (${(truck.length / 12).toFixed(1)}′) Length`, dimLMid.x - 35, dimLMid.y + 14);

    // Height callout line on left bulkhead post
    const dimHStart = proj(0, 0, -8);
    const dimHEnd = proj(0, truckH, -8);
    ctx.beginPath();
    ctx.moveTo(dimHStart.x, dimHStart.y);
    ctx.lineTo(dimHEnd.x, dimHEnd.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(dimHStart.x - 3, dimHStart.y);
    ctx.lineTo(dimHStart.x + 3, dimHStart.y);
    ctx.moveTo(dimHEnd.x - 3, dimHEnd.y);
    ctx.lineTo(dimHEnd.x + 3, dimHEnd.y);
    ctx.stroke();

    const dimHMid = proj(0, truckH / 2, -8);
    ctx.fillText(`${truck.height}″ Height`, dimHMid.x - 68, dimHMid.y);
  }, [truck, blocks, selectedBlockId, hoveredBlock, dimensions]);

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
          className="absolute pointer-events-none z-30 px-3.5 py-2.5 bg-[#111318]/95 border border-[#0066FF] shadow-2xl backdrop-blur-md rounded-lg text-xs font-sans transition-transform duration-75 text-white"
          style={{
            left: Math.min(mousePos.x + 15, dimensions.width - 220),
            top: Math.max(10, Math.min(mousePos.y - 45, dimensions.height - 130)),
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-1.5 border-b border-[#1F242F] pb-1">
            <span className="font-semibold text-[#F8F9FA] tracking-tight text-sm">
              {hoveredBlock.label}
            </span>
            {hoveredBlock.isAttic && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF5500]/20 text-[#FF5500] font-semibold tracking-wide uppercase">
                Attic
              </span>
            )}
          </div>
          <div className="space-y-0.5 text-zinc-300">
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">Dimensions:</span>
              <span className="text-zinc-200 tabular-nums">{hoveredBlock.dimensionsText}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">Volume:</span>
              <span className="text-[#0066FF] font-semibold tabular-nums">
                {hoveredBlock.volumeCuFt} cu ft
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">Weight:</span>
              <span className="text-zinc-200 tabular-nums">~{hoveredBlock.weightLbs} lbs</span>
            </div>
            <div className="flex justify-between gap-4 text-[10px] text-zinc-500 pt-1 border-t border-[#1F242F]">
              <span>Position:</span>
              <span className="tabular-nums">[{hoveredBlock.x}″, {hoveredBlock.y}″, {hoveredBlock.z}″]</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Left Truck Legend Badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111318]/90 border border-[#1F242F] backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-xs font-semibold text-white tracking-tight">
            {truck.name} <span className="text-zinc-400 font-normal tabular-nums">({truck.volumeCuFt} cu ft)</span>
          </span>
        </div>
        <div className="text-[11px] text-zinc-500 px-1 tabular-nums">
          {blocks.length} items packed • architectural CAD view
        </div>
      </div>

      {/* Controls / Perspective Tag Bottom Right */}
      <div className="absolute bottom-3 right-4 z-10 text-[11px] text-zinc-500 pointer-events-none">
        30° isometric projection • 1-ft grid
      </div>
    </div>
  );
}
