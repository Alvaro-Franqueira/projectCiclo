import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';

// Dice face configurations - positions for the pips on each face
const diceFaces = {
  1: [[0, 0, 0]], // Center
  2: [[-0.3, -0.3, 0], [0.3, 0.3, 0]], // Diagonal
  3: [[-0.3, -0.3, 0], [0, 0, 0], [0.3, 0.3, 0]], // Diagonal with center
  4: [[-0.3, -0.3, 0], [-0.3, 0.3, 0], [0.3, -0.3, 0], [0.3, 0.3, 0]], // Four corners
  5: [[-0.3, -0.3, 0], [-0.3, 0.3, 0], [0, 0, 0], [0.3, -0.3, 0], [0.3, 0.3, 0]], // Four corners with center
  6: [[-0.3, -0.3, 0], [-0.3, 0, 0], [-0.3, 0.3, 0], [0.3, -0.3, 0], [0.3, 0, 0], [0.3, 0.3, 0]] // Two columns of three
};

// Standard dice have opposite faces sum to 7
// 1 is opposite to 6
// 2 is opposite to 5
// 3 is opposite to 4

// Simple die component with physics
function Die({ position, index, apiRef, meshRef, value = 1 }) {
  const [dieValue, setDieValue] = useState(value);
  
  // Update die value when prop changes
  useEffect(() => {
    setDieValue(value);
  }, [value]);

  const [ref, api] = useBox(() => ({
    mass: 1,
    position: position,
    args: [1, 1, 1], // Box dimensions (adjust size if needed)
    angularDamping: 0.5, // Helps settle rotation
    linearDamping: 0.5, // Helps settle movement
    sleepSpeedLimit: 0.1, 
    sleepTimeLimit: 1, 
  }));

  // Forward the physics api and mesh ref to the parent
  if (apiRef) apiRef(api);
  if (meshRef) meshRef(ref);

  // Basic material - white dice with black pips
  const materials = useMemo(() => {
    // Create materials for each face
    const mats = [];
    for (let i = 0; i < 6; i++) {
      mats.push(new THREE.MeshStandardMaterial({ 
        color: '#ffffff',
        roughness: 0.3,
        metalness: 0.2,
      }));
    }
    return mats;
  }, []);

  // Create geometry for pips (small black dots)
  const pipGeometry = useMemo(() => new THREE.SphereGeometry(0.08, 16, 16), []);
  const pipMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#000000' }), []);

  // Track rotation for determining which face is up
  const [rotation, setRotation] = useState([0, 0, 0]);
  
  useFrame(() => {
    if (ref.current) {
      const currentRotation = ref.current.rotation;
      setRotation([currentRotation.x, currentRotation.y, currentRotation.z]);
    }
  });

  // Function to render pips for a face
  const renderPips = (faceNumber) => {
    return diceFaces[faceNumber].map((pos, i) => (
      <mesh 
        key={`face${faceNumber}-pip-${i}`} 
        position={[pos[0], pos[1], 0]} 
        geometry={pipGeometry} 
        material={pipMaterial}
      />
    ));
  };

  return (
    <group>
      {/* Die cube */}
      <mesh 
        ref={ref} 
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.2} />
      </mesh>
      
      {/* Face 1 (Front) - shows 1 pip */}
      <group position={[0, 0, 0.51]} rotation={[0, 0, 0]}>
        {renderPips(1)}
      </group>
      
      {/* Face 2 (Back) - shows 6 pips (opposite to 1) */}
      <group position={[0, 0, -0.51]} rotation={[0, Math.PI, 0]}>
        {renderPips(6)}
      </group>
      
      {/* Face 3 (Right) - shows 3 pips */}
      <group position={[0.51, 0, 0]} rotation={[0, Math.PI/2, 0]}>
        {renderPips(3)}
      </group>
      
      {/* Face 4 (Left) - shows 4 pips (opposite to 3) */}
      <group position={[-0.51, 0, 0]} rotation={[0, -Math.PI/2, 0]}>
        {renderPips(4)}
      </group>
      
      {/* Face 5 (Top) - shows 2 pips */}
      <group position={[0, 0.51, 0]} rotation={[-Math.PI/2, 0, 0]}>
        {renderPips(2)}
      </group>
      
      {/* Face 6 (Bottom) - shows 5 pips (opposite to 2) */}
      <group position={[0, -0.51, 0]} rotation={[Math.PI/2, 0, 0]}>
        {renderPips(5)}
      </group>
    </group>
  );
}

export default React.memo(Die); // Memoize to prevent unnecessary re-renders
