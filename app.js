
let quizData = null;
let currentLang = "zh-HK";
let current = 0;
let answersState = {};
let showingFinal = false;

const badgeImageMap = {
  perfect: "img/badge-perfect.png",
  pass70: "img/badge-pass70.png",
  below70: "img/badge-below70.png"
};

function getUIText(key) {
  return quizData.ui[currentLang][key];
}

function updateLanguageInUrl(lang) {
  const url = new URL(window.location);
  url.searchParams.set("lang", lang);
  window.history.replaceState({}, "", url);
}

function getQuestionState(questionId) {
  if (!answersState[questionId]) {
    answersState[questionId] = {
      selected: [],
      submitted: false
    };
  }
  return answersState[questionId];
}

function getCorrectIndexes(question) {
  const indexes = [];
  question.options.forEach((opt, i) => {
    if (opt.correct) indexes.push(i);
  });
  return indexes;
}

function isAnswerCorrect(question, selectedIndexes) {
  const correctIndexes = getCorrectIndexes(question);
  if (selectedIndexes.length !== correctIndexes.length) return false;

  const sortedSelected = [...selectedIndexes]
    .map(num => Number(num))
    .sort((x, y) => x - y);

  const sortedCorrect = [...correctIndexes]
    .map(num => Number(num))
    .sort((x, y) => x - y);

  return sortedSelected.every((value, index) => value === sortedCorrect[index]);
}

function getScore() {
  if (!quizData) return 0;
  let score = 0;
  quizData.questions.forEach(q => {
    const state = answersState[q.id];
    if (state && state.submitted && isAnswerCorrect(q, state.selected)) {
      score++;
    }
  });
  return score;
}

function getAnsweredCount() {
  return Object.values(answersState).filter(s => s && s.submitted).length;
}

function allAnswered() {
  return quizData && getAnsweredCount() === quizData.questions.length;
}

function getLevelKey() {
  const total = quizData.questions.length;
  const score = getScore();
  const ratio = score / total;
  if (score === total) return "perfect";
  if (ratio >= 0.7) return "pass70";
  return "below70";
}

function getEncouragementMessage() {
  return quizData.messages[getLevelKey()][currentLang];
}

function getBadgeImagePath(levelKey) {
  return badgeImageMap[levelKey] || badgeImageMap.pass70;
}

function getShareUrl() {
  return `${window.location.origin}${window.location.pathname}?lang=${currentLang}`;
}

function getShareTitle() {
  return getUIText("siteTitle");
}

function getLevelText(levelKey) {
  return getUIText("levels")[levelKey] || "";
}

function cleanLevelText(levelText) {
  return levelText.replace(/^\p{Emoji_Presentation}|^\p{Extended_Pictographic}/u, "").trim();
}

function applyLanguageUI() {
  const ui = quizData.ui[currentLang];
  document.title = ui.siteTitle;
  document.documentElement.lang = currentLang;

  document.getElementById("badge").innerText = ui.badge;
  document.getElementById("siteTitle").innerText = ui.siteTitle;
  document.getElementById("heroSubtitle").innerText = ui.heroSubtitle;
  document.getElementById("intro").innerText = ui.intro;
  document.getElementById("nextBtn").innerText = ui.next;
  document.getElementById("footer").innerText = ui.footer;
  document.getElementById("langSelect").value = currentLang;
  document.getElementById("langLabel").innerText = ui.langLabel || "Language / 語言 / 语言";
  document.getElementById("checkBtn").innerText = ui.checkAnswer;
}

function updateSummary() {
  const score = getScore();
  document.getElementById("summary").innerHTML = `${getUIText("scoreLabel")}：${score} / ${quizData.questions.length}`;
}

function hideResult() {
  const box = document.getElementById("result");
  box.className = "result";
  box.innerHTML = "";
  box.style.display = "none";
}

function triggerAnimation(el, className) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

function showResult(question, selectedIndexes) {
  const resultBox = document.getElementById("result");
  const correct = isAnswerCorrect(question, selectedIndexes);

  resultBox.classList.remove("result-pop", "result-shake");

  const contentHtml = `
    ${correct ? getUIText("correctLabel") : getUIText("wrongLabel")}<br>
    ${question.explanation[currentLang]}
    <div class="reminder">${getUIText("reminderLabel")}：${question.reminder[currentLang]}</div>
  `;

  if (correct) {
    resultBox.className = "result correct";
    resultBox.innerHTML = contentHtml;
    resultBox.style.display = "block";
    triggerAnimation(resultBox, "result-pop");
  } else {
    resultBox.className = "result wrong";
    resultBox.innerHTML = contentHtml;
    resultBox.style.display = "block";
    triggerAnimation(resultBox, "result-shake");
  }
}

function buildLevelBadge(levelKey) {
  const levelText = cleanLevelText(getLevelText(levelKey));
  const badgePath = getBadgeImagePath(levelKey);
  return `
    <div class="level-badge">
      <img class="level-badge-icon" src="${badgePath}" alt="${levelText}">
      <span class="level-text">${getUIText("levelLabel")}：${levelText}</span>
    </div>
  `;
}

function getResultScoreLine() {
  const score = getScore();
  const total = quizData.questions.length;
  const percent = Math.round((score / total) * 100);
  return `${getUIText("scoreLabel")}：${score} / ${total} (${percent}%)`;
}

function buildShareCardHTML(levelKey) {
  const badgePath = getBadgeImagePath(levelKey);
  const levelText = cleanLevelText(getLevelText(levelKey));
  const score = getScore();
  const total = quizData.questions.length;

  return `
    <div class="share-card-inner" id="shareCardInner">
      <div class="share-card-headline">${getUIText("badge")}</div>
      <div class="share-card-title">${getUIText("siteTitle")}</div>

      <div class="share-card-grid">
        <div class="share-card-badge-wrap">
          <img class="share-card-badge" src="${badgePath}" alt="${levelText}">
        </div>

        <div>
          <div class="share-card-score">${getUIText("scoreLabel")}：<strong>${score}</strong> / ${total}</div>
          <div class="share-card-level">
            <img src="${badgePath}" alt="${levelText}">
            <span>${levelText}</span>
          </div>
          <div class="share-card-message">${getEncouragementMessage()}</div>
        </div>
      </div>

      <div class="share-card-footer">
        <div class="share-card-chip">${getUIText("footer")}</div>
        <div class="share-card-chip">${getShareUrl()}</div>
      </div>
    </div>
  `;
}

function renderShareSection(levelKey) {
  return `
    <div class="share-box">
      <div class="share-title">${getUIText("shareTitle")}</div>
      <div class="share-text">${getUIText("shareText")}</div>

      <div class="share-card-preview">
        ${buildShareCardHTML(levelKey)}
      </div>

      <div class="share-actions">
        <button class="share-btn download" onclick="downloadShareCard()">🖼️ 下載成就卡</button>
        <button class="share-btn secondary" onclick="systemShareCard()">📤 系統分享圖片</button>
        <button class="share-btn whatsapp" onclick="shareWhatsApp()">🟢 WhatsApp</button>
        <button class="share-btn facebook" onclick="shareFacebook()">🔵 Facebook</button>
        <button class="share-btn instagram" onclick="shareInstagram()">🟣 Instagram</button>
        <button class="share-btn secondary" onclick="copyQuizLink()">${getUIText("copyLink")}</button>
      </div>

      <div class="share-note">
        提示：你而家可以先下載或系統分享「成就卡圖片」。WhatsApp / Facebook / Instagram 按鈕目前仍以分享連結為主；如要做到各平台從網頁直接貼圖分享，仍受平台和瀏覽器限制。
      </div>

      <div class="copy-msg" id="copyMsg">${getUIText("copied")}</div>
      <div class="ig-hint" id="igHint" style="display:none;">📸 已複製小測驗連結！你可以去 Instagram 貼上分享，或先下載成就卡再發佈。</div>
    </div>
  `;
}

function hideFinalResult() {
  const box = document.getElementById("finalResult");
  if (!box) return;
  box.className = "result";
  box.innerHTML = "";
  box.style.display = "none";
  showingFinal = false;
}

function copyQuizLink() {
  const url = getShareUrl();
  navigator.clipboard.writeText(url).then(() => {
    const msg = document.getElementById("copyMsg");
    if (msg) {
      msg.classList.remove("show");
      void msg.offsetWidth;
      msg.classList.add("show");
      setTimeout(() => msg.classList.remove("show"), 2500);
    }
  }).catch(() => {
    alert(url);
  });
}

function shareWhatsApp() {
  const url = getShareUrl();
  const text = `${getShareTitle()}\n${url}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(waUrl, "_blank", "noopener,noreferrer");
}

function shareFacebook() {
  const url = getShareUrl();
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.open(fbUrl, "_blank", "noopener,noreferrer");
}

function shareInstagram() {
  const url = getShareUrl();
  navigator.clipboard.writeText(url).then(() => {
    const msg = document.getElementById("copyMsg");
    const igHint = document.getElementById("igHint");

    if (msg) {
      msg.classList.remove("show");
      void msg.offsetWidth;
      msg.classList.add("show");
    }

    if (igHint) {
      igHint.style.display = "block";
      setTimeout(() => {
        igHint.style.display = "none";
      }, 4000);
    }
  }).catch(() => {
    alert(url);
  });
}

function waitImageLoaded(img) {
  return new Promise((resolve, reject) => {
    if (img.complete && img.naturalWidth > 0) {
      resolve(img);
      return;
    }
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 6) {
  const words = String(text).split(/\s+/);
  let line = "";
  let lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line ? `${line} ${words[n]}` : words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      lines.push(line);
      line = words[n];
      if (lines.length >= maxLines - 1) break;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);

  lines = lines.slice(0, maxLines);
  lines.forEach((ln, idx) => ctx.fillText(ln, x, y + (idx * lineHeight)));
}

function wrapTextByChars(ctx, text, x, y, maxWidth, lineHeight, maxLines = 6) {
  const chars = Array.from(String(text));
  let line = "";
  let lines = [];

  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      lines.push(line);
      line = chars[i];
      if (lines.length >= maxLines - 1) break;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);

  lines = lines.slice(0, maxLines);
  lines.forEach((ln, idx) => ctx.fillText(ln, x, y + (idx * lineHeight)));
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function generateShareCardBlob() {
  const levelKey = getLevelKey();
  const badgePath = getBadgeImagePath(levelKey);
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#fff8ec");
  grad.addColorStop(1, "#ffeed0");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // comic dots
  ctx.fillStyle = "rgba(255,213,79,0.22)";
  for (let y = 30; y < canvas.height; y += 32) {
    for (let x = 30; x < canvas.width; x += 32) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // outer panel
  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, 54, 54, 972, 1242, 34);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();

  // sticker
  ctx.fillStyle = "#ffd54f";
  drawRoundedRect(ctx, 120, 104, 250, 72, 36);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();
  ctx.fillStyle = "#1f1f1f";
  ctx.font = "bold 30px Arial";
  ctx.fillText(getUIText("badge"), 150, 150);

  // title
  ctx.fillStyle = "#1f1f1f";
  ctx.font = "bold 66px Arial";
  if (currentLang === "en") {
    wrapText(ctx, getUIText("siteTitle"), 120, 250, 840, 78, 3);
  } else {
    wrapTextByChars(ctx, getUIText("siteTitle"), 120, 250, 840, 78, 3);
  }

  // badge image
  const badgeImg = new Image();
  badgeImg.src = badgePath;
  await waitImageLoaded(badgeImg);
  ctx.fillStyle = "#fffef8";
  drawRoundedRect(ctx, 110, 390, 290, 320, 28);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();
  ctx.drawImage(badgeImg, 150, 430, 210, 210);

  // score box
  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, 430, 390, 520, 320, 28);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();

  ctx.fillStyle = "#1f1f1f";
  ctx.font = "bold 38px Arial";
  ctx.fillText(getUIText("scoreLabel"), 470, 455);

  const score = getScore();
  const total = quizData.questions.length;
  ctx.fillStyle = "#ff6b6b";
  ctx.font = "bold 86px Arial";
  ctx.fillText(String(score), 470, 560);
  ctx.fillStyle = "#1f1f1f";
  ctx.font = "bold 44px Arial";
  ctx.fillText(`/ ${total}`, 590, 558);

  const levelText = cleanLevelText(getLevelText(levelKey));
  ctx.fillStyle = "#fff7d0";
  drawRoundedRect(ctx, 468, 590, 430, 80, 40);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();
  ctx.font = "bold 34px Arial";
  ctx.fillStyle = "#1f1f1f";
  ctx.fillText(levelText, 505, 643);

  // message panel
  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, 110, 760, 840, 340, 24);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();

  ctx.fillStyle = "#1f1f1f";
  ctx.font = "bold 34px Arial";
  ctx.fillText(getUIText("resultTitle"), 150, 825);
  ctx.font = "30px Arial";

  if (currentLang === "en") {
    wrapText(ctx, getEncouragementMessage(), 150, 890, 760, 46, 5);
  } else {
    wrapTextByChars(ctx, getEncouragementMessage(), 150, 890, 760, 46, 5);
  }

  // footer chips
  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, 120, 1140, 280, 56, 28);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();
  ctx.fillStyle = "#1f1f1f";
  ctx.font = "bold 24px Arial";
  ctx.fillText(getUIText("footer"), 150, 1176);

  drawRoundedRect(ctx, 430, 1140, 520, 56, 28);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();
  ctx.fillStyle = "#1f1f1f";
  ctx.font = "20px Arial";
  wrapText(ctx, getShareUrl(), 455, 1176, 470, 24, 2);

  return await new Promise(resolve => canvas.toBlob(resolve, "image/png", 1.0));
}

async function downloadShareCard() {
  try {
    const blob = await generateShareCardBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz-share-card-${getLevelKey()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error(error);
    alert("未能生成成就卡圖片，請稍後再試。");
  }
}

async function systemShareCard() {
  try {
    const blob = await generateShareCardBlob();
    const file = new File([blob], `quiz-share-card-${getLevelKey()}.png`, { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
      await navigator.share({
        files: [file],
        title: getShareTitle(),
        text: getUIText("shareText")
      });
    } else {
      await downloadShareCard();
    }
  } catch (error) {
    console.error(error);
    await downloadShareCard();
  }
}

function showFinalResult() {
  showingFinal = true;
  const card = document.getElementById("quizCard");
  card.classList.add("final-mode");

  const finalBox = document.getElementById("finalResult");
  const score = getScore();
  const total = quizData.questions.length;
  const levelKey = getLevelKey();
  const badgePath = getBadgeImagePath(levelKey);
  const cleanLevel = cleanLevelText(getLevelText(levelKey));

  finalBox.innerHTML = `
    <div class="final-enter">
      <h3 style="margin-top:0; font-size:24px;">🎉 ${getUIText("resultTitle")}</h3>

      <div class="result-hero">
        <div class="result-badge-panel">
          <img class="result-badge-img" src="${badgePath}" alt="${cleanLevel}">
        </div>
        <div class="result-details">
          <div class="result-score-line">${getUIText("scoreLabel")}：<span class="result-score-number">${score}</span> / ${total}</div>
          ${buildLevelBadge(levelKey)}
          <div class="encouragement-box">${getEncouragementMessage()}</div>
        </div>
      </div>

      ${renderShareSection(levelKey)}
    </div>
  `;

  finalBox.className = "result info";
  finalBox.style.display = "block";

  const nextBtn = document.getElementById("nextBtn");
  nextBtn.innerText = getUIText("restart");
  nextBtn.classList.remove("cta-glow");
}

function getOptionLetter(index) {
  const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  return alphabet[index] || `${index + 1}`;
}

function renderPresentation(question) {
  const storyCard = document.getElementById("storyCard");
  const questionBox = document.getElementById("question");

  if (question.presentation === "scenario" && question.story && question.story[currentLang]) {
    const story = question.story[currentLang];

    document.getElementById("storyLabel").innerText = story.label || getUIText("scenarioLabelDefault");
    document.getElementById("storyTitle").innerText = story.title || "";

    const storyContentBox = document.getElementById("storyContent");
    storyContentBox.innerHTML = "";

    if (Array.isArray(story.dialogues)) {
      story.dialogues.forEach((item, idx) => {
        const wrap = document.createElement("div");
        wrap.className = `dialogue-wrap ${item.side === "right" ? "right" : "left"}`;
        wrap.style.animationDelay = `${idx * 0.08}s`;

        const avatar = document.createElement("div");
        avatar.className = "avatar";
        avatar.textContent = item.avatar || "🙂";

        const bubble = document.createElement("div");
        bubble.className = "bubble";

        const speaker = document.createElement("div");
        speaker.className = "speaker";
        speaker.textContent = item.speaker || "";

        const text = document.createElement("div");
        text.className = "bubble-text";
        text.textContent = item.text || "";

        bubble.appendChild(speaker);
        bubble.appendChild(text);
        wrap.appendChild(avatar);
        wrap.appendChild(bubble);
        storyContentBox.appendChild(wrap);
      });
    } else if (Array.isArray(story.content)) {
      story.content.forEach(line => {
        const div = document.createElement("div");
        div.className = "bubble-text";
        div.textContent = line;
        storyContentBox.appendChild(div);
      });
    }

    storyCard.style.display = "block";
    questionBox.innerHTML = question.question[currentLang];
  } else {
    storyCard.style.display = "none";
    questionBox.innerHTML = question.scenario[currentLang];
  }
}

function animateQuestionArea() {
  const area = document.getElementById("questionArea");
  if (!area) return;
  area.classList.remove("content-anim");
  void area.offsetWidth;
  area.classList.add("content-anim");
}

function refreshOptionSelectionUI(question, state) {
  const buttons = document.querySelectorAll("#answers .option-btn");

  buttons.forEach((btn, i) => {
    btn.classList.remove("option-selected");
    if (state.selected.includes(i)) {
      btn.classList.add("option-selected");
    }
  });

  if (question.type === "multiple" && !state.submitted) {
    document.getElementById("answerAction").style.display = "block";
    document.getElementById("checkBtn").disabled = state.selected.length === 0;
  }
}

function renderQuestion() {
  const question = quizData.questions[current];
  if (!question) return;

  document.getElementById("quizCard").classList.remove("final-mode");
  hideFinalResult();
  applyLanguageUI();

  const state = getQuestionState(question.id);
  const alreadySubmitted = state.submitted;

  const questionLabel = getUIText("questionLabel")
    .replace("{current}", current + 1)
    .replace("{total}", quizData.questions.length);

  document.getElementById("meta").innerHTML = `${questionLabel} ・ ${question.category[currentLang]}`;
  document.getElementById("title").innerHTML = question.title[currentLang];

  renderPresentation(question);

  document.getElementById("questionType").innerHTML =
    question.type === "multiple" ? getUIText("multipleLabel") : getUIText("singleLabel");

  document.getElementById("questionHint").innerHTML =
    question.type === "multiple" ? getUIText("multipleHint") : getUIText("singleHint");

  const correctIndexes = getCorrectIndexes(question);
  let html = "";

  question.options.forEach((opt, i) => {
    const classes = ["option-btn"];

    if (state.selected.includes(i)) classes.push("option-selected");

    if (alreadySubmitted) {
      if (correctIndexes.includes(i)) {
        classes.push("option-correct");
      } else if (state.selected.includes(i) && !correctIndexes.includes(i)) {
        classes.push("option-wrong");
      }
    }

    html += `
      <button class="${classes.join(" ")}" onclick="selectOption(${i})" ${alreadySubmitted ? "disabled" : ""}>
        <span class="option-letter">${getOptionLetter(i)}.</span>
        <span>${opt.text[currentLang]}</span>
      </button>
    `;
  });

  document.getElementById("answers").innerHTML = html;

  if (question.type === "multiple" && !alreadySubmitted) {
    document.getElementById("answerAction").style.display = "block";
    document.getElementById("checkBtn").disabled = state.selected.length === 0;
  } else {
    document.getElementById("answerAction").style.display = "none";
  }

  if (alreadySubmitted) {
    showResult(question, state.selected);
  } else {
    hideResult();
  }

  updateSummary();

  const nextBtn = document.getElementById("nextBtn");
  nextBtn.classList.remove("cta-glow");

  if (allAnswered() && current === quizData.questions.length - 1 && alreadySubmitted) {
    nextBtn.innerText = getUIText("finish");
    nextBtn.classList.add("cta-glow");
  } else {
    nextBtn.innerText = getUIText("next");
  }

  animateQuestionArea();
}

function selectOption(index) {
  const question = quizData.questions[current];
  const state = getQuestionState(question.id);
  if (state.submitted) return;

  if (question.type === "single") {
    state.selected = [index];
    state.submitted = true;
    renderQuestion();
    return;
  }

  if (question.type === "multiple") {
    if (state.selected.includes(index)) {
      state.selected = state.selected.filter(i => i !== index);
    } else {
      state.selected.push(index);
    }
    refreshOptionSelectionUI(question, state);
  }
}

function submitMultipleAnswer() {
  const question = quizData.questions[current];
  const state = getQuestionState(question.id);
  if (question.type !== "multiple") return;

  if (state.selected.length === 0) {
    alert(getUIText("selectAtLeastOne"));
    return;
  }

  state.submitted = true;
  renderQuestion();
}

function restartQuiz() {
  answersState = {};
  current = 0;
  showingFinal = false;
  document.getElementById("quizCard").classList.remove("final-mode");
  document.getElementById("nextBtn").classList.remove("cta-glow");
  renderQuestion();
}

function nextQuestion() {
  if (!quizData) return;

  if (showingFinal) {
    restartQuiz();
    return;
  }

  const question = quizData.questions[current];
  const state = getQuestionState(question.id);

  if (!state.submitted) {
    alert(getUIText("answerBeforeNext"));
    return;
  }

  if (current === quizData.questions.length - 1) {
    showFinalResult();
    return;
  }

  current++;
  renderQuestion();
}

async function loadQuestions() {
  try {
    const response = await fetch("questions.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    quizData = await response.json();

    const urlLang = new URLSearchParams(window.location.search).get("lang");
    const supported = ["zh-HK", "zh-CN", "en"];
    if (supported.includes(urlLang)) {
      currentLang = urlLang;
    }

    renderQuestion();
  } catch (error) {
    document.body.innerHTML = `
      <div class="card">
        <div class="result wrong" style="display:block;">
          ❌ Failed to load quiz<br><br>
          <small>${error.message}</small>
        </div>
      </div>`;
    console.error(error);
  }
}

document.getElementById("langSelect").addEventListener("change", function () {
  currentLang = this.value;
  updateLanguageInUrl(currentLang);
  if (showingFinal) {
    applyLanguageUI();
    showFinalResult();
  } else {
    renderQuestion();
  }
});

document.getElementById("checkBtn").addEventListener("click", submitMultipleAnswer);
document.getElementById("nextBtn").addEventListener("click", nextQuestion);

loadQuestions();
