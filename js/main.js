window.DashaOS = window.DashaOS || {};

function bootDashaOS() {
  // 1. Инициализируем экран загрузки BIOS и звуковую систему
  if (window.DashaOS.initBootSequence) {
    window.DashaOS.initBootSequence();
  }

  // 2. Рендерим резюме Даши
  if (window.DashaOS.renderResumeWindow) {
    window.DashaOS.renderResumeWindow();
  }

  // 3. Запускаем менеджер окон
  const windowApi = window.DashaOS.initWindowManager();

  // 4. Открытие кейса при клике на ярлык
  const handleSelectProject = function (project) {
    window.DashaOS.openProjectModal(project, windowApi);
  };

  // 5. Рендерим все 12 ярлыков на рабочем столе
  window.DashaOS.renderDesktopIcons("all", handleSelectProject);

  // 6. Фильтрация по верхним кнопкам категорий
  const filterBtns = document.querySelectorAll("#category-filters .win95-btn");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (window.DashaOS.sound) window.DashaOS.sound.playOpenFile();
      filterBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      window.DashaOS.renderDesktopIcons(btn.dataset.filter, handleSelectProject);
    });
  });

  // 7. Фильтрация по клику на иконки софта в нижнем Доке
  document.querySelectorAll("[data-filter-tool]").forEach(function (dockBtn) {
    dockBtn.addEventListener("click", function () {
      if (window.DashaOS.sound) window.DashaOS.sound.playOpenFile();
      const tool = dockBtn.dataset.filterTool;
      filterBtns.forEach(function (b) { b.classList.remove("active"); });
      window.DashaOS.renderDesktopIcons("tool:" + tool, handleSelectProject);
    });
  });

  // 8. Перетаскивание и ресайз окон
  window.DashaOS.initDragAndDrop();

  // 9. Системный трей, обои и меню Пуск
  window.DashaOS.initSystemTray(function () {
    filterBtns.forEach(function (b) {
      b.classList.toggle("active", b.dataset.filter === "all");
    });
    window.DashaOS.renderDesktopIcons("all", handleSelectProject);
  }, windowApi);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootDashaOS);
} else {
  bootDashaOS();
}