async function fetchEntrystory() {
    const query = `
        query SELECT_ENTRYSTORY($pageParam: PageParam){
            discussList(pageParam: $pageParam){
                total
            }
        }
    `;
    const variables = { pageParam: { display: 1, page: 1 } };

    const res = await fetch("https://playentry.org/graphql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "csrf-token": document.cookie.match(/_csrf=([^;]+)/)?.[1] || "",
            "x-token": localStorage.getItem("x-token") || "",
            "User-Agent": navigator.userAgent,
            "Referer": "https://playentry.org/"
        },
        body: JSON.stringify({ operationName: "SELECT_ENTRYSTORY", query, variables })
    });

    const data = await res.json();
    const total = data.data?.discussList?.total || 0;
    const time = new Date().toISOString();

    // 로컬 스토리지에 통계 저장
    chrome.storage.local.get({ stats: [] }, (result) => {
        const stats = result.stats;
        stats.push({ time, total });
        chrome.storage.local.set({ stats });
    });
}

// 페이지 로드 시 자동 실행
fetchEntrystory();