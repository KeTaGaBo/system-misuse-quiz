function applyLanguageUI() {
  const ui = AppState.quizData.ui[AppState.currentLang];
  document.title = ui.siteTitle;
  document.documentElement.lang = AppState.currentLang;

  document.getElementById("badge").innerText = ui.badge;
  document.getElementById("siteTitle").innerText = ui.siteTitle;
  document.getElementById("heroSubtitle").innerText = ui.heroSubtitle;
  document.getElementById("intro").innerText = ui.intro;
  document.getElementById("nextBtn").innerText = ui.next;
  document.getElementById("footer").innerText = ui.footer;
  document.getElementById("langSelect").value = AppState.currentLang;
  document.getElementById("langLabel").innerText = ui.langLabel || "Language / 語言 / 语言";
  document.getElementById("checkBtn").innerText = ui.checkAnswer;

  // 三語聲明切換
  const disclaimerEls = document.querySelectorAll("#disclaimerNote .disclaimer-text");
  disclaimerEls.forEach(el => {
    if (el.dataset.lang === AppState.currentLang) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
  });
}

function updateSummary() {
  const score = getScore();
  document.getElementById("summary").innerHTML =
    `${getUIText("scoreLabel")}：${score} / ${AppState.quizData.questions.length}`;
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
    ${question.explanation[AppState.currentLang]}
    <div class="reminder">${getUIText("reminderLabel")}：${question.reminder[AppState.currentLang]}</div>
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

function getOptionLetter(index) {
  const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  return alphabet[index] || `${index + 1}`;
}

function renderPresentation(question) {
  const storyCard = document.getElementById("storyCard");
  const questionBox = document.getElementById("question");

  if (question.presentation === "scenario" && question.story && question.story[AppState.currentLang]) {
    const story = question.story[AppState.currentLang];

    document.getElementById("storyLabel").innerText =
      story.label || getUIText("scenarioLabelDefault");
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
    questionBox.innerHTML = question.question[AppState.currentLang];
  } else {
    storyCard.style.display = "none";
    questionBox.innerHTML = question.scenario[AppState.currentLang];
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
  const question = AppState.quizData.questions[AppState.current];
  if (!question) return;

  document.getElementById("quizCard").classList.remove("final-mode");
  hideFinalResult();
  applyLanguageUI();

  const state = getQuestionState(question.id);
  const alreadySubmitted = state.submitted;

  const questionLabel = getUIText("questionLabel")
    .replace("{current}", AppState.current + 1)
    .replace("{total}", AppState.quizData.questions.length);

  document.getElementById("meta").innerHTML =
    `${questionLabel} ・ ${question.category[AppState.currentLang]}`;
  document.getElementById("title").innerHTML = question.title[AppState.currentLang];

  renderPresentation(question);

  document.getElementById("questionType").innerHTML =
    question.type === "multiple"
      ? getUIText("multipleLabel")
      : getUIText("singleLabel");

  document.getElementById("questionHint").innerHTML =
    question.type === "multiple"
      ? getUIText("multipleHint")
      : getUIText("singleHint");

  let html = "";
  const correctIndexes = getCorrectIndexes(question);

  question.options.forEach((opt, i) => {
    let classes = ["option-btn"];

    if (state.selected.includes(i)) {
      classes.push("option-selected");
    }

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
        <span>${opt.text[AppState.currentLang]}</span>
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

  if (allAnswered() && AppState.current === AppState.quizData.questions.length - 1 && alreadySubmitted) {
    nextBtn.innerText = getUIText("finish");
    nextBtn.classList.add("cta-glow");
  } else {
    nextBtn.innerText = getUIText("next");
  }

  animateQuestionArea();
}

function selectOption(index) {
  const question = AppState.quizData.questions[AppState.current];
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
  const question = AppState.quizData.questions[AppState.current];
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
  AppState.answersState = {};
  AppState.current = 0;
  AppState.showingFinal = false;
  document.getElementById("quizCard").classList.remove("final-mode");
  renderQuestion();
}

function nextQuestion() {
  if (!AppState.quizData) return;

  if (AppState.showingFinal) {
    restartQuiz();
    return;
  }

  const question = AppState.quizData.questions[AppState.current];
  const state = getQuestionState(question.id);

  if (!state.submitted) {
    alert(getUIText("answerBeforeNext"));
    return;
  }

  if (AppState.current === AppState.quizData.questions.length - 1) {
    showFinalResult();
    return;
  }

  AppState.current++;
  renderQuestion();
}
