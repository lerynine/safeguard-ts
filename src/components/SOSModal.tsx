import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, X, PhoneCall, MapPin, ShieldAlert } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function SOSModal({ isOpen, onClose, user }: SOSModalProps) {
  const [countdown, setCountdown] = useState(5);
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);

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
        location: {
          lat: -6.1754, // Placeholder for Pelabuhan Tanjung Priok
          lng: 106.8272
        }
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
                <InfoList>
                  <InfoItem><PhoneCall size={16} /> Tim Medis: 118</InfoItem>
                  <InfoItem><ShieldAlert size={16} /> Keamanan: Ext. 911</InfoItem>
                  <InfoItem><MapPin size={16} /> Lokasi Anda Terdeteksi</InfoItem>
                </InfoList>
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
