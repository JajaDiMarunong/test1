// =====================================================================
// ARTWORK CONFIG
// Add more entries here later to scale up — each one just needs a
// marker photo + a model to become fully real. Entries with
// markerImage/modelObj set to null show as "coming soon" and are not
// scannable yet.
// =====================================================================
const artworks = [
  {
    id: 0,
    name: "Mona Lisa",
    description: "Leonardo da Vinci's portrait — the first piece added to this prototype.",
    markerImage: "./assets/mona-marker.jpg",
    modelObj: "./assets/mona-centered.obj",
    baseScale: 0.06,
    icon: "🖼️",
    unlocked: false,
  },
  {
    id: 1,
    name: "Second Artwork",
    description: "Coming soon — add a photo and model to activate this piece.",
    markerImage: null,
    modelObj: null,
    baseScale: 0.06,
    icon: "🗿",
    unlocked: false,
  },
];

// ---------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------
const screenHome = document.getElementById("screen-home");
const screenScanner = document.getElementById("screen-scanner");
const galleryGrid = document.getElementById("gallery-grid");
const progressFill = document.getElementById("progress-fill");
const progressLabel = document.getElementById("progress-label");
const scanHint = document.getElementById("scan-hint");

const unlockModal = document.getElementById("unlock-modal");
const modalTitle = document.getElementById("modal-title");
const modalDesc = document.getElementById("modal-desc");

const loadingScreen = document.getElementById("loading-screen");
const loadingText = document.getElementById("loading-text");
const permissionError = document.getElementById("permission-error");

const btnStartScan = document.getElementById("btn-start-scan");
const btnBackHome = document.getElementById("btn-back-home");
const btnKeepScanning = document.getElementById("btn-keep-scanning");
const btnViewCollection = document.getElementById("btn-view-collection");

const arContainer = document.getElementById("ar-container");

// ---------------------------------------------------------------------
// Gallery rendering
// ---------------------------------------------------------------------
function renderGallery() {
  galleryGrid.innerHTML = "";

  artworks.forEach((art) => {
    const isComingSoon = !art.markerImage;
    const card = document.createElement("div");
    card.className =
      "art-card " + (isComingSoon ? "comingsoon" : art.unlocked ? "unlocked" : "locked");

    card.innerHTML = `
      <div class="art-icon">${art.unlocked ? art.icon : "🔒"}</div>
      <div class="status-badge ${
        isComingSoon ? "comingsoon" : art.unlocked ? "unlocked" : ""
      }">${isComingSoon ? "Coming Soon" : art.unlocked ? "✓ Unlocked" : "🔒 Locked"}</div>
      <h3>${art.name}</h3>
      <p>${
        isComingSoon
          ? "Not active yet"
          : art.unlocked
          ? art.description
          : "Scan this artwork to reveal it"
      }</p>
    `;
    galleryGrid.appendChild(card);
  });

  const scannable = artworks.filter((a) => a.markerImage);
  const unlockedCount = scannable.filter((a) => a.unlocked).length;
  const pct = scannable.length ? (unlockedCount / scannable.length) * 100 : 0;
  progressFill.style.width = pct + "%";
  progressLabel.textContent = `${unlockedCount} / ${scannable.length} unlocked`;
}

// ---------------------------------------------------------------------
// Screen switching
// ---------------------------------------------------------------------
function showHome() {
  screenScanner.classList.add("hidden");
  screenHome.classList.remove("hidden");
  renderGallery();
}

function showScanner() {
  screenHome.classList.add("hidden");
  screenScanner.classList.remove("hidden");
  scanHint.textContent = "Point your camera at an artwork";
  scanHint.classList.remove("found");
}

function showUnlockModal(art) {
  modalTitle.textContent = art.name;
  modalDesc.textContent = art.description;
  unlockModal.classList.remove("hidden");
}

function hideUnlockModal() {
  unlockModal.classList.add("hidden");
}

btnStartScan.addEventListener("click", showScanner);
btnBackHome.addEventListener("click", showHome);
btnKeepScanning.addEventListener("click", hideUnlockModal);
btnViewCollection.addEventListener("click", () => {
  hideUnlockModal();
  showHome();
});

// ---------------------------------------------------------------------
// Loading an image element from a URL
// ---------------------------------------------------------------------
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ---------------------------------------------------------------------
// Gesture state: which target is currently being tracked, and its
// live scale/rotation, so pinch-zoom and drag-to-rotate can act on it.
// ---------------------------------------------------------------------
let activeModelEl = null;
let activeBaseScale = 0.06;
let currentScale = 0.06;
let currentRotY = 0;
let currentRotX = 0;

function applyTransform() {
  if (!activeModelEl) return;
  activeModelEl.setAttribute("scale", `${currentScale} ${currentScale} ${currentScale}`);
  activeModelEl.setAttribute("rotation", `${currentRotX} ${currentRotY} 0`);
}

// Two-finger pinch = zoom, one-finger drag = rotate (horizontal drag spins
// around the vertical axis, vertical drag tilts it forward/back).
let lastPinchDistance = null;
let lastTouchX = null;
let lastTouchY = null;

function getPinchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

window.addEventListener(
  "touchstart",
  (e) => {
    if (screenScanner.classList.contains("hidden")) return;
    if (e.touches.length === 2) {
      lastPinchDistance = getPinchDistance(e.touches);
    } else if (e.touches.length === 1) {
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
    }
  },
  { passive: true }
);

window.addEventListener(
  "touchmove",
  (e) => {
    if (screenScanner.classList.contains("hidden") || !activeModelEl) return;

    if (e.touches.length === 2 && lastPinchDistance !== null) {
      const newDistance = getPinchDistance(e.touches);
      const factor = newDistance / lastPinchDistance;
      const minScale = activeBaseScale * 0.3;
      const maxScale = activeBaseScale * 3;
      currentScale = Math.min(maxScale, Math.max(minScale, currentScale * factor));
      lastPinchDistance = newDistance;
      applyTransform();
    } else if (e.touches.length === 1 && lastTouchX !== null) {
      const dx = e.touches[0].clientX - lastTouchX;
      const dy = e.touches[0].clientY - lastTouchY;
      currentRotY += dx * 0.5; // horizontal drag -> spin left/right
      currentRotX += dy * 0.5; // vertical drag -> tilt up/down
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      applyTransform();
    }
  },
  { passive: true }
);

window.addEventListener(
  "touchend",
  (e) => {
    if (e.touches.length < 2) lastPinchDistance = null;
    if (e.touches.length < 1) {
      lastTouchX = null;
      lastTouchY = null;
    }
  },
  { passive: true }
);

// ---------------------------------------------------------------------
// Handling a target being recognized / lost by the camera
// ---------------------------------------------------------------------
function handleTargetFound(artworkId, modelEl, baseScale) {
  const art = artworks.find((a) => a.id === artworkId);
  scanHint.textContent = "Pinch to zoom · Drag to rotate";
  scanHint.classList.add("found");

  activeModelEl = modelEl;
  activeBaseScale = baseScale;
  currentScale = baseScale;
  currentRotY = 0;
  currentRotX = 0;
  applyTransform();

  if (art && !art.unlocked) {
    art.unlocked = true;
    showUnlockModal(art);
  }
}

function handleTargetLost() {
  scanHint.textContent = "Point your camera at an artwork";
  scanHint.classList.remove("found");
  activeModelEl = null;
}

// ---------------------------------------------------------------------
// Build the AR scene: compile every scannable artwork's marker image
// together (so each gets a targetIndex in the same order), then inject
// an <a-scene> with one tracked entity per artwork.
// ---------------------------------------------------------------------
async function initAR() {
  const scannable = artworks.filter((a) => a.markerImage);

  loadingText.textContent = "Loading artwork images…";
  const images = await Promise.all(scannable.map((a) => loadImage(a.markerImage)));

  loadingText.textContent = "Analyzing artworks (compiling recognition data)…";
  const compiler = new window.MINDAR.IMAGE.Compiler();
  await compiler.compileImageTargets(images, (progress) => {
    loadingText.textContent = `Analyzing artworks… ${Math.round(progress)}%`;
  });
  const exportedBuffer = await compiler.exportData();
  const blobUrl = URL.createObjectURL(new Blob([exportedBuffer]));

  loadingText.textContent = "Starting camera…";

  const targetEntities = scannable
    .map(
      (art, i) => `
    <a-entity id="ar-target-${i}" mindar-image-target="targetIndex: ${i}">
      ${
        art.modelObj
          ? `<a-entity
               id="model-${i}"
               obj-model="obj: ${art.modelObj}"
               material="side: double"
               position="0 0 0.1"
               rotation="0 0 0"
               scale="${art.baseScale} ${art.baseScale} ${art.baseScale}"
             ></a-entity>`
          : ""
      }
    </a-entity>`
    )
    .join("\n");

  arContainer.innerHTML = `
    <a-scene
      id="ar-scene"
      mindar-image="imageTargetSrc: ${blobUrl}; maxTrack: ${scannable.length};"
      color-space="sRGB"
      renderer="colorManagement: true, physicallyCorrectLights"
      vr-mode-ui="enabled: false"
      device-orientation-permission-ui="enabled: false"
      embedded
    >
      <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
      ${targetEntities}
    </a-scene>
  `;

  const arScene = document.getElementById("ar-scene");
  arScene.addEventListener("renderstart", () => {
    setTimeout(() => loadingScreen.classList.add("hidden"), 300);
  });

  scannable.forEach((art, i) => {
    const targetEl = document.getElementById(`ar-target-${i}`);
    const modelEl = document.getElementById(`model-${i}`);
    targetEl.addEventListener("targetFound", () =>
      handleTargetFound(art.id, modelEl, art.baseScale)
    );
    targetEl.addEventListener("targetLost", handleTargetLost);
  });
}

// ---------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------
renderGallery();

navigator.mediaDevices?.getUserMedia?.({ video: true })
  .then(() => initAR())
  .catch(() => {
    loadingScreen.classList.add("hidden");
    permissionError.classList.remove("hidden");
  });
