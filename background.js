function scheduleQuarterHourFetch() {
    // 1. 정각 기준 다음 15분 단위까지 남은 시간 계산
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const ms = now.getMilliseconds();
    const delay = ((15 - (minutes % 15)) % 15) * 60 * 1000 - seconds*1000 - ms; // 밀리초 단위
    if(delay < 0) delay += 15*60*1000;
    
    console.log(`[background] scheduleQuarterHourFetch: delay=${delay}ms`);
    
    // 2. 첫 요청과 알람 생성
    setTimeout(() => {
        // 첫 요청
        chrome.tabs.query({ url: "https://playentry.org/community/entrystory/list*" }, (tabs) => {
            tabs.forEach(tab => {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => fetchEntrystory()
                });
            });
        });
    
        // 이후 15분 간격으로 알람 반복
        chrome.alarms.create("fetchEntrystory", { periodInMinutes: 15 });
    }, delay);
}

function performFetchOnce() {
    chrome.tabs.query({ url: "https://playentry.org/community/entrystory/list*"},(tabs) => {
        if (!tabs || tabs.length === 0) {
            console.log("[background] No matching entrystory tab found. Skipping fetch.");
            return;
        }

        let tab = tabs.find(t => t.active) || tabs[0];
        const tabId = tab.id;

        console.log(`[background] sending FETCH_ENTRYSTORY to tab ${tabId}`);

        chrome.tabs.sendMessage(tabId, {type:"FETCH_ENTRYSTORY"}, response => {
            if (chrome.runtime.lastError) {
                console.warn("[background] sendMessage failed:",chrome.runtime.lastError);
                //content.js가 없을 가능성 => inject 시도
                injectContentAndFetch(tabId);
                return;
            }

            if (!response) {
                console.warn("[background] No response from content script, trying injection...");
                injectContentAndFetch(tabId);
                return;
            }

            if (response.success) {
                const total = response.total;
                const time = new Date().toISOString();
                //저장
                chrome.storage.local.get({stats: []}, (res) => {
                    const stats = res.stats || [];
                    stats.push({ time, total });
                    chrome.storage.local.set({stats},() => {
                        console.log("[background] Saved stat:",{time,total});
                        
                    })
                })
            } else {
                console.error("[background] content fetch error:", response.error);
            }
        })
    });
}

function injectContentAndFetch(tabId) {
    chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"]
    }, (injectionResults) => {
        if (chrome.runtime.lastError) {
            console.error("[background] Injection failed:", chrome.runtime.lastError.message);
            return;
        }
        // 주입 뒤 메시지 다시 보냄
        chrome.tabs.sendMessage(tabId, { type: "FETCH_ENTRYSTORY" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("[background] sendMessage after inject failed:", chrome.runtime.lastError.message);
                return;
            }
            if (response && response.success) {
                const total = response.total;
                const time = new Date().toISOString();
                chrome.storage.local.get({ stats: [] }, (res) => {
                    const stats = res.stats || [];
                    stats.push({ time, total });
                    chrome.storage.local.set({ stats }, () => {
                        console.log("[background] Saved stat after injection:", { time, total });
                    });
                });
            } else {
                console.error("[background] Error after injection response:", response?.error);
            }
        });
    });
}

// 3. 알람 이벤트 리스너
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "fetchEntrystory") {
        performFetchOnce();
    }
});

//디버깅용 메시지로 수동 트리거 기능
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "MANUAL_FETCH") {
        performFetchOnce();
        sendResponse({ ok: true });
    }
});