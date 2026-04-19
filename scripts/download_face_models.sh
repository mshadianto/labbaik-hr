#!/usr/bin/env bash
# =============================================================
# Download face-api.js model weights
# Source: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
#
# Run from frontend-employee/ directory:
#   bash ../scripts/download_face_models.sh
# =============================================================

set -euo pipefail

MODELS_DIR="${1:-public/models}"
BASE_URL="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

mkdir -p "$MODELS_DIR"
cd "$MODELS_DIR"

echo "▸ Downloading face-api.js models to $MODELS_DIR..."
echo ""

# List of required model files
FILES=(
  # Tiny Face Detector (primary detector — fast, accurate enough)
  "tiny_face_detector_model-weights_manifest.json"
  "tiny_face_detector_model-shard1"

  # 68-point face landmarks (needed for eye detection / liveness)
  "face_landmark_68_model-weights_manifest.json"
  "face_landmark_68_model-shard1"

  # Face recognition (128-dim embedding)
  "face_recognition_model-weights_manifest.json"
  "face_recognition_model-shard1"
  "face_recognition_model-shard2"

  # Face expression (optional — future emotion detection)
  "face_expression_model-weights_manifest.json"
  "face_expression_model-shard1"
)

TOTAL=${#FILES[@]}
I=0

for file in "${FILES[@]}"; do
  I=$((I+1))
  if [[ -f "$file" ]]; then
    echo "  [$I/$TOTAL] ✓ $file (already exists)"
    continue
  fi
  echo -n "  [$I/$TOTAL] Downloading $file ... "
  if curl -fsSL "$BASE_URL/$file" -o "$file"; then
    echo "✓"
  else
    echo "✗ FAILED"
    exit 1
  fi
done

echo ""
echo "▸ Verifying downloads..."
TOTAL_SIZE=$(du -sh . | cut -f1)
FILE_COUNT=$(ls -1 | wc -l)
echo "  Total size: $TOTAL_SIZE ($FILE_COUNT files)"
echo ""
echo "✓ Done. Models ready at $MODELS_DIR"
echo ""
echo "Verify in browser:"
echo "  http://localhost:5173/models/tiny_face_detector_model-weights_manifest.json"
