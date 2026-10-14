window.DashaOS = window.DashaOS || {};

window.DashaOS.initWindowManager = function () {
  let topZIndex = 50;
  let currentProjectIndex = 0;
  const windows = document.querySelectorAll(".win95-window");
  const taskbarTabs = document.getElementById("taskbar-tabs");

  function updateMaximizeButtonIcon(winEl) {
    const maxBtn = winEl.querySelector('[data-action="maximize"]');
    if (maxBtn) {
      maxBtn.textContent = winEl.classList.contains("is-maximized") ? "❐" : "□";
    }
  }

  function focusWindow(winEl) {
    if (!winEl) return;
    windows.forEach(function (w) { w.classList.remove("is-focused"); });
    winEl.classList.remove("is-minimized");
    topZIndex += 1;
    winEl.style.zIndex = topZIndex;
    winEl.classList.add("is-focused");
    syncTaskbar();
  }

  function openWindow(winId, silent) {
    const winEl = document.getElementById(winId);
    if (!winEl) return;
    if (!silent && window.DashaOS.sound) {
      window.DashaOS.sound.playOpenFile();
    }
    winEl.classList.add("is-open");
    winEl.classList.remove("is-minimized");
    focusWindow(winEl);

    if (window.innerWidth < 768) {
      winEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function minimizeWindow(winEl) {
    winEl.classList.add("is-minimized");
    winEl.classList.remove("is-focused");
    syncTaskbar();
  }

  function toggleMaximizeWindow(winEl) {
    winEl.classList.toggle("is-maximized");
    updateMaximizeButtonIcon(winEl);
    focusWindow(winEl);
  }

  function closeWindow(winEl) {
    winEl.classList.remove("is-open", "is-focused", "is-minimized", "is-maximized");
    updateMaximizeButtonIcon(winEl);
    syncTaskbar();
  }

  function syncTaskbar() {
    if (!taskbarTabs) return;
    taskbarTabs.innerHTML = "";

    windows.forEach(function (winEl) {
      if (!winEl.classList.contains("is-open")) return;

      const title = winEl.dataset.title || "Окно";
      const isFocused = winEl.classList.contains("is-focused") && !winEl.classList.contains("is-minimized");
      const isMinimized = winEl.classList.contains("is-minimized");

      const tabBtn = document.createElement("button");
      tabBtn.type = "button";
      tabBtn.className = "win95-btn taskbar-tab " + (isFocused ? "active " : "") + (isMinimized ? "is-minimized-tab" : "");
      tabBtn.textContent = title;

      tabBtn.addEventListener("click", function () {
        if (window.DashaOS.sound) window.DashaOS.sound.playOpenFile();
        if (isMinimized) {
          winEl.classList.remove("is-minimized");
          focusWindow(winEl);
        } else if (isFocused) {
          minimizeWindow(winEl);
        } else {
          focusWindow(winEl);
        }
      });

      taskbarTabs.appendChild(tabBtn);
    });
  }

  windows.forEach(function (winEl) {
    winEl.addEventListener("mousedown", function () {
      if (!winEl.classList.contains("is-minimized")) {
        focusWindow(winEl);
      }
    });

    const titlebar = winEl.querySelector(".win95-titlebar");
    if (titlebar) {
      titlebar.addEventListener("dblclick", function (e) {
        if (e.target.closest(".win95-ctrl-btn")) return;
        toggleMaximizeWindow(winEl);
      });
    }

    winEl.querySelectorAll(".win95-ctrl-btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === "minimize") minimizeWindow(winEl);
        if (action === "maximize") toggleMaximizeWindow(winEl);
        if (action === "close") closeWindow(winEl);
      });
    });
  });

  document.addEventListener("click", function (e) {
    const trigger = e.target.closest("[data-open-window]");
    if (!trigger) return;
    openWindow(trigger.dataset.openWindow);
    const startMenu = document.getElementById("start-menu");
    if (startMenu) startMenu.hidden = true;
  });

  const prevBtn = document.getElementById("btn-prev-project");
  const nextBtn = document.getElementById("btn-next-project");
  const projects = window.DashaOS.projectsData || [];

  if (prevBtn && nextBtn && projects.length) {
    prevBtn.addEventListener("click", function () {
      currentProjectIndex = (currentProjectIndex - 1 + projects.length) % projects.length;
      window.DashaOS.openProjectModal(projects[currentProjectIndex], api);
    });
    nextBtn.addEventListener("click", function () {
      currentProjectIndex = (currentProjectIndex + 1) % projects.length;
      window.DashaOS.openProjectModal(projects[currentProjectIndex], api);
    });
  }

  const lightbox = document.getElementById("image-lightbox");
  const lightboxClose = document.getElementById("lightbox-close");
  if (lightbox && lightboxClose) {
    lightboxClose.addEventListener("click", function () { lightbox.hidden = true; });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) lightbox.hidden = true;
    });
  }

  function setCurrentProjectIndex(id) {
    const idx = projects.findIndex(function (p) { return p.id === id; });
    if (idx !== -1) currentProjectIndex = idx;
  }

  const initialOpen = document.querySelector(".win95-window.is-open");
  if (initialOpen) focusWindow(initialOpen);

  const api = { openWindow: openWindow, focusWindow: focusWindow, setCurrentProjectIndex: setCurrentProjectIndex, syncTaskbar: syncTaskbar };
  return api;
};

window.DashaOS.openProjectModal = function (project, windowApi) {
  const winEl = document.getElementById("win-project-viewer");
  const titleEl = document.getElementById("project-modal-title");
  const bodyEl = document.getElementById("project-modal-body");
  const statusCat = document.getElementById("project-status-category");
  const statusTools = document.getElementById("project-status-tools");

  if (!winEl || !bodyEl || !project) return;

  windowApi.setCurrentProjectIndex(project.id);
  winEl.dataset.title = "🎨 " + project.title + ".lnk";
  titleEl.textContent = "🎨 Кейс: " + project.title + " — " + project.categoryName;
  statusCat.textContent = "Направление: " + project.categoryName;
  statusTools.textContent = "Стек: " + project.tools;

  const fallbackUri = project.fallbackThumb || "";
  const allSlides = project.images && project.images.length ? project.images : [project.thumb];

  const deliverablesHtml = (project.deliverables || [])
    .map(function (item) { return "<li>" + item + "</li>"; })
    .join("");

  const paletteHtml = (project.palette || [])
    .map(function (hex) {
      return '<button type="button" class="palette-swatch" data-copy-hex="' + hex + '" title="Скопировать ' + hex + '">' +
        '<span class="palette-swatch__color" style="background:' + hex + ';"></span>' +
        '<span>' + hex + '</span></button>';
    })
    .join("");

  const slidesHtml = allSlides
    .map(function (imgSrc, i) {
      return '<img src="' + imgSrc + '" alt="' + project.title + ' слайд ' + (i + 1) + '" ' +
        'class="project-slide-thumb" data-fallback="' + fallbackUri + '" ' +
        'onerror="window.DashaOS.handleImgFallback(this, this.dataset.fallback)" ' +
        'title="Нажмите для увеличения слайда №' + (i + 1) + '">';
    })
    .join("");

  bodyEl.innerHTML =
    '<div class="project-showcase">' +
      '<div class="project-showcase__gallery">' +
        '<img id="main-showcase-img" src="' + project.thumb + '" alt="' + project.title + '" ' +
          'class="project-showcase__img" data-fallback="' + fallbackUri + '" ' +
          'onerror="window.DashaOS.handleImgFallback(this, this.dataset.fallback)" ' +
          'style="cursor:zoom-in; object-fit:contain; background:#1e1e1e;" title="Нажмите для полноэкранного увеличения">' +
        '<div class="project-meta-box">' +
          '<p><strong>📌 Направление:</strong> ' + project.categoryName + '</p>' +
          '<p><strong>🛠 Инструменты:</strong> ' + project.tools + '</p>' +
          '<p style="margin-top:6px;"><strong>📂 Исходные данные:</strong><br>' + project.inputData + '</p>' +
          '<p style="margin-top:6px;"><strong>🎯 Задача:</strong><br>' + project.task + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="project-meta-box">' +
        '<p><strong>🖼 Все макеты в этом файле (' + allSlides.length + ' шт.) — кликните для увеличения:</strong></p>' +
        '<div class="project-slides-grid">' + slidesHtml + '</div>' +
      '</div>' +
      '<div class="project-meta-box">' +
        '<p><strong>✅ Что было сделано (' + project.title + '):</strong></p>' +
        '<p style="margin-top:4px;">' + project.result + '</p>' +
        '<ul class="deliverables-list">' + deliverablesHtml + '</ul>' +
      '</div>' +
      '<div class="project-meta-box">' +
        '<p><strong>🎨 Цветовая палитра проекта:</strong></p>' +
        '<div class="palette-row">' + paletteHtml + '</div>' +
      '</div>' +
    '</div>';

  // Открытие любого слайда в полноэкранном лайтбоксе + смена главного превью
  const mainImg = document.getElementById("main-showcase-img");
  function openInLightbox(srcToZoom) {
    if (window.DashaOS.sound) window.DashaOS.sound.playOpenFile();
    const lb = document.getElementById("image-lightbox");
    const lbImg = document.getElementById("lightbox-img");
    const lbCap = document.getElementById("lightbox-caption");
    if (lb && lbImg) {
      lbImg.src = srcToZoom;
      if (lbCap) lbCap.textContent = "🔍 " + project.title + " — Просмотр макета";
      lb.hidden = false;
    }
  }

  if (mainImg) {
    mainImg.addEventListener("click", function () {
      openInLightbox(mainImg.src);
    });
  }

  bodyEl.querySelectorAll(".project-slide-thumb").forEach(function (thumbEl) {
    thumbEl.addEventListener("click", function () {
      if (mainImg) mainImg.src = thumbEl.src;
      openInLightbox(thumbEl.src);
    });
  });

  // Копирование HEX-кода палитры
  bodyEl.querySelectorAll("[data-copy-hex]").forEach(function (swatch) {
    swatch.addEventListener("click", function () {
      const hex = swatch.dataset.copyHex;
      if (navigator.clipboard) navigator.clipboard.writeText(hex);
      const label = swatch.querySelector("span:last-child");
      if (label) {
        label.textContent = "Скопировано!";
        setTimeout(function () { label.textContent = hex; }, 1000);
      }
    });
  });

  windowApi.openWindow("win-project-viewer");
};