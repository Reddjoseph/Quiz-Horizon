// =====================
// script.js (smart parser)
// =====================

const txtFile = document.getElementById("txtFile");
const manualInput = document.getElementById("manualInput");
const startManualBtn = document.getElementById("startManualBtn");

const uploadBtn = document.getElementById("uploadBtn");
const manualBtn = document.getElementById("manualBtn");
const uploadContainer = document.getElementById("uploadContainer");
const manualContainer = document.getElementById("manualContainer");

const quizContainer = document.getElementById("quizContainer");
const fileContainer = document.getElementById("fileContainer");
const questionContainer = document.getElementById("questionContainer");
const feedbackDiv = document.getElementById("feedback");
const nextBtn = document.getElementById("nextBtn");
const cancelBtn = document.getElementById("cancelBtn");
const scoreDiv = document.getElementById("score");
const restartMenu = document.getElementById("restartMenu");

const themeToggle = document.getElementById("themeToggle");
const progressBar = document.getElementById("progressBar");
const questionCounter = document.getElementById("questionCounter");

const cancelModal = document.getElementById("cancelModal");
const confirmCancel = document.getElementById("confirmCancel");
const closeModal = document.getElementById("closeModal");

let questions = [];
let currentIndex = 0;
let score = 0;

/* ---------------------------
   Theme switch
----------------------------*/
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeToggle.textContent =
    document.body.classList.contains("dark") ? "Dark" : "Light";
});

/* ---------------------------
   Show Upload / Manual Section
----------------------------*/
uploadBtn.onclick = () => {
  uploadContainer.style.display = "block";
  manualContainer.style.display = "none";
};
manualBtn.onclick = () => {
  manualContainer.style.display = "block";
  uploadContainer.style.display = "none";
};

/* ---------------------------
   File Upload
----------------------------*/
txtFile.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  resetQuiz();
  try {
    const text = await file.text();
    parseQuestions(text);
    startQuiz();
  } catch (err) {
    console.error(err);
    alert("Error reading file.");
  }
});

/* ---------------------------
   Manual Start
----------------------------*/
startManualBtn.addEventListener("click", () => {
  const text = manualInput.value.trim();
  if (!text) return alert("Please type or paste your questions.");
  resetQuiz();
  parseQuestions(text);
  startQuiz();
});

/* ---------------------------
   Start Quiz
----------------------------*/
function startQuiz() {
  if (!questions.length) return alert("No questions detected.");
  questions = shuffleArray(questions);
  quizContainer.style.display = "block";
  fileContainer.style.display = "none";
  cancelBtn.classList.remove("hidden");
  showQuestion();
}

/* ---------------------------
   Reset
----------------------------*/
function resetQuiz() {
  score = 0;
  currentIndex = 0;
  questionContainer.innerHTML = "";
  feedbackDiv.innerHTML = "";
  restartMenu.innerHTML = "";
  nextBtn.style.display = "none";
  scoreDiv.textContent = "";
  progressBar.style.width = "0%";
}

/* ======================================================
   SMART PARSER
   - Handles numbering restarts
   - Detects A-D choices even if multi-line
   - Detects correct marks: ✔ ✓ (correct) (answer) Answer: B etc.
   - Robust to blank lines / extra spaces
   ====================================================== */
function parseQuestions(rawText) {
  const allLines = rawText
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\u00A0/g, " ").trim()) 
    .filter((l) => l.length >= 0); 

  const blocks = [];
  let currentBlock = [];

  const questionStartRe = /^\s*\d+[\.\)\-]\s*/;

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];

    if (questionStartRe.test(line)) {
      if (currentBlock.length) {
        blocks.push(currentBlock.join("\n"));
      }
      currentBlock = [line.trim()];
    } else {
      if (line.trim() === "" && currentBlock.length === 0) {
        continue;
      }
      if (currentBlock.length === 0) {
        currentBlock.push(line.trim());
      } else {
        currentBlock.push(line.trim());
      }
    }
  }
  if (currentBlock.length) blocks.push(currentBlock.join("\n"));
  const parsed = [];

  blocks.forEach((blockRaw) => {
    const block = blockRaw.trim();
    if (!block) return;

    const lines = block.split("\n").map((l) => l.trim()).filter(() => true);

    let questionLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*\d+[\.\)\-]\s*/.test(lines[i])) {
        questionLineIndex = i;
        break;
      }
    }
    if (questionLineIndex === -1) questionLineIndex = 0;

    let questionText = lines[questionLineIndex].replace(/^\s*\d+[\.\)\-]\s*/, "").trim();
    let ptr = questionLineIndex + 1;
    while (ptr < lines.length && !/^[A-D][\.\)\-]?\s*/i.test(lines[ptr]) && !/^(answer[:\s])/i.test(lines[ptr])) {
      questionText += " " + lines[ptr];
      ptr++;
    }

    const options = [];
    let currentLabel = null;
    let currentText = [];

    const pushOption = () => {
      if (!currentLabel) return;
      let joined = currentText.join(" ").trim();
      const hadCorrectMark = /✔|✓|\(correct\)|\(answer\)|\bcorrect\b/i.test(joined);
      const cleaned = joined.replace(/✔|✓|\(correct\)|\(answer\)|\bcorrect\b/gi, "").trim();
      options.push({ label: currentLabel, text: cleaned, rawText: joined, marked: hadCorrectMark });
      currentLabel = null;
      currentText = [];
    };

    for (let i = ptr; i < lines.length; i++) {
      const ln = lines[i];
      const choiceMatch = ln.match(/^\s*([A-D])[\.\)\-]?\s*(.*)$/i);
      if (choiceMatch) {
        pushOption();
        currentLabel = choiceMatch[1].toUpperCase();
        currentText = [choiceMatch[2].trim()];
        continue;
      }
      const onlyAnswerMatch = ln.match(/^(?:answer|correct)[:\s]*([A-D])$/i);
      if (onlyAnswerMatch) {
        pushOption();
        options.push({ label: onlyAnswerMatch[1].toUpperCase(), text: "", rawText: "", marked: true, explicitOnly: true });
        continue;
      }

      if (currentLabel) {
        currentText.push(ln);
      } else {
        questionText += " " + ln;
      }
    }
    pushOption();

    let correct = null;
    for (const opt of options) {
      if (opt.marked) {
        correct = opt.label;
        break;
      }
    }

    if (!correct) {
      const sentinel = options.find((o) => o.explicitOnly);
      if (sentinel) correct = sentinel.label;
    }
    if (!correct) {
      const m = block.match(/([A-D])\s*(?:[:\-\)]\s*)?(?:.*?)(?:✔|✓)/i) || block.match(/(?:✔|✓).{0,6}([A-D])/i);
      if (m) correct = (m[1] || m[2] || m[0]).toUpperCase();
    }

    const finalOptions = options.filter((o) => !o.explicitOnly).map((o) => ({ label: o.label, text: o.text }));

    if (finalOptions.length >= 2 && correct) {
      parsed.push({
        text: questionText.trim(),
        options: finalOptions,
        correct: correct
      });
    } else {
      const fallback = fallbackParseBlock(block);
      if (fallback) parsed.push(fallback);
    }
  });

  // Assign to global questions
  questions = parsed;
  if (!questions.length) {
    const fallbackAll = fallbackParseAll(rawText);
    if (fallbackAll.length) questions = fallbackAll;
  }
  console.log(`Parsed ${questions.length} questions (smart parser).`);
}

/* ----------------------------
   Fallback: parse one block with simpler regex
-----------------------------*/
function fallbackParseBlock(block) {
  const qRegex = /(\d+)\.\s*([\s\S]*?)\s*(?:A\.|$)/i;
  const match = qRegex.exec(block);
  if (!match) return null;
  const questionText = block.replace(/^\s*\d+[\.\)\-]\s*/, "").split(/\nA\./i)[0].trim();
  const optRegex = /([A-D])\.\s*([^\n]+)/g;
  let optMatch;
  const opts = [];
  let correct = null;
  while ((optMatch = optRegex.exec(block)) !== null) {
    let t = optMatch[2].trim();
    if (/✔|✓|\(correct\)|\(answer\)/i.test(t)) {
      correct = optMatch[1].toUpperCase();
      t = t.replace(/✔|✓|\(correct\)|\(answer\)/gi, "").trim();
    }
    opts.push({ label: optMatch[1].toUpperCase(), text: t });
  }
  if (opts.length >= 2 && correct) {
    return { text: questionText, options: opts.map(o => ({ label: o.label, text: o.text })), correct };
  }
  return null;
}

/* ----------------------------
   Fallback parse entire text with old regex
-----------------------------*/
function fallbackParseAll(text) {
  const qRegex = /(\d+)\.\s([\s\S]*?)(?=\n\d+\.|$)/g;
  const optRegex = /([A-D])\.\s([^\n]+)/g;
  const out = [];
  let match;
  while ((match = qRegex.exec(text)) !== null) {
    const fullBlock = match[2].trim();
    const questionText = fullBlock.split(/A\./)[0].trim();
    let options = [], correct = null, optMatch;
    while ((optMatch = optRegex.exec(fullBlock)) !== null) {
      let t = optMatch[2].trim();
      if (t.includes("✔") || t.includes("✓")) {
        correct = optMatch[1].toUpperCase();
        t = t.replace(/✔|✓/g, "").trim();
      }
      options.push({ label: optMatch[1].toUpperCase(), text: t });
    }
    if (correct) out.push({ text: questionText, options, correct });
  }
  return out;
}

/* ---------------------------
   Show Question
----------------------------*/
function showQuestion() {
  feedbackDiv.textContent = "";
  nextBtn.style.display = "none";
  restartMenu.innerHTML = "";

  const q = questions[currentIndex];
  q.options = shuffleArray(q.options);

  const progress = (currentIndex / questions.length) * 100;
  progressBar.style.width = progress + "%";
  questionCounter.textContent = `Question ${currentIndex + 1} of ${questions.length}`;

  questionContainer.innerHTML = `<div class="question">${escapeHtml(q.text)}</div>`;

  q.options.forEach((o, idx) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.innerHTML =
      `<span class="shortcut">${idx + 1}</span> ${escapeHtml(o.label)}. ${escapeHtml(o.text)}`;
    btn.onclick = () => checkAnswer(o.label, btn);
    questionContainer.appendChild(btn);
  });
}

/* ---------------------------
   Handle Answer
----------------------------*/
function checkAnswer(selected, btnClicked) {
  const q = questions[currentIndex];
  document.querySelectorAll(".option").forEach(b => b.disabled = true);

  if (selected === q.correct) {
    btnClicked.style.backgroundColor = "#d4edda";
    btnClicked.style.borderColor = "#28a745";
    feedbackDiv.innerHTML = `<span class="correct">Correct!</span>`;
    score++;
  } else {
    btnClicked.style.backgroundColor = "#f8d7da";
    btnClicked.style.borderColor = "#dc3545";
    const correctOption = q.options.find(x => x.label === q.correct) || {};
    feedbackDiv.innerHTML =
      `<span class="wrong">Wrong!</span> Correct: ${q.correct}. ${escapeHtml(correctOption.text || "")}`;
  }

  if (currentIndex < questions.length - 1) {
    nextBtn.style.display = "inline-block";
  } else {
    finishQuiz();
  }
}

/* ---------------------------
   Next button
----------------------------*/
nextBtn.addEventListener("click", () => {
  currentIndex++;
  showQuestion();
});

/* ---------------------------
   Finish Quiz
----------------------------*/
function finishQuiz() {
  progressBar.style.width = "100%";
  questionCounter.textContent = "";
  feedbackDiv.textContent = "";
  nextBtn.style.display = "none";
  cancelBtn.classList.add("hidden");

  scoreDiv.textContent =
    `Quiz Completed! You scored ${score} / ${questions.length}`;

  restartMenu.innerHTML =
    `<button onclick="location.reload()">Start Over / Main Menu</button>`;
}

/* ---------------------------
   Shuffle
----------------------------*/
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ---------------------------
   Cancel Modal
----------------------------*/
cancelBtn.addEventListener("click", () => cancelModal.classList.remove("hidden"));
closeModal.addEventListener("click", () => cancelModal.classList.add("hidden"));
confirmCancel.addEventListener("click", () => location.reload());

/* ---------------------------
   Fixed Keyboard Shortcuts
   - ESC opens modal
   - 1-4 select options (works even if buttons are disabled)
   - Enter / N -> next
----------------------------*/
document.addEventListener("keydown", (e) => {
  const options = Array.from(document.querySelectorAll(".option"));
  const modalOpen = !cancelModal.classList.contains("hidden");

  if (e.key === "Escape") {
    if (!modalOpen) cancelModal.classList.remove("hidden");
    return;
  }

  if (modalOpen) return;

  if (["1", "2", "3", "4"].includes(e.key)) {
    const idx = parseInt(e.key, 10) - 1;
    const target = options[idx];
    if (target) {
      if (typeof target.onclick === "function") {
        target.onclick();
      } else {
        target.click();
      }
    }
    return;
  }

  if ((e.key === "Enter" || e.key.toLowerCase() === "n") && nextBtn.style.display !== "none") {
    nextBtn.click();
  }
});

/* ---------------------------
   Utility: escape HTML (prevent markup injection)
----------------------------*/
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ============================
   End of script
   ============================ */
