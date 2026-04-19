/**
 * FaceEnrollScreen.jsx
 * Enroll 3 samples of user's face for future clock-in matching.
 */
import React, { useEffect, useRef, useState } from "react";
import { Camera, Check, X, Loader2, AlertCircle } from "lucide-react";
import { loadFaceModels, detectFace } from "./faceRecognition";
import { face } from "./api";

export default function FaceEnrollScreen({ onClose, onSuccess }) {
  const [step, setStep] = useState("init"); // init | capturing | submitting | done | error
  const [samples, setSamples] = useState([]);
  const [quality, setQuality] = useState(0);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  async function startCapture() {
    setStep("capturing");
    setSamples([]);
    try {
      await loadFaceModels();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 480, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      captureLoop();
    } catch (e) {
      setError(`Kamera error: ${e.message}`);
      setStep("error");
    }
  }

  async function captureLoop() {
    if (!videoRef.current) return;
    try {
      const det = await detectFace(videoRef.current);
      if (det && det.quality > 0.75) {
        setQuality(det.quality);
        setSamples(prev => {
          if (prev.length >= 3) return prev;
          // Throttle: only add if significantly different from last sample
          if (prev.length === 0 || Date.now() - (prev[prev.length-1].ts || 0) > 800) {
            return [...prev, { embedding: det.embedding, quality: det.quality, ts: Date.now() }];
          }
          return prev;
        });
      } else if (det) {
        setQuality(det.quality);
      }
    } catch (e) {
      console.error(e);
    }
    animFrameRef.current = requestAnimationFrame(captureLoop);
  }

  useEffect(() => {
    if (samples.length >= 3) {
      submitEnrollment();
    }
  }, [samples.length]);

  async function submitEnrollment() {
    setStep("submitting");
    cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());

    // Average the 3 embeddings for robustness
    const avgEmbedding = samples[0].embedding.map((_, i) =>
      samples.reduce((sum, s) => sum + s.embedding[i], 0) / samples.length
    );
    const avgQuality = samples.reduce((sum, s) => sum + s.quality, 0) / samples.length;

    try {
      await face.enroll(avgEmbedding, avgQuality);
      setStep("done");
      setTimeout(onSuccess, 1500);
    } catch (e) {
      setError(e.message);
      setStep("error");
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={e => e.stopPropagation()}>
        <div style={styles.grip}/>
        <button onClick={onClose} style={styles.close}><X size={18}/></button>

        <h2 style={styles.title}>Daftarkan Wajah</h2>
        <p style={styles.subtitle}>
          Butuh 3 sampel · data diproses lokal · hanya vektor yang dikirim
        </p>

        {step === "init" && (
          <div style={{ padding: "16px 0" }}>
            <div style={{ background: "#F5EBD3", borderRadius: 10, padding: 12, marginBottom: 20,
                          fontSize: 11, color: "#6F5016", lineHeight: 1.5 }}>
              <b>Tips:</b> pencahayaan cukup, wajah menghadap kamera, jangan pakai kacamata gelap atau masker.
            </div>
            <button onClick={startCapture} style={styles.primaryBtn}>
              <Camera size={16}/> Mulai Enrollment
            </button>
          </div>
        )}

        {step === "capturing" && (
          <div style={styles.center}>
            <div style={styles.videoFrame}>
              <video ref={videoRef} autoPlay playsInline muted
                style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}/>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "14px 0" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 12, height: 12, borderRadius: "50%",
                  background: samples.length > i ? "#0F6E56" : "rgba(10,42,35,0.15)",
                  transition: "background 0.3s",
                }}/>
              ))}
            </div>

            <div style={styles.status}>
              {samples.length === 0 ? "Posisikan wajah di tengah…" :
               samples.length === 1 ? "Bagus! Sampel 2 dari 3…" :
               samples.length === 2 ? "Hampir selesai, sampel terakhir…" :
               "Memproses…"}
            </div>
            <div style={styles.statusMeta}>
              Kualitas: {(quality * 100).toFixed(0)}% · Sampel: {samples.length}/3
            </div>
          </div>
        )}

        {step === "submitting" && (
          <div style={styles.center}>
            <Loader2 size={40} style={{ color: "#0F6E56", animation: "spin 1s linear infinite" }}/>
            <div style={styles.status}>Mengirim ke server…</div>
          </div>
        )}

        {step === "done" && (
          <div style={styles.center}>
            <div style={{ ...styles.statusCircle, background: "#0F6E56", color: "white", width: 80, height: 80 }}>
              <Check size={40}/>
            </div>
            <div style={{ ...styles.status, fontSize: 18, color: "#085041" }}>
              Alhamdulillah, berhasil!
            </div>
          </div>
        )}

        {step === "error" && (
          <div style={styles.center}>
            <div style={{ ...styles.statusCircle, background: "rgba(184,65,65,0.14)", color: "#B84141" }}>
              <AlertCircle size={28}/>
            </div>
            <div style={{ ...styles.status, color: "#B84141" }}>Gagal enroll</div>
            <div style={styles.statusMeta}>{error}</div>
            <button onClick={() => { setError(null); setStep("init"); setSamples([]); }}
              style={{ ...styles.primaryBtn, marginTop: 20 }}>Coba Lagi</button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(10,42,35,0.55)",
    backdropFilter: "blur(6px)", zIndex: 1000,
    display: "flex", alignItems: "flex-end", justifyContent: "center",
  },
  sheet: {
    width: "100%", maxWidth: 440, background: "#F7F5EE",
    borderRadius: "28px 28px 0 0", padding: 24, position: "relative",
    animation: "slideUp 0.3s ease-out",
  },
  grip: { width: 36, height: 4, background: "rgba(10,42,35,0.12)", borderRadius: 2, margin: "0 auto 20px" },
  close: { position: "absolute", top: 20, right: 20, background: "transparent", border: "none", cursor: "pointer" },
  title: { margin: "0 0 4px", fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, color: "#0A2A23" },
  subtitle: { margin: "0 0 24px", fontSize: 13, color: "#3D5A50" },
  primaryBtn: {
    width: "100%", padding: 14, background: "#0F6E56", color: "white",
    border: "none", borderRadius: 14, fontSize: 14, fontWeight: 500, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  center: { textAlign: "center", padding: "20px 0" },
  status: { marginTop: 14, fontSize: 15, fontWeight: 500, color: "#0A2A23" },
  statusMeta: { marginTop: 4, fontSize: 11, color: "#3D5A50" },
  statusCircle: {
    width: 60, height: 60, borderRadius: "50%", margin: "0 auto",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  videoFrame: {
    width: 220, height: 220, margin: "0 auto 16px", borderRadius: "50%",
    overflow: "hidden", position: "relative", border: "3px solid #0F6E56", background: "#000",
  },
};
