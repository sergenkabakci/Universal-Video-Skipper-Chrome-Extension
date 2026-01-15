document.addEventListener("DOMContentLoaded", () => {
  console.log("[PrimeVideoSkip] Popup JS loaded");

  const select = document.getElementById("skipSeconds");

  chrome.storage.sync.get({ skipSeconds: 5 }, (data) => {
    select.value = String(data.skipSeconds);
    console.log("[PrimeVideoSkip] Popup loaded:", data.skipSeconds);
  });

  select.addEventListener("change", () => {
    const value = Number(select.value);

    chrome.storage.sync.set({ skipSeconds: value }, () => {
      console.log("[PrimeVideoSkip] Popup saved:", value);
    });
  });
});
