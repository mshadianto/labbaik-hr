/**
 * App.jsx — Labbaik HR Employee PWA
 * ===================================
 * Top-level shell: session, profile, tab routing, modals.
 * Page implementations live in src/pages/.
 */
import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { supabase, auth, me, attendance } from "./api";
import { theme, globalStyles } from "./theme";

import ClockInScreen from "./ClockInScreen";
import FaceEnrollScreen from "./FaceEnrollScreen";

import LoginScreen from "./pages/LoginScreen";
import HomeScreen from "./pages/HomeScreen";
import CutiScreen from "./pages/CutiScreen";
import AIScreen from "./pages/AIScreen";
import PayrollScreen from "./pages/PayrollScreen";
import ProfileScreen from "./pages/ProfileScreen";

import BottomNav from "./components/BottomNav";

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("home");
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [clockInOpen, setClockInOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    me.get().then(setProfile).catch((err) => console.error("Load profile failed:", err));
    attendance.today().then(setTodayAttendance).catch(() => {});
  }, [session]);

  const handleLogout = async () => {
    await auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const handleClockInSuccess = () => {
    setClockInOpen(false);
    attendance.today().then(setTodayAttendance).catch(() => {});
  };

  const handleEnrollSuccess = () => {
    setEnrollOpen(false);
    alert("Wajah berhasil didaftarkan. Anda sekarang bisa clock-in.");
  };

  if (loading) {
    return (
      <>
        <style>{globalStyles}</style>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader2 size={30} style={{ color: theme.primary, animation: "spin 1s linear infinite" }} />
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <style>{globalStyles}</style>
        <LoginScreen onSuccess={() => {}} />
      </>
    );
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div
        style={{
          minHeight: "100vh",
          background: "#E8E3D4",
          padding: 20,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            minHeight: 800,
            background: theme.bg,
            borderRadius: 32,
            boxShadow: "0 20px 60px rgba(10,42,35,0.18)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              height: "calc(100vh - 40px)",
              maxHeight: 820,
              overflowY: "auto",
              paddingBottom: tab === "ai" ? 0 : 80,
            }}
          >
            {tab === "home" && profile && (
              <HomeScreen
                profile={profile}
                todayAttendance={todayAttendance}
                onClockInOpen={() => setClockInOpen(true)}
                setTab={setTab}
              />
            )}
            {tab === "cuti" && <CutiScreen profile={profile} />}
            {tab === "payroll" && <PayrollScreen />}
            {tab === "ai" && <AIScreen />}
            {tab === "profil" && (
              <ProfileScreen
                profile={profile}
                onLogout={handleLogout}
                onEnrollFace={() => setEnrollOpen(true)}
              />
            )}
          </div>

          {tab !== "ai" && <BottomNav tab={tab} setTab={setTab} />}

          {clockInOpen && (
            <ClockInScreen
              mode={todayAttendance?.clock_in_at && !todayAttendance?.clock_out_at ? "out" : "in"}
              onClose={() => setClockInOpen(false)}
              onSuccess={handleClockInSuccess}
            />
          )}

          {enrollOpen && (
            <FaceEnrollScreen
              onClose={() => setEnrollOpen(false)}
              onSuccess={handleEnrollSuccess}
            />
          )}
        </div>
      </div>
    </>
  );
}
