import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Points, PointMaterial } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

function seeded(i) {
  const x = Math.sin(i * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function WebMesh({ count, mouse }) {
  const pointsRef = useRef(null);
  const group = useRef(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 1.2 + seeded(i) * 6.4;
      const angle = seeded(i + 20) * Math.PI * 2;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = (seeded(i + 40) - 0.5) * 7;
      arr[i * 3 + 2] = Math.sin(angle) * radius * 0.7;
    }
    return arr;
  }, [count]);

  const lines = useMemo(() => {
    const result = [];
    for (let i = 0; i < count; i += 5) {
      const a = [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]];
      const j = (i + 7) % count;
      const b = [positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]];
      result.push([a, b]);
    }
    return result;
  }, [count, positions]);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.06 + mouse.x * 0.2;
      group.current.rotation.x = mouse.y * 0.12;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.z = state.clock.elapsedTime * 0.04;
    }
  });

  return (
    <group ref={group}>
      <Points ref={pointsRef} positions={positions} stride={3}>
        <PointMaterial transparent color="#f5c518" size={0.055} sizeAttenuation depthWrite={false} opacity={0.9} />
      </Points>
      {lines.map((line, index) => (
        <Line key={index} points={line} color={index % 3 ? "#e11d2e" : "#93c5fd"} lineWidth={0.8} transparent opacity={0.42} />
      ))}
    </group>
  );
}

export function ThreeBackground({ mouse }) {
  const { simplify } = useReducedMotion();
  const count = simplify ? 28 : 72;
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 9], fov: 50 }} dpr={[1, simplify ? 1 : 1.5]}>
        <color attach="background" args={["#071433"]} />
        <fog attach="fog" args={["#071433", 8, 18]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[4, 3, 4]} intensity={18} color="#e11d2e" />
        <pointLight position={[-4, -2, 2]} intensity={14} color="#f5c518" />
        <WebMesh count={count} mouse={mouse} />
      </Canvas>
    </div>
  );
}
