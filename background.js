// 1. 정각 기준 다음 15분 단위까지 남은 시간 계산
const now = new Date();
const minutes = now.getMinutes();
const delay = ((15 - (minutes % 15)) % 15) * 60 * 1000; // 밀리초 단위

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

// 3. 알람 이벤트 리스너
chrome.alarms.onAlarm.addListener(() => {
    chrome.tabs.query({ url: "https://playentry.org/community/entrystory/list*" }, (tabs) => {
        tabs.forEach(tab => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => fetchEntrystory()
            });
        });
    });
});