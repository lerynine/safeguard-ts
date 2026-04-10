import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Edit3,
  ShieldAlert,
  Search,
  X
} from 'lucide-react';
import { ReportStatus, UserRole } from '../constants/enums';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from 'firebase/auth';

const STATUS_CONFIG = {
  [ReportStatus.OPEN]: {
    label: 'MENUNGGU',
    icon: AlertTriangle,
    text: '#fbbf24',
    bg: 'rgba(251,191,36,0.1)',
    border: 'rgba(251,191,36,0.2)',
  },
  [ReportStatus.IN_PROGRESS]: {
    label: 'DIPROSES',
    icon: Clock,
    text: '#818cf8',
    bg: 'rgba(129,140,248,0.1)',
    border: 'rgba(129,140,248,0.2)',
  },
  [ReportStatus.CLOSED]: {
    label: 'SELESAI',
    icon: CheckCircle2,
    text: '#34d399',
    bg: 'rgba(52,211,153,0.1)',
    border: 'rgba(52,211,153,0.2)',
  },
};

export default function ReportTable({
  reports,
  user,
  onUpdate,
  onImageClick,
  hideActions = false
}: {
  reports: any[],
  user: any,
  onUpdate: (id: string, data: any) => void,
  onImageClick?: (url: string) => void,
  hideActions?: boolean
}) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [estimationDate, setEstimationDate] = useState('');
  const [plannedAction, setPlannedAction] = useState('');

  const [disposisiReportId, setDisposisiReportId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [disposisiMessage, setDisposisiMessage] = useState('');
  const [disposisiStep, setDisposisiStep] = useState<1 | 2>(1);
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingUserSearch, setLoadingUserSearch] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const auth = getAuth();
      const authUser = auth.currentUser;
      console.log("👤 Current Auth User:", authUser ? { uid: authUser.uid, email: authUser.email } : "Not logged in");
      if (!authUser) return;

      const q = query(
        collection(db, "users"),
        where("uid", "==", authUser.uid)
      );
      console.log("📡 Fetching user role from Firestore for UID:", authUser.uid);
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        console.log("✅ Current User Data from Firestore:", userData);
        setCurrentUserRole(userData.role);
      } else {
        console.log("⚠️ User document not found in 'users' collection for UID:", authUser.uid);
      }
    };
    loadUser();
  }, []);

  const handleEdit = (report: any) => {
    if (selectedReportId === report.id) {
      setSelectedReportId(null);
    } else {
      setSelectedReportId(report.id);
      setEstimationDate(report.estimationDate || '');
      setPlannedAction(report.plannedAction || '');
    }
  };

  const handleSearchUser = async () => {
    console.log("🔍 Searching for user with name (case-insensitive):", searchName);
    if (!searchName.trim()) {
      console.log("⚠️ Search name is empty, skipping.");
      return;
    }
    try {
      setLoadingUserSearch(true);
      
      // Fetch all users and filter in JS for case-insensitivity
      // This is the most reliable way without schema changes in Firestore
      console.log("📡 Fetching all users from Firestore for client-side filtering...");
      const snapshot = await getDocs(collection(db, "users"));
      console.log("📦 Total users in collection:", snapshot.size);
      
      const q = searchName.toLowerCase();
      const results = snapshot.docs
        .map(doc => {
          const data = doc.data();
          const userUid = data.uid;
          return {
            id: userUid || doc.id,
            docId: doc.id,
            ...data
          };
        })
        .filter((user: any) => {
          const name = (user.nama || "").toLowerCase();
          return name.includes(q);
        });

      console.log("✅ Filtered results count:", results.length);
      setSearchResults(results);
    } catch (error) {
      console.error("❌ Error search user:", error);
    } finally {
      setLoadingUserSearch(false);
    }
  };

  const handleSubmit = (id: string, type: 'PROSES' | 'SELESAI') => {
    const updates: any = {
      estimationDate,
      plannedAction,
    };
    if (type === 'SELESAI') {
      updates.status = ReportStatus.CLOSED;
      updates.handlingReport = 'Selesai';
    } else if (type === 'PROSES') {
      updates.status = ReportStatus.IN_PROGRESS;
      updates.moveToProses = true;
    }
    onUpdate(id, updates);
    setSelectedReportId(null);
  };

  const isUserBPO = currentUserRole === UserRole.BPO;

  return (
    <TableContainer className="glass-card" as={motion.div} layout>
      <ScrollWrapper>
        <StyledTable>
          <thead>
            <tr>
              <th>TEMUAN</th>
              <th className="hide-mobile">KATEGORI</th>
              <th>TANGGAL</th>
              <th>STATUS</th>
              {!hideActions && <th style={{ textAlign: 'right' }}>AKSI</th>}
            </tr>
          </thead>
          <motion.tbody layout>
            <AnimatePresence mode="popLayout">
              {reports.map((report) => {
                const config = (STATUS_CONFIG as any)[report.status] || STATUS_CONFIG[ReportStatus.OPEN];
                const StatusIcon = config.icon;
                const isEditing = selectedReportId === report.id;
                const isDisposisi = disposisiReportId === report.id;

                return (
                  <React.Fragment key={report.id}>
                    <TableRow
                      active={isEditing || isDisposisi}
                      as={motion.tr}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td>
                        <InfoCell>
                          {report.photoUrl ? (
                            <Thumb
                              src={report.photoUrl}
                              alt="Finding"
                              as={motion.img}
                              whileHover={{ scale: 2.5, zIndex: 10, borderRadius: '12px' }}
                              onClick={() => onImageClick?.(report.photoUrl)}
                              style={{ cursor: 'pointer' }}
                            />
                          ) : (
                            <NoThumb><ShieldAlert size={14} /></NoThumb>
                          )}
                          <div>
                            <Description>{report.description}</Description>
                            <Suggestion>"{report.suggestion}"</Suggestion>
                            <MobileOnly>
                              <Badge>{report.findingType}</Badge>
                            </MobileOnly>
                          </div>
                        </InfoCell>
                      </td>
                      <td className="hide-mobile">
                        <Badge>{report.findingType}</Badge>
                      </td>
                      <td>
                        <DateCell>
                          <Calendar size={12} />
                          {report.date}
                        </DateCell>
                      </td>
                      <td>
                        <StatusBadge color={config.text} bg={config.bg} border={config.border}>
                          <StatusIcon size={10} />
                          {config.label}
                        </StatusBadge>
                      </td>
                      {!hideActions && (
                        <td>
                          <ActionGroup>
                            {report.status !== ReportStatus.CLOSED ? (
                              <>
                                <EditButton
                                  active={isEditing}
                                  onClick={() => handleEdit(report)}
                                  as={motion.button}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Edit3 size={14} />
                                  <span>Edit</span>
                                </EditButton>

                                {isUserBPO && (
                                  <EditButton
                                    active={isDisposisi}
                                    onClick={() => {
                                      setDisposisiReportId(isDisposisi ? null : report.id);
                                      setDisposisiStep(1);
                                      setSelectedUsers([]);
                                      setDisposisiMessage('');
                                      setSearchResults([]);
                                      setSearchName('');
                                    }}
                                    as={motion.button}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{ background: isDisposisi ? 'linear-gradient(135deg, #6366f1, #4338ca)' : 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.2)', color: isDisposisi ? 'white' : '#818cf8' }}
                                  >
                                    <ShieldAlert size={14} />
                                    <span>Disposisi</span>
                                  </EditButton>
                                )}
                              </>
                            ) : (
                              <ActionButton
                                title="Lihat Detail"
                                as={motion.button}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Eye size={16} />
                              </ActionButton>
                            )}
                          </ActionGroup>
                        </td>
                      )}
                    </TableRow>

                    <AnimatePresence>
                      {isEditing && (
                        <EditRow
                          as={motion.tr}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <td colSpan={5}>
                            <EditPanel>
                              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                <InputGroup style={{ flex: 1, minWidth: '200px' }}>
                                  <label>ESTIMASI TANGGAL SELESAI</label>
                                  <input
                                    type="date"
                                    value={estimationDate}
                                    onChange={(e) => setEstimationDate(e.target.value)}
                                  />
                                </InputGroup>

                                <InputGroup style={{ flex: 2, minWidth: '300px' }}>
                                  <label>RENCANA TINDAKAN</label>
                                  <textarea
                                    rows={2}
                                    value={plannedAction}
                                    onChange={(e) => setPlannedAction(e.target.value)}
                                    placeholder="Tambahkan rencana tindakan..."
                                  />
                                </InputGroup>
                              </div>

                              <ButtonGroup style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                                <CancelBtn onClick={() => setSelectedReportId(null)}>
                                  Batal
                                </CancelBtn>
                                <SubmitBtn
                                  style={{ background: '#3b82f6' }}
                                  onClick={() => handleSubmit(report.id, 'PROSES')}
                                >
                                  Proses
                                </SubmitBtn>
                                <SubmitBtn
                                  style={{ background: '#10b981' }}
                                  onClick={() => handleSubmit(report.id, 'SELESAI')}
                                >
                                  Selesaikan
                                </SubmitBtn>
                              </ButtonGroup>
                            </EditPanel>
                          </td>
                        </EditRow>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {isDisposisi && (
                        <EditRow
                          as={motion.tr}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <td colSpan={5}>
                            <EditPanel style={{ borderTopColor: 'rgba(99, 102, 241, 0.3)' }}>
                              <h4 style={{ color: "#818cf8", fontSize: '12px', fontWeight: 900, letterSpacing: '0.1em' }}>FORM DISPOSISI</h4>

                              {disposisiStep === 1 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                  <InputGroup>
                                    <label>CARI PENERIMA (NAMA)</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                      <div style={{ position: 'relative', flex: 1 }}>
                                        <input
                                          type="text"
                                          value={searchName}
                                          onChange={(e) => setSearchName(e.target.value)}
                                          onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                                          placeholder="Ketik nama user..."
                                          style={{ width: '100%', paddingLeft: '2.5rem' }}
                                        />
                                        <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                                      </div>
                                      <SubmitBtn onClick={handleSearchUser} disabled={loadingUserSearch} style={{ padding: '0 1.5rem', background: '#6366f1' }}>
                                        {loadingUserSearch ? '...' : 'CARI'}
                                      </SubmitBtn>
                                    </div>
                                  </InputGroup>

                                  {searchResults.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '0.5rem' }}>
                                      {searchResults.map((u) => (
                                        <UserResultItem
                                          key={u.id}
                                          onClick={() => {
                                            if (!selectedUsers.includes(u.id)) {
                                              setSelectedUsers([...selectedUsers, u.id]);
                                            }
                                          }}
                                        >
                                          <span>{u.nama}</span>
                                          <span style={{ fontSize: '10px', opacity: 0.5 }}>{u.role}</span>
                                        </UserResultItem>
                                      ))}
                                    </div>
                                  )}

                                  {selectedUsers.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                      {selectedUsers.map((id) => {
                                        const found = searchResults.find(u => u.id === id);
                                        return (
                                          <SelectedBadge key={id}>
                                            {found?.nama || id}
                                            <X size={12} onClick={() => setSelectedUsers(selectedUsers.filter(uid => uid !== id))} style={{ cursor: 'pointer' }} />
                                          </SelectedBadge>
                                        );
                                      })}
                                    </div>
                                  )}

                                  <ButtonGroup style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                                    <CancelBtn onClick={() => setDisposisiReportId(null)}>Batal</CancelBtn>
                                    <SubmitBtn disabled={selectedUsers.length === 0} onClick={() => setDisposisiStep(2)} style={{ background: '#6366f1' }}>
                                      Lanjut
                                    </SubmitBtn>
                                  </ButtonGroup>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                  <InputGroup>
                                    <label>PESAN / INSTRUKSI</label>
                                    <textarea
                                      rows={3}
                                      value={disposisiMessage}
                                      onChange={(e) => setDisposisiMessage(e.target.value)}
                                      placeholder="Tulis instruksi pengerjaan..."
                                    />
                                  </InputGroup>

                                  <ButtonGroup style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                                    <CancelBtn onClick={() => setDisposisiStep(1)}>Kembali</CancelBtn>
                                    <SubmitBtn
                                      onClick={async () => {
                                        console.log("📤 Submitting disposisi for report:", report.id);
                                        console.log("👥 Target users:", selectedUsers);
                                        
                                        // 1. Update the report status and data
                                        onUpdate(report.id, {
                                          disposisiTo: selectedUsers,
                                          disposisiMessage,
                                          status: ReportStatus.IN_PROGRESS,
                                        });

                                        // 2. Create notification in Firestore with the requested schema
                                        try {
                                          const notificationsRef = collection(db, "notifications");
                                          const senderName = user?.name || "Admin";
                                          
                                          console.log("🔔 Creating notification document...");
                                          await addDoc(notificationsRef, {
                                            reportId: report.id,
                                            findingType: report.findingType,
                                            title: `Disposisi dari ${senderName}`,
                                            reportTitle: report.description || "Temuan",
                                            message: `instruksi: ${disposisiMessage}`,
                                            toUserId: selectedUsers,
                                            isRead: false,
                                            createdAt: serverTimestamp()
                                          });
                                          console.log("✅ Notification successfully created with sender name and formatted message.");
                                        } catch (err) {
                                          console.error("❌ Failed to create notification:", err);
                                        }

                                        setDisposisiReportId(null);
                                      }}
                                      style={{ background: '#10b981' }}
                                    >
                                      Kirim Disposisi
                                    </SubmitBtn>
                                  </ButtonGroup>
                                </div>
                              )}
                            </EditPanel>
                          </td>
                        </EditRow>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </AnimatePresence>
          </motion.tbody>
        </StyledTable>
      </ScrollWrapper>
      {reports.length === 0 && (
        <Empty>Tidak ada laporan ditemukan.</Empty>
      )}
    </TableContainer>
  );
}

const TableContainer = styled.div`
  border-radius: 1.5rem;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const ScrollWrapper = styled.div`
  overflow-x: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;

  th {
    padding: 1rem;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.2em;
    color: #94a3b8;
    text-transform: uppercase;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
`;

const TableRow = styled.tr<{ active: boolean }>`
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  transition: all 0.3s;
  background: ${({ active }) => active ? 'rgba(59, 130, 246, 0.08)' : 'transparent'};

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
`;

const InfoCell = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
`;

const Thumb = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const NoThumb = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
`;

const Description = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: white;
  margin-bottom: 2px;
`;

const Suggestion = styled.div`
  font-size: 11px;
  color: #64748b;
  font-style: italic;
`;

const MobileOnly = styled.div`
  display: none;
  margin-top: 4px;
  @media (max-width: 640px) {
    display: block;
  }
`;

const Badge = styled.span`
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
`;

const DateCell = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #94a3b8;
`;

const StatusBadge = styled.div<{ color: string, bg: string, border: string }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 9px;
  font-weight: 800;
  color: ${({ color }) => color};
  background: ${({ bg }) => bg};
  border: 1px solid ${({ border }) => border};
`;

const ActionGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 0.5rem 1rem;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    padding: 0.25rem 0.5rem;
    gap: 4px;
  }
`;

const ActionButton = styled.button<{ active?: boolean }>`
  padding: 10px;
  border-radius: 12px;
  background: ${({ active }) => active ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)'};
  color: ${({ active }) => active ? '#60a5fa' : '#94a3b8'};
  border: 1px solid ${({ active }) => active ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
    transform: translateY(-1px);
  }
`;

const EditButton = styled(ActionButton)`
  gap: 8px;
  padding: 8px 16px;
  
  span {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const EditRow = styled.tr`
  background: rgba(0, 0, 0, 0.2);
`;

const EditPanel = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: #3b82f6;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 10px;
    font-weight: 800;
    color: #64748b;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  input, textarea {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 12px 16px;
    color: white;
    font-size: 14px;
    outline: none;
    transition: all 0.2s;

    &:focus {
      border-color: #3b82f6;
      background: rgba(15, 23, 42, 0.8);
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
`;

const SubmitBtn = styled.button`
  padding: 10px 20px;
  border-radius: 12px;
  background: #3b82f6;
  color: white;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelBtn = styled.button`
  padding: 10px 20px;
  background: transparent;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }
`;

const UserResultItem = styled.div`
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #cbd5e1;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    color: white;
  }
`;

const SelectedBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 20px;
  color: #818cf8;
  font-size: 11px;
  font-weight: 600;
`;

const Empty = styled.div`
  padding: 4rem;
  text-align: center;
  color: #475569;
  font-style: italic;
  font-size: 14px;
`;
