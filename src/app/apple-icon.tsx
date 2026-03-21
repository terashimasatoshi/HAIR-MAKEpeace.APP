import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4A7C59, #5a9469)',
          color: 'white',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        <div style={{ fontSize: 14, letterSpacing: '4px', opacity: 0.8 }}>HAIR&MAKE</div>
        <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: '2px' }}>peace</div>
      </div>
    ),
    { ...size }
  );
}
