import React, { useState, useMemo, useEffect } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Bell,
  LogOut,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldAlert,
  Sparkles,
  Filter,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  BarChart3,
  Trophy,
  AlertOctagon
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ReportStatus, UserRole } from "../constants/enums";
import ReportForm from "./ReportForm";
import ReportCard from "./ReportCard";
import SOSModal from "./SOSModal";

const COLOR_MAP = {
  blue: { bg: "rgba(59,130,246,0.1)", text: "#60a5fa" },
  amber: { bg: "rgba(251,191,36,0.1)", text: "#fbbf24" },
  indigo: { bg: "rgba(99,102,241,0.1)", text: "#818cf8" },
  emerald: { bg: "rgba(16,185,129,0.1)", text: "#34d399" },
};

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

export default function Dashboard({
  user,
  reports,
  notifications,
  onAddReport,
  onUpdateReport,
  onMarkNotificationsAsRead,
  onMarkNotificationAsRead,
  onLogout,
}: {
  user: any;
  reports: any[];
  notifications: any[];
  onAddReport: (data: any) => void;
  onUpdateReport: (id: string, updates: any) => void;
  onMarkNotificationsAsRead: () => void;
  onMarkNotificationAsRead: (id: string) => void;
  onLogout: () => void;
}) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    const hour = new Date().getHours();
    const g =
      hour < 12 ? "Pagi" : hour < 15 ? "Siang" : hour < 18 ? "Sore" : "Malam";
    setGreeting(`Selamat ${g}, ${user.name || "User"}`);
  }, [user.name]);

  // Notifications are already filtered by the Firestore query in App.tsx
  const userNotifications = notifications;

  const filteredReports = useMemo(() => {
    let result = [...reports];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.description.toLowerCase().includes(q) ||
          r.findingType.toLowerCase().includes(q),
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

  const handleToggleNotif = () => {
    setIsNotifOpen(!isNotifOpen);
  };

  const hasUnread = userNotifications.some((n) => !n.isRead);

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

  const stats = [
    {
      label: "Total",
      value: reports.length,
      icon: FileText,
      color: "blue" as const,
      path: "/reports",
    },
    {
      label: "Menunggu",
      value: reports.filter((r) => r.status === ReportStatus.OPEN).length,
      icon: AlertTriangle,
      color: "amber" as const,
      path: "/reports/menunggu",
    },
    {
      label: "Diproses",
      value: reports.filter((r) => r.status === ReportStatus.IN_PROGRESS)
        .length,
      icon: Clock,
      color: "indigo" as const,
      path: "/reports/diproses",
    },
    {
      label: "Selesai",
      value: reports.filter((r) => r.status === ReportStatus.CLOSED).length,
      icon: CheckCircle2,
      color: "emerald" as const,
      path: "/reports/selesai",
    },
  ];

  return (
    <Wrapper>
      <Header className="glass-card">
        <HeaderLeft>
          <PelindoLogo />
          <div>
            <Title className="font-brand">PT. PELINDO MULTI TERMINAL</Title>
            <Greeting>{greeting} <Sparkles size={12} style={{ display: 'inline', marginLeft: 4 }} /></Greeting>
          </div>
        </HeaderLeft>

        <HeaderRight>

          <IconButton 
            onClick={() => navigate("/leaderboard")}
            as={motion.button}
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(251, 191, 36, 0.1)' }}
            whileTap={{ scale: 0.9 }}
            title="Leaderboard K3"
          >
            <Trophy size={18} color="#fbbf24" />
          </IconButton>

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
                      {userNotifications.length ? (
                        userNotifications.map((n) => (
                          <NotifItem 
                            key={n.id} 
                            unread={!n.isRead}
                            onClick={() => {
                              if (!n.isRead) onMarkNotificationAsRead(n.id);
                              setIsNotifOpen(false);
                              
                              // Determine target path based on report status
                              const reportId = n.reportId || n.id;
                              const targetReport = reports.find(r => 
                                r.id === reportId && 
                                (!n.findingType || r.findingType === n.findingType)
                              );
                              
                              let path = "/reports/menunggu";
                              if (targetReport) {
                                if (targetReport.status === ReportStatus.IN_PROGRESS) path = "/reports/diproses";
                                else if (targetReport.status === ReportStatus.CLOSED) path = "/reports/selesai";
                              }
                              navigate(path);
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

          <IconButton 
            onClick={() => navigate("/analytics")}
            as={motion.button}
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
            whileTap={{ scale: 0.9 }}
            title="Rekap Analitik"
          >
            <BarChart3 size={18} />
          </IconButton>

          <PrimaryButton 
            onClick={() => setIsReportModalOpen(true)}
            as={motion.button}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={16} /> <span>Tambah Laporan</span>
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
        <StatsRow>
          {stats.map((s) => (
            <StatCard
              key={s.label}
              onClick={() => navigate(s.path)}
              role="button"
              tabIndex={0}
              as={motion.div}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
              whileTap={{ scale: 0.98 }}
            >
              <StatIcon
                style={{
                  background: COLOR_MAP[s.color].bg,
                  color: COLOR_MAP[s.color].text,
                }}
              >
                <s.icon size={18} />
              </StatIcon>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </StatCard>
          ))}
        </StatsRow>

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

        <Grid as={motion.div} variants={containerVariants}>
          <AnimatePresence mode="popLayout">
            {filteredReports.length ? (
              filteredReports.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  variants={itemVariants}
                >
                  <ReportCard
                    report={r}
                    user={user}
                    isBPO={user.role === UserRole.BPO}
                    onUpdate={(u: any) => onUpdateReport(r.id, u)}
                    onImageClick={(url: string) => setSelectedImage(url)}
                  />
                </motion.div>
              ))
            ) : (
              <EmptyState 
                className="glass-card"
                as={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <ShieldAlert size={48} />
                <p>Tidak ada laporan ditemukan.</p>
              </EmptyState>
            )}
          </AnimatePresence>
        </Grid>
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

      <SOSModal 
        isOpen={isSOSOpen} 
        onClose={() => setIsSOSOpen(false)} 
        user={user}
      />

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

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgba(52, 59, 92, 0.4);
  color: #e5e7eb;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  background: rgba(6, 14, 49, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  @media (max-width: 768px) {
    padding: 0.6rem 1rem;
    gap: 0.5rem;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;

  @media (max-width: 480px) {
    gap: 0.5rem;
    
    img {
      height: 20px !important;
      border-radius: 4px;
    }
  }
`;

const HeaderRight = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const SOSBtn = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 0.75rem;
  font-weight: 800;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  
  &:hover {
    background: #dc2626;
    transform: scale(1.05);
  }

  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
    span { display: none; }
  }
`;

const Title = styled.h2`
  color: #f8fafc;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 0.75rem;
    letter-spacing: 0.02em;
    line-height: 1.2;
  }
`;

const Greeting = styled.p`
  color: #60a5fa;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  margin: 0;

  @media (max-width: 640px) {
    display: none;
  }
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
  transition: all 0.2s ease;

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
  background: red;
  border-radius: 50%;
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

  @media (max-width: 640px) {
    padding: 0.65rem;
    span {
      display: none;
    }
  }

  @media (max-width: 480px) {
    padding: 0.5rem;
    border-radius: 0.6rem;
    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const Main = styled.main`
  padding: 2rem;
  flex: 1;
  overflow-y: auto;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const StatCard = styled.div`
  padding: 1.4rem;
  border-radius: 1.75rem;
  text-align: center;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);

  strong {
    display: block;
    font-size: 1.6rem;
    font-weight: 800;
    color: #f8fafc;
  }

  span {
    font-size: 0.65rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #64748b;
  }
`;

const StatIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  margin: 0 auto 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  padding: 4rem;
  text-align: center;
  color: #64748b;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 2rem;
  border: 1px dashed rgba(255, 255, 255, 0.1);
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
