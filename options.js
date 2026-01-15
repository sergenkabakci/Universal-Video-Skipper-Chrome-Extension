document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("skipSeconds");

  if (!select) {
    console.error("[PrimeVideoSkip] select not found");
    return;
  }

  // Load
  chrome.storage.sync.get({ skipSeconds: 5 }, (data) => {
    select.value = String(data.skipSeconds);
    console.log("[PrimeVideoSkip] Popup loaded:", data.skipSeconds);
  });

  // Save
  select.addEventListener("change", () => {
    const value = Number(select.value);

    chrome.storage.sync.set({ skipSeconds: value }, () => {
      console.log("[PrimeVideoSkip] Popup saved:", value);
    });
  });
});
