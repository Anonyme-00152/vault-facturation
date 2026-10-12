"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type VaultSceneProps = {
  /** Crans de déverrouillage (0 à 3) : la roue tourne d'un tiers de tour par étape. */
  step?: number;
  /** Échelle de la porte dans le cadre. */
  scale?: number;
  /** Décalage horizontal de la porte (unités de scène). */
  offsetX?: number;
  /** Progression du défilement (0 → 1) qui fait tourner la roue. */
  progressRef?: React.RefObject<number>;
  reducedMotion?: boolean;
  paused?: boolean;
};

const LIME = new THREE.Color("#d2ff00");

/** Reflets studio générés à la volée : aucune texture HDR téléchargée (CSP stricte). */
function StudioEnvironment() {
  const gl = useThree((state) => state.gl);
  const texture = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return environment;
  }, [gl]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <primitive object={texture} attach="environment" />;
}

/** Nuage de particules déterministe : même rendu d'une visite à l'autre. */
function createDust(count: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const violet = new THREE.Color("#8e7bff");
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (random() - 0.5) * 9;
    positions[i * 3 + 1] = (random() - 0.5) * 5;
    positions[i * 3 + 2] = (random() - 0.5) * 3 - 0.5;
    const color = random() > 0.82 ? LIME : violet;
    colors.set([color.r, color.g, color.b], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

/** Profil de la porte, révolutionné autour de son axe (rayon, profondeur). */
function useDoorGeometry() {
  return useMemo(() => {
    const profile = [
      [0.0, 0.3],
      [0.42, 0.3],
      [0.48, 0.24],
      [0.95, 0.2],
      [1.04, 0.26],
      [1.11, 0.33],
      [1.41, 0.33],
      [1.47, 0.27],
      [1.55, 0.24],
      [1.61, 0.17],
      [1.63, -0.2],
      [1.56, -0.27],
      [0.0, -0.27],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const geometry = new THREE.LatheGeometry(profile, 160);
    geometry.rotateX(Math.PI / 2);
    geometry.computeVertexNormals();
    return geometry;
  }, []);
}

function Rivets({ material }: { material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = 24;
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      matrix.setPosition(Math.cos(angle) * 1.26, Math.sin(angle) * 1.26, 0.335);
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} material={material}>
      <sphereGeometry args={[0.045, 16, 12]} />
    </instancedMesh>
  );
}

function Bolts({ material }: { material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = 10;
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const object = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.PI / count;
      object.position.set(Math.cos(angle) * 1.68, Math.sin(angle) * 1.68, -0.02);
      object.rotation.set(0, 0, angle - Math.PI / 2);
      object.updateMatrix();
      mesh.setMatrixAt(i, object.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} material={material}>
      <cylinderGeometry args={[0.07, 0.07, 0.22, 20]} />
    </instancedMesh>
  );
}

function Dust({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => createDust(160), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    if (!ref.current || reducedMotion) return;
    ref.current.rotation.y += delta * 0.015;
    ref.current.rotation.x += delta * 0.004;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.025}
        vertexColors
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function VaultDoor({
  step = 0,
  scale = 1,
  offsetX = 0,
  progressRef,
  reducedMotion = false,
}: VaultSceneProps) {
  const group = useRef<THREE.Group>(null);
  const wheel = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const doorGeometry = useDoorGeometry();

  const materials = useMemo(
    () => ({
      door: new THREE.MeshPhysicalMaterial({
        color: "#3d3470",
        metalness: 0.88,
        roughness: 0.3,
        iridescence: 1,
        iridescenceIOR: 1.55,
        iridescenceThicknessRange: [180, 640],
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        envMapIntensity: 1.35,
      }),
      chrome: new THREE.MeshPhysicalMaterial({
        color: "#dfe2f2",
        metalness: 1,
        roughness: 0.14,
        iridescence: 0.55,
        iridescenceIOR: 1.3,
        clearcoat: 0.6,
        envMapIntensity: 1.5,
      }),
      lime: new THREE.MeshBasicMaterial({ color: LIME, toneMapped: false }),
    }),
    [],
  );

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(
    () => () => {
      doorGeometry.dispose();
      Object.values(materials).forEach((material) => material.dispose());
    },
    [doorGeometry, materials],
  );

  useFrame((state, delta) => {
    const g = group.current;
    const w = wheel.current;
    if (!g || !w) return;
    const t = state.clock.elapsedTime;
    const damp = 1 - Math.exp(-delta * 3.2);

    const targetY = -0.42 + pointer.current.x * 0.28;
    const targetX = 0.16 + pointer.current.y * 0.18;
    g.rotation.y += (targetY - g.rotation.y) * damp;
    g.rotation.x += (targetX - g.rotation.x) * damp;
    if (!reducedMotion) g.position.y = Math.sin(t * 0.7) * 0.06;

    const progress = progressRef?.current ?? 0;
    const targetSpin = -(step * (Math.PI * 2)) / 3 - progress * Math.PI * 1.5 - (reducedMotion ? 0 : t * 0.12);
    w.rotation.z += (targetSpin - w.rotation.z) * (1 - Math.exp(-delta * 4));

    if (glow.current && !reducedMotion) {
      const pulse = 1 + Math.sin(t * 2.2) * 0.06;
      glow.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={group} scale={scale} position={[offsetX, 0, 0]}>
      <mesh geometry={doorGeometry} material={materials.door} />
      <Rivets material={materials.chrome} />
      <Bolts material={materials.chrome} />

      <group ref={wheel} position={[0, 0, 0.34]}>
        <mesh material={materials.chrome} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.24, 0.27, 0.16, 48]} />
        </mesh>
        <mesh material={materials.chrome} position={[0, 0, 0.08]}>
          <torusGeometry args={[0.66, 0.04, 20, 96]} />
        </mesh>
        {[0, 1, 2].map((i) => {
          const angle = Math.PI / 2 + (i * Math.PI * 2) / 3;
          return (
            <group key={i} rotation={[0, 0, angle]}>
              <mesh material={materials.chrome} position={[0.48, 0, 0.08]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.042, 0.05, 0.62, 20]} />
              </mesh>
              <mesh material={materials.chrome} position={[0.84, 0, 0.08]}>
                <sphereGeometry args={[0.09, 24, 16]} />
              </mesh>
            </group>
          );
        })}
        <mesh ref={glow} material={materials.lime} position={[0, 0, 0.09]}>
          <torusGeometry args={[0.15, 0.018, 12, 64]} />
        </mesh>
        <mesh material={materials.lime} position={[0, 0, 0.09]}>
          <circleGeometry args={[0.06, 32]} />
        </mesh>
      </group>
    </group>
  );
}

export default function VaultScene(props: VaultSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6.2], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={props.paused ? "never" : "always"}
      aria-hidden
    >
      <StudioEnvironment />
      <ambientLight intensity={0.15} />
      <directionalLight position={[-4, 3, 5]} intensity={2.4} color="#6f7bff" />
      <directionalLight position={[5, -2, 3]} intensity={1.8} color="#c06cff" />
      <pointLight position={[0, 0, 2]} intensity={1.4} distance={4} color="#d2ff00" />
      <VaultDoor {...props} />
      <Dust reducedMotion={Boolean(props.reducedMotion)} />
    </Canvas>
  );
}
