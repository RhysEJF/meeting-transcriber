// @ts-check
/// <reference path="../types/chrome.d.ts" />
/// <reference path="../types/index.js" />

window.onload = function () {
  const autoModeRadio = document.querySelector("#auto-mode")
  const manualModeRadio = document.querySelector("#manual-mode")
  const versionElement = document.querySelector("#version")

  // Platform Checkboxes
  const googleMeetToggle = /** @type {HTMLInputElement} */ (document.querySelector("#enable-google-meet"))

  if (versionElement) {
    versionElement.innerHTML = `v${chrome.runtime.getManifest().version}`
  }

  chrome.storage.sync.get(["operationMode"], function (resultSyncUntyped) {
    const resultSync = /** @type {ResultSync} */ (resultSyncUntyped)
    if (autoModeRadio instanceof HTMLInputElement && manualModeRadio instanceof HTMLInputElement) {
      if (resultSync.operationMode === "manual") {
        manualModeRadio.checked = true
      }
      else {
        autoModeRadio.checked = true
      }

      autoModeRadio.addEventListener("change", function () {
        chrome.storage.sync.set({ operationMode: "auto" }, function () { })
      })
      manualModeRadio.addEventListener("change", function () {
        chrome.storage.sync.set({ operationMode: "manual" }, function () { })
      })
    }
  })

  /**
   * Syncs checkbox UI with actual background script registration status
   * @param {HTMLInputElement} element
   * @param {Platform} platform
   */
  function syncPlatformStatus(element, platform) {
    /** @type {ExtensionMessage} */
    const message = {
      type: "get_platform_status",
      platform: platform
    }
    chrome.runtime.sendMessage(message, (responseUntyped) => {
      const response = /** @type {ExtensionResponse} */ (responseUntyped)
      if (response && response.success) {
        element.checked = response.message === "Enabled"
      }
    })

    element.addEventListener("change", () => {
      const type = element.checked ? "enable_platform" : "disable_platform"

      /** @type {ExtensionMessage} */
      const message = {
        type: type,
        platform: platform
      }
      chrome.runtime.sendMessage(message, (responseUntyped) => {
        const response = /** @type {ExtensionResponse} */ (responseUntyped)
        if (response.success) {
          chrome.storage.sync.set({ wantGoogleMeet: element.checked }, function () { })
        }
        else {
          element.checked = !element.checked // Revert on failure
          console.error(`Failed to toggle ${platform}:`, response.message)
        }
      })
    })
  }

  // Initialize Toggles
  if (googleMeetToggle) {
    syncPlatformStatus(googleMeetToggle, "google_meet")
  }
}
