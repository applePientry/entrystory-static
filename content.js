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
            accept: "*/*",
            "Content-Type": "application/json",
            "csrf-token": JSON.parse(document.getElementById("__NEXT_DATA__").innerText).props.initialProps.csrfToken,
            "x-token": JSON.parse(document.querySelector("#__NEXT_DATA__").innerText).props.pageProps.initialState.common.user.xToken,
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