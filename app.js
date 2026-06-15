let quizData = null;
let currentLang = "zh-HK";
let current = 0;
let answersState = {};
let showingFinal = false;

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

function shareWhatsApp() {
  const url = window.location.origin + window.location.pathname + "?lang=" + currentLang;
  const text = `${getUIText("siteTitle")} \n${url}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(waUrl, "_blank");
}

function shareFacebook() {
  const url = window.location.origin + window.location.pathname + "?lang=" + currentLang;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.open(fbUrl, "_blank");
}

function shareInstagram() {
  const url = window.location.origin + window.location.pathname + "?lang=" + currentLang;
  navigator.clipboard.writeText(url).then(() => {
    const msg = document.getElementById("copyMsg");
    if (msg) {
      msg.innerText = getUIText("copied");
      setTimeout(() => { msg.innerText = ""; }, 3000);
    } else {
      alert(getUIText("copied"));
    }
  });
}

function calculateScore() {
  let score = 0;
  quizData.questions.forEach(q => {
    const state = answersState[q.id];
    if (!state) return;
    
    if (q.type === "single") {
      const correctIdx = q.options.findIndex(o => o.correct);
      if (state.selected.length === 1 && state.selected[0] === correctIdx) {
        score += 10;
      }
    } else if (q.type === "multiple") {
      const correctIndices = q.options.map((o, idx) => o.correct ? idx : null).filter(v => v !== null);
      const userSel = [...state.selected].sort((x, y) => x - y);
      const corrSel = [...correctIndices].sort((x, y) => x - y);
      
      if (userSel.length === corrSel.length && userSel.every((v, i) => v === corrSel[i])) {
        score += 10;
      }
    }
  });
  return score;
}

function applyLanguageUI() {
  document.getElementById("badge").innerText = getUIText("badge");
  document.getElementById("langLabel").innerText = getUIText("langLabel");
  document.getElementById("siteTitle").innerText = getUIText("siteTitle");
  document.getElementById("heroSubtitle").innerText = getUIText("heroSubtitle");
  document.getElementById("intro").innerText = getUIText("intro");
}

function renderQuestion() {
  applyLanguageUI();
  showingFinal = false;

  const questionArea = document.getElementById("questionArea");
  questionArea.style.display = "block";

  const question = quizData.questions[current];
  const state = getQuestionState(question.id);

  document.getElementById("meta").innerText = getUIText("questionLabel")
    .replace("{current}", current + 1)
    .replace("{total}", quizData.questions.length);

  document.getElementById("title").innerText = question.title[currentLang];

  const storyCard = document.getElementById("storyCard");
  if (question.presentation === "scenario" && question.story) {
    storyCard.style.display = "block";
    const story = question.story[currentLang];
    document.getElementById("storyLabel").innerText = story.label;
    document.getElementById("storyTitle").innerText = story.title;
    
    const storyContent = document.getElementById("storyContent");
    storyContent.innerHTML = "";
    story.dialogues.forEach(d => {
      const row = document.createElement("div");
      row.className = `dialogue-item ${d.side === "right" ? "right" : ""}`;
      row.innerHTML = `
        <div class="dialogue-avatar">${d.avatar}</div>
        <div class="dialogue-bubble">
          <strong>${d.speaker}:</strong> ${d.text}
        </div>
      `;
      storyContent.appendChild(row);
    });
  } else {
    storyCard.style.display = "none";
  }

  document.getElementById("question").innerText = question.type === "single" 
    ? (question.question ? question.question[currentLang] : question.scenario[currentLang])
    : (question.scenario ? question.scenario[currentLang] : "");

  document.getElementById("questionType").innerText = question.type === "single" 
    ? getUIText("singleLabel") 
    : getUIText("multipleLabel");

  document.getElementById("questionHint").innerText = question.type === "single" 
    ? getUIText("singleHint") 
    : getUIText("multipleHint");

  const answersContainer = document.getElementById("answers");
  answersContainer.innerHTML = "";

  question.options.forEach((opt, idx) => {
    const div = document.createElement("div");
    div.className = `option ${state.selected.includes(idx) ? "selected" : ""}`;
    
    const iconClass = question.type === "single" ? "radio-box" : "checkbox-box";
    div.innerHTML = `
      <div class="${iconClass}"></div>
      <div class="option-text">${opt.text[currentLang]}</div>
    `;

    if (!state.submitted) {
      div.onclick = () => {
        if (question.type === "single") {
          state.selected = [idx];
        } else {
          if (state.selected.includes(idx)) {
            state.selected = state.selected.filter(i => i !== idx);
          } else {
            state.selected.push(idx);
          }
        }
        renderQuestion();
      };
    }
    answersContainer.appendChild(div);
  });

  const answerAction = document.getElementById("answerAction");
  const checkBtn = document.getElementById("checkBtn");
  const resultDiv = document.getElementById("result");

  if (!state.submitted) {
    answerAction.style.display = "block";
    checkBtn.innerText = getUIText("checkAnswer");
    resultDiv.style.display = "none";
  } else {
    answerAction.style.display = "none";
    resultDiv.style.display = "block";
    
    let isCorrect = false;
    if (question.type === "single") {
      isCorrect = question.options[state.selected[0]]?.correct === true;
    } else {
      const correctIndices = question.options.map((o, idx) => o.correct ? idx : null).filter(v => v !== null);
      const userSel = [...state.selected].sort((x, y) => x - y);
      const corrSel = [...correctIndices].sort((x, y) => x - y);
      isCorrect = userSel.length === corrSel.length && userSel.every((v, i) => v === corrSel[i]);
    }

    resultDiv.className = `result ${isCorrect ? "correct" : "wrong"}`;
    resultDiv.innerHTML = `
      <div class="result-status">${isCorrect ? getUIText("correctLabel") : getUIText("wrongLabel")}</div>
      <div>${question.explanation[currentLang]}</div>
      <div class="reminder-box">
        <strong>${getUIText("reminderLabel")}:</strong> ${question.reminder[currentLang]}
      </div>
    `;
  }

  const nextBtn = document.getElementById("nextBtn");
  if (current === quizData.questions.length - 1) {
    nextBtn.innerText = getUIText("finish");
  } else {
    nextBtn.innerText = getUIText("next");
  }
}

function checkCurrentAnswer() {
  const question = quizData.questions[current];
  const state = getQuestionState(question.id);

  if (state.selected.length === 0) {
    alert(getUIText("selectAtLeastOne"));
    return;
  }

  state.submitted = true;
  renderQuestion();
}

function showFinalResult() {
  showingFinal = true;
  applyLanguageUI();

  const total = quizData.questions.length * 10;
  const score = calculateScore();

  let levelKey = "below70";
  if (score === total) {
    levelKey = "perfect";
  } else if (score >= 70) {
    levelKey = "pass70";
  }

  const levelText = getUIText("levels")[levelKey];
  const msgText = quizData.messages[levelKey][currentLang];

  // ✨ 多語言完美同步修復：更新隱藏卡片模板（#hiddenCardCapture）內的所有英文/繁體硬編碼
  document.getElementById("certBadgeTop").innerText = getUIText("badge");
  document.getElementById("certSiteTitle").innerText = getUIText("siteTitle");
  document.getElementById("certScoreLabel").innerText = getUIText("scoreLabel") + ":";
  document.getElementById("certScoreVal").innerText = `${score} / ${total}`;
  document.getElementById("certLevelLabel").innerText = getUIText("levelLabel") + ":";
  
  // 提取乾淨的稱號文字（去除 Emoji 裝飾）
  const cleanLevelName = levelText.replace(/[\u2000-\u3300\ud83c\ud83d\ud83e]/g, '').trim();
  document.getElementById("certLevelName").innerText = cleanLevelName;
  
  document.getElementById("certMsgVal").innerText = msgText;
  document.getElementById("certQrTip").innerText = "Scan to play or verify results online.";
  document.getElementById("certQuizName").innerText = "Data Integrity Quiz Platform";
  document.getElementById("certMotto").innerText = getUIText("footer");

  // 🎯 核心聯動：根據等級，加載對應的 PNG 勳章檔案到隱藏卡片中
  const certBadgeImg = document.getElementById("certBadgeImg");
  certBadgeImg.src = `badge-${levelKey}.png`;

  // 渲染前端主畫面的結果頁
  const questionArea = document.getElementById("questionArea");
  questionArea.innerHTML = `
    <div class="final-score-title">${getUIText("resultTitle")}</div>
    <div class="final-rank">${levelText}</div>
    <div class="intro">${msgText}</div>
    
    <div class="controls" style="padding:0; margin-top:16px;">
      <div style="font-size:20px; font-weight:bold; margin-bottom:8px;">
        ${getUIText("scoreLabel")}: <span style="color:var(--red); font-size:26px;">${score}</span> / ${total}
      </div>
    </div>

    <div class="share-zone">
      <button class="share-btn" onclick="shareWhatsApp()">WhatsApp</button>
      <button class="share-btn" onclick="shareFacebook()">Facebook</button>
      <button class="share-btn" onclick="shareInstagram()">${getUIText("copyLink")}</button>
      <span id="copyMsg" style="margin-left:8px; font-weight:bold; color:var(--green); align-self:center;"></span>
    </div>

    <div class="screenshot-area">
      <p style="margin:0 0 10px 0; font-weight:bold; font-size:14px; color:#555;">
        🖼️ 正在即時繪製您的個人合規成就卡片...
      </p>
      <div id="screenshotSpinner" style="font-weight:bold; color:var(--purple);">Generating Image...</div>
      <div id="imageContainer"></div>
    </div>
  `;

  document.getElementById("nextBtn").innerText = getUIText("restartQuiz");

  // 確保圖片載入完成後再利用 html2canvas 實時擷取
  setTimeout(() => {
    const target = document.getElementById("hiddenCardCapture");
    html2canvas(target, {
      useCORS: true,
      scale: 2, // 提升至雙倍清晰度，防止字體模糊
      backgroundColor: null
    }).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const img = document.createElement("img");
      img.src = imgData;
      img.className = "screenshot-img";
      
      const container = document.getElementById("imageContainer");
      const spinner = document.getElementById("screenshotSpinner");
      if (container) container.appendChild(img);
      if (spinner) spinner.style.display = "none";
    }).catch(err => {
      console.error("Canvas drawing failed:", err);
      const spinner = document.getElementById("screenshotSpinner");
      if (spinner) spinner.innerText = "❌ 無法生成卡片圖片，請手動截圖。";
    });
  }, 600);
}

function restartQuiz() {
  current = 0;
  answersState = {};
  showingFinal = false;
  
  // 重新初始化整個網頁結構
  window.location.reload();
}

function handleNext() {
  if (showingFinal) {
    restartQuiz();
    return;
  }

  const question = quizData.questions[current];
  const state = getQuestionState(question.id);

  if (!state.submitted) {
    checkCurrentAnswer();
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

    document.getElementById("langSelect").value = currentLang;
    renderQuestion();
  } catch (error) {
    document.body.innerHTML = `
      <div class="card">
        <div class="result wrong" style="display:block;">
          ❌ Failed to load quiz questions.<br><br>
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
    showFinalResult();
  } else {
    renderQuestion();
  }
});

document.getElementById("nextBtn").addEventListener("click", handleNext);

// 初始化加載
window.onload = loadQuestions;
