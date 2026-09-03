'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TruckSpec } from '@/lib/constants/trucks';
import { DrawableBlock } from '@/lib/engine/packEngine';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

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

  // Viewport dimensions
  const [dimensions, setDimensions] = useState({ width: 900, height: 580 });

  // Interactive Camera State (Smooth Pan & Zoom)
  const [userScale, setUserScale] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<Point2D>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<Point2D>({ x: 0, y: 0 });
  const hasDraggedRef = useRef<boolean>(false);

  // Active refs for native wheel and touch handlers without stale closure lag
  const userScaleRef = useRef<number>(1.0);
  const panOffsetRef = useRef<Point2D>({ x: 0, y: 0 });

  useEffect(() => {
    userScaleRef.current = userScale;
  }, [userScale]);

  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  // Block hover state
  const [hoveredBlock, setHoveredBlock] = useState<DrawableBlock | null>(null);
  const [mousePos, setMousePos] = useState<Point2D | null>(null);

  // Projected polygons cache for pixel-perfect raycasting
  const projectedCacheRef = useRef<BlockProjectedFaces[]>([]);

  // Base projection parameters ref
  const baseMetricsRef = useRef<{
    baseScale: number;
    midX: number;
    midY: number;
  }>({ baseScale: 1, midX: 0, midY: 0 });

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
    // 1. VEHICLE DIMENSIONS & FRAMING ENVELOPE
    // Modeled after Ford E-450 / Chevy Express commercial cutaway truck chassis
    // =========================================================================
    const truckL = truck.length;
    const truckW = truck.width;
    const truckH = truck.height;

    // Commercial Cab Coordinates (in inches)
    const cabFrontX = -56;       // Nose / Bumper forward of cargo bulkhead
    const cowlX = -26;           // Base of windshield / hood cowl
    const cabRoofX = -12;        // Top of windshield / roof peak
    const chassisDropY = -18;    // Steel chassis frame under floor
    const groundY = -34;         // Ground plane (tire contact patch)
    const hoodTopY = 28;         // Top of hood cowl
    const noseTopY = 22;         // Nose edge above grille
    const cabRoofY = 52;         // Standard E-450 cab roof height

    // Axles
    const frontAxleX = -36;
    const rearAxleX = Math.round(truckL * 0.74);
    const hasDualRear = truckL >= 300;
    const rearAxles = hasDualRear ? [rearAxleX - 18, rearAxleX + 18] : [rearAxleX];

    // Framing envelope in 3D (includes exterior dimension callout clearance):
    const envelope = [
      { x: cabFrontX - 14, y: groundY - 8, z: -26 },
      { x: truckL + 36, y: groundY - 8, z: -26 },
      { x: truckL + 36, y: groundY - 8, z: truckW + 12 },
      { x: cabFrontX - 14, y: groundY - 8, z: truckW + 12 },
      { x: cabFrontX - 14, y: truckH + 34, z: -26 },
      { x: truckL + 36, y: truckH + 34, z: -26 },
      { x: truckL + 36, y: truckH + 34, z: truckW + 12 },
      { x: cabFrontX - 14, y: truckH + 34, z: truckW + 12 },
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

    const marginX = 70;
    const marginY = 70;
    const availWidth = width - marginX * 2;
    const availHeight = height - marginY * 2;

    const baseScale = Math.min(availWidth / (maxProjX - minProjX), availHeight / (maxProjY - minProjY));
    const midX = (minProjX + maxProjX) / 2;
    const midY = (minProjY + maxProjY) / 2;

    baseMetricsRef.current = { baseScale, midX, midY };

    // Apply interactive user scale & camera pan
    const scale = baseScale * userScale;
    const offsetX = width / 2 - midX * scale + panOffset.x;
    const offsetY = height / 2 - midY * scale + 15 + panOffset.y;

    const proj = (x: number, y: number, z: number) =>
      project3DTo2D(x, y, z, scale, offsetX, offsetY);

    // =========================================================================
    // HELPER: DRAW 3D PRISM (Crisp Architectural CAD Linework)
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
    // STAGE 1: GROUND DROP SHADOW (Soft Asphalt Ambient Occlusion)
    // =========================================================================
    const gP0 = proj(cabFrontX - 10, groundY, 0);
    const gPL = proj(truckL + 14, groundY, 0);
    const gPLW = proj(truckL + 14, groundY, truckW + 10);
    const gPW = proj(cabFrontX - 10, groundY, truckW + 10);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(gP0.x, gP0.y);
    ctx.lineTo(gPL.x, gPL.y);
    ctx.lineTo(gPLW.x, gPLW.y);
    ctx.lineTo(gPW.x, gPW.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.filter = 'blur(12px)';
    ctx.fill();
    ctx.filter = 'none';
    ctx.restore();

    // Dark rubber contact patch shadows under near-side tires
    const drawTirePatch = (axleX: number) => {
      const pNear = proj(axleX, groundY, truckW);
      ctx.beginPath();
      ctx.ellipse(pNear.x, pNear.y, 15 * scale, 4.5 * scale, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fill();
    };
    drawTirePatch(frontAxleX);
    for (const rAxle of rearAxles) {
      drawTirePatch(rAxle);
    }

    // =========================================================================
    // STAGE 2: UNDER-FLOOR CHASSIS RAILS (Dark Steel I-Beams Y < 0)
    // Far-side wheels (Z = 0) are physically occluded and CULLED from view.
    // =========================================================================
    const railWidth = 4;
    const railHeight = 16;
    const railStartLength = truckL + 46;

    // Far chassis rail (under floor at Z = 10)
    drawPrism(-46, chassisDropY, 10, railStartLength, railHeight, railWidth, {
      top: '#1E222A',
      right: '#14171D',
      front: '#0E1014',
      stroke: '#272C38',
    });

    // Transverse structural cross-members under cargo deck
    for (let cx = 12; cx < truckL; cx += 48) {
      drawPrism(cx, chassisDropY + 4, 12, 4, 8, truckW - 24, {
        top: '#191D24',
        right: '#12151A',
        front: '#0D0F13',
        stroke: '#242935',
      });
    }

    // Near chassis rail (under floor at Z = truckW - 14)
    drawPrism(-46, chassisDropY, truckW - 14, railStartLength, railHeight, railWidth, {
      top: '#242933',
      right: '#181B22',
      front: '#101318',
      stroke: '#2F3646',
    });

    // =========================================================================
    // STAGE 3: SOLID CARGO FLOOR DECK (Solid Opaque Plate at Y = 0)
    // Completely occludes undercarriage rails from interior cargo
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
    ctx.fillStyle = '#0D0E12'; // Solid opaque plate
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
    // STAGE 5: REALISTIC COMMERCIAL CABIN REDESIGN (Ford E-450 Cutaway Spec)
    // Drawn BEFORE cargo items so cargo at bulkhead sits inside the truck
    // =========================================================================
    const cabWidth = truckW - 10;
    const cabZ = 5;
    const nearCabZ = cabZ + cabWidth; // Near side of cabin facing camera

    // 1. Lower Cab Body & Floor Base (X = cowlX to 0, Y = chassisDropY to 28)
    drawPrism(cowlX, chassisDropY, cabZ, -cowlX, 28 - chassisDropY, cabWidth, {
      top: '#262A33',
      right: '#1B1E25',
      front: '#121419',
      stroke: '#323846',
    });

    // 2. Cab Upper Enclosure & Doors (X = cowlX to 0, Y = 28 to cabRoofY)
    drawPrism(cowlX, 28, cabZ, -cowlX, cabRoofY - 28, cabWidth, {
      top: '#2E333F',
      right: '#20242D',
      front: '#15181E',
      stroke: '#3A4252',
    });

    // 3. Sloped Aerodynamic Hood (X = cabFrontX to cowlX, sloping from noseTopY to hoodTopY)
    // Draw hood lower block (chassisDropY to noseTopY)
    drawPrism(cabFrontX, chassisDropY, cabZ, cowlX - cabFrontX, noseTopY - chassisDropY, cabWidth, {
      top: '#242831',
      right: '#191C22',
      front: '#101217',
      stroke: '#2F3542',
    });

    // Sloped Hood Top Wedge (from noseTopY at cabFrontX to hoodTopY at cowlX)
    const hdNoseNear = proj(cabFrontX, noseTopY, nearCabZ);
    const hdNoseFar = proj(cabFrontX, noseTopY, cabZ);
    const hdCowlFar = proj(cowlX, hoodTopY, cabZ);
    const hdCowlNear = proj(cowlX, hoodTopY, nearCabZ);

    // Hood Top Surface
    ctx.beginPath();
    ctx.moveTo(hdNoseNear.x, hdNoseNear.y);
    ctx.lineTo(hdNoseFar.x, hdNoseFar.y);
    ctx.lineTo(hdCowlFar.x, hdCowlFar.y);
    ctx.lineTo(hdCowlNear.x, hdCowlNear.y);
    ctx.closePath();
    ctx.fillStyle = '#2C313C';
    ctx.fill();
    ctx.strokeStyle = '#394050';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Hood Near Side Wedge
    const hdBaseNear = proj(cowlX, noseTopY, nearCabZ);
    ctx.beginPath();
    ctx.moveTo(hdNoseNear.x, hdNoseNear.y);
    ctx.lineTo(hdCowlNear.x, hdCowlNear.y);
    ctx.lineTo(hdBaseNear.x, hdBaseNear.y);
    ctx.closePath();
    ctx.fillStyle = '#1E2129';
    ctx.fill();
    ctx.strokeStyle = '#323846';
    ctx.stroke();

    // 4. Sloped 48° Raked Windshield & A-Pillars
    const wsTopNear = proj(cabRoofX, cabRoofY - 2, nearCabZ - 3);
    const wsTopFar = proj(cabRoofX, cabRoofY - 2, cabZ + 3);
    const wsBottomFar = proj(cowlX - 1, hoodTopY + 1, cabZ + 3);
    const wsBottomNear = proj(cowlX - 1, hoodTopY + 1, nearCabZ - 3);

    ctx.beginPath();
    ctx.moveTo(wsTopFar.x, wsTopFar.y);
    ctx.lineTo(wsTopNear.x, wsTopNear.y);
    ctx.lineTo(wsBottomNear.x, wsBottomNear.y);
    ctx.lineTo(wsBottomFar.x, wsBottomFar.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(14, 165, 233, 0.08)'; // Subtle automotive cyan glass tint
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Windshield Top Sunband Tint Strip
    const sunbandNear = proj(cabRoofX - (cowlX - cabRoofX) * 0.22, cabRoofY - 8, nearCabZ - 3);
    const sunbandFar = proj(cabRoofX - (cowlX - cabRoofX) * 0.22, cabRoofY - 8, cabZ + 3);
    ctx.beginPath();
    ctx.moveTo(wsTopFar.x, wsTopFar.y);
    ctx.lineTo(wsTopNear.x, wsTopNear.y);
    ctx.lineTo(sunbandNear.x, sunbandNear.y);
    ctx.lineTo(sunbandFar.x, sunbandFar.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(14, 165, 233, 0.22)';
    ctx.fill();

    // Specular diagonal highlight across windshield
    const spec1 = proj(cabRoofX - 3, cabRoofY - 4, cabZ + cabWidth * 0.45);
    const spec2 = proj(cowlX + 2, hoodTopY + 3, cabZ + cabWidth * 0.45);
    ctx.beginPath();
    ctx.moveTo(spec1.x, spec1.y);
    ctx.lineTo(spec2.x, spec2.y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 5. Driver Door, Window, Handle & Entry Running Board (Near Side $Z = nearCabZ$)
    // Driver side window (trapezoidal commercial window)
    const dw1 = proj(cowlX + 3, 33, nearCabZ);
    const dw2 = proj(-3, 33, nearCabZ);
    const dw3 = proj(-3, cabRoofY - 4, nearCabZ);
    const dw4 = proj(cabRoofX + 1, cabRoofY - 4, nearCabZ);
    ctx.beginPath();
    ctx.moveTo(dw1.x, dw1.y);
    ctx.lineTo(dw2.x, dw2.y);
    ctx.lineTo(dw3.x, dw3.y);
    ctx.lineTo(dw4.x, dw4.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Door shut-lines / contour
    const dl1 = proj(-2, chassisDropY, nearCabZ);
    const dl2 = proj(-2, cabRoofY, nearCabZ);
    ctx.beginPath();
    ctx.moveTo(dl1.x, dl1.y);
    ctx.lineTo(dl2.x, dl2.y);
    ctx.strokeStyle = '#181A20';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const dl3 = proj(cowlX + 1, chassisDropY, nearCabZ);
    const dl4 = proj(cowlX + 1, 33, nearCabZ);
    ctx.beginPath();
    ctx.moveTo(dl3.x, dl3.y);
    ctx.lineTo(dl4.x, dl4.y);
    ctx.strokeStyle = '#181A20';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Recessed Black Commercial Door Handle
    const dh = proj(-9, 31, nearCabZ);
    ctx.beginPath();
    ctx.rect(dh.x - 4 * scale, dh.y - 1.5 * scale, 8 * scale, 3 * scale);
    ctx.fillStyle = '#111317';
    ctx.fill();
    ctx.strokeStyle = '#3F3F46';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Lower Cab Entry Running Board / Step (under door)
    drawPrism(cowlX + 2, -23, nearCabZ - 2, 20, 4, 5, {
      top: '#2C303B',
      right: '#1E2229',
      front: '#14161C',
      stroke: '#3F4657',
    });

    // Commercial Dual-Glass Towing Side Mirror Assembly
    const mMount = proj(cowlX + 3, 36, nearCabZ);
    const mArmEnd = proj(cowlX + 1, 36, nearCabZ + 7);
    ctx.beginPath();
    ctx.moveTo(mMount.x, mMount.y);
    ctx.lineTo(mArmEnd.x, mArmEnd.y);
    ctx.strokeStyle = '#181A20';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Mirror Head Housing
    drawPrism(cowlX - 2, 30, nearCabZ + 5, 4, 15, 3, {
      top: '#22252D',
      right: '#181A20',
      front: '#0F1116',
      stroke: '#38BDF8',
      lineWidth: 1,
    });

    // 6. Front Grille, Headlights, and Steel Bumper (X = cabFrontX)
    // Commercial Radiator Grille
    const grilleTop = noseTopY - 2;
    const grilleBottom = -6;
    drawPrism(cabFrontX - 2, grilleBottom, cabZ + 6, 2, grilleTop - grilleBottom, cabWidth - 12, {
      top: '#1A1D24',
      right: '#111318',
      front: '#0B0C0E',
      stroke: '#282E39',
    });

    // Horizontal grille slats
    for (let gy = grilleBottom + 3; gy < grilleTop; gy += 3.5) {
      const gStart = proj(cabFrontX - 2, gy, cabZ + 8);
      const gEnd = proj(cabFrontX - 2, gy, nearCabZ - 8);
      ctx.beginPath();
      ctx.moveTo(gStart.x, gStart.y);
      ctx.lineTo(gEnd.x, gEnd.y);
      ctx.strokeStyle = '#050608';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Dual Composite Headlights & Amber Turn Markers
    // Near headlight (facing camera)
    drawPrism(cabFrontX - 2.5, 4, nearCabZ - 7, 2.5, 12, 6, {
      top: '#3E4452',
      right: '#282C35',
      front: 'rgba(255, 255, 255, 0.85)',
      stroke: '#38BDF8',
    });
    const amberNear = proj(cabFrontX - 2.5, 14, nearCabZ - 2);
    ctx.beginPath();
    ctx.arc(amberNear.x, amberNear.y, Math.max(2, scale * 1.5), 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();

    // Far headlight
    drawPrism(cabFrontX - 2.5, 4, cabZ + 1, 2.5, 12, 6, {
      top: '#3E4452',
      right: '#282C35',
      front: 'rgba(255, 255, 255, 0.85)',
      stroke: '#38BDF8',
    });
    const amberFar = proj(cabFrontX - 2.5, 14, cabZ + 1);
    ctx.beginPath();
    ctx.arc(amberFar.x, amberFar.y, Math.max(2, scale * 1.5), 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();

    // Heavy-Duty Wrap-Around Commercial Front Bumper (X = cabFrontX - 6)
    drawPrism(cabFrontX - 6, chassisDropY - 4, cabZ - 2, 6, 16, cabWidth + 4, {
      top: '#2B2F38',
      right: '#1B1E24',
      front: '#101216',
      stroke: '#3B4352',
      lineWidth: 1.2,
    });

    // 7. Aerodynamic Cab-Over Wind Deflector (Mom's Attic Transition)
    const fairingTopY = truck.hasAttic ? truckH - (truck.attic?.height || 30) : Math.min(cabRoofY + 28, truckH);
    if (fairingTopY > cabRoofY) {
      const fTopNear = proj(0, fairingTopY, nearCabZ);
      const fTopFar = proj(0, fairingTopY, cabZ);
      const fRoofFar = proj(cabRoofX, cabRoofY, cabZ);
      const fRoofNear = proj(cabRoofX, cabRoofY, nearCabZ);

      // Curved sloped fairing surface
      ctx.beginPath();
      ctx.moveTo(fRoofFar.x, fRoofFar.y);
      ctx.lineTo(fRoofNear.x, fRoofNear.y);
      ctx.lineTo(fTopNear.x, fTopNear.y);
      ctx.lineTo(fTopFar.x, fTopFar.y);
      ctx.closePath();
      ctx.fillStyle = '#282C36';
      ctx.fill();
      ctx.strokeStyle = '#383F4E';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Near-side aerodynamic fairing triangular flank
      const fBaseNear = proj(0, cabRoofY, nearCabZ);
      ctx.beginPath();
      ctx.moveTo(fRoofNear.x, fRoofNear.y);
      ctx.lineTo(fTopNear.x, fTopNear.y);
      ctx.lineTo(fBaseNear.x, fBaseNear.y);
      ctx.closePath();
      ctx.fillStyle = '#1D2027';
      ctx.fill();
      ctx.strokeStyle = '#313745';
      ctx.stroke();
    }

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

      // Block Monospace/Sans Label
      const topCenterX = (v4.x + v5.x + v6.x + v7.x) / 4;
      const topCenterY = (v4.y + v5.y + v6.y + v7.y) / 4;

      const projectedWidth = Math.abs(v6.x - v4.x);
      if (projectedWidth > 26) {
        ctx.save();
        const fontSize = Math.max(9, Math.min(12, Math.floor(projectedWidth / 7.5)));
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
    // STAGE 8: VISIBLE NEAR-SIDE WHEELS (Z = truckW, Camera-Facing)
    // Anchored strictly at Y <= 0 under flared commercial wheel arches
    // =========================================================================
    const drawCommercialWheel = (axleX: number) => {
      const wheelRadius = 15.5;
      const wheelWidth = 8;
      const centerY = -18.5; // Axle centerline below cargo floor
      const segments = 28;

      const outerPts: Point2D[] = [];
      const innerPts: Point2D[] = [];

      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const wx = axleX + wheelRadius * Math.cos(theta);
        const wy = centerY + wheelRadius * Math.sin(theta);
        outerPts.push(proj(wx, wy, truckW));
        innerPts.push(proj(wx, wy, truckW - wheelWidth));
      }

      // Dark Inner Splash Guard / Wheel Well Liner
      const fenderArchL = proj(axleX - 21, 0, truckW);
      const fenderArchPeak = proj(axleX, 5, truckW);
      const fenderArchR = proj(axleX + 21, 0, truckW);

      ctx.beginPath();
      ctx.moveTo(fenderArchL.x, fenderArchL.y);
      ctx.quadraticCurveTo(fenderArchPeak.x, fenderArchPeak.y, fenderArchR.x, fenderArchR.y);
      ctx.lineTo(fenderArchR.x, fenderArchR.y + 12 * scale);
      ctx.lineTo(fenderArchL.x, fenderArchL.y + 12 * scale);
      ctx.closePath();
      ctx.fillStyle = '#090A0D';
      ctx.fill();
      ctx.strokeStyle = '#272C38';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Tire Tread Sleeve (extrusion along Z)
      ctx.fillStyle = '#0C0D10';
      ctx.strokeStyle = '#17191F';
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

      // Outer Tire Face
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

      // Heavy-Duty Deep-Dish Commercial Steel Rim
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
      ctx.fillStyle = '#3F444E';
      ctx.fill();
      ctx.strokeStyle = '#272C38';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Recessed Center Hub Dust Cap
      const hubCenter = proj(axleX, centerY, truckW);
      ctx.beginPath();
      ctx.arc(hubCenter.x, hubCenter.y, Math.max(2, scale * 3.2), 0, Math.PI * 2);
      ctx.fillStyle = '#111317';
      ctx.fill();

      // 8-Lug Chrome Nut Pattern
      const boltRadius = rimRadius * 0.46;
      for (let b = 0; b < 8; b++) {
        const bTheta = (b / 8) * Math.PI * 2;
        const bx = axleX + boltRadius * Math.cos(bTheta);
        const by = centerY + boltRadius * Math.sin(bTheta);
        const bp = proj(bx, by, truckW);

        ctx.beginPath();
        ctx.arc(bp.x, bp.y, Math.max(1, scale * 0.9), 0, Math.PI * 2);
        ctx.fillStyle = '#E4E4E7';
        ctx.fill();
      }
    };

    drawCommercialWheel(frontAxleX);
    for (const rAxle of rearAxles) {
      drawCommercialWheel(rAxle);
    }

    // =========================================================================
    // ARCHITECTURAL DIMENSION CALLOUTS (CAD Blueprint Floating Badges)
    // Placed strictly outside the vehicle envelope to prevent any intersection
    // =========================================================================
    const drawDimensionCallout = (
      p1: { x: number; y: number; z: number },
      p2: { x: number; y: number; z: number },
      offset: { x: number; y: number; z: number },
      label: string,
      valueText: string
    ) => {
      const p1Offset = { x: p1.x + offset.x, y: p1.y + offset.y, z: p1.z + offset.z };
      const p2Offset = { x: p2.x + offset.x, y: p2.y + offset.y, z: p2.z + offset.z };

      const v1 = proj(p1.x, p1.y, p1.z);
      const v2 = proj(p2.x, p2.y, p2.z);
      const o1 = proj(p1Offset.x, p1Offset.y, p1Offset.z);
      const o2 = proj(p2Offset.x, p2Offset.y, p2Offset.z);

      ctx.save();

      // 1. Dashed Extension / Witness Lines from truck features to dimension line
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);

      ctx.beginPath();
      ctx.moveTo(v1.x, v1.y);
      ctx.lineTo(o1.x, o1.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(v2.x, v2.y);
      ctx.lineTo(o2.x, o2.y);
      ctx.stroke();

      ctx.setLineDash([]);

      // 2. Main Dimension Line
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(o1.x, o1.y);
      ctx.lineTo(o2.x, o2.y);
      ctx.stroke();

      // 3. 45-Degree Architectural Tick Marks
      const tick = Math.max(3, Math.min(5, scale * 3.5));
      const drawTickMark = (pt: Point2D) => {
        ctx.beginPath();
        ctx.moveTo(pt.x - tick, pt.y + tick);
        ctx.lineTo(pt.x + tick, pt.y - tick);
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      };
      drawTickMark(o1);
      drawTickMark(o2);

      // 4. Center Floating Pill Badge
      const midX = (o1.x + o2.x) / 2;
      const midY = (o1.y + o2.y) / 2;

      ctx.font = '600 10px var(--font-sans), sans-serif';
      const badgeText = `${label} • ${valueText}`;
      const textWidth = ctx.measureText(badgeText).width;
      const pillW = textWidth + 16;
      const pillH = 20;

      // Opaque dark background
      ctx.fillStyle = '#090A0D';
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        ctx.roundRect(midX - pillW / 2, midY - pillH / 2, pillW, pillH, 4);
      } else {
        ctx.rect(midX - pillW / 2, midY - pillH / 2, pillW, pillH);
      }
      ctx.fill();

      // Subtle cyan border
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Text readout
      ctx.fillStyle = '#F8F9FA';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, midX, midY + 0.5);

      ctx.restore();
    };

    // 1. Cargo Box Length (placed above top roof rail in open background)
    drawDimensionCallout(
      { x: 0, y: truckH, z: 0 },
      { x: truckL, y: truckH, z: 0 },
      { x: 0, y: 20, z: -20 },
      'LENGTH',
      `${truck.length}″ (${(truck.length / 12).toFixed(1)}′)`
    );

    // 2. Cargo Box Height (placed behind rear roll-up door post in open space)
    drawDimensionCallout(
      { x: truckL, y: 0, z: 0 },
      { x: truckL, y: truckH, z: 0 },
      { x: 22, y: 0, z: -22 },
      'HEIGHT',
      `${truck.height}″ (${(truck.height / 12).toFixed(1)}′)`
    );

    // 3. Cargo Box Deck Width (placed extending rearward across roll-up door opening)
    drawDimensionCallout(
      { x: truckL, y: 0, z: 0 },
      { x: truckL, y: 0, z: truckW },
      { x: 28, y: -4, z: 0 },
      'WIDTH',
      `${truck.width}″ (${(truck.width / 12).toFixed(1)}′)`
    );
  }, [truck, blocks, selectedBlockId, hoveredBlock, dimensions, userScale, panOffset]);

  useEffect(() => {
    render();
  }, [render]);

  // =========================================================================
  // CAMERA INTERACTIONS: NATIVE WHEEL ZOOM (Strictly Prevents Page Scrolling)
  // Attached directly to canvas DOM element with { passive: false }
  // When cursor is inside the canvas, zoom in/out only.
  // When cursor is outside, the page scrolls normally.
  // =========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onNativeWheel = (e: WheelEvent) => {
      // Strictly prevent browser page scrolling while cursor is inside canvas
      e.preventDefault();
      e.stopPropagation();

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Handle wheel and trackpad pinch
      const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const currentScale = userScaleRef.current;
      const newScale = Math.max(0.4, Math.min(3.5, currentScale * zoomFactor));

      if (newScale === currentScale) return;

      const { baseScale, midX, midY } = baseMetricsRef.current;
      const currentWorldScale = baseScale * currentScale;
      const nextWorldScale = baseScale * newScale;

      const currentPan = panOffsetRef.current;
      const currentOffsetX = dimensions.width / 2 - midX * currentWorldScale + currentPan.x;
      const currentOffsetY = dimensions.height / 2 - midY * currentWorldScale + 15 + currentPan.y;

      // Preserve focal point under mouse
      const ratio = nextWorldScale / currentWorldScale;
      const nextOffsetX = mouseX - (mouseX - currentOffsetX) * ratio;
      const nextOffsetY = mouseY - (mouseY - currentOffsetY) * ratio;

      const nextPanX = nextOffsetX - (dimensions.width / 2 - midX * nextWorldScale);
      const nextPanY = nextOffsetY - (dimensions.height / 2 - midY * nextWorldScale + 15);

      userScaleRef.current = newScale;
      panOffsetRef.current = { x: nextPanX, y: nextPanY };

      setUserScale(newScale);
      setPanOffset({ x: nextPanX, y: nextPanY });
    };

    canvas.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', onNativeWheel);
    };
  }, [dimensions]);

  // =========================================================================
  // CAMERA INTERACTIONS: MOUSE DRAG PANNING & CLICK DETECTION
  // =========================================================================
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mousePoint: Point2D = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    setMousePos(mousePoint);

    if (isDragging) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasDraggedRef.current = true;
      }

      setPanOffset((prev) => {
        const next = {
          x: prev.x + dx,
          y: prev.y + dy,
        };
        panOffsetRef.current = next;
        return next;
      });

      dragStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Raycast hit-test against depth-sorted projected faces
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

  const handleMouseUp = () => {
    if (!hasDraggedRef.current) {
      if (onSelectBlock) {
        onSelectBlock(hoveredBlock);
      }
    }
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredBlock(null);
    setMousePos(null);
  };

  // Reset Camera View
  const handleResetCamera = () => {
    userScaleRef.current = 1.0;
    panOffsetRef.current = { x: 0, y: 0 };
    setUserScale(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setUserScale((prev) => {
      const next = Math.min(3.5, prev * 1.25);
      userScaleRef.current = next;
      return next;
    });
  };

  const handleZoomOut = () => {
    setUserScale((prev) => {
      const next = Math.max(0.4, prev / 1.25);
      userScaleRef.current = next;
      return next;
    });
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[440px] bg-[#090A0C] overflow-hidden select-none overscroll-contain touch-none ${className}`}
      style={{ overscrollBehavior: 'contain', touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ overscrollBehavior: 'contain', touchAction: 'none' }}
        className={`w-full h-full block overscroll-contain touch-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      />

      {/* Floating Interactive Camera Controls HUD */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-[#111318]/90 p-1 rounded-md border border-[#1F242F] backdrop-blur-md text-zinc-300">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-1 rounded-md hover:bg-[#1F242F] hover:text-white transition-colors"
          title="Zoom In (or Scroll Up)"
        >
          <ZoomIn className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1 rounded-md hover:bg-[#1F242F] hover:text-white transition-colors"
          title="Zoom Out (or Scroll Down)"
        >
          <ZoomOut className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>

        <div className="w-[1px] h-3.5 bg-[#1F242F] mx-0.5" />

        <button
          type="button"
          onClick={handleResetCamera}
          className="p-1 rounded-md hover:bg-[#1F242F] hover:text-white transition-colors"
          title="Reset Camera Framing"
        >
          <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>

        <div className="px-1.5 text-[11px] font-mono text-zinc-400 tabular-nums">
          {Math.round(userScale * 100)}%
        </div>
      </div>

      {/* Dimensional Tooltip HUD */}
      {hoveredBlock && mousePos && !isDragging && (
        <div
          className="absolute pointer-events-none z-30 px-3 py-2 bg-[#111318]/95 border border-[#0066FF] backdrop-blur-md rounded-md text-xs font-sans transition-transform duration-75 text-white"
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
        <div className="text-[11px] text-zinc-500 px-1 tabular-nums flex items-center gap-1.5">
          <Move className="w-3 h-3 text-[#0066FF]" />
          <span>Click & drag to pan • Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}
