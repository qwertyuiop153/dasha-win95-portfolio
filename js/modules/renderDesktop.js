window.DashaOS = window.DashaOS || {};

// Умный обработчик ошибок картинок: если .jpg не найден, пробует .png и .jpeg, а затем ставит ретро-заглушку
window.DashaOS.handleImgFallback = function (imgEl, fallbackDataUri) {
  const currentSrc = imgEl.getAttribute("src") || "";
  if (!imgEl.dataset.triedPng && currentSrc.match(/\.jpg$/i)) {
    imgEl.dataset.triedPng = "1";
    imgEl.src = currentSrc.replace(/\.jpg$/i, ".png");
    return;
  }
  if (!imgEl.dataset.triedJpeg && currentSrc.match(/\.png$/i)) {
    imgEl.dataset.triedJpeg = "1";
    imgEl.src = currentSrc.replace(/\.png$/i, ".jpeg");
    return;
  }
  imgEl.onerror = null;
  if (fallbackDataUri) {
    imgEl.src = fallbackDataUri;
  }
};

window.DashaOS.renderResumeWindow = function () {
  const container = document.getElementById("resume-window-body");
  const data = window.DashaOS.resumeData;
  if (!container || !data) return;

  container.innerHTML = `
    <div class="resume-section">
      <h2>👋 Обо мне</h2>
      <p>${data.about}</p>
    </div>

    <div class="resume-section">
      <h3>💼 Опыт работы</h3>
      ${data.experience
        .map(
          (exp) => `
        <div style="margin-bottom: 10px;">
          <strong>${exp.position} — ${exp.company}</strong> <span style="color:#555;">(${exp.period})</span>
          <p style="font-size: 0.88rem; margin-top: 3px;">${exp.details}</p>
        </div>
      `
        )
        .join("")}
    </div>

    <div class="resume-section">
      <h3>🛠 Хардскилы и Графический стек</h3>
      <div class="skill-pills">
        ${data.hardSkills.map((s) => `<span class="skill-pill">${s}</span>`).join("")}
      </div>
      <div class="skill-pills" style="margin-top: 8px;">
        ${data.software.map((sw) => `<span class="skill-pill"><strong>${sw}</strong></span>`).join("")}
      </div>
    </div>

    <div class="resume-section">
      <h3>🤝 Софтскилы</h3>
      <div class="skill-pills">
        ${data.softSkills.map((s) => `<span class="skill-pill">${s}</span>`).join("")}
      </div>
    </div>

    <div class="resume-section">
      <h3>🎓 Образование</h3>
      <ul class="deliverables-list">
        ${data.education.map((ed) => `<li>${ed}</li>`).join("")}
      </ul>
    </div>
  `;
};

window.DashaOS.renderDesktopIcons = function (filterMode, onOpenProject) {
  const container = document.getElementById("desktop-icons-container");
  const projects = window.DashaOS.projectsData || [];
  if (!container) return;

  let filtered = projects;
  if (filterMode && filterMode !== "all") {
    if (filterMode.startsWith("tool:")) {
      const toolName = filterMode.replace("tool:", "").toLowerCase();
      filtered = projects.filter((p) => p.tools.toLowerCase().includes(toolName));
    } else {
      filtered = projects.filter((p) => p.category === filterMode);
    }
  }

  container.innerHTML = filtered
    .map(
      (project) => `
      <div 
        class="desktop-icon" 
        tabindex="0"
        role="button"
        data-project-id="${project.id}"
        style="--pos-x: ${project.posX}; --pos-y:${project.posY};"
        aria-label="Открыть кейс ${project.title}"
      >
        <div class="desktop-icon__thumb-wrap">
          <img 
            src="${project.thumb}" 
            alt="${project.title}" 
            class="desktop-icon__thumb"
            data-fallback="${project.fallbackThumb || ""}"
            onerror="window.DashaOS.handleImgFallback(this, this.dataset.fallback)"
          >
          <span class="desktop-icon__tag">${project.tools.split(",")[0]}</span>
        </div>
        <span class="desktop-icon__label">${project.title}.lnk</span>
      </div>
    `
    )
    .join("");

  if (window.DashaOS.bindIconsInteraction) {
    window.DashaOS.bindIconsInteraction(container, onOpenProject);
  }
};