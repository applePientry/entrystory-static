async function fetchEntrystory() {
    const query = `
          query SELECT_ENTRYSTORY(
              $pageParam: PageParam
              $query: String
              $user: String
              $category: String
              $term: String
              $prefix: String
              $progress: String
              $discussType: String
              $searchType: String
              $searchAfter: JSON
              $tag: String
          ){
              discussList(
                  pageParam: $pageParam
                  query: $query
                  user: $user
                  category: $category
                  term: $term
                  prefix: $prefix
                  progress: $progress
                  discussType: $discussType
                  searchType: $searchType
                  searchAfter: $searchAfter
                  tag: $tag
              ) {
                  total
                  list {
                      id
                      content
                      created
                      commentsLength
                      likesLength
                      user {
                          id
                          nickname
                          profileImage {
                              id
                              name
                              label {
                                  ko
                                  en
                                  ja
                                  vn
                              }
                              filename
                              imageType
                              dimension {
                                  width
                                  height
                              }
                              trimmed {
                                  filename
                                  width
                                  height
                              }
                          }
                          status {
                              following
                              follower
                          }
                          description
                          role
                          mark {
                              id
                              name
                              label {
                                  ko
                                  en
                                  ja
                                  vn
                              }
                              filename
                              imageType
                              dimension {
                                  width
                                  height
                              }
                              trimmed {
                                  filename
                                  width
                                  height
                              }
                          }
                      }
                      image {
                          id
                          name
                          label {
                              ko
                              en
                              ja
                              vn
                          }
                          filename
                          imageType
                          dimension {
                              width
                              height
                          }
                          trimmed {
                              filename
                              width
                              height
                          }
                      }
                      sticker {
                          id
                          name
                          label {
                              ko
                              en
                              ja
                              vn
                          }
                          filename
                          imageType
                          dimension {
                              width
                              height
                          }
                          trimmed {
                              filename
                              width
                              height
                          }
                      }
                      isLike
                  }
                  searchAfter
              }
          }
        `;
    
    const variables = {
        category: "free",
        searchType: "scroll",
        term: "all",
        discussType: "entrystory",
        pageParam: { display: 1, sort: "created" }
    };

    let csrfToken = "";
    try {
        const nextDataEl = document.getElementById("__NEXT_DATA__");
        if (nextDataEl) {
            const parsed = JSON.parse(nextDataEl.innerText || "{}");
            csrfToken = parsed?.props?.initialProps?.csrfToken || "";
        }
    } catch (e) {
        console.warn("[content] Failed to parse __NEXT_DATA__ for csrf-token",e);
    }

    try {
        const res = await fetch("https://playentry.org/graphql/SELECT_ENTRYSTORY", {
            headers: {
                accept: "*/*",
                "accept-language": "en-US,en;q=0.7",
                "content-type": "application/json",
                "csrf-token": JSON.parse(document.getElementById("__NEXT_DATA__").innerText).props.initialProps.csrfToken,
                "priority": "u=1, i",
                "sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Brave\";v=\"140\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Linux\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "sec-gpc": "1",
                "x-client-type": "Client"
            },
            referrer: "https://playentry.org/community/entrystory/list?sort=created&term=all",
            body: JSON.stringify({ query, variables }),
            method: "POST",
            mode: "cors",
            credentials: "include"
        });
    
        if (!res.ok) {
            const text = await res.text().catch(()=>"");
            throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
            
        }
    
        const data = await res.json();
        const total = data.data?.discussList?.total ?? 0;
        return { success: true, total, raw: data};
    } catch (err) {
        return { success: false, error:err?.message || String(err)};
    }

    // 로컬 스토리지에 통계 저장
    chrome.storage.local.get({ stats: [] }, (result) => {
        const stats = result.stats;
        stats.push({ time, total });
        chrome.storage.local.set({ stats });
    });
}

chrome.runtime.onMessage.addListener((msg,sender,sendResponse) => {
    if (msg && msg.type === "FETCH_ENTRYSTORY") {
        fetchEntrystory()
            .then(result => {
                if(result.success) {
                    sendResponse({success: true, total: result.total});
                } else {
                    sendResponse({success: false, error: result.error});
                }
            })
            .catch(err => {
                sendResponse({ success: false, error: err?.message || String(err)})
            })
        return true;
    }
})
