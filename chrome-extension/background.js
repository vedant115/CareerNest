// CareerNest Chrome Extension - Background Script

// Extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log("CareerNest Job Tracker extension installed");

  if (details.reason === "install") {
    // Set default settings
    chrome.storage.local.set({
      extensionEnabled: true,
      autoFillEnabled: true,
    });

    // Open welcome page or instructions
    chrome.tabs.create({
      url: "http://localhost:5173/login",
    });
  }
});

// Handle extension icon click (only if no popup is defined)
// Since we have a popup defined in manifest, this won't be called
// chrome.action.onClicked.addListener((tab) => {
//   console.log('Extension icon clicked on tab:', tab.url);
// });

// Listen for tab updates to detect job posting pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const isJobSite = isJobPostingPage(tab.url);

    if (isJobSite) {
      // Update extension icon to indicate job posting detected
      chrome.action.setBadgeText({
        tabId: tabId,
        text: "!",
      });

      chrome.action.setBadgeBackgroundColor({
        tabId: tabId,
        color: "#2563eb",
      });

      chrome.action.setTitle({
        tabId: tabId,
        title:
          "CareerNest Job Tracker - Job posting detected! Click to add to your tracker.",
      });
    } else {
      // Clear badge for non-job pages
      chrome.action.setBadgeText({
        tabId: tabId,
        text: "",
      });

      chrome.action.setTitle({
        tabId: tabId,
        title: "CareerNest Job Tracker",
      });
    }
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkJobSite") {
    const isJobSite = isJobPostingPage(sender.tab?.url || "");
    sendResponse({ isJobSite });
  }

  if (request.action === "openCareerNest") {
    chrome.tabs.create({
      url: "http://localhost:5173/job-tracker",
    });
  }

  return true;
});

// Function to detect if current page is a job posting
function isJobPostingPage(url) {
  if (!url) return false;

  const jobSitePatterns = [
    /linkedin\.com\/jobs\/view/,
    /indeed\.com\/viewjob/,
    /glassdoor\.com\/job-listing/,
    /jobs\.lever\.co/,
    /boards\.greenhouse\.io/,
    /jobs\.smartrecruiters\.com/,
    /careers\.google\.com/,
    /careers\.microsoft\.com/,
    /careers\.facebook\.com/,
    /careers\.apple\.com/,
    /jobs\.netflix\.com/,
    /amazon\.jobs/,
    /angel\.co\/company/,
    /wellfound\.com\/company/,
    /stackoverflow\.com\/jobs/,
    /remote\.co\/job/,
    /remoteok\.io\/remote-jobs/,
    /weworkremotely\.com\/remote-jobs/,
    /ziprecruiter\.com\/jobs/,
    /monster\.com\/job-openings/,
  ];

  return jobSitePatterns.some((pattern) => pattern.test(url));
}

// Handle extension context menu (disabled for now to avoid conflicts)
// chrome.runtime.onInstalled.addListener(() => {
//   chrome.contextMenus.create({
//     id: "addToCareerNest",
//     title: "Add to CareerNest Job Tracker",
//     contexts: ["page"],
//     documentUrlPatterns: [
//       "*://www.linkedin.com/jobs/*",
//       "*://www.indeed.com/viewjob*",
//       "*://www.glassdoor.com/job-listing/*",
//       "*://jobs.lever.co/*",
//       "*://boards.greenhouse.io/*",
//     ],
//   });
// });

// chrome.contextMenus.onClicked.addListener((info, tab) => {
//   if (info.menuItemId === "addToCareerNest") {
//     // Open popup or send message to content script
//     chrome.action.openPopup();
//   }
// });

// Cleanup on extension disable/uninstall
chrome.runtime.onSuspend.addListener(() => {
  console.log("CareerNest extension suspended");
});

console.log("CareerNest background script loaded");
