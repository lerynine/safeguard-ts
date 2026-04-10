/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
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
  writeBatch
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserRole, ReportStatus } from "./constants/enums";
import { uploadToCloudinary } from "./utils/uploadToCloudinary";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import StatusPage from "./pages/StatusPage";
import GlobalStyle from "./components/GlobalStyle";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
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
    } else if ((updates.estimationDate || updates.moveToProses) && report.status === ReportStatus.OPEN) {
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
        color: 'white',
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
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Memuat Aplikasi...</p>
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
                onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
                onMarkNotificationAsRead={handleMarkNotificationAsRead}
                onLogout={handleLogout}
              />
            }
          />
        </Routes>
      )}
    </BrowserRouter>
  );
}
