window.DashaOS = window.DashaOS || {};

window.DashaOS.initDragAndDrop = function () {
  const windows = document.querySelectorAll(".win95-window");

  windows.forEach(function (winEl) {
    const titlebar = winEl.querySelector(".win95-titlebar");
    const resizers = winEl.querySelectorAll(".win95-resizer");

    // 1. ПЕРЕТАСКИВАНИЕ ОКНА ЗА СИНЮЮ ШАПКУ
    if (titlebar) {
      titlebar.addEventListener("mousedown", function (e) {
        if (e.button !== 0) return; // Только левая кнопка мыши
        if (window.innerWidth < 768) return; // На смартфонах окна в мобильной сетке
        if (e.target.closest(".win95-ctrl-btn")) return; // Игнорируем клик по кнопкам [ _ ] [ □ ] [ ✕ ]

        e.preventDefault();

        // Если окно было развернуто на весь экран — при перетаскивании восстанавливаем его
        if (winEl.classList.contains("is-maximized")) {
          winEl.classList.remove("is-maximized");
          const maxBtn = winEl.querySelector('[data-action="maximize"]');
          if (maxBtn) maxBtn.textContent = "□";
        }

        const parentRect = winEl.offsetParent
          ? winEl.offsetParent.getBoundingClientRect()
          : { left: 0, top: 0 };
        const rect = winEl.getBoundingClientRect();

        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = rect.left - parentRect.left;
        const startTop = rect.top - parentRect.top;

        function onMouseMove(moveEvent) {
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;

          const maxLeft = Math.max(0, window.innerWidth - 100);
          const maxTop = Math.max(0, window.innerHeight - 130);

          const nextLeft = Math.max(0, Math.min(startLeft + dx, maxLeft));
          const nextTop = Math.max(0, Math.min(startTop + dy, maxTop));

          winEl.style.left = nextLeft + "px";
          winEl.style.top = nextTop + "px";
        }

        function onMouseUp() {
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);
        }

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      });
    }

    // 2. ИЗМЕНЕНИЕ РАЗМЕРА ОКНА (ЗА ПРАВУЮ ГРАНЬ, НИЖНЮЮ ГРАНЬ И УГОЛОК)
    resizers.forEach(function (handle) {
      handle.addEventListener("mousedown", function (e) {
        if (e.button !== 0) return;
        if (window.innerWidth < 768) return;
        if (winEl.classList.contains("is-maximized")) return;

        e.preventDefault();
        e.stopPropagation();

        const rect = winEl.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;
        const startW = rect.width;
        const startH = rect.height;

        const isRight = handle.classList.contains("win95-resizer--r") || handle.classList.contains("win95-resizer--br");
        const isBottom = handle.classList.contains("win95-resizer--b") || handle.classList.contains("win95-resizer--br");

        function onResizeMove(moveEvent) {
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;

          if (isRight) {
            const newW = Math.max(300, Math.min(startW + dx, window.innerWidth - 16));
            winEl.style.width = newW + "px";
          }
          if (isBottom) {
            const newH = Math.max(220, Math.min(startH + dy, window.innerHeight - 110));
            winEl.style.height = newH + "px";
          }
        }

        function onResizeUp() {
          window.removeEventListener("mousemove", onResizeMove);
          window.removeEventListener("mouseup", onResizeUp);
        }

        window.addEventListener("mousemove", onResizeMove);
        window.addEventListener("mouseup", onResizeUp);
      });
    });
  });
};

// 3. ПЕРЕТАСКИВАНИЕ И ОТКРЫТИЕ ЯРЛЫКОВ НА РАБОЧЕМ СТОЛЕ
window.DashaOS.bindIconsInteraction = function (container, onOpenProject) {
  const projects = window.DashaOS.projectsData || [];
  const icons = container.querySelectorAll(".desktop-icon");

  icons.forEach(function (iconEl) {
    let wasDragged = false;

    iconEl.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      icons.forEach(function (i) { i.classList.remove("is-selected"); });
      iconEl.classList.add("is-selected");

      if (window.innerWidth < 768) return;

      wasDragged = false;
      const parentRect = container.getBoundingClientRect();
      const rect = iconEl.getBoundingClientRect();

      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = rect.left - parentRect.left;
      const startTop = rect.top - parentRect.top;

      function onIconMove(moveEvent) {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
          wasDragged = true;
          iconEl.style.left = (startLeft + dx) + "px";
          iconEl.style.top = (startTop + dy) + "px";
        }
      }

      function onIconUp() {
        window.removeEventListener("mousemove", onIconMove);
        window.removeEventListener("mouseup", onIconUp);
      }

      window.addEventListener("mousemove", onIconMove);
      window.addEventListener("mouseup", onIconUp);
    });

    iconEl.addEventListener("click", function (e) {
      e.stopPropagation();
      if (wasDragged) {
        wasDragged = false;
        return;
      }
      const proj = projects.find(function (p) { return p.id === iconEl.dataset.projectId; });
      if (proj && onOpenProject) {
        onOpenProject(proj);
      }
    });
  });
};