// components/auth/LoginBackground.tsx

export function LoginBackground() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: '#F0EEFF',
      zIndex: 0, overflow: 'hidden',
      pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes orbPulse1 {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.7; }
          50%       { transform: scale(1.15) translate(-20px, 15px); opacity: 1; }
        }
        @keyframes orbPulse2 {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.5; }
          50%       { transform: scale(1.1) translate(15px, -20px); opacity: 0.8; }
        }
        @keyframes orbPulse3 {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.4; }
          50%       { transform: scale(1.2) translate(-10px, -15px); opacity: 0.7; }
        }
      `}</style>

      {/* Orbe violet — top left */}
      <div style={{
        position: 'absolute',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108, 40, 217, 0.38) 0%, transparent 70%)',
        top: '-80px', left: '-80px',
        animation: 'orbPulse3 7s ease-in-out infinite',
      }} />

      {/* Orbe citron — top left */}
      <div style={{
        position: 'absolute',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(198, 239, 35, 0.59) 0%, transparent 70%)',
        bottom: '180px', left: '90px',
        animation: 'orbPulse3 8s ease-in-out infinite',
      }} />

      {/* Orbe citron — bottom right */}
      <div style={{
        position: 'absolute',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(223, 250, 16, 0.62) 0%, transparent 70%)',
        bottom: '-60px', right: '-60px',
        animation: 'orbPulse2 8s ease-in-out infinite',
      }} />

      {/* Orbe lavande — center right */}
      <div style={{
        position: 'absolute',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(81, 10, 194, 0.43) 0%, transparent 70%)',
        top: '40%', right: '8%',
        animation: 'orbPulse3 9s ease-in-out infinite',
      }} />
    </div>
  )
}