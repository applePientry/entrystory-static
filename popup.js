const ul = document.getElementById("statsList");

chrome.storage.local.get({ stats: [] }, (result) => {
    const stats = result.stats;
    stats.slice(-20).forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.time}: ${item.total} 글`;
        ul.appendChild(li);
    });
});

document.getElementById("fetchBtn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "MANUAL_FETCH" }, (response) => {
        console.log("Background 응답:", response);
    });
});