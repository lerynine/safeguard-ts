import { useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Point {
  id: string;
  lat: number;
  lng: number;
}

interface Cluster {
  points: Point[];
  center: [number, number];
  radius: number;
  density: number;
  risk: 'High' | 'Medium' | 'Low';
}

interface RiskMapProps {
  reports: any[];
}

// Distance in km between two lat/lng points
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const dbscan = (points: Point[], eps: number, minPts: number) => {
  const clusters: Point[][] = [];
  const visited = new Set<string>();
  const noise = new Set<string>();

  const getNeighbors = (p: Point) => {
    return points.filter(other => getDistance(p.lat, p.lng, other.lat, other.lng) <= eps);
  };

  for (const point of points) {
    if (visited.has(point.id)) continue;
    visited.add(point.id);

    const neighbors = getNeighbors(point);
    if (neighbors.length < minPts) {
      noise.add(point.id);
    } else {
      const cluster: Point[] = [];
      clusters.push(cluster);
      expandCluster(point, neighbors, cluster, visited, getNeighbors, minPts);
    }
  }

  return clusters;
};

const expandCluster = (
  p: Point, 
  neighbors: Point[], 
  cluster: Point[], 
  visited: Set<string>,
  getNeighbors: (p: Point) => Point[],
  minPts: number
) => {
  cluster.push(p);

  const queue = [...neighbors];
  for (let i = 0; i < queue.length; i++) {
    const q = queue[i];
    if (!visited.has(q.id)) {
      visited.add(q.id);
      const qNeighbors = getNeighbors(q);
      if (qNeighbors.length >= minPts) {
        queue.push(...qNeighbors.filter(qn => !queue.some(exp => exp.id === qn.id)));
      }
    }
    if (!cluster.some(cp => cp.id === q.id)) {
      cluster.push(q);
    }
  }
};

const calculateHull = (points: Point[]) => {
  if (points.length === 0) return { center: [0, 0] as [number, number], radius: 0 };
  
  let totalLat = 0;
  let totalLng = 0;
  points.forEach(p => {
    totalLat += p.lat;
    totalLng += p.lng;
  });
  
  const center: [number, number] = [totalLat / points.length, totalLng / points.length];
  
  // Find max distance from center to include all points
  let maxDist = 0;
  points.forEach(p => {
    const dist = getDistance(center[0], center[1], p.lat, p.lng);
    if (dist > maxDist) maxDist = dist;
  });
  
  return { center, radius: Math.max(maxDist * 1000, 100) }; // Convert km to meters, min 100m
};

const SetMapBounds = ({ points, clusters }: { points: Point[], clusters: Cluster[] }) => {
  const map = useMap();
  
  useEffect(() => {
    // Prioritaskan titik yang masuk dalam cluster untuk penentuan fokus awal
    let targetPoints = points;
    if (clusters.length > 0) {
      const allClusterPoints = clusters.flatMap(c => c.points);
      if (allClusterPoints.length > 0) {
        targetPoints = allClusterPoints;
      }
    }

    if (targetPoints.length > 0) {
      const bounds = L.latLngBounds(targetPoints.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { 
        padding: [50, 50],
        maxZoom: 14 // Mencegah zoom terlalu dekat jika hanya ada satu titik/cluster kecil
      });
    }
  }, [points, clusters, map]);

  return null;
};

export default function RiskMap({ reports }: RiskMapProps) {
  const points: Point[] = useMemo(() => {
    return reports
      .filter(r => r.latitude && r.longitude)
      .map(r => ({
        id: r.id,
        lat: Number(r.latitude),
        lng: Number(r.longitude)
      }));
  }, [reports]);

  const clusters: Cluster[] = useMemo(() => {
    if (points.length === 0) return [];
    
    const eps = 1; // 1km
    const minPts = 3;
    const rawClusters = dbscan(points, eps, minPts);
    
    const processed = rawClusters.map(points => {
      const { center, radius } = calculateHull(points);
      return {
        points,
        center,
        radius,
        density: points.length,
        risk: 'Low' as any
      };
    });
    
    if (processed.length === 0) return [];
    
    const totalDensity = processed.reduce((sum, c) => sum + c.density, 0);
    const averageDensity = totalDensity / processed.length;
    
    return processed.map(c => {
      let risk: 'High' | 'Medium' | 'Low' = 'Low';
      if (c.density >= 1.5 * averageDensity) risk = 'High';
      else if (c.density >= averageDensity) risk = 'Medium';
      
      return { ...c, risk };
    });
  }, [points]);

  const getColor = (risk: string) => {
    switch (risk) {
      case 'High': return '#ef4444'; // red
      case 'Medium': return '#f59e0b'; // yellow
      case 'Low': return '#10b981'; // green
      default: return '#3b82f6';
    }
  };

  return (
    <MapWrapper className="glass-card">
      <MapHeader>
        <h3>Dynamic Risk Map</h3>
        <p>Distribusi kerawanan berdasarkan kepadatan laporan</p>
      </MapHeader>
      <MapContainer 
        center={[-0.5, 117]} 
        zoom={5} 
        style={{ height: '400px', width: '100%', borderRadius: '1rem' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {clusters.map((cluster, i) => (
          <Circle
            key={i}
            center={cluster.center}
            radius={cluster.radius}
            pathOptions={{ 
              color: getColor(cluster.risk),
              fillColor: getColor(cluster.risk),
              fillOpacity: 0.4
            }}
          >
            <Popup>
              <PopupContent>
                <h4>Cluster Kerawanan: {cluster.risk}</h4>
                <p><strong>Total Temuan:</strong> {cluster.density}</p>
                <p>Status area dengan kepadatan laporan {cluster.risk === 'High' ? 'Kritis' : cluster.risk === 'Medium' ? 'Waspada' : 'Normal'}.</p>
              </PopupContent>
            </Popup>
          </Circle>
        ))}
        <SetMapBounds points={points} clusters={clusters} />
      </MapContainer>
      <LegendRow>
        <LegendItem color="#ef4444"><span></span> Tinggi</LegendItem>
        <LegendItem color="#f59e0b"><span></span> Sedang</LegendItem>
        <LegendItem color="#10b981"><span></span> Rendah</LegendItem>
      </LegendRow>
    </MapWrapper>
  );
}

const MapWrapper = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 1.5rem;
  overflow: hidden;
`;

const MapHeader = styled.div`
  margin-bottom: 1rem;
  h3 {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }
  p {
    font-size: 0.8rem;
    opacity: 0.7;
  }
`;

const PopupContent = styled.div`
  h4 {
    margin: 0 0 0.5rem 0;
    font-weight: 700;
    color: #1e293b;
  }
  p {
    margin: 0.25rem 0;
    font-size: 0.85rem;
    color: #475569;
  }
`;

const LegendRow = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255,255,255,0.05);
`;

const LegendItem = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  
  span {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    background: ${props => props.color};
  }
`;
