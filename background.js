chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.executeScript({file: "content_script.js"});
})
