const ul = document.getElementById("statsList");

chrome.storage.local.get({ stats: [] }, (result) => {
    const stats = result.stats;
    stats.slice(-20).forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.time}: ${item.total} 글`;
        ul.appendChild(li);
    });
});