import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  MapPin,
  Share2,
} from 'lucide-react';
import { ReportStatus } from '../constants/enums';
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";

// Fix for default marker icon in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const STATUS_CONFIG = {
  [ReportStatus.OPEN]: {
    color: 'amber',
    label: 'MENUNGGU',
    icon: AlertTriangle,
    border: 'rgba(251,191,36,0.3)',
    text: '#fbbf24',
  },
  [ReportStatus.IN_PROGRESS]: {
    color: 'indigo',
    label: 'DIPROSES',
    icon: Clock,
    border: 'rgba(99,102,241,0.3)',
    text: '#818cf8',
  },
  [ReportStatus.CLOSED]: {
    color: 'emerald',
    label: 'SELESAI',
    icon: CheckCircle2,
    border: 'rgba(16,185,129,0.3)',
    text: '#34d399',
  },
  default: {
    color: 'blue',
    label: 'Other',
    icon: ShieldAlert,
    border: 'rgba(59,130,246,0.3)',
    text: '#60a5fa',
  },
};

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      map.setView([lat, lng], 16);
    }, 300); // tunggu animasi height selesai
    return () => clearTimeout(timer);
  }, [lat, lng, map]);

  return null;
}

export default function ReportCard({
  report,
  isBPO,
  onUpdate,
  onImageClick,
  user // Added back to maintain compatibility with Dashboard.tsx
}: {
  report: any,
  isBPO: boolean,
  onUpdate: (data: any) => void,
  onImageClick?: (url: string) => void,
  user?: any,
  key?: React.Key
}) {
  const [showActions, setShowActions] = useState(false);
  const [bpoData, setBpoData] = useState({
    estimationDate: report.estimationDate || '',
    plannedAction: report.plannedAction || '',
    handlingReport: '',
  });
  const [showMap, setShowMap] = useState(false);
  const config = (STATUS_CONFIG as any)[report.status] || STATUS_CONFIG.default;
  const StatusIcon = config.icon;
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!report.latitude || !report.longitude) return;

    const fetchAddress = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${report.latitude}&lon=${report.longitude}`
        );
        const data = await res.json();
        setAddress(data.display_name);
      } catch (err) {
        console.error("Reverse geocoding error:", err);
      }
    };

    fetchAddress();
  }, [report.latitude, report.longitude]);

  const handleShare = async () => {
    const googleMapsUrl = `https://www.google.com/maps?q=${report.latitude},${report.longitude}`;
    const shareText = `Laporan Temuan: ${report.description}\nLokasi: ${address || 'Koordinat ' + report.latitude + ',' + report.longitude}\nLihat di Peta: ${googleMapsUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Laporan Temuan Safeguard',
          text: shareText,
          url: googleMapsUrl,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      // Fallback to WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <Card
      className="glass-card"
      as={motion.div}
      whileHover={{ y: -5, borderColor: 'rgba(59, 130, 246, 0.3)' }}
      layout
    >
      <ImageWrapper onClick={() => report.photoUrl && onImageClick?.(report.photoUrl)} style={{ cursor: report.photoUrl ? 'pointer' : 'default' }}>
        {report.photoUrl ? (
          <Image
            src={report.photoUrl}
            alt="Report"
            as={motion.img}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.5 }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <NoImage>
            <ShieldAlert size={64} />
          </NoImage>
        )}

        <StatusBadge border={config.border} text={config.text} as={motion.div} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <StatusIcon size={10} />
          {config.label}
        </StatusBadge>

        <FindingType as={motion.div} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>{report.findingType}</FindingType>
      </ImageWrapper>

      <Content>
        <Header>
          <Calendar size={12} />
          {report.date}
        </Header>

        {report.latitude && report.longitude && (
          <LocationMeta>
            <MapPin size={14} />
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <span style={{ fontSize: 11, color: '#f8fafc', fontWeight: 600 }}>
                {address ? address : "Mendeteksi alamat..."}
              </span>
              <small style={{ opacity: 0.5, fontSize: '9px' }}>
                {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
              </small>
            </div>

            <ToggleMapButton
              onClick={() => setShowMap(!showMap)}
              as={motion.button}
              whileTap={{ scale: 0.95 }}
            >
              {showMap ? "Tutup Peta" : "Lihat Peta"}
            </ToggleMapButton>

            <ShareButton
              onClick={handleShare}
              as={motion.button}
              whileTap={{ scale: 0.95 }}
              title="Bagikan Lokasi"
            >
              <Share2 size={14} />
            </ShareButton>
          </LocationMeta>
        )}

        <AnimatePresence>
          {showMap && report.latitude && report.longitude && (
            <MapWrapper
              as={motion.div}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 180 }}
              exit={{ opacity: 0, height: 0 }}
            >
              <MapContainer
                center={[report.latitude, report.longitude]}
                zoom={16}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker position={[report.latitude, report.longitude]} />

                <RecenterMap
                  lat={report.latitude}
                  lng={report.longitude}
                />
              </MapContainer>
            </MapWrapper>
          )}
        </AnimatePresence>
        
        <Description>{report.description}</Description>

        <SuggestionBox>
          <span>Usulan Perbaikan</span>
          <p>"{report.suggestion}"</p>
        </SuggestionBox>

        <Footer>
          {isBPO && report.status !== ReportStatus.CLOSED ? (
            <ActionToggle
              onClick={() => setShowActions(!showActions)}
              as={motion.button}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Edit <motion.div animate={{ rotate: showActions ? 90 : 0 }}><ChevronRight size={12} /></motion.div>
            </ActionToggle>
          ) : (
            report.status === ReportStatus.CLOSED && (
              <Resolved as={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CheckCircle2 size={12} />
                <span>Selesai {report.closedAt}</span>
              </Resolved>
            )
          )}
        </Footer>

        <AnimatePresence>
          {showActions && isBPO && (
            <ActionPanel
              as={motion.div}
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
            >
              <Label>TANGGAL PERUBAHAN</Label>
              <Input
                type="date"
                value={bpoData.estimationDate}
                onChange={(e) =>
                  setBpoData((p) => ({ ...p, estimationDate: e.target.value }))
                }
              />

              <Label>NOTE</Label>
              <Textarea
                rows={2}
                placeholder="Tambahkan catatan..."
                value={bpoData.plannedAction}
                onChange={(e) =>
                  setBpoData((p) => ({ ...p, plannedAction: e.target.value }))
                }
              />

              <SubmitButton
                onClick={() =>
                  onUpdate({ ...bpoData, handlingReport: 'Selesai' })
                }
                as={motion.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Update Penanganan
              </SubmitButton>
            </ActionPanel>
          )}
        </AnimatePresence>
      </Content>
    </Card>
  );
}

const Card = styled.div`
  border-radius: 1.5rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: border 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(30, 41, 59, 0.4);

  &:hover {
    border-color: rgba(59, 130, 246, 0.2);
  }
`;

const ImageWrapper = styled.div`
  height: 140px;
  position: relative;
  background: #1e293b;
  overflow: hidden;
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const NoImage = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.1;
  background: linear-gradient(135deg, #334155, #020617);
`;

const badgeBase = css`
  position: absolute;
  top: 20px;
  padding: 6px 12px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  backdrop-filter: blur(12px);
`;

const StatusBadge = styled.div<{ border: string, text: string }>`
  ${badgeBase};
  left: 20px;
  background: rgba(2, 6, 23, 0.9);
  border: 1px solid ${({ border }) => border};
  color: ${({ text }) => text};
`;

const FindingType = styled.div`
  ${badgeBase};
  right: 20px;
  background: #2563eb;
  color: white;
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3);
`;

const Content = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #64748b;
`;

const Description = styled.h4`
  color: white;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
`;

const SuggestionBox = styled.div`
  padding: 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.11);
  border: 1px solid rgba(255, 255, 255, 0.05);

  span {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    font-weight: 700;
    color: rgb(187, 197, 216);
    display: block;
    margin-bottom: 4px;
  }

  p {
    font-size: 12px;
    color: #f87171;
    font-weight: 600;
    line-height: 1.4;
  }
`;

const Footer = styled.div`
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: flex-end;
  min-height: 32px;
`;

const ActionToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.2));
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.2);
  padding: 10px 20px;
  border-radius: 14px;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &:hover {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
    border-color: rgba(255, 255, 255, 0.1);
  }
`;

const Resolved = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #34d399;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
`;

const ActionPanel = styled.div`
  margin-top: 20px;
  padding: 24px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(to right, #3b82f6, #10b981);
  }
`;

const Label = styled.label`
  font-size: 10px;
  font-weight: 900;
  color: #60a5fa;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: -4px;
  opacity: 0.8;
`;

const fieldBase = css`
  width: 100%;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 12px;
  font-size: 12px;
  color: white;
  outline: none;
`;

const Input = styled.input`
  ${fieldBase}
`;

const Textarea = styled.textarea`
  ${fieldBase}
  resize: none;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 14px;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4);
  margin-top: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px -5px rgba(37, 99, 235, 0.5);
    filter: brightness(1.1);
  }
`;

const LocationMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  margin-top: 8px;
  opacity: 0.8;
`;

const ToggleMapButton = styled.button`
  margin-left: auto;
  font-size: 11px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #60a5fa;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
`;

const ShareButton = styled.button`
  margin-left: 8px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(16, 185, 129, 0.2);
    transform: scale(1.05);
  }
`;

const MapWrapper = styled.div`
  margin-top: 12px;
  border-radius: 12px;
  overflow: hidden;
`;