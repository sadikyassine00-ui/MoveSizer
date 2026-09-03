import { ImageResponse } from 'next/og';

export const alt = 'TruckSizer — Moving Truck Cargo Fit & Sizing Engine';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#090A0C',
          padding: 60,
          justifyContent: 'space-between',
          fontFamily: 'sans-serif',
          border: '12px solid #1F242F',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                backgroundColor: '#FF5500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: 26,
                fontWeight: 900,
              }}
            >
              T
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: 2,
                display: 'flex',
              }}
            >
              <span>TRUCK</span>
              <span style={{ color: '#FF5500' }}>SIZER</span>
            </div>
          </div>
          <div
            style={{
              padding: '8px 18px',
              borderRadius: 20,
              backgroundColor: '#111318',
              border: '1px solid #1F242F',
              color: '#10B981',
              fontSize: 16,
              fontWeight: 700,
              display: 'flex',
            }}
          >
            <span>18% REAL-WORLD SAFETY BUFFER INCLUDED</span>
          </div>
        </div>

        {/* Center content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.15,
              maxWidth: 950,
              display: 'flex',
            }}
          >
            Moving Truck Cargo Fit & 2.5D Visual Sizing Engine
          </div>
          <div
            style={{
              fontSize: 22,
              color: '#9CA3AF',
              maxWidth: 860,
              lineHeight: 1.4,
              display: 'flex',
            }}
          >
            Calculate exact truck size (10ft, 15ft, 20ft, 26ft), household box requirements, and visualize your cargo in 30° isometric cutaway.
          </div>
        </div>

        {/* Bottom feature badges */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              backgroundColor: '#111318',
              border: '1px solid #1F242F',
              color: '#F8F9FA',
              fontSize: 16,
              fontWeight: 600,
              display: 'flex',
            }}
          >
            2.5D Isometric Auto-Pack
          </div>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              backgroundColor: '#111318',
              border: '1px solid #1F242F',
              color: '#F8F9FA',
              fontSize: 16,
              fontWeight: 600,
              display: 'flex',
            }}
          >
            US Rental Fleet Specs (U-Haul / Budget / Penske)
          </div>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              backgroundColor: '#FF5500',
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 700,
              display: 'flex',
            }}
          >
            Instant Rate Comparison
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
