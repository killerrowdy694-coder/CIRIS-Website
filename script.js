"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  // ---------- TOAST MESSAGES ----------
  let toastTimer;

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
  }

  // ---------- CURRENT YEAR ----------
  $("#year").textContent = new Date().getFullYear();

  // ---------- MOBILE NAVIGATION ----------
  const menuBtn = $("#menuBtn");
  const nav = $("#nav");

  menuBtn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuBtn.textContent = isOpen ? "×" : "☰";
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  });

  $$("#nav a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuBtn.textContent = "☰";
      menuBtn.setAttribute("aria-expanded", "false");
    });
  });

  // ---------- DARK / LIGHT THEME ----------
  const themeBtn = $("#themeBtn");

  try {
    if (localStorage.getItem("ciris-theme") === "light") {
      document.body.classList.add("light-theme");
    }
  } catch (_) {
    // The website still works if browser storage is unavailable.
  }

  function updateThemeButton() {
    const isLight = document.body.classList.contains("light-theme");
    themeBtn.textContent = isLight ? "☾" : "☼";
    themeBtn.title = isLight ? "Switch to dark mode" : "Switch to light mode";
    document.querySelector('meta[name="theme-color"]')
      .setAttribute("content", isLight ? "#f7f5f0" : "#0b0b0d");
  }

  updateThemeButton();

  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");

    try {
      localStorage.setItem(
        "ciris-theme",
        document.body.classList.contains("light-theme") ? "light" : "dark"
      );
    } catch (_) {}

    updateThemeButton();
  });

  // ---------- TYPING ANIMATION ----------
  const typingText = $("#typingText");
  const words = [
    "Dreaming Big",
    "Learning Every Day",
    "Building My Future",
    "Creating My Identity"
  ];

  let wordIndex = 0;
  let charIndex = words[0].length;
  let deleting = true;

  function typeEffect() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      typingText.textContent = words[0];
      return;
    }

    const word = words[wordIndex];

    if (deleting) {
      charIndex--;
      typingText.textContent = word.substring(0, charIndex);
    } else {
      charIndex++;
      typingText.textContent = word.substring(0, charIndex);
    }

    let delay = deleting ? 48 : 85;

    if (!deleting && charIndex === word.length) {
      deleting = true;
      delay = 1300;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      delay = 300;
    }

    setTimeout(typeEffect, delay);
  }

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setTimeout(typeEffect, 1300);
  }

  // ---------- LOCAL PROFILE PHOTO ----------
  function loadProfilePhoto() {
    const img = $("#profilePhoto");
    const placeholder = $("#profilePlaceholder");

    img.addEventListener("load", () => {
      img.style.display = "block";
      placeholder.style.display = "none";
    });

    img.addEventListener("error", () => {
      img.style.display = "none";
      placeholder.style.display = "flex";
    });

    // Recheck if an image loaded before the listener was registered.
    if (img.complete && img.naturalWidth > 0) {
      img.style.display = "block";
      placeholder.style.display = "none";
    }
  }

  loadProfilePhoto();

  // ---------- PHOTO GALLERY ----------
  const galleryCards = $$(".gallery-card");
  const galleryGrid = $("#galleryGrid");
  const searchInput = $("#photoSearch");
  const filterButtons = $$(".filter-btn");

  let activeFilter = "all";
  let searchTerm = "";
  let visiblePhotoCards = [];
  let currentPhotoIndex = 0;
  let slideTimer = null;

  // Add images using the local paths defined in index.html.
  galleryCards.forEach((card) => {
    const src = card.dataset.src;
    const title = card.dataset.title;
    const placeholder = card.querySelector(".gallery-placeholder");

    const img = document.createElement("img");
    img.src = src;
    img.alt = title;
    img.loading = "lazy";
    img.decoding = "async";

    img.addEventListener("load", () => {
      placeholder.replaceWith(img);
    });

    img.addEventListener("error", () => {
      // Keep the designed placeholder when a photo is missing.
      img.remove();
    });

    card.prepend(img);
  });

  function getLoadedCards() {
    return visiblePhotoCards.filter((card) => {
      const img = card.querySelector("img");
      return img && img.complete && img.naturalWidth > 0;
    });
  }

  function filterGallery() {
    visiblePhotoCards = [];

    galleryCards.forEach((card) => {
      const matchesCategory =
        activeFilter === "all" || card.dataset.category === activeFilter;

      const matchesSearch = (
        card.dataset.title + " " + card.dataset.category
      ).toLowerCase().includes(searchTerm);

      const matches = matchesCategory && matchesSearch;

      card.hidden = !matches;

      if (matches) {
        visiblePhotoCards.push(card);
      }
    });

    // Reset slideshow whenever the gallery changes.
    stopSlideshow();
    updateSlideshowButton();
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;

      filterButtons.forEach((item) => {
        item.classList.toggle("active", item === button);
      });

      filterGallery();
    });
  });

  searchInput.addEventListener("input", () => {
    searchTerm = searchInput.value.trim().toLowerCase();
    filterGallery();
  });

  // ---------- FULL-SCREEN PHOTO VIEWER ----------
  const lightbox = $("#lightbox");
  const lightboxImage = $("#lightboxImage");
  const lightboxCaption = $("#lightboxCaption");
  const lightboxClose = $("#lightboxClose");
  const lightboxPrev = $("#lightboxPrev");
  const lightboxNext = $("#lightboxNext");

  let previouslyFocusedElement = null;

  function showPhoto(index) {
    const loadedCards = getLoadedCards();

    if (loadedCards.length === 0) {
      showToast("Pehle images folder mein apni photos add karo.");
      return;
    }

    currentPhotoIndex =
      (index + loadedCards.length) % loadedCards.length;

    const card = loadedCards[currentPhotoIndex];
    const image = card.querySelector("img");

    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    lightboxCaption.textContent = card.dataset.title;

    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.removeAttribute("src");
    document.body.style.overflow = "";

    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus();
    }
  }

  galleryCards.forEach((card) => {
    card.addEventListener("click", () => {
      const img = card.querySelector("img");

      if (!img || !img.complete || img.naturalWidth === 0) {
        showToast("Is photo ki file images folder mein nahi mili.");
        return;
      }

      previouslyFocusedElement = card;
      const index = getLoadedCards().indexOf(card);
      showPhoto(Math.max(0, index));
    });
  });

  lightboxClose.addEventListener("click", closeLightbox);

  lightboxPrev.addEventListener("click", () => {
    showPhoto(currentPhotoIndex - 1);
  });

  lightboxNext.addEventListener("click", () => {
    showPhoto(currentPhotoIndex + 1);
  });

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("open")) return;

    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") showPhoto(currentPhotoIndex - 1);
    if (event.key === "ArrowRight") showPhoto(currentPhotoIndex + 1);
  });

  // ---------- SLIDESHOW ----------
  const slideshowBtn = $("#slideshowBtn");

  function updateSlideshowButton() {
    slideshowBtn.textContent = slideTimer
      ? "Ⅱ Stop Slideshow"
      : "▶ Start Slideshow";
  }

  function stopSlideshow() {
    if (slideTimer !== null) {
      clearInterval(slideTimer);
      slideTimer = null;
    }
    updateSlideshowButton();
  }

  function startSlideshow() {
    const loaded = getLoadedCards();

    if (loaded.length === 0) {
      showToast("Slideshow ke liye pehle apni photos add karo.");
      return;
    }

    const firstIndex = Math.max(
      0,
      loaded.indexOf(visiblePhotoCards.find((card) => card === loaded[0]))
    );

    previouslyFocusedElement = document.activeElement;
    showPhoto(firstIndex);

    slideTimer = setInterval(() => {
      if (!lightbox.classList.contains("open")) {
        stopSlideshow();
        return;
      }
      showPhoto(currentPhotoIndex + 1);
    }, 3000);

    updateSlideshowButton();
  }

  slideshowBtn.addEventListener("click", () => {
    if (slideTimer !== null) {
      stopSlideshow();
    } else {
      startSlideshow();
    }
  });

  // Stop the slideshow when the viewer is closed.
  lightboxClose.addEventListener("click", stopSlideshow);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) stopSlideshow();
  });

  // ---------- SHARE PROFILE ----------
  async function shareProfile() {
    const shareData = {
      title: "Krish Kumar | CIRIS",
      text: "My Life, My Journey, My Identity."
    };

    // Share the public URL only when this page has been hosted.
    if (location.protocol === "http:" || location.protocol === "https:") {
      shareData.url = location.href.split("#")[0];
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(
          shareData.url || shareData.title + " — " + shareData.text
        );
        showToast(
          shareData.url
            ? "Website link copied!"
            : "Profile text copied. Publish the site to share its link."
        );
      } else {
        showToast("Website publish hone ke baad link share kar sakte ho.");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        showToast("Share nahi ho paya. Dobara try karo.");
      }
    }
  }

  $("#shareBtn").addEventListener("click", shareProfile);
  $("#contactShareBtn").addEventListener("click", shareProfile);

  // ---------- BACK TO TOP + SCROLL PROGRESS ----------
  const backToTop = $("#backToTop");
  const progressBar = $("#progressBar");

  function updateScrollUI() {
    const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;

    const progress = scrollable > 0
      ? (window.scrollY / scrollable) * 100
      : 0;

    progressBar.style.width = progress + "%";
    backToTop.classList.toggle("visible", window.scrollY > 350);
  }

  window.addEventListener("scroll", updateScrollUI, { passive: true });
  updateScrollUI();

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ---------- ACTIVE NAV LINK ----------
  const sections = $$("main section[id]");
  const navLinks = $$("#nav a");

  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        navLinks.forEach((link) => {
          link.classList.toggle(
            "active",
            link.getAttribute("href") === "#" + entry.target.id
          );
        });
      });
    }, { rootMargin: "-30% 0px -60% 0px" });

    sections.forEach((section) => navObserver.observe(section));
  }

  // ---------- REVEAL ANIMATIONS ----------
  const revealItems = $$(".section-heading, .quote-card, .dream-card, " +
    ".memory-card, .timeline-item, .gallery-card, .empty-memory");

  if ("IntersectionObserver" in window &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealItems.forEach((item) => item.classList.add("reveal"));

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  // ---------- OPTIONAL AMBIENT MUSIC ----------
  // Creates a quiet electronic ambient tone locally; no audio file is required.
  let audioContext = null;
  let musicNodes = [];
  let musicPlaying = false;

  const musicBtn = $("#musicBtn");
  const musicLabel = $("#musicLabel");

  function stopMusic() {
    musicNodes.forEach((node) => {
      try {
        node.stop();
      } catch (_) {}
      try {
        node.disconnect();
      } catch (_) {}
    });

    musicNodes = [];
    musicPlaying = false;
    musicBtn.setAttribute("aria-pressed", "false");
    musicLabel.textContent = "Music: Off";
  }

  async function startMusic() {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      showToast("Is browser mein audio support available nahi hai.");
      return;
    }

    try {
      audioContext = audioContext || new AudioContextClass();
      await audioContext.resume();

      const master = audioContext.createGain();
      master.gain.value = 0.025;
      master.connect(audioContext.destination);

      // Gentle, sustained notes. Start only after the user's click.
      [130.81, 196, 261.63].forEach((frequency) => {
        const oscillator = audioContext.createOscillator();
        const volume = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        volume.gain.value = 0.18;

        oscillator.connect(volume);
        volume.connect(master);
        oscillator.start();

        musicNodes.push(oscillator, volume);
      });

      musicNodes.push(master);
      musicPlaying = true;
      musicBtn.setAttribute("aria-pressed", "true");
      musicLabel.textContent = "Music: On";
    } catch (_) {
      stopMusic();
      showToast("Audio start nahi ho paya.");
    }
  }

  musicBtn.addEventListener("click", () => {
    if (musicPlaying) {
      stopMusic();
    } else {
      startMusic();
    }
  });

  // Initial gallery state.
  filterGallery();
});