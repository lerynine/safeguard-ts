/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, where, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db } from './firebase';
import Dashboard from './components/Dashboard';
import ReportTable from './components/ReportTable';
import { ReportStatus, UserRole } from './constants/enums';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // Fetch user role from Firestore
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', authUser.uid)));
        
        let userData = {
          uid: authUser.uid,
          name: authUser.displayName || 'User',
          email: authUser.email,
          role: UserRole.USER
        };

        if (!userDoc.empty) {
          userData = { ...userData, ...userDoc.docs[0].data() };
        } else {
          // Create user doc if not exists
          await addDoc(collection(db, 'users'), {
            uid: authUser.uid,
            nama: authUser.displayName,
            email: authUser.email,
            role: UserRole.USER,
            createdAt: serverTimestamp()
          });
        }
        
        setUser(userData);

        // Listen for reports
        const unsubscribeReports = onSnapshot(collection(db, 'reports'), (snapshot) => {
          setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Listen for notifications
        const unsubscribeNotifs = onSnapshot(collection(db, 'notifications'), (snapshot) => {
          setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        setLoading(false);
        return () => {
          unsubscribeReports();
          unsubscribeNotifs();
        };
      } else {
        setUser(null);
        setReports([]);
        setNotifications([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleAddReport = async (data: any) => {
    try {
      await addDoc(collection(db, 'reports'), {
        ...data,
        authorId: user.uid,
        authorName: user.name,
        status: ReportStatus.OPEN,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Add report failed:", error);
    }
  };

  const handleUpdateReport = async (id: string, updates: any) => {
    try {
      await updateDoc(doc(db, 'reports', id), updates);
    } catch (error) {
      console.error("Update report failed:", error);
    }
  };

  const handleMarkNotificationsAsRead = async () => {
    if (!user?.uid) return;
    
    // Filter unread notifications for this user
    const unreadNotifs = notifications.filter(n => n.toUserId?.includes(user.uid) && !n.isRead);
    if (unreadNotifs.length === 0) return;

    const batch = writeBatch(db);
    unreadNotifs.forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { isRead: true });
    });
    
    try {
      await batch.commit();
    } catch (error) {
      console.error("Mark as read failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-pulse text-xl font-bold">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center space-y-6">
          <h1 className="text-3xl font-bold text-white">Sistem Pelaporan Temuan</h1>
          <p className="text-slate-400">Silakan login untuk melanjutkan</p>
          <button 
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
          >
            Login dengan Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={
        <Dashboard 
          user={user}
          reports={reports}
          notifications={notifications}
          onAddReport={handleAddReport}
          onUpdateReport={handleUpdateReport}
          onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
          onLogout={handleLogout}
        />
      } />
      <Route path="/reports/*" element={
        <div className="p-8">
          <ReportTable 
            reports={reports}
            user={user}
            onUpdate={handleUpdateReport}
          />
        </div>
      } />
    </Routes>
  );
}
