import React, { useState, useRef, useEffect } from "react";
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import {
  X,
  Calendar,
  Camera,
  Info,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  FolderOpen,
  Sparkles,
  MapPin,
} from 'lucide-react';

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

function LocationMarker({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    // Invalidate size after a short delay to ensure the modal animation is finished
    const timer = setTimeout(() => {
      map.invalidateSize();
      map.setView(center, 16);
    }, 500);
    return () => clearTimeout(timer);
  }, [map, center]);

  return null;
}

export default function ReportForm({ onClose, onSubmit }: { onClose: () => void, onSubmit: (data: any) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    findingType: "Unsafe Condition",
    description: "",
    suggestion: "",
    photo: null as string | null,
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () =>
      setFormData((p) => ({ ...p, photo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const openPicker = (capture?: string) => {
    if (!fileInputRef.current) return;
    if (capture) {
      fileInputRef.current.setAttribute('capture', capture);
    } else {
      fileInputRef.current.removeAttribute('capture');
    }
    fileInputRef.current.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        staggerChildren: 0.1
      }
    },
    exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      // Default to Tanjung Priok
      setFormData(prev => ({ ...prev, latitude: -6.1033, longitude: 106.8792 }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
      },
      (error) => {
        console.error("Error getting location:", error);
        // Default to Tanjung Priok if fails
        setFormData(prev => ({ ...prev, latitude: -6.1033, longitude: 106.8792 }));
      },
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <Wrapper className="glass-card">
        <Header>
          <HeaderText>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="font-brand"
            >
              Lapor Temuan <Sparkles size={18} style={{ display: 'inline', marginLeft: 8, color: '#fbbf24' }} />
            </motion.h2>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              SAFEGUARD PELAPORAN RESMI
            </motion.span>
          </HeaderText>
          <CloseButton onClick={onClose} as={motion.button} whileHover={{ rotate: 90, scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <X size={24} />
          </CloseButton>
        </Header>

        <Form onSubmit={handleSubmit}>
          <Section as={motion.div} variants={itemVariants}>
            <Label>
              <AlertCircle size={14} /> Pilih Tipe Temuan
            </Label>
            <TypeGrid>
              {['Unsafe Condition', 'Unsafe Action'].map((type) => (
                <TypeButton
                  key={type}
                  active={formData.findingType === type}
                  onClick={() =>
                    setFormData((p) => ({ ...p, findingType: type }))
                  }
                  type="button"
                  as={motion.button}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Dot active={formData.findingType === type} />
                  {type}
                </TypeButton>
              ))}
            </TypeGrid>
          </Section>

          <Section as={motion.div} variants={itemVariants}>
            <Label>
              <Camera size={14} /> Lampirkan Bukti Foto
            </Label>

            <PhotoGrid>
              <PickerButton
                type="button"
                onClick={() => openPicker('environment')}
                as={motion.button}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                whileTap={{ scale: 0.95 }}
              >
                <Camera />
                <span>Kamera</span>
              </PickerButton>
              <PickerButton
                type="button"
                onClick={() => openPicker()}
                as={motion.button}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                whileTap={{ scale: 0.95 }}
              >
                <ImageIcon />
                <span>Galeri</span>
              </PickerButton>
              <PickerButton
                type="button"
                onClick={() => openPicker()}
                as={motion.button}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                whileTap={{ scale: 0.95 }}
              >
                <FolderOpen />
                <span>File</span>
              </PickerButton>
            </PhotoGrid>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              hidden
              onChange={handleFileChange}
            />

            <AnimatePresence>
              {formData.photo && (
                <Preview
                  as={motion.div}
                  initial={{ opacity: 0, scale: 0.8, height: 0 }}
                  animate={{ opacity: 1, scale: 1, height: 160 }}
                  exit={{ opacity: 0, scale: 0.8, height: 0 }}
                >
                  <img src={formData.photo} alt="Preview" />
                  <PreviewOverlay>
                    <CheckCircle2 />
                  </PreviewOverlay>
                </Preview>
              )}
            </AnimatePresence>
          </Section>

          <Section as={motion.div} variants={itemVariants}>
            <Label>
              <Calendar size={14} /> Tanggal Kejadian
            </Label>
            <Input
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData((p) => ({ ...p, date: e.target.value }))
              }
            />
          </Section>

          <Section as={motion.div} variants={itemVariants}>
            <Label>
              <Info size={14} /> Deskripsi Temuan
            </Label>
            <Textarea
              rows={3}
              required
              placeholder="Jelaskan secara singkat apa yang terjadi..."
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
            />
          </Section>

          <Section as={motion.div} variants={itemVariants}>
            <Label>
              <Lightbulb size={14} /> Usulan Perbaikan
            </Label>
            <Textarea
              rows={2}
              placeholder="Apa saran Anda agar ini tidak terulang?"
              value={formData.suggestion}
              onChange={(e) =>
                setFormData((p) => ({ ...p, suggestion: e.target.value }))
              }
            />
          </Section>

          <Section as={motion.div} variants={itemVariants}>
            <Label>
              <MapPin size={14} /> Lokasi Kejadian (Klik peta untuk ubah)
            </Label>

            <div style={{ height: "200px", borderRadius: '1.5rem', overflow: "hidden", border: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 1 }}>
              <MapContainer
                center={[formData.latitude || -6.1033, formData.longitude || 106.8792]}
                zoom={16}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {formData.latitude && formData.longitude && (
                  <>
                    <LocationMarker 
                      position={[formData.latitude, formData.longitude]} 
                      setPosition={(pos) => setFormData(p => ({ ...p, latitude: pos[0], longitude: pos[1] }))} 
                    />
                    <MapController center={[formData.latitude, formData.longitude]} />
                  </>
                )}
              </MapContainer>
            </div>
            {formData.latitude && formData.longitude && (
              <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'right', fontWeight: 600 }}>
                {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </div>
            )}
          </Section>

          <SubmitButton
            type="submit"
            as={motion.button}
            whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            Kirim Laporan
          </SubmitButton>
        </Form>
      </Wrapper>
    </motion.div>
  );
}

const Wrapper = styled.div`
  border-radius: 2.5rem;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
`;

const Header = styled.div`
  padding: 2rem;
  background: linear-gradient(135deg, #1a2b5a, #284a6c);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 480px) {
    padding: 1.5rem;
  }
`;

const HeaderText = styled.div`
  h2 {
    color: white;
    font-size: 1.5rem;
    margin: 0 0 0.5rem;
    font-weight: 800;
    letter-spacing: -0.02em;

    @media (max-width: 480px) {
      font-size: 1.1rem;
    }
  }

  span {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: #60a5fa;
    text-transform: uppercase;
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ccd6e4;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.2);
  }
`;

const Form = styled.form`
  padding: 2rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  background: rgba(125, 153, 219, 0.3);

  @media (max-width: 480px) {
    padding: 1.5rem;
    gap: 1.5rem;
  }

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Label = styled.label`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const TypeButton = styled.button<{ active: boolean }>`
  padding: 1.25rem;
  border-radius: 1.5rem;
  border: 1px solid
    ${({ active }) => (active ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 0, 0, 0.05)')};
  background: ${({ active }) =>
    active ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'rgba(30,41,59,0.4)'};
  color: ${({ active }) => (active ? 'white' : '#d2ddef')};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${({ active }) => active ? '0 10px 20px -5px rgba(37, 99, 235, 0.4)' : 'none'};

  @media (max-width: 480px) {
    padding: 0.75rem;
    border-radius: 1rem;
    font-size: 8px;
    gap: 0.4rem;
  }
`;

const Dot = styled.div<{ active: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ active }) => (active ? 'white' : '#5d7089')};
  box-shadow: ${({ active }) => active ? '0 0 10px white' : 'none'};
`;

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
`;

const PickerButton = styled.button`
  padding: 1rem;
  border-radius: 1.5rem;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  @media (max-width: 480px) {
    padding: 0.6rem;
    border-radius: 1rem;
    gap: 0.3rem;
  }

  svg {
    width: 24px;
    height: 24px;
    color: #64748b;

    @media (max-width: 480px) {
      width: 18px;
      height: 18px;
    }
  }

  span {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    color: #64748b;
  }

  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
    svg { color: #60a5fa; }
    span { color: #60a5fa; }
  }
`;

const Preview = styled.div`
  position: relative;
  height: 160px;
  border-radius: 1.5rem;
  overflow: hidden;
  border: 1px solid rgba(245, 246, 248, 0.3);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PreviewOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(16, 185, 129, 0.3);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 40px;
    height: 40px;
    color: white;
    filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.3));
  }
`;

const fieldBase = css`
  width: 100%;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.5rem;
  padding: 1rem 1.25rem;
  font-size: 14px;
  color: white;
  outline: none;
  transition: all 0.3s;

  @media (max-width: 480px) {
    padding: 0.75rem 1rem;
    font-size: 12px;
    border-radius: 1rem;
  }

  &:focus {
    border-color: #3b82f6;
    background: rgba(30, 41, 59, 0.8);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #475569;
  }
`;

const Input = styled.input`
  ${fieldBase}
`;

const Textarea = styled.textarea`
  ${fieldBase}
  resize: none;
`;

const SubmitButton = styled.button`
  margin-top: 1rem;
  padding: 1.5rem;
  border-radius: 1.5rem;
  background: linear-gradient(90deg, #2563eb, #4338ca);
  color: white;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  box-shadow: 0 20px 40px rgba(37, 99, 235, 0.3);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;

  @media (max-width: 480px) {
    padding: 1rem;
    font-size: 9px;
    border-radius: 1rem;
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    box-shadow: 0 25px 50px rgba(37, 99, 235, 0.4), 0 0 20px rgba(59, 130, 246, 0.4);
    transform: translateY(-2px);
    &::after {
      opacity: 1;
    }
  }
`;
