export default defineBackground(() => {
  browser.runtime.onMessage.addListener((request) => {
    console.log("[background.js] Received message: ", request);
    if (request.action === "openOptionsPage") {
      console.log(
        "[background.js] Opening options page (Response: openOptionsPage)"
      );
      browser.runtime.openOptionsPage();
    }
  });

  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "update") {
      browser.tabs.create({
        url: browser.runtime.getURL("/updated.html") + "?old_version=" + details.previousVersion,
      });
    } else if (details.reason === "install") {
      browser.tabs.create({
        url: browser.runtime.getURL("/installed.html"),
      });
    }
  });
});
