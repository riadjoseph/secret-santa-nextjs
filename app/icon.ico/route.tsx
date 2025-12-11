import { ImageResponse } from 'next/og'

export async function GET() {
  // Create the same icon as in icon.tsx but in ICO format
  // Note: Next.js ImageResponse will automatically convert to appropriate format
  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        🎅
      </div>
    ),
    {
      width: 32,
      height: 32,
    }
  )

  // Get the image buffer
  const buffer = await imageResponse.arrayBuffer()

  // Return as ICO format
  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/x-icon',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
