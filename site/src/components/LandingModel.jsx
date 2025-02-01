import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const OrbitalPaths = () => {
  const pathsRef = useRef();
  const materialRef = useRef();

  const fragmentShader = `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vec3 accent = vec3(0.831, 0.514, 0.067);
      vec3 secondary = vec3(0.412, 0.459, 0.396);
      
      float flow = fract(vUv.x - uTime * 0.2);
      float intensity = smoothstep(0.0, 0.2, flow) * smoothstep(1.0, 0.8, flow);
      
      float colorMix = sin(vPosition.x * 2.0 + uTime) * 0.5 + 0.5;
      vec3 color = mix(accent, secondary, colorMix);
      
      float glow = exp(-flow * 3.0) * 0.5;
      color = mix(color, accent, glow);
      
      float edgeFade = smoothstep(0.0, 0.1, intensity) * smoothstep(1.0, 0.9, intensity);
      
      gl_FragColor = vec4(color, edgeFade * 0.7);
    }
  `;

  const vertexShader = `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      
      vec3 pos = position;
      float displacement = sin(pos.x * 5.0 + uTime) * cos(pos.y * 5.0 + uTime) * 0.05;
      pos += normal * displacement;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    if (pathsRef.current) {
      pathsRef.current.rotation.y += 0.008;
      pathsRef.current.rotation.z += 0.005;
    }
  });

  const createOrbitalPath = (radius, height, turns) => {
    const points = [];
    const segments = 256;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2 * turns;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = Math.sin(t * Math.PI * 2) * height;
      points.push(new THREE.Vector3(x, y, z));
    }
    
    return new THREE.CatmullRomCurve3(points);
  };

  const createTubeGeometry = (curve) => {
    return new THREE.TubeGeometry(curve, 128, 0.015, 8, false);
  };

  const paths = [
    { radius: 0.7, height: 0.2, turns: 2, rotation: [0, 0, 0] },
    { radius: 0.8, height: 0.4, turns: 3.14, rotation: [0, Math.PI / 4, 0] },
    { radius: 0.5, height: 0.3, turns: 3, rotation: [Math.PI / 3, 0, 0] },
  ];

  return (
    <group ref={pathsRef}>
      {paths.map((path, index) => (
        <mesh key={index} rotation={path.rotation}>
          <primitive
            object={createTubeGeometry(
              createOrbitalPath(path.radius, path.height, path.turns)
            )}
          />
          <shaderMaterial
            ref={materialRef}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={{
              uTime: { value: 0 }
            }}
            transparent={true}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

const CoreParticle = () => {
  const coreRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    if (coreRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      coreRef.current.scale.set(1 + pulse, 1 + pulse, 1 + pulse);
    }
    if (glowRef.current) {
      const glowPulse = Math.sin(state.clock.elapsedTime * 2) * 0.15 + 1.15;
      glowRef.current.scale.set(glowPulse, glowPulse, glowPulse);
    }
  });

  return (
    <group>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshPhongMaterial
          color="#D48311"
          emissive="#D48311"
          emissiveIntensity={2}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshPhongMaterial
          color="#D48311"
          emissive="#D48311"
          emissiveIntensity={1.5}
          transparent
          opacity={0.4}
        />
      </mesh>
      
      <mesh>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshPhongMaterial
          color="#D48311"
          emissive="#D48311"
          emissiveIntensity={1}
          transparent
          opacity={0.2}
        />
      </mesh>
    </group>
  );
};

const LandingModel = () => {
  return (
    <div className="w-[80%] h-[80%] m-auto">
      <Canvas 
        camera={{ 
          position: [0, 0, 2.5], 
          fov: 50,
          near: 0.1,
          far: 1000
        }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        <group scale={1}>
          <CoreParticle />
          <OrbitalPaths />
        </group>
      </Canvas>
    </div>
  );
};

export default LandingModel;