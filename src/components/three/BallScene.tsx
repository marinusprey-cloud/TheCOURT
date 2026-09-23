import { Float } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function CourtLines() {
  const group = useRef<THREE.Group>(null)
  const reduced = useMemo(prefersReducedMotion, [])
  const { pointer } = useThree()
  const tilt = useRef({ x: 0, y: 0 })
  const spin = useRef(0)

  useFrame((_, delta) => {
    if (!group.current) return
    tilt.current.x = THREE.MathUtils.lerp(tilt.current.x, pointer.y * 0.22, 0.04)
    tilt.current.y = THREE.MathUtils.lerp(tilt.current.y, pointer.x * 0.32, 0.04)
    spin.current += (reduced ? 0.02 : 0.12) * delta
    group.current.rotation.x = tilt.current.x
    group.current.rotation.y = spin.current + tilt.current.y
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, tilt.current.y * 0.06, 0.04)
  })

  return (
    <group ref={group}>
      <Float speed={reduced ? 0 : 1.1} rotationIntensity={reduced ? 0 : 0.25} floatIntensity={reduced ? 0 : 0.6}>
        <mesh>
          <icosahedronGeometry args={[1.55, 1]} />
          <meshStandardMaterial
            color="#e2622c"
            wireframe
            emissive="#e2622c"
            emissiveIntensity={0.35}
            roughness={0.4}
            metalness={0.2}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[2.35, 0.008, 8, 96]} />
          <meshStandardMaterial color="#4f9d74" emissive="#4f9d74" emissiveIntensity={0.6} />
        </mesh>
        <mesh rotation={[Math.PI / 2.4, 0.6, 0]}>
          <torusGeometry args={[2.75, 0.006, 8, 96]} />
          <meshStandardMaterial color="#f5f3ef" emissive="#f5f3ef" emissiveIntensity={0.15} transparent opacity={0.3} />
        </mesh>
      </Float>
    </group>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[4, 3, 5]} intensity={40} color="#e2622c" />
      <pointLight position={[-5, -2, -3]} intensity={25} color="#4f9d74" />
      <CourtLines />
    </>
  )
}

export function BallScene({ className, onFailed }: { className?: string; onFailed?: () => void }) {
  const [ready, setReady] = useState(false)
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        onCreated={({ gl }) => {
          setReady(true)
          gl.domElement.addEventListener(
            'webglcontextlost',
            (e) => {
              e.preventDefault()
              onFailed?.()
            },
            { once: true },
          )
        }}
        style={{ opacity: ready ? 1 : 0, transition: 'opacity 1.2s ease' }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}
