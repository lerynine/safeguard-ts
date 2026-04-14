import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, X, PhoneCall, MapPin, ShieldAlert, Share2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      map.setView(center, 16);
    }, 500);
    return () => clearTimeout(timer);
  }, [map, center]);

  return null;
}

export default function SOSModal({ isOpen, onClose, user }: SOSModalProps) {
  const [countdown, setCountdown] = useState(5);
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number}>({ lat: -6.1754, lng: 106.8272 });

  useEffect(() => {
    if (isOpen && !isSent) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          (err) => console.warn("SOS Geolocation error:", err)
        );
      }
    }
  }, [isOpen, isSent]);

  useEffect(() => {
    let timer: any;
    if (isOpen && countdown > 0 && !isSent) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (isOpen && countdown === 0 && !isSent) {
      sendSOS();
    }
    return () => clearTimeout(timer);
  }, [isOpen, countdown, isSent]);

  const sendSOS = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'emergency_calls'), {
        callerUid: user?.uid || 'anonymous',
        callerName: user?.name || 'Anonymous User',
        status: 'ACTIVE',
        createdAt: serverTimestamp(),
        location: location
      });
      setIsSent(true);
    } catch (error) {
      console.error("Error sending SOS:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
    setCountdown(5);
    setIsSent(false);
  };

  const handleShare = async () => {
    const googleMapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    const shareText = `DARURAT SOS! Saya butuh bantuan segera.\nLokasi Saya: ${googleMapsUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DARURAT SOS Safeguard',
          text: shareText,
          url: googleMapsUrl,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Modal
            as={motion.div}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {!isSent ? (
              <>
                <IconWrapper animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                  <AlertOctagon size={80} color="#ef4444" />
                </IconWrapper>
                <Title>DARURAT SOS</Title>
                <Description>
                  Mengirim sinyal darurat ke Pusat Komando K3 dalam:
                </Description>
                <Countdown>{countdown}</Countdown>
                <ButtonGroup>
                  <CancelBtn onClick={handleCancel}>BATALKAN</CancelBtn>
                  <ConfirmBtn onClick={sendSOS} disabled={loading}>
                    {loading ? 'MENGIRIM...' : 'KIRIM SEKARANG'}
                  </ConfirmBtn>
                </ButtonGroup>
              </>
            ) : (
              <>
                <IconWrapper>
                  <ShieldAlert size={80} color="#10b981" />
                </IconWrapper>
                <Title style={{ color: '#10b981' }}>SINYAL TERKIRIM</Title>
                <Description>
                  Bantuan sedang dalam perjalanan. Tetap tenang dan cari tempat aman.
                </Description>
                  <MapSection>
                    <MapContainer 
                      center={[location.lat, location.lng]} 
                      zoom={16} 
                      style={{ height: '100%', width: '100%' }}
                      zoomControl={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[location.lat, location.lng]} />
                      <MapController center={[location.lat, location.lng]} />
                    </MapContainer>
                    <MapOverlay>
                      <MapPin size={10} />
                      <span>Lokasi Terdeteksi</span>
                    </MapOverlay>
                  </MapSection>
                <InfoList>
                  <InfoItem><PhoneCall size={16} /> Tim Medis: 118</InfoItem>
                  <InfoItem><ShieldAlert size={16} /> Keamanan: Ext. 911</InfoItem>
                  <InfoItem><MapPin size={16} /> Lokasi Anda Terdeteksi</InfoItem>
                </InfoList>
                <ButtonGroup style={{ marginBottom: '1rem' }}>
                  <ShareSOSBtn onClick={handleShare}>
                    <Share2 size={18} /> BAGIKAN LOKASI
                  </ShareSOSBtn>
                </ButtonGroup>
                <CloseBtn onClick={handleCancel}>TUTUP</CloseBtn>
              </>
            )}
          </Modal>
        </Overlay>
      )}
    </AnimatePresence>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.9);
  backdrop-filter: blur(10px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
`;

const Modal = styled.div`
  background: #0f172a;
  width: 100%;
  max-width: 450px;
  border-radius: 2rem;
  padding: 3rem 2rem;
  text-align: center;
  border: 1px solid rgba(239, 68, 68, 0.3);
  box-shadow: 0 0 50px rgba(239, 68, 68, 0.2);
`;

const IconWrapper = styled(motion.div)`
  margin-bottom: 2rem;
  display: flex;
  justify-content: center;
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 900;
  color: #ef4444;
  margin-bottom: 1rem;
  letter-spacing: 0.1em;
`;

const Description = styled.p`
  color: #94a3b8;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const MapSection = styled.div`
  height: 150px;
  width: 100%;
  border-radius: 1.5rem;
  overflow: hidden;
  border: 1px solid rgba(16, 185, 129, 0.3);
  position: relative;
  z-index: 1;
  margin-bottom: 2rem;
`;

const MapOverlay = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(15, 23, 42, 0.9);
  padding: 4px 10px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: #ffffff;
  z-index: 1000;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 700;
  text-transform: uppercase;
`;

const Countdown = styled.div`
  font-size: 5rem;
  font-weight: 900;
  color: #ffffff;
  margin-bottom: 2.5rem;
  font-family: var(--font-mono);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const CancelBtn = styled.button`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
  padding: 1rem;
  border-radius: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba(255, 255, 255, 0.1); }
`;

const ConfirmBtn = styled.button`
  flex: 1;
  background: #ef4444;
  border: none;
  color: #ffffff;
  padding: 1rem;
  border-radius: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: #dc2626; transform: translateY(-2px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const InfoList = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #f8fafc;
  font-size: 0.9rem;
  font-weight: 600;
`;

const CloseBtn = styled.button`
  width: 100%;
  background: var(--primary);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: #2563eb; }
`;

const ShareSOSBtn = styled.button`
  flex: 1;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
  padding: 1rem;
  border-radius: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.2s;
  &:hover {
    background: rgba(16, 185, 129, 0.2);
    transform: translateY(-2px);
  }
`;
