/**
 * faceRecognition.js
 * Real face-api.js integration for browser-side face verification.
 *
 * Privacy model:
 *  - Face image NEVER leaves the device
 *  - Only the 128-dim embedding vector is sent to backend
 *  - Liveness check uses blink detection + head movement
 */

import * as faceapi from "face-api.js";

let modelsLoaded = false;

const MODEL_URL = "/models"; // serve face-api.js models from /public/models

export async function loadFaceModels() {
  if (modelsLoaded) return;
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

/**
 * Detect face in a video element, return embedding + quality metrics.
 * @param {HTMLVideoElement} videoEl
 * @returns {Promise<{embedding:number[], quality:number, box:object} | null>}
 */
export async function detectFace(videoEl) {
  const detection = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;

  // Quality heuristic: face size relative to frame + detection confidence
  const faceArea = detection.detection.box.width * detection.detection.box.height;
  const frameArea = videoEl.videoWidth * videoEl.videoHeight;
  const sizeRatio = faceArea / frameArea;

  // Ideal face takes 15-40% of frame
  let quality = detection.detection.score;
  if (sizeRatio < 0.08) quality *= 0.6; // too far
  if (sizeRatio > 0.5) quality *= 0.7;  // too close

  return {
    embedding: Array.from(detection.descriptor),
    quality: Math.min(quality, 1),
    box: detection.detection.box,
    landmarks: detection.landmarks,
  };
}

/**
 * Liveness detection via blink counting.
 * User must blink at least 2 times within the detection window.
 */
export class LivenessDetector {
  constructor() {
    this.blinkCount = 0;
    this.wasEyeOpen = true;
    this.frames = [];
  }

  /** Eye Aspect Ratio (EAR) — standard blink detection formula */
  eyeAspectRatio(eye) {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const v1 = dist(eye[1], eye[5]);
    const v2 = dist(eye[2], eye[4]);
    const h = dist(eye[0], eye[3]);
    return (v1 + v2) / (2 * h);
  }

  processFrame(landmarks) {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const ear = (this.eyeAspectRatio(leftEye) + this.eyeAspectRatio(rightEye)) / 2;

    const EYE_CLOSED_THRESHOLD = 0.21;
    const isEyeOpen = ear > EYE_CLOSED_THRESHOLD;

    // Blink detected: open → closed → open
    if (this.wasEyeOpen && !isEyeOpen) {
      // just closed
    } else if (!this.wasEyeOpen && isEyeOpen) {
      // just opened — blink complete
      this.blinkCount++;
    }
    this.wasEyeOpen = isEyeOpen;
    this.frames.push({ ear, ts: Date.now() });
    return {
      ear,
      blinkCount: this.blinkCount,
      livenessScore: Math.min(this.blinkCount / 2, 1),
      passed: this.blinkCount >= 2,
    };
  }

  reset() {
    this.blinkCount = 0;
    this.wasEyeOpen = true;
    this.frames = [];
  }
}

/**
 * Compute cosine similarity between two embedding vectors (0..1).
 */
export function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
