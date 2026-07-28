// =====================================================================
// SITE BACKGROUND PHOTO (optional)
// Put a photo at this path to use it as the home screen background.
// If the file doesn't exist, the page quietly falls back to the
// default gallery-wall gradient — nothing breaks either way.
// =====================================================================
const BACKGROUND_IMAGE = "./assets/background.jpg";

// =====================================================================
// ARTWORK CONFIG
// To add a new artwork later: drop in its marker photo + model, a card
// photo, and a short quiz, then add one more entry here.
// =====================================================================
const artworks = [
  {
    id: 0,
    name: "Mona Lisa",
    image: "./assets/mona-marker.jpg", // shown on the card + detail page
    details:
      "Painted by Leonardo da Vinci in the early 1500s, this portrait is one of the most " +
      "recognized paintings in the world, known for its subtle, ambiguous smile and soft " +
      "transitions of light and shadow. It has hung in the Louvre in Paris since the museum " +
      "opened to the public.",
    markerImage: "./assets/mona-marker.jpg",
    modelObj: "./assets/mona-centered.obj",
    baseScale: 0.06,
    icon: "🖼️",
    unlocked: false,
    quizCompleted: false,
    quiz: [
      {
        question: "Who painted the Mona Lisa?",
        options: ["Michelangelo", "Leonardo da Vinci", "Raphael", "Titian"],
        correctIndex: 1,
      },
      {
        question: "Which museum currently displays the Mona Lisa?",
        options: ["The British Museum", "The Uffizi Gallery", "The Louvre", "The Prado"],
        correctIndex: 2,
      },
      {
        question: "The painting is best known for its...",
        options: ["Bright, bold colors", "Enigmatic smile", "Large size", "Use of gold leaf"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 1,
    name: "Second Artwork",
    image: "./assets/artwork-2.jpg", // add this file to activate the real photo
    details: "Details will appear here once this artwork is added.",
    markerImage: null,
    modelObj: null,
    baseScale: 0.06,
    icon: "🗿",
    unlocked: false,
    quizCompleted: false,
    quiz: [],
  },
];

// ---------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------
const screenHome = document.getElementById("screen-home");
const screenScanner = document.getElementById("screen-scanner");
const screenDetail = document.getElementById("screen-detail");
const screenQuiz = document.getElementById("screen-quiz");

const galleryGrid = document.getElementById("gallery-grid");
const progressFill = document.getElementById("progress-fill");
const progressLabel = document.getElementById("progress-label");
const scanHint = document.getElementById("scan-hint");

const filterButtons = document.querySelectorAll(".filter-btn");
const filterToast = document.getElementById("filter-toast");

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

const detailImage = document.getElementById("detail-image");
const detailTitle = document.getElementById("detail-title");
const detailText = document.getElementById("detail-text");
const btnDetailBack = document.getElementById("btn-detail-back");
const btnTakeQuiz = document.getElementById("btn-take-quiz");
const quizDoneNote = document.getElementById("quiz-done-note");

const quizProgress = document.getElementById("quiz-progress");
const quizQuestion = document.getElementById("quiz-question");
const quizOptions = document.getElementById("quiz-options");
const quizFeedback = document.getElementById("quiz-feedback");
const btnQuizNext = document.getElementById("btn-quiz-next");
const btnQuizBack = document.getElementById("btn-quiz-back");

const arContainer = document.getElementById("ar-container");

// ---------------------------------------------------------------------
// Optional background photo: test-load it; only apply if it exists.
// ---------------------------------------------------------------------
(function tryApplyBackground() {
  const test = new Image();
  test.onload = () => {
    screenHome.style.backgroundImage =
      `linear-gradient(rgba(20,15,12,0.72), rgba(20,15,12,0.88)), url("${BACKGROUND_IMAGE}")`;
  };
  test.onerror = () => {
    /* file not present yet — keep the default gradient, no error shown */
  };
  test.src = BACKGROUND_IMAGE;
})();

// ---------------------------------------------------------------------
// Gallery filter state ("all" | "locked" | "unlocked")
// ---------------------------------------------------------------------
let activeFilter = "all";

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const clicked = btn.dataset.filter;
    activeFilter = activeFilter === clicked ? "all" : clicked;
    updateFilterButtonStyles();
    renderGallery();
    if (activeFilter !== "all") {
      showFilterToast(`Showing ${activeFilter} artworks`);
    } else {
      hideFilterToast();
    }
  });
});

function updateFilterButtonStyles() {
  filterButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === activeFilter);
  });
}

let toastTimer = null;
function showFilterToast(msg) {
  filterToast.textContent = msg;
  filterToast.classList.remove("hidden");
  clearTimeout(toastTimer);
}
function hideFilterToast() {
  filterToast.classList.add("hidden");
}

// ---------------------------------------------------------------------
// Gallery rendering
// ---------------------------------------------------------------------
function renderGallery() {
  galleryGrid.innerHTML = "";

  const visible = artworks.filter((art) => {
    const isComingSoon = !art.markerImage;
    if (activeFilter === "locked") return !art.unlocked;
    if (activeFilter === "unlocked") return art.unlocked && !isComingSoon;
    return true;
  });

  visible.forEach((art) => {
    const isComingSoon = !art.markerImage;
    const card = document.createElement("div");
    card.className =
      "art-card " + (isComingSoon ? "comingsoon" : art.unlocked ? "unlocked" : "locked");

    card.innerHTML = `
      <div class="art-card-photo">
        <img src="${art.image}" alt="${art.name}"
             onerror="this.style.display='none'; this.parentElement.querySelector('.photo-fallback').style.display='flex';" />
        <div class="photo-fallback" style="display:none;">${art.icon}</div>
        <div class="status-badge ${
          isComingSoon ? "comingsoon" : art.unlocked ? "unlocked" : ""
        }">${isComingSoon ? "Coming Soon" : art.unlocked ? "✓ Unlocked" : "🔒 Locked"}</div>
        ${art.quizCompleted ? `<div class="quiz-check-ribbon">✓</div>` : ""}
      </div>
      <div class="art-card-info">
        <h3>${art.name}</h3>
        <p>${
          isComingSoon
            ? "Not active yet"
            : art.unlocked
            ? "Tap to view details"
            : "Scan this artwork to reveal it"
        }</p>
      </div>
    `;

    if (art.unlocked && !isComingSoon) {
      card.addEventListener("click", () => openDetail(art.id));
    } else if (!isComingSoon) {
      card.addEventListener("click", () => {
        showFilterToast("Scan this artwork first to unlock it");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(hideFilterToast, 1800);
      });
    }

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
function hideAllScreens() {
  screenHome.classList.add("hidden");
  screenScanner.classList.add("hidden");
  screenDetail.classList.add("hidden");
  screenQuiz.classList.add("hidden");
}

function showHome() {
  hideAllScreens();
  screenHome.classList.remove("hidden");
  renderGallery();
}

function showScanner() {
  hideAllScreens();
  screenScanner.classList.remove("hidden");
  scanHint.textContent = "Point your camera at an artwork";
  scanHint.classList.remove("found");
}

function showUnlockModal(art) {
  modalTitle.textContent = art.name;
  modalDesc.textContent = art.details;
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
// Artwork detail page
// ---------------------------------------------------------------------
let currentDetailArtId = null;

function openDetail(artworkId) {
  const art = artworks.find((a) => a.id === artworkId);
  if (!art) return;
  currentDetailArtId = artworkId;

  detailImage.src = art.image;
  detailImage.alt = art.name;
  detailTitle.textContent = art.name;
  detailText.textContent = art.details;

  const hasQuiz = art.quiz && art.quiz.length > 0;
  btnTakeQuiz.style.display = hasQuiz ? "block" : "none";
  quizDoneNote.classList.toggle("hidden", !art.quizCompleted);

  hideAllScreens();
  screenDetail.classList.remove("hidden");
}

btnDetailBack.addEventListener("click", showHome);
btnTakeQuiz.addEventListener("click", () => {
  if (currentDetailArtId !== null) startQuiz(currentDetailArtId);
});

// ---------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------
let quizArtId = null;
let quizIndex = 0;
let quizScore = 0;

function startQuiz(artworkId) {
  const art = artworks.find((a) => a.id === artworkId);
  if (!art || !art.quiz || art.quiz.length === 0) return;

  quizArtId = artworkId;
  quizIndex = 0;
  quizScore = 0;

  hideAllScreens();
  screenQuiz.classList.remove("hidden");
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const art = artworks.find((a) => a.id === quizArtId);
  const q = art.quiz[quizIndex];

  quizProgress.textContent = `Question ${quizIndex + 1} / ${art.quiz.length}`;
  quizQuestion.textContent = q.question;
  quizFeedback.classList.add("hidden");
  btnQuizNext.classList.add("hidden");

  quizOptions.innerHTML = "";
  q.options.forEach((option, i) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.textContent = option;
    btn.addEventListener("click", () => selectQuizAnswer(i));
    quizOptions.appendChild(btn);
  });
}

function selectQuizAnswer(selectedIndex) {
  const art = artworks.find((a) => a.id === quizArtId);
  const q = art.quiz[quizIndex];
  const optionButtons = quizOptions.querySelectorAll(".quiz-option-btn");

  optionButtons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correctIndex) btn.classList.add("correct");
    else if (i === selectedIndex) btn.classList.add("incorrect");
  });

  const isCorrect = selectedIndex === q.correctIndex;
  if (isCorrect) quizScore++;

  quizFeedback.textContent = isCorrect ? "Correct!" : "Not quite — the highlighted answer was correct.";
  quizFeedback.className = "quiz-feedback " + (isCorrect ? "correct" : "incorrect");
  quizFeedback.classList.remove("hidden");

  btnQuizNext.textContent = quizIndex === art.quiz.length - 1 ? "Finish Quiz" : "Next Question";
  btnQuizNext.classList.remove("hidden");
}

btnQuizNext.addEventListener("click", () => {
  const art = artworks.find((a) => a.id === quizArtId);
  if (quizIndex < art.quiz.length - 1) {
    quizIndex++;
    renderQuizQuestion();
  } else {
    art.quizCompleted = true;
    openDetail(quizArtId); // back to detail page, now showing the checkmark note
  }
});

btnQuizBack.addEventListener("click", () => {
  if (currentDetailArtId !== null) openDetail(currentDetailArtId);
  else showHome();
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
// Gesture state: pinch-to-zoom + drag-to-rotate on the active target
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
      currentRotY += dx * 0.5;
      currentRotX += dy * 0.5;
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
// Build the AR scene from every scannable artwork's marker image
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
