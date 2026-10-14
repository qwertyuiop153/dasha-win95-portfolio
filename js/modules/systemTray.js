window.DashaOS = window.DashaOS || {};

window.DashaOS.initSystemTray = function (onResetFilter, windowApi) {
  const clockEl = document.getElementById("tray-clock");
  function updateClock() {
    if (!clockEl) return;
    clockEl.textContent = new Date().toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  updateClock();
  setInterval(updateClock, 10000);

  // Кнопка Вкл/Выкл звука в трее
  const soundBtn = document.getElementById("btn-toggle-sound");
  if (soundBtn && window.DashaOS.sound) {
    soundBtn.addEventListener("click", function () {
      const muted = window.DashaOS.sound.toggleMute();
      soundBtn.textContent = muted ? "🔇" : "🔊";
      soundBtn.title = muted ? "Звук выключен" : "Звук включен";
    });
  }

  // Меню «Пуск»
  const startBtn = document.getElementById("start-btn");
  const startMenu = document.getElementById("start-menu");

  if (startBtn && startMenu) {
    startBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (window.DashaOS.sound) window.DashaOS.sound.playOpenFile();
      const willOpen = startMenu.hidden;
      startMenu.hidden = !willOpen;
      startBtn.classList.toggle("active", willOpen);
    });

    document.addEventListener("click", function (e) {
      if (!startMenu.hidden && !e.target.closest("#start-menu")) {
        startMenu.hidden = true;
        startBtn.classList.remove("active");
      }
    });
  }

  // Переключатель 3 классических обоев Windows 95
  const themes = [
    { cls: "theme-teal", label: "🎨 Обои: Win95 Teal" },
    { cls: "theme-pattern", label: "🎨 Обои: Win95 Узор" },
    { cls: "theme-clouds", label: "🎨 Обои: Retro'98 Облака" }
  ];
  let themeIdx = 0;
  const bgBtn = document.getElementById("btn-toggle-bg");

  if (bgBtn) {
    bgBtn.addEventListener("click", function () {
      if (window.DashaOS.sound) window.DashaOS.sound.playOpenFile();
      document.body.classList.remove(themes[themeIdx].cls);
      themeIdx = (themeIdx + 1) % themes.length;
      document.body.classList.add(themes[themeIdx].cls);
      bgBtn.textContent = themes[themeIdx].label;
    });
  }

  const resetIconsBtn = document.getElementById("btn-reset-icons");
  if (resetIconsBtn && onResetFilter) {
    resetIconsBtn.addEventListener("click", function () {
      if (window.DashaOS.sound) window.DashaOS.sound.playOpenFile();
      onResetFilter();
    });
  }

  const showAllBtn = document.getElementById("start-open-all-projects");
  if (showAllBtn && onResetFilter) {
    showAllBtn.addEventListener("click", function () {
      onResetFilter();
      if (startMenu) startMenu.hidden = true;
    });
  }

  const cascadeBtn = document.getElementById("start-cascade-windows");
  if (cascadeBtn && windowApi) {
    cascadeBtn.addEventListener("click", function () {
      const ids = ["win-resume", "win-project-viewer", "win-contacts", "win-ai-report"];
      ids.forEach(function (id, index) {
        const win = document.getElementById(id);
        if (win) {
          win.classList.remove("is-maximized");
          win.style.left = (30 + index * 36) + "px";
          win.style.top = (30 + index * 32) + "px";
          windowApi.openWindow(id, true);
        }
      });
      if (window.DashaOS.sound) window.DashaOS.sound.playOpenFile();
      if (startMenu) startMenu.hidden = true;
    });
  }

  const form = document.getElementById("contact-form");
  const feedback = document.getElementById("form-feedback");
  if (form && feedback) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (window.DashaOS.sound) window.DashaOS.sound.playOpenFile();
      feedback.textContent = "✅ Письмо записано в очередь отправки!";
      form.reset();
    });
  }
};