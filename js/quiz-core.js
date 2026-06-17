window.AppState = {
  quizData: null,
  currentLang: "zh-HK",
  current: 0,
  answersState: {},
  showingFinal: false,
  badgeImageMap: {
    perfect: "img/badge-perfect.png",
    pass70: "img/badge-pass70.png",
    below70: "img/badge-below70.png"
  }
};

function getUIText(key) {
  return AppState.quizData.ui[AppState.currentLang][key];
}

function updateLanguageInUrl(lang) {
  const url = new URL(window.location);
  url.searchParams.set("lang", lang);
  window.history.replaceState({}, "", url);
}

function getQuestionState(questionId) {
  if (!AppState.answersState[questionId]) {
    AppState.answersState[questionId] = {
      selected: [],
      submitted: false
    };
  }
  return AppState.answersState[questionId];
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
  if (!AppState.quizData) return 0;

  let score = 0;
  AppState.quizData.questions.forEach(q => {
    const state = AppState.answersState[q.id];
    if (state && state.submitted && isAnswerCorrect(q, state.selected)) {
      score++;
    }
  });

  return score;
}

function getAnsweredCount() {
  return Object.values(AppState.answersState).filter(s => s && s.submitted).length;
}

function allAnswered() {
  return AppState.quizData && getAnsweredCount() === AppState.quizData.questions.length;
}

function getLevelKey() {
  const total = AppState.quizData.questions.length;
  const score = getScore();
  const ratio = score / total;

  if (score === total) return "perfect";
  if (ratio >= 0.7) return "pass70";
  return "below70";
}

function getEncouragementMessage() {
  return AppState.quizData.messages[getLevelKey()][AppState.currentLang];
}

function getShortResultSummary(levelKey) {
  const shortMap = {
    "zh-HK": {
      perfect: "你對資料安全界線有很清晰的掌握。",
      pass70: "你已掌握大部分重點，但仍有細節值得再留意。",
      below70: "你需要重新建立資料安全界線意識。"
    },
    "zh-CN": {
      perfect: "你对资料安全界线有很清晰的掌握。",
      pass70: "你已掌握大部分重点，但仍有细节值得再留意。",
      below70: "你需要重新建立资料安全界线意识。"
    },
    "en": {
      perfect: "You have a very clear grasp of data safety boundaries.",
      pass70: "You got most of the key ideas, but some details still need attention.",
      below70: "You need to rebuild your awareness of data safety boundaries."
    }
  };

  return shortMap[AppState.currentLang]?.[levelKey] || getEncouragementMessage();
}

function getBadgeImagePath(levelKey) {
  return AppState.badgeImageMap[levelKey] || AppState.badgeImageMap.pass70;
}

function getShareUrl() {
  return `${window.location.origin}${window.location.pathname}?lang=${AppState.currentLang}`;
}

function getShareTitle() {
  return getUIText("siteTitle");
}

function getLevelText(levelKey) {
  return getUIText("levels")[levelKey] || "";
}

function cleanLevelText(levelText) {
  return levelText.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "").trim();
}