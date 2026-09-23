import { Component, Suspense, lazy, useState, type ReactNode } from 'react'

const BallScene = lazy(() => import('./BallScene').then((m) => ({ default: m.BallScene })))

class WebGLBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}

function GradientFallback() {
  return (
    <div
      className="h-full w-full opacity-60"
      style={{
        background:
          'radial-gradient(circle at 50% 45%, rgba(226,98,44,0.35), transparent 60%), radial-gradient(circle at 60% 60%, rgba(79,157,116,0.25), transparent 55%)',
      }}
    />
  )
}

export function Hero3D({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className={className}>
      {failed ? (
        <GradientFallback />
      ) : (
        <WebGLBoundary fallback={<GradientFallback />}>
          <Suspense fallback={<GradientFallback />}>
            <BallScene className="h-full w-full" onFailed={() => setFailed(true)} />
          </Suspense>
        </WebGLBoundary>
      )}
    </div>
  )
}
