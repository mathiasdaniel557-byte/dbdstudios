/* ==========================================================
   DBD Studio — main.js
   Everything you may want to edit is in SETTINGS below.
   ========================================================== */

const SETTINGS = {
  // Country code + number, no "+" and no spaces
  whatsappNumber: "2347084788749",
  email: "dbdstudioo@gmail.com",

  // X (Twitter). The X buttons open the profile page below.
  xProfile: "https://x.com/DBDStudio_",
  // The "Watch full video on X" button in the intro pop-up opens this post
  xThread: "https://x.com/DBDStudio_/status/2120903868833812726",
  // Optional: your numeric X user ID. If you fill it in, the X option in the
  // package pop-up opens a direct message to you instead of your profile.
  // (X direct messages only work for people you allow to message you.)
  xDmUserId: "",

  // "Let's chat", hero and contact-section buttons (casual enquiry)
  emailSubject: "Project enquiry from the DBD Studio website",
  generalMessage:
    "Hi DBD Studio, I found your website and I'd like to talk about a project.\n\n" +
    "(Feel free to edit this message and tell me what you have in mind.)",

  // Package buttons. {name} becomes the package name (Starter, Growth...).
  // The price comes from data-price on each package card in index.html.
  // Text in [square brackets] is a placeholder the visitor replaces.
  packageEmailSubject: "{name} package enquiry from the DBD Studio website",
  packageDetails:
    "\n\nAbout my project: [describe your project here]\n" +
    "Preferred timeline: [add a date or deadline here]\n\n" +
    "(Feel free to edit this message to say what you need.)"
};


/* ---------- Link builders ---------- */

/**
 * @param {string} message
 * @returns {string}
 */
function whatsappLink(message) {
  return "https://wa.me/" + SETTINGS.whatsappNumber + "?text=" + encodeURIComponent(message);
}

/**
 * @param {string} body
 * @param {string} subject
 * @returns {string}
 */
function emailLink(body, subject) {
  return (
    "mailto:" + SETTINGS.email +
    "?subject=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent(body)
  );
}

/**
 * Where the X option in the package pop-up goes.
 * @returns {string}
 */
function xLink() {
  return SETTINGS.xDmUserId
    ? "https://x.com/messages/compose?recipient_id=" + encodeURIComponent(SETTINGS.xDmUserId)
    : SETTINGS.xProfile;
}

/**
 * Builds the message for a package enquiry.
 * @param {string} name
 * @param {string | undefined} price
 * @returns {string}
 */
function packageMessage(name, price) {
  return (
    "Hi DBD Studio, I'm interested in the " + name + " package" +
    (price ? " (" + price + ")" : "") + "." +
    SETTINGS.packageDetails
  );
}

/**
 * Points every WhatsApp and email link inside `root` at the given message.
 * @param {ParentNode} root
 * @param {string} message
 * @param {string} subject
 */
function setContactLinks(root, message, subject) {
  root.querySelectorAll('[data-contact="whatsapp"]').forEach((link) => {
    link.href = whatsappLink(message);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });
  root.querySelectorAll('[data-contact="email"]').forEach((link) => {
    link.href = emailLink(message, subject);
  });
  root.querySelectorAll('[data-contact="x"]').forEach((link) => {
    link.href = xLink();
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });
}


/* ---------- Page links ---------- */

// WhatsApp and email buttons on the page lead to the packages (see "Contact buttons"
// below). Only the package pop-up has a pre-filled message. The X buttons go to
// the profile, and the intro pop-up button goes to the thread.
document.querySelectorAll("[data-x-profile]").forEach((link) => {
  if (link instanceof HTMLAnchorElement) link.href = SETTINGS.xProfile;
});
document.querySelectorAll("[data-x-thread]").forEach((link) => {
  if (link instanceof HTMLAnchorElement) link.href = SETTINGS.xThread;
});
document.querySelectorAll("[data-x-note]").forEach((note) => {
  note.textContent = SETTINGS.xDmUserId ? "Opens a direct message to us on X" : "Opens our X page";
});

const calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


/* ---------- Videos: one at a time, no right-click saving ---------- */

// Ambient loops (the muted intro preview) are left out of the "one at a time" rule
const videos = Array.from(document.querySelectorAll("video:not([data-ambient])"));

/**
 * Pauses every video except the one given (or all, if none is given).
 * @param {HTMLVideoElement} [except]
 */
function pauseAllVideos(except) {
  videos.forEach((video) => {
    if (video === except) return;
    delete video.dataset.autopaused;   // a video stopped here should not restart by itself
    if (!video.paused) video.pause();
  });
}

// "play" does not bubble, so listen in the capture phase
document.addEventListener(
  "play",
  (event) => {
    const video = event.target;
    if (video instanceof HTMLVideoElement && !video.hasAttribute("data-ambient")) {
      pauseAllVideos(video);
    }
  },
  true
);

// Right-click saving is blocked, except on videos marked data-saveable (the intro)
videos.forEach((video) => {
  if (video.hasAttribute("data-saveable")) return;
  video.addEventListener("contextmenu", (event) => event.preventDefault());
});


/* ---------- Intro loop: plays only while it is on screen ---------- */

const ambientVideos = /** @type {HTMLVideoElement[]} */ (
  Array.from(document.querySelectorAll("video[data-ambient]"))
);
let introPopupOpen = false;

/**
 * Plays an ambient video only when it is visible, the pop-up is closed and the
 * visitor has not asked for reduced motion.
 * @param {HTMLVideoElement} video
 */
function syncAmbient(video) {
  const shouldPlay = video.dataset.inview === "1" && !introPopupOpen && !calmMotion;
  if (shouldPlay) {
    if (video.paused) video.play().catch(() => {});
  } else if (!video.paused) {
    video.pause();
  }
}

ambientVideos.forEach((video) => {
  video.defaultMuted = true;
  video.muted = true;
});

if ("IntersectionObserver" in window) {
  const ambientObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = /** @type {HTMLVideoElement} */ (entry.target);
        video.dataset.inview = entry.intersectionRatio >= 0.25 ? "1" : "0";
        syncAmbient(video);
      });
    },
    { threshold: [0, 0.25] }
  );
  ambientVideos.forEach((video) => ambientObserver.observe(video));
} else {
  ambientVideos.forEach((video) => {
    video.dataset.inview = "1";
    syncAmbient(video);
  });
}


/* ---------- Selected work: pause out of view, resume when back ---------- */
// A video that scrolls off screen pauses. If it was playing, it resumes by
// itself when it comes back into view. A video the visitor paused stays paused.

const scrollVideos = Array.from(document.querySelectorAll(".project__video"));

if ("IntersectionObserver" in window && scrollVideos.length) {
  const scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = /** @type {HTMLVideoElement} */ (entry.target);
        const inView = entry.intersectionRatio >= 0.2;

        if (!inView) {
          // Leave it alone in full screen (some phones report the page video as off screen)
          if (document.fullscreenElement || /** @type {any} */ (video).webkitDisplayingFullscreen) return;
          if (!video.paused && !video.ended) {
            video.dataset.autopaused = "1";
            video.pause();
          }
        } else if (video.dataset.autopaused === "1") {
          delete video.dataset.autopaused;
          video.play().catch(() => {});   // the browser may refuse; the viewer can press play
        }
      });
    },
    { threshold: [0, 0.2] }
  );
  scrollVideos.forEach((video) => scrollObserver.observe(video));
}


/* ---------- Header logo: hide it if the file is missing ---------- */

document.querySelectorAll(".site-header__logo").forEach((img) => {
  if (!(img instanceof HTMLImageElement)) return;
  const hide = () => { img.hidden = true; };
  if (img.complete && img.naturalWidth === 0) hide();
  img.addEventListener("error", hide);
});


/* ---------- Carousel slider: edge fades and arrow buttons ---------- */

document.querySelectorAll(".slider").forEach((slider) => {
  const track = slider.querySelector(".slider__track");
  if (!(track instanceof HTMLElement)) return;

  // Shows the fade only on the side where more slides are hidden
  const update = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    slider.classList.toggle("is-at-start", track.scrollLeft <= 4);
    slider.classList.toggle("is-at-end", track.scrollLeft >= maxScroll - 4);
  };

  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  window.addEventListener("load", update);

  slider.querySelectorAll("[data-slider-dir]").forEach((button) => {
    button.addEventListener("click", () => {
      const direction = button.getAttribute("data-slider-dir") === "next" ? 1 : -1;
      track.scrollBy({
        left: direction * track.clientWidth * 0.8,
        behavior: calmMotion ? "auto" : "smooth"
      });
    });
  });

  update();
});


/* ---------- Pop-ups ---------- */

const contactDialog = /** @type {HTMLDialogElement | null} */ (document.getElementById("contact-dialog"));
const featuredDialog = /** @type {HTMLDialogElement | null} */ (document.getElementById("featured-dialog"));
const introDialog = /** @type {HTMLDialogElement | null} */ (document.getElementById("intro-dialog"));
const introVideo = /** @type {HTMLVideoElement | null} */ (document.getElementById("intro-video"));
const contextLine = document.getElementById("contact-dialog-context");
const packagesSection = document.getElementById("packages");
const packagesPick = document.getElementById("packages-pick");

/**
 * Sets the contact pop-up's messages: general if no package is given,
 * otherwise a message that names the chosen package and its price.
 * @param {string | undefined} packageName
 * @param {string | undefined} price
 */
function prepareContactDialog(packageName, price) {
  if (!contactDialog || !contextLine) return;

  if (packageName) {
    setContactLinks(
      contactDialog,
      packageMessage(packageName, price),
      SETTINGS.packageEmailSubject.replace("{name}", packageName)
    );
    contextLine.textContent = "About the " + packageName + " package";
    contextLine.hidden = false;
  } else {
    setContactLinks(contactDialog, SETTINGS.generalMessage, SETTINGS.emailSubject);
    contextLine.textContent = "";
    contextLine.hidden = true;
  }
}

/**
 * @param {string | undefined} packageName
 * @param {string | undefined} price
 */
function openContactDialog(packageName, price) {
  pauseAllVideos();
  if (contactDialog && typeof contactDialog.showModal === "function") {
    prepareContactDialog(packageName, price);
    contactDialog.showModal();
  } else {
    // Very old browsers: go to the contact section instead
    window.location.hash = "contact";
  }
}

/** Opens the founder's intro with sound, from the start. */
function openIntroDialog() {
  if (!introDialog || !introVideo || typeof introDialog.showModal !== "function") return;

  pauseAllVideos();
  introPopupOpen = true;
  ambientVideos.forEach(syncAmbient);   // pauses the muted loop behind the pop-up

  // The file is only requested when the pop-up is first opened
  if (!introVideo.getAttribute("src")) introVideo.src = introVideo.dataset.src || "";
  introDialog.showModal();
  introVideo.currentTime = 0;
  introVideo.muted = false;
  introVideo.play().catch(() => {});    // if the browser refuses, the play button is there
}

if (introDialog && introVideo) {
  introDialog.addEventListener("close", () => {
    introVideo.pause();
    introPopupOpen = false;
    ambientVideos.forEach(syncAmbient); // the muted loop carries on if it is still on screen
  });
}

let guideTimer = 0;

/**
 * Contact buttons (WhatsApp, email, "Let's chat") come here: it scrolls to the
 * packages and lights the cards up briefly, because a message is started from a package.
 */
function guideToPackages() {
  if (!packagesPick) {
    window.location.hash = "packages";
    return;
  }
  packagesPick.scrollIntoView({ behavior: calmMotion ? "auto" : "smooth", block: "start" });
  packagesPick.focus({ preventScroll: true });
  if (packagesSection) {
    packagesSection.classList.add("is-guided");
    window.clearTimeout(guideTimer);
    guideTimer = window.setTimeout(() => packagesSection.classList.remove("is-guided"), 2600);
  }
}


// One click listener for the whole page (also catches taps on icons inside buttons)
document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  // Contact buttons: go to the packages first
  if (target.closest("[data-guide-to-packages]")) {
    event.preventDefault();
    guideToPackages();
    return;
  }

  // Intro video: open the pop-up with sound / close it
  if (target.closest("[data-intro-open]")) {
    openIntroDialog();
    return;
  }
  if (introDialog && target.closest("[data-intro-close]")) {
    introDialog.close();
    return;
  }

  // Package buttons
  const opener = target.closest("[data-contact-open]");
  if (opener instanceof HTMLElement) {
    const card = opener.closest(".package");
    openContactDialog(
      opener.dataset.packageEnquiry,
      card instanceof HTMLElement ? card.dataset.price : undefined
    );
    return;
  }

  // Featured thumbnail
  if (target.closest("[data-featured-open]")) {
    if (featuredDialog && typeof featuredDialog.showModal === "function") {
      pauseAllVideos();
      featuredDialog.showModal();
    } else {
      window.location.hash = "projects";
    }
    return;
  }

  // Close buttons
  if (contactDialog && target.closest("[data-contact-close]")) {
    contactDialog.close();
    return;
  }
  if (featuredDialog && target.closest("[data-featured-close]")) {
    featuredDialog.close();
    return;
  }

  // Choosing WhatsApp or Email closes the pop-up (the link still opens)
  if (contactDialog && target.closest("#contact-dialog a")) {
    contactDialog.close();
    return;
  }

  // "Back to top" and the logo: always scroll to the very top
  if (target.closest('a[href="#top"]')) {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: calmMotion ? "auto" : "smooth" });
  }
});

// Close a pop-up when the dark area outside its box is tapped
[contactDialog, featuredDialog, introDialog].forEach((dialog) => {
  if (!dialog) return;
  dialog.addEventListener("click", (event) => {
    const box = dialog.getBoundingClientRect();
    const outside =
      event.clientX < box.left || event.clientX > box.right ||
      event.clientY < box.top || event.clientY > box.bottom;
    if (outside) dialog.close();
  });
});
