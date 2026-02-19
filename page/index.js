import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';

export default function TracerouteViz() {
  const [hops, setHops] = useState([]);
  const [isTracing, setIsTracing] = useState(false);
  const [target, setTarget] = useState('');
  const [maxHops, setMaxHops] = useState(100);

  const runTraceroute = useCallback(async () => {
    setIsTracing(true);
    setHops([]);
    
    try {
      const response = await fetch('/api/traceroute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, maxHops })
      });
      
      const data = await response.json();
      setHops(data.hops);
    } catch (error) {
      console.error('Traceroute failed:', error);
      setHops([{ hop: 0, ip: 'error', rtt: 0, status: 'FAILED' }]);
    } finally {
      setIsTracing(false);
    }
  }, [target, maxHops]);

  return (
    <>
      <Head>
        <title>HackerAI Traceroute - 100 Hop Topology</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <div className="traceroute-container">
        <video 
          className="background-video"
          autoPlay 
          loop 
          muted 
          playsInline
          webkit-playsinline="true"
        >
          <source src="/ca63eccfcf11bcd02c1a900196de630f_720w.mp4" type="video/mp4" />
        </video>
        
        <div className="overlay">
          <div className="header">
            <h1 className="title">🔥 HACKERAI TRACEROUTE</h1>
            <p className="subtitle">100-Hop Network Topology Mapper</p>
          </div>

          <div className="controls">
            <input
              type="text"
              placeholder="Target IP/Domain (ex: 8.8.8.8)"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="target-input"
              disabled={isTracing}
            />
            <input
              type="number"
              min="1"
              max="255"
              value={maxHops}
              onChange={(e) => setMaxHops(Number(e.target.value))}
              className="hops-input"
              disabled={isTracing}
            />
            <button 
              onClick={runTraceroute} 
              disabled={isTracing || !target}
              className="trace-btn"
            >
              {isTracing ? 'TRACING...' : 'LAUNCH TRACEROUTE'}
            </button>
          </div>

          <div className="topology-container">
            <Topology hops={hops} isTracing={isTracing} />
          </div>
        </div>
      </div>
    </>
  );
}

function Topology({ hops, isTracing }) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const resize = () => {
      const rect = document.querySelector('.topology-container')?.getBoundingClientRect();
      setDimensions({ width: rect?.width || 1200, height: rect?.height || 600 });
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const radius = Math.min(dimensions.width, dimensions.height) * 0.02;
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  const angleStep = (Math.PI * 2) / Math.max(hops.length, 10);

  return (
    <svg 
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} 
      className="topology-svg"
    >
      {/* Network lines */}
      {hops.slice(0, -1).map((hop, i) => {
        const angle1 = i * angleStep;
        const angle2 = (i + 1) * angleStep;
        const x1 = centerX + Math.cos(angle1) * (radius * 15 * i);
        const y1 = centerY + Math.sin(angle1) * (radius * 15 * i);
        const x2 = centerX + Math.cos(angle2) * (radius * 15 * (i + 1));
        const y2 = centerY + Math.sin(angle2) * (radius * 15 * (i + 1));
        
        return (
          <path
            key={i}
            d={`M ${x1} ${y1} L ${x2} ${y2}`}
            stroke={getHopColor(hop.status)}
            strokeWidth={3}
            strokeDasharray={isTracing && i >= hops.length - 1 ? '5,5' : 'none'}
            className="hop-line"
            opacity={0.8}
          />
        );
      })}

      {/* Hop nodes */}
      {hops.map((hop, i) => {
        const angle = i * angleStep;
        const distance = radius * 15 * Math.min(i + 1, 25);
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;

        return (
          <g key={i} className="hop-node">
            <circle
              cx={x}
              cy={y}
              r={radius * (hop.status === 'REACHABLE' ? 2.5 : 1.5)}
              fill={getHopColor(hop.status)}
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={2}
              className="node-circle"
            />
            <text
              x={x}
              y={y + radius * 0.5}
              textAnchor="middle"
              fill="white"
              fontSize={radius * 1.2}
              fontWeight="bold"
              className="node-label"
            >
              {hop.hop}
            </text>
            <foreignObject
              x={x - 60}
              y={y + radius * 2}
              width="120"
              height="40"
            >
              <div className="hop-info" style={{ color: getHopColor(hop.status) }}>
                {hop.ip} ({hop.rtt}ms)
              </div>
            </foreignObject>
          </g>
        );
      })}

      {/* Scanning animation */}
      {isTracing && (
        <>
          {Array.from({ length: 30 }, (_, i) => {
            const angle = (Date.now() * 0.01 + i * 0.5) % (Math.PI * 2);
            const distance = radius * 20 * i / 30;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={radius * 0.8}
                fill="rgba(0,255,255,0.6)"
                className="scan-particle"
              />
            );
          })}
        </>
      )}
    </svg>
  );
}

function getHopColor(status) {
  const colors = {
    'REACHABLE': '#00ff88',
    'UNREACHABLE': '#ff4444',
    'FAILED': '#ffaa00',
    'error': '#ff4444'
  };
  return colors[status] || '#888';
}