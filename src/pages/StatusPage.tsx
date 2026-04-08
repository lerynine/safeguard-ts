import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Bell,
  LogOut,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowLeft,
  Sparkles,
  Search,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ReportStatus, UserRole } from "../constants/enums";
import ReportForm from "../components/ReportForm";
import ReportTable from "../components/ReportTable";

const PelindoLogo = () => (
  <motion.img
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    src="/Pelindo Multi Terminal.png"
    alt="Pelindo Multi Terminal"
    style={{
      height: 32,
      width: "auto",
      flexShrink: 0,
      borderRadius: 8,
    }}
  />
);

export default function StatusPage({
  user,
  reports,
  status,
  notifications,
  onAddReport,
  onUpdateReport,
  onMarkNotificationsAsRead,
  onMarkNotificationAsRead,
  onLogout,
}: {
  user: any;
  reports: any[];
  status: string;
  notifications: any[];
  onAddReport: (data: any) => void;
  onUpdateReport: (id: string, updates: any) => void;
  onMarkNotificationsAsRead: () => void;
  onMarkNotificationAsRead: (id: string) => void;
  onLogout: () => void;
}) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const navigate = useNavigate();

  const filteredReports = useMemo(() => {
    let result = [...reports];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          (r.description || "").toLowerCase().includes(q) ||
          (r.findingType || "").toLowerCase().includes(q),
      );
    }
    return result.sort((a, b) => {
      // Primary sort by date string (YYYY-MM-DD)
      const dateA = a.date || "";
      const dateB = b.date || "";
      
      if (dateA !== dateB) {
        return sortOrder === "newest" 
          ? dateB.localeCompare(dateA) 
          : dateA.localeCompare(dateB);
      }
      
      // Secondary sort by createdAt timestamp
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      if (timeA !== timeB) {
        return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
      }

      // Final tie-breaker
      return b.id.localeCompare(a.id);
    });
  }, [reports, searchQuery, sortOrder]);

  useEffect(() => {
    if (selectedImage || isReportModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage, isReportModalOpen]);

  const handleToggleNotif = () => {
    setIsNotifOpen(!isNotifOpen);
  };

  const getTitle = () => {
    switch (status) {
      case ReportStatus.OPEN: return "LAPORAN MENUNGGU";
      case ReportStatus.IN_PROGRESS: return "LAPORAN DIPROSES";
      case ReportStatus.CLOSED: return "LAPORAN SELESAI";
      default: return "SEMUA LAPORAN";
    }
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Wrapper>
      <Header className="glass-card">
        <HeaderLeft>
          <BackButton 
            onClick={() => navigate('/reports')}
            as={motion.button}
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft size={20} />
          </BackButton>
          <PelindoLogo />
          <div>
            <Title className="font-brand">{getTitle()}</Title>
            <Subtitle>PT. PELINDO MULTI TERMINAL <Sparkles size={10} style={{ display: 'inline', marginLeft: 4 }} /></Subtitle>
          </div>
        </HeaderLeft>

        <HeaderRight>
          <NotifWrapper>
            <IconButton 
              active={isNotifOpen} 
              onClick={handleToggleNotif}
              as={motion.button}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Bell size={18} />
              {hasUnread && <UnreadDot as={motion.span} initial={{ scale: 0 }} animate={{ scale: 1 }} />}
            </IconButton>

            <AnimatePresence>
              {isNotifOpen && (
                <NotifBox 
                  className="glass-card"
                  as={motion.div}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                >
                  <NotifHeader>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Notifikasi</span>
                      {hasUnread && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkNotificationsAsRead();
                          }}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#3b82f6', 
                            fontSize: '0.6rem', 
                            cursor: 'pointer',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            fontWeight: 700
                          }}
                        >
                          Tandai semua dibaca
                        </button>
                      )}
                    </div>
                    <X size={14} onClick={() => setIsNotifOpen(false)} style={{ cursor: 'pointer' }} />
                  </NotifHeader>
                  <NotifList>
                    {notifications.length ? (
                      notifications.map((n) => (
                        <NotifItem 
                          key={n.id}
                          unread={!n.isRead}
                          onClick={() => {
                            if (!n.isRead) onMarkNotificationAsRead(n.id);
                            setIsNotifOpen(false);
                            navigate("/reports/menunggu");
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <strong>{n.title}</strong>
                            {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', marginTop: 4 }} />}
                          </div>
                          {n.reportTitle && <p style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.75rem', marginBottom: '2px' }}>{n.reportTitle}</p>}
                          <p>{n.message}</p>
                          <small style={{ display: 'block', marginTop: '4px', color: '#64748b' }}>
                            {n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : "Baru saja"}
                          </small>
                        </NotifItem>
                      ))
                    ) : (
                      <EmptyNotif>Tidak ada notifikasi</EmptyNotif>
                    )}
                  </NotifList>
                </NotifBox>
              )}
            </AnimatePresence>
          </NotifWrapper>

          <PrimaryButton 
            onClick={() => setIsReportModalOpen(true)}
            as={motion.button}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={16} /> Tambah Laporan
          </PrimaryButton>

          <IconButton 
            danger 
            onClick={onLogout}
            as={motion.button}
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
            whileTap={{ scale: 0.9 }}
          >
            <LogOut size={18} />
          </IconButton>
        </HeaderRight>
      </Header>

      <Main as={motion.main} initial="hidden" animate="visible" variants={containerVariants}>
        <SearchFilterRow as={motion.div} variants={itemVariants}>
          <SearchBox>
            <SearchIcon>
              <Search size={18} />
            </SearchIcon>
            <SearchInput 
              placeholder="Cari laporan..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchBox>

          <FilterGroup>
            <FilterButton 
              active={sortOrder === 'newest'} 
              onClick={() => setSortOrder('newest')}
            >
              <ArrowDownWideNarrow size={14} />
              <span>Terbaru</span>
            </FilterButton>
            <FilterButton 
              active={sortOrder === 'oldest'} 
              onClick={() => setSortOrder('oldest')}
            >
              <ArrowUpWideNarrow size={14} />
              <span>Terlama</span>
            </FilterButton>
          </FilterGroup>
        </SearchFilterRow>

        <motion.div variants={itemVariants}>
          <ReportTable 
            reports={filteredReports} 
            user={user} 
            onUpdate={onUpdateReport} 
            hideActions={status === ReportStatus.CLOSED}
            onImageClick={(url: string) => setSelectedImage(url)}
          />
        </motion.div>
      </Main>

      <AnimatePresence>
        {isReportModalOpen && (
          <ModalOverlay
            as={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ModalContent>
              <ReportForm
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={(d) => {
                  onAddReport(d);
                  setIsReportModalOpen(false);
                }}
              />
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedImage && (
          <LightboxOverlay
            as={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <motion.img 
              src={selectedImage} 
              alt="Full View"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            />
            <CloseLightbox onClick={() => setSelectedImage(null)}>
              <X size={24} />
            </CloseLightbox>
          </LightboxOverlay>
        )}
      </AnimatePresence>
    </Wrapper>
  );
}

const LightboxOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow: hidden;

  img {
    max-width: 95%;
    max-height: 95%;
    object-fit: contain;
    border-radius: 1rem;
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.5);
  }
`;

const CloseLightbox = styled.button`
  position: absolute;
  top: 2rem;
  right: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
`;

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgba(40, 33, 78, 0.37);
  color: #e5e7eb;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  background: rgba(30, 39, 78, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  @media (max-width: 768px) {
    padding: 0.6rem 1rem;
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  gap: 1.25rem;
  align-items: center;

  @media (max-width: 480px) {
    gap: 0.75rem;
    img {
      height: 20px !important;
    }
  }
`;

const BackButton = styled.button`
  background: rgba(58, 52, 135, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #64748b;
  padding: 8px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const Title = styled.h2`
  color: #f8fafc;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 0.75rem;
    letter-spacing: 0.02em;
  }
`;

const Subtitle = styled.p`
  color: #3b82f6;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  margin: 0;
  text-transform: uppercase;
`;

const IconButton = styled.button<{ active?: boolean, danger?: boolean }>`
  position: relative;
  padding: 0.6rem;
  border-radius: 0.75rem;
  background: ${({ active, danger }) =>
    active ? "#2563eb" : danger ? "transparent" : "rgba(15,23,42,0.7)"};
  color: ${({ danger }) => (danger ? "#f87171" : "#cbd5f5")};
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 480px) {
    padding: 0.4rem;
    border-radius: 0.5rem;
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const UnreadDot = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  box-shadow: 0 0 10px #ef4444;
`;

const PrimaryButton = styled.button`
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  padding: 0.65rem 1.1rem;
  border-radius: 0.9rem;
  font-weight: 800;
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  box-shadow: 0 10px 30px rgba(37, 99, 235, 0.35);

  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.6rem;
    border-radius: 0.6rem;
    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const Main = styled.main`
  padding: 1.5rem;
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const SearchFilterRow = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 2rem;
  width: 100%;

  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const SearchBox = styled.div`
  position: relative;
  flex: 1;
  min-width: 120px;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;

  @media (max-width: 480px) {
    left: 0.75rem;
    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.85rem 1rem 0.85rem 3rem;
  border-radius: 1.25rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: white;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.3s;

  @media (max-width: 480px) {
    padding: 0.6rem 0.75rem 0.6rem 2.25rem;
    font-size: 0.75rem;
    border-radius: 0.75rem;
  }

  &:focus {
    border-color: #3b82f6;
    background: rgba(15, 23, 42, 0.8);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 0.4rem;
  background: rgba(15, 23, 42, 0.6);
  padding: 0.3rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  margin-left: auto;
  flex-shrink: 0;

  @media (max-width: 480px) {
    padding: 0.2rem;
    gap: 0.2rem;
    border-radius: 0.75rem;
  }
`;

const FilterButton = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
  background: ${({ active }) => active ? '#2563eb' : 'transparent'};
  color: ${({ active }) => active ? 'white' : '#64748b'};
  box-shadow: ${({ active }) => active ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none'};
  white-space: nowrap;

  @media (max-width: 480px) {
    padding: 0.3rem 0.5rem;
    gap: 0.2rem;
    span {
      font-size: 0.55rem;
    }
    svg {
      width: 10px;
      height: 10px;
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.9);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  overflow: hidden;
`;

const ModalContent = styled.div`
  width: 100%;
  max-width: 540px;
  border-radius: 2rem;

  @media (max-width: 480px) {
    max-width: calc(100vw - 2rem);
    border-radius: 1.5rem;
  }
`;

const NotifWrapper = styled.div`
  position: relative;
`;

const NotifBox = styled.div`
  position: absolute;
  top: 130%;
  right: 0;
  width: 350px;
  max-height: 400px;
  border-radius: 1.5rem;
  overflow: hidden;
  z-index: 1000;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 1024px) {
    width: 300px;
  }

  @media (max-width: 768px) {
    position: fixed;
    top: 80px;
    left: 1rem;
    right: 1rem;
    width: auto;
    max-height: 60vh;
    margin: 0 auto;
    max-width: 400px;
  }

  @media (max-width: 480px) {
    top: 70px;
    left: 0.75rem;
    right: 0.75rem;
    max-width: none;
  }
`;

const NotifHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.9);

  span {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #e5e7eb;
  }
`;

const NotifList = styled.div`
  max-height: 280px;
  overflow-y: auto;
  background: #020617;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
`;

const NotifItem = styled.div<{ unread?: boolean }>`
  padding: 0.85rem 1rem;
  background: ${({ unread }) => unread ? 'rgba(59, 130, 246, 0.05)' : '#020617'};
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid ${({ unread }) => unread ? '#3b82f6' : 'transparent'};

  &:hover {
    background: ${({ unread }) => unread ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.03)'};
  }

  strong {
    display: block;
    font-size: 0.75rem;
    color: #f8fafc;
    margin-bottom: 2px;
  }

  small {
    font-size: 0.65rem;
    color: #60a5fa;
  }

  p {
    font-size: 0.7rem;
    color: #94a3b8;
    margin-top: 4px;
    line-height: 1.4;
  }
`;

const EmptyNotif = styled.div`
  padding: 2rem;
  text-align: center;
  font-size: 0.75rem;
  color: #64748b;
`;
