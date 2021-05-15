import axios from "axios";

chrome.runtime.onInstalled.addListener(
  (object: chrome.runtime.InstalledDetails): void => {
    if ("install" === object.reason)
      chrome.tabs.create(
        { url: "https://smjt.robertstuendl.com/first-install" },
        (): void => {
          console.log("New tab launched");
        },
      );
  },
);
chrome.commands.onCommand.addListener((command): void => {
  if (command === "panik-key") {
    chrome.tabs.query({ url: "*://moodle.jsp.jena.de/*" }, (value): void => {
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
  const defaultOptions: syncStorage = {
    allowMultipleDownloads: false,
    autodashboardredirect: true,
    autologin_untrusted: false,
    autologinredirect: true,
    biggerVideo: true,
    dashboardEmojiFontSize: 100,
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
    tilesToList: false,
  };
  Object.keys(defaultOptions).forEach((item: string): void => {
    options[item] == undefined ? (options[item] = defaultOptions[item]) : "";
  });
  chrome.storage.sync.set(options);
});
chrome.storage.local.get(null, (options): void => {
  const defaultOptions: localStorage = {
    courseInfo: {},
    downloaded: [],
    "todoist-oauth-token": "",
    "todoist-project-id": "",
  };
  Object.keys(defaultOptions).forEach((item) => {
    options[item] == undefined ? (options[item] = defaultOptions[item]) : "";
  });
  chrome.storage.local.set(options);
});

chrome.runtime.onConnect.addListener(
  (externalPort: chrome.runtime.Port): void => {
    console.log("runtimeConnect");
    externalPort.onDisconnect.addListener((): void => {
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

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    const url = new URL(details.url);
    if (url.href.includes("/api/todoist-loggedin")) {
      chrome.storage.local.set({
        "todoist-oauth-token": url.searchParams.get("token"),
      });
      return {
        redirectUrl: "https://moodle.jsp.jena.de/?action=todoist-loggedin",
      };
    }
    if (
      url.href.includes("/api/todoist-oauth") &&
      url.searchParams.get("smjt_state") == null
    ) {
      url.searchParams.append("smjt_state", chrome.runtime.id);
      url.searchParams.append("client_id", "dffd8cf0da854df890922f69d6ff43a1");

      return { redirectUrl: url.href };
    }
  },
  {
    urls: ["https://smjt.robertstuendl.com/*"],
  },
  ["blocking"],
);

chrome.alarms.create("todoist-sync", {
  periodInMinutes: 0.5,
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "todoist-sync") {
    console.log("Alarm Todoist Sync");
    //TODO: Add A little Check (var: false; before saving --> var: true; after saving) so that no todo goes missing.
    chrome.storage.local.get(
      ["todoist-project-id", "todoist-oauth-token"],

      (values) => {
        axios
          .get("https://api.todoist.com/rest/v1/tasks", {
            headers: {
              Authorization: `Bearer ${values["todoist-oauth-token"]}`,
            },
            params: {
              project_id: values["todoist-project-id"],
            },
          })
          .then((response) => {
            const output: todoItem[] = [];
            (response.data as Array<todoist.task>).forEach((todoistItem) => {
              output.push({
                title: todoistItem.content,
                done: false,
                integration: "todoist",
                time: todoistItem.due.datetime,
                label: todoistItem.label_ids.map(String),
                color: null,
              });
            });
            console.log(output);
            //TODO: Add Last-Synced var
            chrome.storage.local.set({
              todos: output,
            });
          });
      },
    );
  }
});