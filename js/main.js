async function loadQuestions() {
  try {
    const response = await fetch("questions.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    AppState.quizData = await response.json();

    const urlLang = new URLSearchParams(window.location.search).get("lang");
    const supported = ["zh-HK", "zh-CN", "en"];
    if (supported.includes(urlLang)) {
      AppState.currentLang = urlLang;
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
  AppState.currentLang = this.value;
  updateLanguageInUrl(AppState.currentLang);

  if (AppState.showingFinal) {
    applyLanguageUI();
    showFinalResult();
  } else {
    renderQuestion();
  }
});

document.getElementById("checkBtn").addEventListener("click", submitMultipleAnswer);
document.getElementById("nextBtn").addEventListener("click", nextQuestion);

loadQuestions();