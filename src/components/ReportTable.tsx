import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Edit3,
  ShieldAlert
} from 'lucide-react';
import { ReportStatus, UserRole } from '../constants/enums';
import { db } from '../firebase'; // sesuaikan path
import { collection, query, where, getDocs } from "firebase/firestore";
import { useEffect } from 'react';
import { getAuth } from 'firebase/auth';

const fetchCurrentUserRole = async (uid: string) => {
  const q = query(
    collection(db, 'users'),
    where('uid', '==', uid)
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const userData = snapshot.docs[0].data();
    return userData.role;
  }

  return null;
};
const auth = getAuth();
const currentUser = auth.currentUser;
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
  useEffect(() => {
    console.log("🔥 CURRENT USER ROLE:", currentUserRole);
  }, [currentUserRole]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [disposisiMessage, setDisposisiMessage] = useState('');
  const [disposisiStep, setDisposisiStep] = useState<1 | 2>(1);
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingUserSearch, setLoadingUserSearch] = useState(false);
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
    if (!searchName.trim()) return;

    try {
      setLoadingUserSearch(true);

      const q = query(
        collection(db, "users"),
        where("name", ">=", searchName),
        where("name", "<=", searchName + "\uf8ff")
      );

      const snapshot = await getDocs(q);

      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("🔎 Search Results:", results);

      setSearchResults(results);
    } catch (error) {
      console.error("❌ Error search user:", error);
    } finally {
      setLoadingUserSearch(false);
    }
  };
  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setUsersList(users);
  };

  const handleSubmit = (id: string, type: 'PROSES' | 'SELESAI') => {
    const updates: any = {
      estimationDate,
      plannedAction,
    };

    if (type === 'SELESAI') {
      updates.handlingReport = 'Selesai';
    } else if (type === 'PROSES') {
      updates.moveToProses = true;
    }

    onUpdate(id, updates);
    setSelectedReportId(null);
  };

  // Robust BPO check
  const isUserBPO = currentUserRole === UserRole.BPO;

  useEffect(() => {
    const loadUser = async () => {
      const auth = getAuth();
      const authUser = auth.currentUser;

      if (!authUser) {
        console.log("❌ Tidak ada user login");
        return;
      }

      console.log("🔎 Cari user dengan UID:", authUser.uid);

      const q = query(
        collection(db, "users"),
        where("uid", "==", authUser.uid)
      );

      const snapshot = await getDocs(q);

      console.log("📦 Snapshot size:", snapshot.size);

      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        console.log("✅ USER DATA:", userData);
        setCurrentUserRole(userData.role);
      } else {
        console.log("❌ User tidak ditemukan di Firestore");
      }
    };

    loadUser();
  }, []);

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

                return (
                  <React.Fragment key={report.id}>
                    <TableRow
                      active={isEditing}
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
                          {isUserBPO && report.status !== ReportStatus.CLOSED && (
                            <ActionButton
                              onClick={async () => {
                                await fetchUsers();
                                setDisposisiReportId(report.id);
                                setDisposisiStep(1);
                                setSelectedUsers([]);
                                setDisposisiMessage('');
                              }}
                              as={motion.button}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Disposisi
                            </ActionButton>
                          )}
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
                              <InputGroup>
                                <label>TANGGAL PERUBAHAN</label>
                                <input
                                  type="date"
                                  value={estimationDate}
                                  onChange={(e) => setEstimationDate(e.target.value)}
                                />
                              </InputGroup>

                              <InputGroup>
                                <label>NOTE</label>
                                <textarea
                                  rows={2}
                                  value={plannedAction}
                                  onChange={(e) => setPlannedAction(e.target.value)}
                                  placeholder="Tambahkan catatan..."
                                />
                              </InputGroup>

                              <ButtonGroup>
                                <CancelBtn onClick={() => setSelectedReportId(null)}>
                                  Batal
                                </CancelBtn>

                                {report.status === ReportStatus.OPEN && (
                                  <SubmitBtn
                                    onClick={() => handleSubmit(report.id, 'PROSES')}
                                  >
                                    Update Proses
                                  </SubmitBtn>
                                )}

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
  {disposisiReportId === report.id && (
    <EditRow
      as={motion.tr}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <td colSpan={5}>
        <EditPanel>
          <h4 style={{ color: "#60a5fa" }}>DISPOSISI</h4>

          {/* ================= STEP 1 ================= */}
          {disposisiStep === 1 && (
            <>
              <h4 style={{ color: "white" }}>
                Pilih Penerima Disposisi
              </h4>

              {/* SEARCH INPUT */}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Cari nama user..."
                  style={{ flex: 1, padding: 6 }}
                />

                <button onClick={handleSearchUser}>
                  Search
                </button>
              </div>

              {/* SEARCH RESULT */}
              <div style={{ marginTop: 10 }}>
                {searchResults.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      padding: 6,
                      cursor: "pointer",
                      background: "#1f2937",
                      marginBottom: 4,
                    }}
                    onClick={() => {
                      if (!selectedUsers.includes(u.id)) {
                        setSelectedUsers([
                          ...selectedUsers,
                          u.id,
                        ]);
                      }
                    }}
                  >
                    {u.name}
                  </div>
                ))}
              </div>

              {/* SELECTED USERS */}
              {selectedUsers.length > 0 && (
                <div style={{ marginTop: 15 }}>
                  <h5 style={{ color: "white" }}>
                    Dipilih:
                  </h5>

                  {selectedUsers.map((id) => {
                    const user = searchResults.find(
                      (u) => u.id === id
                    );

                    return (
                      <div
                        key={id}
                        style={{
                          background: "#374151",
                          padding: 6,
                          marginBottom: 4,
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>
                          {user?.name || id}
                        </span>

                        <button
                          onClick={() =>
                            setSelectedUsers(
                              selectedUsers.filter(
                                (uid) => uid !== id
                              )
                            )
                          }
                        >
                          X
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <ButtonGroup>
                <CancelBtn
                  onClick={() =>
                    setDisposisiReportId(null)
                  }
                >
                  Batal
                </CancelBtn>

                <SubmitBtn
                  disabled={selectedUsers.length === 0}
                  onClick={() =>
                    setDisposisiStep(2)
                  }
                >
                  Next
                </SubmitBtn>
              </ButtonGroup>
            </>
          )}

          {/* ================= STEP 2 ================= */}
          {disposisiStep === 2 && (
            <>
              <InputGroup>
                <label>Instruksi / Pesan</label>
                <textarea
                  rows={3}
                  value={disposisiMessage}
                  onChange={(e) =>
                    setDisposisiMessage(
                      e.target.value
                    )
                  }
                  placeholder="Masukkan instruksi untuk penerima disposisi..."
                />
              </InputGroup>

              <ButtonGroup>
                <CancelBtn
                  onClick={() =>
                    setDisposisiStep(1)
                  }
                >
                  Back
                </CancelBtn>

                <SubmitBtn
                  onClick={() => {
                    console.log(
                      "Disposisi ke:",
                      selectedUsers
                    );
                    console.log(
                      "Pesan:",
                      disposisiMessage
                    );

                    onUpdate(report.id, {
                      disposisiTo:
                        selectedUsers,
                      disposisiMessage,
                      status:
                        ReportStatus.IN_PROGRESS,
                    });

                    setDisposisiReportId(null);
                    setDisposisiStep(1);
                    setSelectedUsers([]);
                    setDisposisiMessage("");
                  }}
                >
                  Submit Disposisi
                </SubmitBtn>
              </ButtonGroup>
            </>
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
  border-radius: 2rem;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.4);
`;

const ScrollWrapper = styled.div`
  overflow-x: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;

  th {
    padding: 0.75rem 1rem;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.2em;
    color: #64748b;
    text-transform: uppercase;
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    @media (max-width: 480px) {
      padding: 0.5rem 0.75rem;
      font-size: 7px;
      letter-spacing: 0.1em;
    }
  }

  .hide-mobile {
    @media (max-width: 640px) {
      display: none;
    }
  }
`;

const TableRow = styled.tr<{ active: boolean }>`
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  transition: background 0.2s;
  background: ${({ active }) => active ? 'rgba(59, 130, 246, 0.05)' : 'transparent'};

  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  @media (max-width: 480px) {
    td {
      padding: 0.25rem 0;
    }
  }
`;

const InfoCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;

  @media (max-width: 480px) {
    padding: 0.4rem 0.5rem;
    gap: 0.4rem;
  }
`;

const Thumb = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 480px) {
    width: 24px;
    height: 24px;
    border-radius: 4px;
  }
`;

const NoThumb = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
`;

const Description = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: white;
  margin-bottom: 1px;

  @media (max-width: 480px) {
    font-size: 10px;
  }
`;

const Suggestion = styled.div`
  font-size: 10px;
  color: #64748b;
  font-style: italic;

  @media (max-width: 480px) {
    font-size: 8px;
  }
`;

const MobileOnly = styled.div`
  display: none;
  margin-top: 4px;
  @media (max-width: 640px) {
    display: block;
  }
`;

const Badge = styled.span`
  padding: 3px 6px;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;

  @media (max-width: 480px) {
    font-size: 7px;
    padding: 2px 4px;
  }
`;

const DateCell = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #94a3b8;

  @media (max-width: 480px) {
    font-size: 9px;
    gap: 4px;
    svg {
      width: 10px;
      height: 10px;
    }
  }
`;

const StatusBadge = styled.div<{ color: string, bg: string, border: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 8px;
  font-weight: 800;
  color: ${({ color }) => color};
  background: ${({ bg }) => bg};
  border: 1px solid ${({ border }) => border};

  @media (max-width: 480px) {
    font-size: 7px;
    padding: 2px 6px;
    gap: 4px;
    svg {
      width: 8px;
      height: 8px;
    }
  }
`;

const ActionGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding-right: 1rem;

  @media (max-width: 480px) {
    padding-right: 0.5rem;
    gap: 4px;
  }
`;

const ActionButton = styled.button<{ active?: boolean }>`
  padding: 8px;
  border-radius: 12px;
  background: ${({ active }) => active ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'rgba(255, 255, 255, 0.03)'};
  color: ${({ active }) => active ? 'white' : '#94a3b8'};
  border: 1px solid ${({ active }) => active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${({ active }) => active ? '0 10px 20px -5px rgba(37, 99, 235, 0.4)' : 'none'};

  @media (max-width: 480px) {
    padding: 6px;
    border-radius: 8px;
    svg {
      width: 14px;
      height: 14px;
    }
  }

  &:hover {
    background: ${({ active }) => active ? 'linear-gradient(135deg, #2563eb, #1e40af)' : 'rgba(255, 255, 255, 0.08)'};
    color: white;
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
`;

const EditButton = styled(ActionButton)`
  gap: 6px;
  padding: 8px 14px;
  
  span {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  @media (max-width: 480px) {
    padding: 6px 10px;
    span {
      font-size: 8px;
    }
    svg {
      width: 12px;
      height: 12px;
    }
  }
`;

const EditRow = styled.tr`
  background: linear-gradient(to bottom, rgba(59, 130, 246, 0.05), transparent);
`;

const EditPanel = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1.5rem;
  border-top: 1px solid rgba(59, 130, 246, 0.15);
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 0.75rem;
    gap: 0.5rem;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(to bottom, #3b82f6, #10b981);
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;

  @media (max-width: 480px) {
    gap: 4px;
  }

  label {
    font-size: 10px;
    font-weight: 900;
    color: #60a5fa;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    opacity: 0.8;

    @media (max-width: 480px) {
      font-size: 8px;
    }
  }

  input, textarea {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 14px 18px;
    color: white;
    font-size: 13px;
    outline: none;
    transition: all 0.3s;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);

    @media (max-width: 480px) {
      padding: 8px 12px;
      font-size: 10px;
      border-radius: 10px;
    }

    &:focus {
      border-color: #3b82f6;
      background: rgba(15, 23, 42, 1);
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1), inset 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    &::placeholder {
      color: #475569;
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (max-width: 480px) {
    gap: 8px;
  }
`;

const SubmitBtn = styled.button`
  padding: 14px 24px;
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

  @media (max-width: 480px) {
    padding: 10px 16px;
    font-size: 9px;
    border-radius: 12px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px -5px rgba(37, 99, 235, 0.5);
    filter: brightness(1.1);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CancelBtn = styled.button`
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.03);
  color: #94a3b8;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;

  @media (max-width: 480px) {
    padding: 10px 16px;
    font-size: 9px;
    border-radius: 12px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }
`;

const Empty = styled.div`
  padding: 4rem;
  text-align: center;
  color: #475569;
  font-style: italic;
  font-size: 14px;
`;