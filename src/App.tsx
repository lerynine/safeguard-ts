/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy,
  writeBatch,
  increment,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserRole, ReportStatus } from "./constants/enums";
import { uploadToCloudinary } from "./utils/uploadToCloudinary";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import StatusPage from "./pages/StatusPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import GlobalStyle from "./components/GlobalStyle";
import ConfirmModal from "./components/ConfirmModal";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, reportId: string | null }>({
    isOpen: false,
    reportId: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      console.log("❌ User belum ada");
      return;
    }

    console.log("✅ User UID:", user.uid);

    // Filter by toUserId array using array-contains
    const q = query(
      collection(db, "notifications"),
      where("toUserId", "array-contains", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      console.log("🔥 Snapshot masuk, jumlah:", snapshot.size);

      const notifData = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      console.log("📦 Final notifData:", notifData);
      setNotifications(notifData);
    }, (error) => {
      console.error("❌ Error snapshot:", error);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Initial user state from auth
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.email?.split("@")[0].toUpperCase() || "USER",
          position: "Staff Pelaksana",
          division: "Operasional",
          role: firebaseUser.email?.includes("admin") ? UserRole.BPO : UserRole.USER,
          email: firebaseUser.email,
        });

        // Fetch additional profile data from 'users' collection
        const userRef = doc(db, "users", firebaseUser.uid);
        unsubProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser((prev: any) => ({
              ...prev,
              name: userData.nama || prev.name,
              position: userData.jabatan || prev.position,
              division: userData.divisi || prev.division,
              role: userData.role || prev.role,
            }));
          }
        });
      } else {
        setUser(null);
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = null;
        }
      }
      setLoading(false);
    });

    // Fallback: stop loading after 5 seconds even if Firebase doesn't respond
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubActions = onSnapshot(collection(db, "unsafe_actions"), (snapshot) => {
      const actions = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        findingType: "Unsafe Action",
      }));
      setReports((prev) => {
        const others = prev.filter((r) => r.findingType !== "Unsafe Action");
        return [...actions, ...others];
      });
    });

    const unsubConditions = onSnapshot(collection(db, "unsafe_conditions"), (snapshot) => {
      const conditions = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        findingType: "Unsafe Condition",
      }));
      setReports((prev) => {
        const others = prev.filter((r) => r.findingType !== "Unsafe Condition");
        return [...conditions, ...others];
      });
    });

    return () => {
      unsubActions();
      unsubConditions();
    };
  }, [user]);

  const incrementUserPoints = async (userId: string, amount: number) => {
    try {
      // Find the user document where the field 'uid' matches userId
      const q = query(collection(db, "users"), where("uid", "==", userId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        await updateDoc(doc(db, "users", userDoc.id), { 
          points: increment(amount) 
        });
      } else {
        console.warn(`⚠️ User document with uid ${userId} not found. Cannot award points.`);
      }
    } catch (error) {
      console.error("Error incrementing points:", error);
    }
  };

  const handleAddReport = async (formData: any) => {
    if (!user) return;
    try {
      const imageUrl = formData.photo ? await uploadToCloudinary(formData.photo) : null;
      const collectionName = formData.findingType === "Unsafe Action" ? "unsafe_actions" : "unsafe_conditions";

      await addDoc(collection(db, collectionName), {
        date: formData.date,
        description: formData.description,
        suggestion: formData.suggestion,
        photoUrl: imageUrl,
        status: ReportStatus.OPEN,
        findingType: formData.findingType,
        latitude: formData.latitude ?? null,
        longitude: formData.longitude ?? null,
        reportedBy: {
          uid: user.uid,
          name: user.name,
          email: user.email,
          division: user.division,
        },
        createdAt: serverTimestamp(),
      });

      // Award points for reporting
      await incrementUserPoints(user.uid, 10);
    } catch (error) {
      console.error("Error saving report:", error);
      alert("Gagal mengirim laporan");
    }
  };

  const handleUpdateReport = async (reportId: string, updates: any) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    const collectionName = report.findingType === "Unsafe Action" ? "unsafe_actions" : "unsafe_conditions";
    const docRef = doc(db, collectionName, reportId);

    let newStatus = report.status;
    const finalUpdates: any = { ...updates };

    if (updates.handlingReport && report.status !== ReportStatus.CLOSED) {
      newStatus = ReportStatus.CLOSED;
      finalUpdates.closedAt = new Date().toISOString().split("T")[0];
      
      // Award points when report is closed
      if (report.reportedBy?.uid) {
        await incrementUserPoints(report.reportedBy.uid, 50); // Reporter gets 50 pts
      }
      await incrementUserPoints(user.uid, 20); // BPO gets 20 pts
    } else if ((updates?.estimationDate || updates?.moveToProses) && report?.status === ReportStatus.OPEN) {
      newStatus = ReportStatus.IN_PROGRESS;
    }

    finalUpdates.status = newStatus;

    try {
      await updateDoc(docRef, finalUpdates);
    } catch (error) {
      console.error("Error updating report:", error);
      alert("Gagal memperbarui laporan");
    }
  };
  
  const handleDeleteReport = (reportId: string) => {
    console.log("🚀 App: handleDeleteReport called with ID:", reportId);
    setDeleteConfirm({ isOpen: true, reportId });
  };

  const confirmDelete = async () => {
    const reportId = deleteConfirm.reportId;
    console.log("🎯 App: confirmDelete triggered for ID:", reportId);
    if (!reportId) return;

    const report = reports.find((r) => r.id === reportId);
    if (!report) {
      console.error("❌ App: Report not found in state:", reportId);
      setDeleteConfirm({ isOpen: false, reportId: null });
      return;
    }

    const collectionName = report.findingType === "Unsafe Action" ? "unsafe_actions" : "unsafe_conditions";
    console.log("📂 App: Deleting from collection:", collectionName);
    const docRef = doc(db, collectionName, reportId);

    try {
      await deleteDoc(docRef);
      console.log("✅ App: Document successfully deleted from Firestore");
      setDeleteConfirm({ isOpen: false, reportId: null });
    } catch (error) {
      console.error("❌ App: Error deleting report:", error);
      setDeleteConfirm({ isOpen: false, reportId: null });
    }
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    try {
      const ref = doc(db, "notifications", id);
      await updateDoc(ref, { isRead: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkNotificationsAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    
    unread.forEach((notif) => {
      const ref = doc(db, "notifications", notif.id);
      batch.update(ref, { isRead: true });
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#020617', 
        color: '#f8fafc',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid rgba(255,255,255,0.1)', 
          borderTopColor: '#3b82f6', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Memuat Aplikasi...</p>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <GlobalStyle />
      {!user ? (
        <Onboarding onFinish={setUser} />
      ) : (
        <Routes>
          <Route path="/" element={<Navigate to="/reports" replace />} />
          <Route
            path="/reports"
            element={
              <Dashboard
                user={user}
                reports={reports}
                notifications={notifications}
                onAddReport={handleAddReport}
                onUpdateReport={handleUpdateReport}
                onDeleteReport={handleDeleteReport}
                onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
                onMarkNotificationAsRead={handleMarkNotificationAsRead}
                onLogout={handleLogout}
              />
            }
          />
          <Route
            path="/reports/menunggu"
            element={
              <StatusPage
                user={user}
                reports={reports.filter((r) => r.status === ReportStatus.OPEN)}
                allReports={reports}
                status={ReportStatus.OPEN}
                notifications={notifications}
                onAddReport={handleAddReport}
                onUpdateReport={handleUpdateReport}
                onDeleteReport={handleDeleteReport}
                onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
                onMarkNotificationAsRead={handleMarkNotificationAsRead}
                onLogout={handleLogout}
              />
            }
          />
          <Route
            path="/reports/diproses"
            element={
              <StatusPage
                user={user}
                reports={reports.filter((r) => r.status === ReportStatus.IN_PROGRESS)}
                allReports={reports}
                status={ReportStatus.IN_PROGRESS}
                notifications={notifications}
                onAddReport={handleAddReport}
                onUpdateReport={handleUpdateReport}
                onDeleteReport={handleDeleteReport}
                onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
                onMarkNotificationAsRead={handleMarkNotificationAsRead}
                onLogout={handleLogout}
              />
            }
          />
          <Route
            path="/reports/selesai"
            element={
              <StatusPage
                user={user}
                reports={reports.filter((r) => r.status === ReportStatus.CLOSED)}
                allReports={reports}
                status={ReportStatus.CLOSED}
                notifications={notifications}
                onAddReport={handleAddReport}
                onUpdateReport={handleUpdateReport}
                onDeleteReport={handleDeleteReport}
                onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
                onMarkNotificationAsRead={handleMarkNotificationAsRead}
                onLogout={handleLogout}
              />
            }
          />
          <Route
            path="/analytics"
            element={<AnalyticsPage reports={reports} />}
          />
          <Route
            path="/leaderboard"
            element={<LeaderboardPage />}
          />
        </Routes>
      )}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Hapus Laporan"
        message="Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, reportId: null })}
        type="danger"
      />
    </BrowserRouter>
  );
}
