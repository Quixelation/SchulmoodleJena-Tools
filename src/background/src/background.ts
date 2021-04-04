import { localStorage, storage } from "../../types";
chrome.runtime.onInstalled.addListener(function (object) {
  if ("install" === object.reason)
    chrome.tabs.create(
      { url: "https://smjt.robertstuendl.com/first-install" },
      function () {
        console.log("New tab launched");
      },
    );
});
chrome.commands.onCommand.addListener((command): void => {
  if (command === "panik-key") {
    chrome.tabs.query({ url: "*://moodle.jsp.jena.de/*" }, function (value) {
      if (value.length > 0) {
        chrome.tabs.update(value[0].id, { highlighted: true });
      } else {
        chrome.tabs.create({
          url: "https://moodle.jsp.jena.de/my",
          active: true,
        });
      }
    });
  }
});
chrome.storage.sync.get(null, (options): void => {
  const defaultOptions: storage = {
    allowMultipleDownloads: false,
    autodashboardredirect: true,
    autologin_untrusted: false,
    autologinredirect: true,
    biggerVideo: true,
    courseInfo: {},
    dashboardEmojiFontSize: 100,
    downloaded: [],
    fächer: {},
    forcedownload: true,
    "no-empty-topics": [],
    "no-hidden-topics": false,
    removeNavigationBlock: true,
    reversed_courses: [],
    shortcoursenames: true,
    showemojicourses: true,
    sortedCourses: [],
    todos: {},
    usecoloredprogress: true,
  };
  Object.keys(defaultOptions).forEach((item: string): void => {
    options[item] == undefined ? (options[item] = defaultOptions[item]) : "";
  });
  chrome.storage.sync.set(options);
});
chrome.storage.local.get(null, function (options) {
  const defaultOptions: localStorage = {
    courseInfo: {},
    downloaded: [],
  };
  Object.keys(defaultOptions).forEach((item) => {
    options[item] == undefined ? (options[item] = defaultOptions[item]) : "";
  });
  chrome.storage.local.set(options);
});

chrome.runtime.onConnect.addListener(
  (externalPort: chrome.runtime.Port): void => {
    console.log("runtimeConnect");
    externalPort.onDisconnect.addListener(function () {
      // const ignoreError = chrome.runtime.lastError;
      console.log("runtimeDicConnect");
      chrome.tabs.query({ active: true }, (tab) => {
        console.log(tab[0]);
        if (tab[0].url.includes("moodle.jsp.jena.de")) {
          chrome.tabs.sendMessage(tab[0].id, { text: "reload" });
        }
      });
    });
  },
);
