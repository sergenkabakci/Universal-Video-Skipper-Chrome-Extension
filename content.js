(() => {
  "use strict";

  console.log("[PrimeVideoSkip] Content script loaded");

  let SKIP_SECONDS = 5;
  let initialized = false;

  function getVideo() {
    return document.querySelector("video");
  }

  function skip(seconds) {
    const video = getVideo();
    if (!video) {
      console.log("[PrimeVideoSkip] Video not found");
      return;
    }

    const oldTime = video.currentTime;
    video.currentTime = Math.min(
      video.duration,
      Math.max(0, video.currentTime + seconds)
    );

    console.log(
      `[PrimeVideoSkip] Skipped ${seconds}s | ${oldTime} → ${video.currentTime}`
    );
  }

  function createButtons() {
    if (document.getElementById("pv-skip-controls")) return;

    const container = document.createElement("div");
    container.id = "pv-skip-controls";
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      gap: 8px;
    `;

    const btnBack = document.createElement("button");
    const btnForward = document.createElement("button");

    btnBack.textContent = `−${SKIP_SECONDS}s`;
    btnForward.textContent = `+${SKIP_SECONDS}s`;

    [btnBack, btnForward].forEach((btn) => {
      btn.style.cssText = `
        padding: 8px 12px;
        font-size: 14px;
        cursor: pointer;
        border-radius: 6px;
        border: none;
        background: rgba(0,0,0,0.7);
        color: white;
      `;
    });

    btnBack.onclick = () => skip(-SKIP_SECONDS);
    btnForward.onclick = () => skip(SKIP_SECONDS);

    container.append(btnBack, btnForward);
    document.body.appendChild(container);

    console.log("[PrimeVideoSkip] UI buttons added");
  }

  function init() {
    if (initialized) return;

    const video = getVideo();
    if (!video) {
      console.log("[PrimeVideoSkip] No video found on this page");
      return; // ✅ ARTIK YASAL
    }

    initialized = true;

    chrome.storage.sync.get({ skipSeconds: 5 }, (data) => {
      SKIP_SECONDS = data.skipSeconds;
      console.log("[PrimeVideoSkip] Skip seconds loaded:", SKIP_SECONDS);
    });

    document.addEventListener(
      "keydown",
      (e) => {
        const video = getVideo();
        if (!video) return;

        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || e.isComposing) return;

        if (e.code === "ArrowRight") {
          skip(SKIP_SECONDS);
          e.preventDefault();
          e.stopPropagation();
        }

        if (e.code === "ArrowLeft") {
          skip(-SKIP_SECONDS);
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true
    );

    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.command === "skip-forward") skip(SKIP_SECONDS);
      if (msg.command === "skip-backward") skip(-SKIP_SECONDS);
    });

    setTimeout(createButtons, 3000);
  }

  const observer = new MutationObserver(init);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.skipSeconds) {
      SKIP_SECONDS = changes.skipSeconds.newValue;

      const controls = document.getElementById("pv-skip-controls");
      if (controls) controls.remove();
      createButtons();
    }
  });

  init();
})();
