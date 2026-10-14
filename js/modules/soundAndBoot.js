window.DashaOS = window.DashaOS || {};

(function () {
  let isMuted = false;
  let audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Проигрывание локального аудиофайла с автоматическим фоллбэком на синтезатор Web Audio API
  function playAudioFileOrSynth(filePath, synthFallbackFn) {
    if (isMuted) return;
    const audio = new Audio(filePath);
    audio.volume = 0.75;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(function () {
        // Если файла нет в папке ./assets/audio/ — играем встроенный синтезированный звук Windows 95!
        if (synthFallbackFn) synthFallbackFn();
      });
    }
  }

  // 1. ЗВУК ЗАПУСКА WINDOWS 95 (Локальный ./assets/audio/startup.mp3 ИЛИ полифонический аккорд)
  function synthWin95Startup() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Теплый эмбиент-аккорд в стиле The Microsoft Sound (Brian Eno)
    const freqs = [311.13, 466.16, 622.25, 698.46, 932.33, 1244.5];
    freqs.forEach(function (f, idx) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(f, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.11, now + idx * 0.08 + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + 3.5);
    });
  }

  // 2. ЗВУК ОТКРЫТИЯ ФАЙЛА / ПАПКИ НА РАБОЧЕМ СТОЛЕ (./assets/audio/open.mp3 ИЛИ двойной щелчок Win95)
  function synthFileOpen() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [880, 1320].forEach(function (freq, i) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.045);

      gain.gain.setValueAtTime(0.09, now + i * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.055);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.06);
    });
  }

  // 3. КОРОТКИЙ ПИСК BIOS POST (1000Hz)
  function synthBiosBeep() {
    if (isMuted) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(1000, now);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  window.DashaOS.sound = {
    playStartup: function () {
      playAudioFileOrSynth("./assets/audio/startup.mp3", synthWin95Startup);
    },
    playOpenFile: function () {
      playAudioFileOrSynth("./assets/audio/open.mp3", synthFileOpen);
    },
    playBiosBeep: synthBiosBeep,
    toggleMute: function () {
      isMuted = !isMuted;
      return isMuted;
    }
  };

  // ИНИЦИАЛИЗАЦИЯ ЭКРАНА ЗАГРУЗКИ BIOS (Видео ./assets/video/boot.mp4 + фоллбэк)
  window.DashaOS.initBootSequence = function () {
    const bootScreen = document.getElementById("boot-screen");
    const powerOverlay = document.getElementById("boot-power-overlay");
    const btnPowerOn = document.getElementById("btn-power-on");
    const btnSkipImm = document.getElementById("btn-skip-immediately");
    const btnSkipBoot = document.getElementById("btn-skip-boot");
    const bootVideo = document.getElementById("boot-video");
    const biosFallback = document.getElementById("bios-fallback");
    const memCounter = document.getElementById("bios-mem-counter");
    const biosLog = document.getElementById("bios-log");

    if (!bootScreen) return;

    let bootTimers = [];
    function clearBootTimers() {
      bootTimers.forEach(clearTimeout);
      bootTimers = [];
    }

    function finishBoot(playWinSound) {
      clearBootTimers();
      if (bootVideo) {
        bootVideo.pause();
        bootVideo.currentTime = 0;
      }
      bootScreen.classList.add("is-hidden");
      setTimeout(function () {
        bootScreen.hidden = true;
      }, 350);
      if (playWinSound) {
        window.DashaOS.sound.playStartup();
      }
    }

    // Резервная анимация по кадрам из видео Award BIOS (если файл boot.mp4 еще не скачан)
    function runFallbackBiosAnimation() {
      if (bootVideo) bootVideo.style.display = "none";
      if (biosFallback) biosFallback.hidden = false;
      if (biosLog) biosLog.innerHTML = "";
      window.DashaOS.sound.playBiosBeep();

      let mem = 0;
      const memInterval = setInterval(function () {
        mem += 4096;
        if (mem >= 32768) {
          mem = 32768;
          clearInterval(memInterval);
        }
        if (memCounter) memCounter.textContent = String(mem);
      }, 90);
      bootTimers.push(memInterval);

      const steps = [
        { delay: 900, text: "Award Plug and Play BIOS Extension v1.0A\nCopyright (C) 1997, Award Software, Inc." },
        { delay: 1600, text: "Detecting IDE Primary Master   ... PCemHD" },
        { delay: 2100, text: "Detecting IDE Primary Slave    ... PCemCD" },
        { delay: 2600, text: "Detecting IDE Secondary Master ... None\nDetecting IDE Secondary Slave  ... None" },
        { delay: 3300, text: "\nVerifying DMI Pool Data ........" },
        { delay: 4100, text: "Starting Windows 95..." }
      ];

      steps.forEach(function (step) {
        const t = setTimeout(function () {
          if (biosLog) {
            const p = document.createElement("pre");
            p.textContent = step.text;
            biosLog.appendChild(p);
          }
        }, step.delay);
        bootTimers.push(t);
      });

      const endTimer = setTimeout(function () {
        finishBoot(true);
      }, 5000);
      bootTimers.push(endTimer);
    }

    function startBootProcess() {
      if (powerOverlay) powerOverlay.hidden = true;
      bootScreen.hidden = false;
      bootScreen.classList.remove("is-hidden");

      if (!bootVideo) {
        runFallbackBiosAnimation();
        return;
      }

      bootVideo.style.display = "block";
      if (biosFallback) biosFallback.hidden = true;
      bootVideo.currentTime = 0;
      bootVideo.muted = isMuted;

      const playPromise = bootVideo.play();
      if (playPromise !== undefined) {
        playPromise
          .then(function () {
            // Видео ./assets/video/boot.mp4 успешно играет! Ждем его окончания:
            bootVideo.onended = function () {
              finishBoot(true);
            };
          })
          .catch(function () {
            // Если видеофайл ./assets/video/boot.mp4 еще не добавлен в папку — запускаем встроенный Award BIOS!
            runFallbackBiosAnimation();
          });
      } else {
        runFallbackBiosAnimation();
      }
    }

    if (btnPowerOn) {
      btnPowerOn.addEventListener("click", function () {
        startBootProcess();
      });
    }

    if (btnSkipImm) {
      btnSkipImm.addEventListener("click", function () {
        finishBoot(true);
      });
    }

    if (btnSkipBoot) {
      btnSkipBoot.addEventListener("click", function () {
        finishBoot(true);
      });
    }

    // Пропуск по клавише Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !bootScreen.hidden) {
        finishBoot(true);
      }
    });

    // Кнопка в меню «Пуск» для повторного показа загрузки
    const replayBtn = document.getElementById("start-replay-boot");
    if (replayBtn) {
      replayBtn.addEventListener("click", function () {
        const sm = document.getElementById("start-menu");
        if (sm) sm.hidden = true;
        startBootProcess();
      });
    }
  };
})();