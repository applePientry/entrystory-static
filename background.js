chrome.alarms.create("fetchEntrystory", { periodInMinutes: 15 });

chrome.alarms.onAlarm.addListener(() => {
    // 모든 탭에 메시지 보내기
    chrome.tabs.query({ url: "https://playentry.org/community/entrystory/list*" }, (tabs) => {
        tabs.forEach(tab => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    // content.js에 정의된 fetchEntrystory 함수 호출
                    fetchEntrystory();
                }
            });
        });
    });
});