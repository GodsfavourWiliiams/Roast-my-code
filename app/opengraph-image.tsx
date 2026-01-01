import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Roast My Code - AI Code Reviewer'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          backgroundImage: 'radial-gradient(circle at 25px 25px, #27272a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #27272a 2%, transparent 0%)',
          backgroundSize: '100px 100px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          {/* Flame Icon */}
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.243-2.188.7-3.125a.5.5 0 0 1 .8 0z" />
          </svg>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 900,
              background: 'linear-gradient(to right, #f87171, #fb923c)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: 20,
              letterSpacing: '-0.05em',
            }}
          >
            Roast My Code
          </div>
          <div
            style={{
              fontSize: 32,
              color: '#a1a1aa',
              fontWeight: 500,
            }}
          >
            AI Code Reviewer with Attitude
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
