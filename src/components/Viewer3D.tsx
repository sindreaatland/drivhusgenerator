import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Edges, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { STUD_D, STUD_W, WALL_H, braceEnds, gableStudTops, studSpan, type Model } from '../model';

// Akser: X langs lengden (0..L), Y opp, Z langs bredden (0..W).
type V3 = [number, number, number];
type Quat = [number, number, number, number];
type BeamKind = 'wood' | 'steel';

interface BeamSpec {
  size: V3;
  position: V3;
  quat?: Quat;
  kind?: BeamKind;
}

const EDGE: Record<BeamKind, string> = { wood: '#6b4a1c', steel: '#374151' };
const IDENTITY: Quat = [0, 0, 0, 1];

const quatX = (a: number): Quat => new THREE.Quaternion().setFromEuler(new THREE.Euler(a, 0, 0)).toArray() as Quat;

/** Boks med lengden langs p1→p2, tykkelse t langs normalen n og bredde w i planet. */
function diagonal(p1: V3, p2: V3, n: V3, t: number, w: number, kind: BeamKind): BeamSpec {
  const a = new THREE.Vector3(...p1);
  const b = new THREE.Vector3(...p2);
  const u = b.clone().sub(a);
  const len = u.length();
  u.normalize();
  const nn = new THREE.Vector3(...n).normalize();
  const v = u.clone().cross(nn);
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(u, nn, v));
  const c = a.clone().add(b).multiplyScalar(0.5);
  return { size: [len, t, w], position: [c.x, c.y, c.z], quat: q.toArray() as Quat, kind };
}

function Beam({ size, position, quat = IDENTITY, kind = 'wood', material }: BeamSpec & { material: THREE.Material }) {
  return (
    <mesh position={position} quaternion={quat} material={material}>
      <boxGeometry args={size} />
      <Edges color={EDGE[kind]} />
    </mesh>
  );
}

function beams(m: Model): BeamSpec[] {
  const { W, L, ridge, nW, nL, halfW, rise, slopeLen, angle, tv } = m;
  const out: BeamSpec[] = [];

  // Bunnsviller (ligger flatt) og toppsviller på langveggene
  out.push({ size: [L, STUD_W, STUD_D], position: [L / 2, STUD_W / 2, STUD_D / 2] });
  out.push({ size: [L, STUD_W, STUD_D], position: [L / 2, STUD_W / 2, W - STUD_D / 2] });
  out.push({ size: [STUD_D, STUD_W, W - 2 * STUD_D], position: [STUD_D / 2, STUD_W / 2, W / 2] });
  out.push({ size: [STUD_D, STUD_W, W - 2 * STUD_D], position: [L - STUD_D / 2, STUD_W / 2, W / 2] });
  out.push({ size: [L, STUD_W, STUD_D], position: [L / 2, WALL_H - STUD_W / 2, STUD_D / 2] });
  out.push({ size: [L, STUD_W, STUD_D], position: [L / 2, WALL_H - STUD_W / 2, W - STUD_D / 2] });

  // Stendere langvegger
  const sh = WALL_H - 2 * STUD_W;
  for (let i = 0; i <= nL; i++) {
    const [x0, x1] = studSpan(i, nL, L);
    const cx = (x0 + x1) / 2;
    out.push({ size: [STUD_W, sh, STUD_D], position: [cx, STUD_W + sh / 2, STUD_D / 2] });
    out.push({ size: [STUD_W, sh, STUD_D], position: [cx, STUD_W + sh / 2, W - STUD_D / 2] });
  }

  // Stendere gavler (opp til underkant sperre)
  for (let j = 1; j < nW; j++) {
    const [z0, z1] = studSpan(j, nW, W);
    const cz = (z0 + z1) / 2;
    const h = Math.min(...gableStudTops(m, z0, z1)) - STUD_W;
    out.push({ size: [STUD_D, h, STUD_W], position: [STUD_D / 2, STUD_W + h / 2, cz] });
    out.push({ size: [STUD_D, h, STUD_W], position: [L - STUD_D / 2, STUD_W + h / 2, cz] });
  }

  // Mønebjelke
  out.push({ size: [L, STUD_D, STUD_W], position: [L / 2, ridge - tv - STUD_D / 2, halfW] });

  // Sperrer c/c 60, overkant følger taklinjen fra (z=0, y=210) til (z=W/2, y=mønehøyde)
  const dz = halfW / slopeLen;
  const dy = rise / slopeLen;
  const my = (WALL_H + ridge) / 2;
  const mz = halfW / 2;
  for (let i = 0; i <= nL; i++) {
    const [x0, x1] = studSpan(i, nL, L);
    const cx = (x0 + x1) / 2;
    out.push({ size: [STUD_W, STUD_D, slopeLen], position: [cx, my - (dz * STUD_D) / 2, mz + (dy * STUD_D) / 2], quat: quatX(-angle) });
    out.push({ size: [STUD_W, STUD_D, slopeLen], position: [cx, my - (dz * STUD_D) / 2, W - mz - (dy * STUD_D) / 2], quat: quatX(angle) });
  }

  // Vindavstivning. Skråstag felles inn fra innsiden av stendere og sperrer; stålbånd spikres på innsiden/undersiden.
  if (m.bracing !== 'ingen') {
    const kind: BeamKind = m.bracing === 'stal' ? 'steel' : 'wood';
    const { braceW: w, braceT: t } = m;
    const inset = m.bracing === 'stal' ? STUD_D + t / 2 : STUD_D - t / 2; // senter målt fra veggens utside
    for (const br of m.wallBracesLong) {
      const [[xa, ya], [xb, yb]] = braceEnds(br, w);
      out.push(diagonal([xa, ya, inset], [xb, yb, inset], [0, 0, 1], t, w, kind));
      out.push(diagonal([xa, ya, W - inset], [xb, yb, W - inset], [0, 0, -1], t, w, kind));
    }
    for (const br of m.wallBracesGable) {
      const [[za, ya], [zb, yb]] = braceEnds(br, w);
      out.push(diagonal([inset, ya, za], [inset, yb, zb], [1, 0, 0], t, w, kind));
      out.push(diagonal([L - inset, ya, za], [L - inset, yb, zb], [-1, 0, 0], t, w, kind));
    }
    // Takplanet: (x, s) med s langs takfallet fra raften, senter roofBraceDepth under overkant tak
    const d = m.roofBraceDepth;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const roofPt = (x: number, s: number, far: boolean): V3 => {
      const z = s * cos + d * sin;
      return [x, WALL_H + s * sin - d * cos, far ? W - z : z];
    };
    for (const br of m.roofBraces) {
      const [[xa, sa], [xb, sb]] = braceEnds(br, w);
      out.push(diagonal(roofPt(xa, sa, false), roofPt(xb, sb, false), [0, cos, -sin], t, w, kind));
      out.push(diagonal(roofPt(xa, sa, true), roofPt(xb, sb, true), [0, cos, sin], t, w, kind));
    }
  }
  return out;
}

// Spisebord midt i drivhuset som størrelsesreferanse (cm).
const TABLE_L = 240; // langs lengden (X)
const TABLE_W = 90; // langs bredden (Z)
const TABLE_H = 75;
const TABLE_TOP = 3;
const TABLE_LEG = 6;
const TABLE_LEG_INSET = 15;

function DiningTable({ m }: { m: Model }) {
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8d6e4a', roughness: 0.8 }), []);
  const cx = m.L / 2;
  const cz = m.W / 2;
  const legH = TABLE_H - TABLE_TOP;
  const legs: V3[] = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      legs.push([cx + sx * (TABLE_L / 2 - TABLE_LEG_INSET), legH / 2, cz + sz * (TABLE_W / 2 - TABLE_LEG_INSET)]);
    }
  }
  return (
    <group>
      <mesh position={[cx, TABLE_H - TABLE_TOP / 2, cz]} material={material}>
        <boxGeometry args={[TABLE_L, TABLE_TOP, TABLE_W]} />
        <Edges color="#5a4230" />
      </mesh>
      {legs.map((p, i) => (
        <mesh key={i} position={p} material={material}>
          <boxGeometry args={[TABLE_LEG, legH, TABLE_LEG]} />
          <Edges color="#5a4230" />
        </mesh>
      ))}
    </group>
  );
}

function Greenhouse({ m }: { m: Model }) {
  const { W, L, ridge, halfW, rise, slopeLen, angle } = m;
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d8b47a', roughness: 0.85 }), []);
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: '#9ca3af', metalness: 0.6, roughness: 0.4 }), []);
  const glass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#8ec5ea', transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false, roughness: 0.1 }),
    [],
  );
  const gableShape = useMemo(() => {
    const pts: [number, number][] = [[0, 0], [W, 0], [W, WALL_H], [halfW, ridge], [0, WALL_H]];
    return new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  }, [W, halfW, ridge]);
  const gridPositions = useMemo(() => {
    const pts: number[] = [];
    for (let x = -120; x <= L + 120; x += 60) pts.push(x, 0, -120, x, 0, W + 120);
    for (let z = -120; z <= W + 120; z += 60) pts.push(-120, 0, z, L + 120, 0, z);
    return new Float32Array(pts);
  }, [L, W]);

  const dz = halfW / slopeLen;
  const dy = rise / slopeLen;
  const my = (WALL_H + ridge) / 2;
  const mz = halfW / 2;
  const specs = beams(m);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[L / 2, -0.5, W / 2]}>
        <planeGeometry args={[L + 400, W + 400]} />
        <meshBasicMaterial color="#f7f9fb" />
      </mesh>
      <lineSegments key={`grid-${L}-${W}`}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[gridPositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#c7cfd9" />
      </lineSegments>

      {specs.map((b, i) => (
        <Beam key={i} {...b} material={b.kind === 'steel' ? steel : wood} />
      ))}

      {/* Glass: langvegger, gavler og tak */}
      <mesh position={[L / 2, WALL_H / 2, -0.3]} material={glass}>
        <planeGeometry args={[L, WALL_H]} />
      </mesh>
      <mesh position={[L / 2, WALL_H / 2, W + 0.3]} material={glass}>
        <planeGeometry args={[L, WALL_H]} />
      </mesh>
      <mesh position={[-0.3, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={glass}>
        <shapeGeometry args={[gableShape]} />
      </mesh>
      <mesh position={[L + 0.3, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={glass}>
        <shapeGeometry args={[gableShape]} />
      </mesh>
      <mesh position={[L / 2, my + dz * 0.4, mz - dy * 0.4]} rotation={[-angle, 0, 0]} material={glass}>
        <boxGeometry args={[L, 0.4, slopeLen]} />
      </mesh>
      <mesh position={[L / 2, my + dz * 0.4, W - mz + dy * 0.4]} rotation={[angle, 0, 0]} material={glass}>
        <boxGeometry args={[L, 0.4, slopeLen]} />
      </mesh>
    </group>
  );
}

interface ControlsLike {
  target: THREE.Vector3;
  update: () => void;
}

const DEFAULT_DIR = new THREE.Vector3(0.7, 0.45, 0.85).normalize();

/** Plasserer kameraet rundt drivhuset og beholder brukerens synsretning når målene endres. */
function Framer({ target, dist }: { target: V3; dist: number }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as ControlsLike | null;
  const invalidate = useThree((s) => s.invalidate);
  const last = useRef<THREE.Vector3 | null>(null);
  const [tx, ty, tz] = target;

  useEffect(() => {
    const t = new THREE.Vector3(tx, ty, tz);
    const dir = last.current ? camera.position.clone().sub(last.current).normalize() : DEFAULT_DIR.clone();
    camera.position.copy(t).addScaledVector(dir, dist);
    camera.lookAt(t);
    if (controls) {
      controls.target.copy(t);
      controls.update();
    }
    last.current = t;
    invalidate();
  }, [camera, controls, invalidate, tx, ty, tz, dist]);

  return null;
}

export function Viewer3D({ m }: { m: Model }) {
  const dist = Math.max(m.L, m.W, m.ridge) * 1.3 + 250;
  return (
    <div className="viewer">
      <Canvas frameloop="demand" dpr={[1, 2]} camera={{ fov: 40, near: 1, far: 30000, position: [800, 500, 900] }}>
        <color attach="background" args={['#eef2f7']} />
        <hemisphereLight args={['#ffffff', '#8a7a5a', 2.2]} />
        <directionalLight position={[1500, 3000, 2000]} intensity={2} />
        <Greenhouse m={m} />
        <DiningTable m={m} />
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.02} />
        <Framer target={[m.L / 2, m.ridge / 2, m.W / 2]} dist={dist} />
      </Canvas>
    </div>
  );
}
