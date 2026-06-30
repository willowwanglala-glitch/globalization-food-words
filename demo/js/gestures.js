/**
 * 手势交互：触摸滑动、双指缩放、键盘快捷键、可选摄像头手势（MediaPipe）
 */
function initGestures(app) {
  const feedbackEl = document.getElementById("gesture-feedback");
  const hintPanel = document.getElementById("gesture-hints");
  const cameraToggle = document.getElementById("camera-toggle");
  const cameraPanel = document.getElementById("camera-panel");
  const cameraVideo = document.getElementById("camera-video");
  const cameraStatus = document.getElementById("camera-status");
  const cameraCanvas = document.getElementById("camera-canvas");

  let feedbackTimer = null;
  let touchStart = null;
  let pinchStart = null;
  let lastCameraGesture = "";
  let lastCameraActionAt = 0;
  let cameraInstance = null;
  let handsInstance = null;

  const SWIPE_THRESHOLD = 56;
  const SWIPE_MAX_MS = 600;
  const CAMERA_COOLDOWN_MS = 700;

  function showFeedback(text, type = "info") {
    if (!feedbackEl) return;
    feedbackEl.textContent = text;
    feedbackEl.className = `gesture-feedback visible ${type}`;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      feedbackEl.classList.remove("visible");
    }, 2200);
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function isInteractiveTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || tag === "BUTTON" || el.closest(".chart-card canvas");
  }

  /* ── Touch: swipe sections, pinch timeline ── */
  document.addEventListener(
    "touchstart",
    (e) => {
      if (isInteractiveTarget(e.target)) return;

      if (e.touches.length === 2) {
        const tl = app.getTimeline();
        pinchStart = {
          distance: dist(e.touches[0], e.touches[1]),
          min: tl.min,
          max: tl.max
        };
        touchStart = null;
        return;
      }

      if (e.touches.length === 1) {
        touchStart = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          t: Date.now()
        };
      }
    },
    { passive: true }
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      if (!pinchStart || e.touches.length !== 2) return;

      const ratio = dist(e.touches[0], e.touches[1]) / pinchStart.distance;
      const center = (pinchStart.min + pinchStart.max) / 2;
      const half = ((pinchStart.max - pinchStart.min) / 2) / ratio;
      app.applyTimeline(center - half, center + half);
    },
    { passive: true }
  );

  document.addEventListener(
    "touchend",
    (e) => {
      if (pinchStart && e.touches.length < 2) {
        pinchStart = null;
        showFeedback("双指捏合：调整时间范围", "touch");
        return;
      }

      if (!touchStart || e.changedTouches.length !== 1) return;

      const dx = e.changedTouches[0].clientX - touchStart.x;
      const dy = e.changedTouches[0].clientY - touchStart.y;
      const dt = Date.now() - touchStart.t;
      touchStart = null;

      if (dt > SWIPE_MAX_MS) return;

      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > SWIPE_THRESHOLD) {
        if (dy < 0) {
          app.navigateStorySection(1);
          showFeedback("上滑 → 下一段叙事", "touch");
        } else {
          app.navigateStorySection(-1);
          showFeedback("下滑 → 上一段叙事", "touch");
        }
        return;
      }

      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        if (dx < 0) {
          app.shiftTimeline(20);
          showFeedback("左滑 → 时间向前 (+20年)", "touch");
        } else {
          app.shiftTimeline(-20);
          showFeedback("右滑 → 时间回溯 (−20年)", "touch");
        }
      }
    },
    { passive: true }
  );

  /* ── Keyboard shortcuts ── */
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        app.navigateStorySection(-1);
        showFeedback("↑ 上一段叙事", "key");
        break;
      case "ArrowDown":
        e.preventDefault();
        app.navigateStorySection(1);
        showFeedback("↓ 下一段叙事", "key");
        break;
      case "ArrowLeft":
        e.preventDefault();
        app.shiftTimeline(-20);
        showFeedback("← 时间回溯 20 年", "key");
        break;
      case "ArrowRight":
        e.preventDefault();
        app.shiftTimeline(20);
        showFeedback("→ 时间向前 20 年", "key");
        break;
      case "-":
      case "_":
        app.narrowTimeline(20);
        showFeedback("缩小时间范围", "key");
        break;
      case "=":
      case "+":
        app.widenTimeline(20);
        showFeedback("扩大时间范围", "key");
        break;
      case "r":
      case "R":
        app.resetTimeline();
        showFeedback("重置时间轴 (R)", "key");
        break;
      case "?":
        hintPanel?.classList.toggle("open");
        break;
      default:
        break;
    }
  });

  /* ── Camera gestures (MediaPipe, optional / needs network on first load) ── */
  function fingerExtended(lm, tip, pip) {
    return lm[tip].y < lm[pip].y - 0.02;
  }

  function detectCameraGesture(lm) {
    const pinch = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
    const indexUp = fingerExtended(lm, 8, 6);
    const middleUp = fingerExtended(lm, 12, 10);
    const ringUp = fingerExtended(lm, 16, 14);
    const pinkyUp = fingerExtended(lm, 20, 18);

    if (pinch < 0.06) return "pinch";
    if (indexUp && middleUp && ringUp && pinkyUp) return "palm";

    const palmX = lm[9].x;
    if (palmX < 0.32) return "left";
    if (palmX > 0.68) return "right";
    return "";
  }

  function handleCameraGesture(gesture) {
    if (!gesture || gesture === lastCameraGesture) return;

    const now = Date.now();
    if (now - lastCameraActionAt < CAMERA_COOLDOWN_MS) return;

    lastCameraGesture = gesture;
    lastCameraActionAt = now;

    switch (gesture) {
      case "left":
        app.shiftTimeline(-20);
        showFeedback("👋 手左移 → 回溯 20 年", "camera");
        break;
      case "right":
        app.shiftTimeline(20);
        showFeedback("👋 手右移 → 前进 20 年", "camera");
        break;
      case "pinch":
        app.narrowTimeline(30);
        showFeedback("🤏 捏合 → 缩小范围", "camera");
        break;
      case "palm":
        app.resetTimeline();
        showFeedback("✋ 张开掌 → 重置", "camera");
        break;
      default:
        break;
    }

    setTimeout(() => {
      lastCameraGesture = "";
    }, CAMERA_COOLDOWN_MS);
  }

  function drawHandOverlay(lm) {
    if (!cameraCanvas || !cameraVideo) return;
    const ctx = cameraCanvas.getContext("2d");
    const w = cameraCanvas.width;
    const h = cameraCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(232, 168, 56, 0.85)";
    lm.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  async function startCameraGestures() {
    if (typeof Hands === "undefined" || typeof Camera === "undefined") {
      cameraStatus.textContent = "MediaPipe 加载失败，请检查网络后重试";
      return;
    }

    handsInstance = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    handsInstance.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.55
    });

    handsInstance.onResults((results) => {
      if (results.multiHandLandmarks?.length) {
        const lm = results.multiHandLandmarks[0];
        drawHandOverlay(lm);
        handleCameraGesture(detectCameraGesture(lm));
        cameraStatus.textContent = "已检测到手部 · 移动 / 捏合 / 张掌";
      } else {
        const ctx = cameraCanvas.getContext("2d");
        ctx.clearRect(0, 0, cameraCanvas.width, cameraCanvas.height);
        cameraStatus.textContent = "请将单手握拳或张掌置于画面中央";
      }
    });

    cameraInstance = new Camera(cameraVideo, {
      onFrame: async () => {
        await handsInstance.send({ image: cameraVideo });
      },
      width: 320,
      height: 240
    });

    await cameraInstance.start();
    cameraPanel.classList.add("active");
    cameraToggle.textContent = "关闭摄像头手势";
    cameraToggle.classList.add("active");
    cameraStatus.textContent = "摄像头已开启";
    showFeedback("摄像头手势已开启", "camera");
  }

  async function stopCameraGestures() {
    if (cameraInstance) {
      cameraInstance.stop();
      cameraInstance = null;
    }
    if (handsInstance) {
      handsInstance.close();
      handsInstance = null;
    }
    if (cameraVideo.srcObject) {
      cameraVideo.srcObject.getTracks().forEach((t) => t.stop());
      cameraVideo.srcObject = null;
    }
    cameraPanel.classList.remove("active");
    cameraToggle.textContent = "开启摄像头手势";
    cameraToggle.classList.remove("active");
    cameraStatus.textContent = "";
  }

  cameraToggle?.addEventListener("click", async () => {
    if (cameraPanel.classList.contains("active")) {
      await stopCameraGestures();
    } else {
      try {
        await startCameraGestures();
      } catch (err) {
        cameraStatus.textContent = "无法访问摄像头：" + err.message;
        showFeedback("摄像头权限被拒绝或不可用", "camera");
      }
    }
  });

  document.getElementById("gesture-hint-toggle")?.addEventListener("click", () => {
    hintPanel?.classList.toggle("open");
  });

  setTimeout(() => hintPanel?.classList.add("open"), 800);
  setTimeout(() => hintPanel?.classList.remove("open"), 6000);

  showFeedback("支持触摸滑动 · 键盘方向键 · 可选摄像头", "info");
}
