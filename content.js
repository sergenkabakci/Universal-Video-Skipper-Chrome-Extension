(() => {
  "use strict";

  console.log("[PrimeVideoSkip] Content script loaded");

  let SKIP_SECONDS = 5;
  let initialized = false;
  let keyboardAttached = false;
  let messageAttached = false;
  let videoObserver = null;
  let currentVideo = null;

  function getVideo() {
    return document.querySelector("video");
  }

function getPlayableVideo() {
  const videos = Array.from(document.querySelectorAll("video"));

  return videos.find((v) =>
    Number.isFinite(v.duration) &&
    v.duration > 0 &&
    !v.paused &&
    v.readyState >= 2
  );
}

  function skip(seconds) {
  const video = getPlayableVideo();
  if (!video) return;

  if (!Number.isFinite(video.currentTime) || !Number.isFinite(video.duration)) {
    console.warn("[PrimeVideoSkip] Invalid video state, skip ignored");
    return;
  }

  const oldTime = video.currentTime;
  const newTime = Math.min(
    video.duration,
    Math.max(0, oldTime + seconds)
  );

  video.currentTime = newTime;

  console.log(
    `[PrimeVideoSkip] Skipped ${seconds}s | ${oldTime} → ${newTime}`
  );
}

 
  function attachKeyboardListener() {
    if (keyboardAttached) return;
    keyboardAttached = true;

    document.addEventListener(
      "keydown",
      (e) => {
        if (!currentVideo) return;

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
  }

  function attachMessageListener() {
    if (messageAttached) return;
    messageAttached = true;

    chrome.runtime.onMessage.addListener((msg) => {
      if (!currentVideo) return;

      if (msg.command === "skip-forward") skip(SKIP_SECONDS);
      if (msg.command === "skip-backward") skip(-SKIP_SECONDS);
    });
  }

  function onVideoReady(video) {
    if (initialized && video === currentVideo) return;

    initialized = true;
    currentVideo = video;

    console.log("[PrimeVideoSkip] Video detected");

    chrome.storage.sync.get({ skipSeconds: 5 }, (data) => {
      SKIP_SECONDS = data.skipSeconds;

      const controls = document.getElementById("pv-skip-controls");
      if (controls) controls.remove();

    });

    attachKeyboardListener();
    attachMessageListener();

    watchVideoRemoval(video);
  }

  function watchVideoRemoval(video) {
    const observer = new MutationObserver(() => {
      if (!document.contains(video)) {
        observer.disconnect();
        reset();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function reset() {
    console.log("[PrimeVideoSkip] Video removed, waiting again");

    initialized = false;
    currentVideo = null;

    const controls = document.getElementById("pv-skip-controls");
    if (controls) controls.remove();

    waitForVideo();
  }

  function waitForVideo() {
    if (videoObserver) videoObserver.disconnect();

    const video = getVideo();
    if (video) {
      onVideoReady(video);
      return;
    }

    videoObserver = new MutationObserver(() => {
      const video = getVideo();
      if (video) {
        videoObserver.disconnect();
        onVideoReady(video);
      }
    });

    videoObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.skipSeconds) {
      SKIP_SECONDS = changes.skipSeconds.newValue;

      const controls = document.getElementById("pv-skip-controls");
      if (controls) controls.remove();

    }
  });

  waitForVideo();
})();
