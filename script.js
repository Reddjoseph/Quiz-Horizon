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

// Theme switch
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeToggle.textContent =
    document.body.classList.contains("dark")
      ? "Dark"
      : "Light";
});

// Show Upload / Manual Section
uploadBtn.onclick = () => {
  uploadContainer.style.display = "block";
  manualContainer.style.display = "none";
};
manualBtn.onclick = () => {
  manualContainer.style.display = "block";
  uploadContainer.style.display = "none";
};

// File Upload
txtFile.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  resetQuiz();
  try {
    const text = await file.text();
    parseQuestions(text);
    startQuiz();
  } catch {
    alert("Error reading file.");
  }
});

// Manual Start
startManualBtn.addEventListener("click", () => {
  const text = manualInput.value.trim();
  if (!text) return alert("Please type or paste your questions.");
  resetQuiz();
  parseQuestions(text);
  startQuiz();
});

// Start Quiz
function startQuiz() {
  if (!questions.length) return alert("No questions detected.");
  questions = shuffleArray(questions);
  quizContainer.style.display = "block";
  fileContainer.style.display = "none";
  cancelBtn.classList.remove("hidden"); // show cancel button
  showQuestion();
}

// Reset
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

// Parse Questions
function parseQuestions(text) {
  const qRegex = /(\d+)\.\s([\s\S]*?)(?=\d+\.|$)/g;
  const optRegex = /([A-D])\.\s([^\n]+)/g;
  let match;
  while ((match = qRegex.exec(text)) !== null) {
    const fullBlock = match[2].trim();
    const questionText = fullBlock.split(/A\./)[0].trim();
    let options = [], correct = null, optMatch;
    while ((optMatch = optRegex.exec(fullBlock)) !== null) {
      let text = optMatch[2].trim();
      if (text.includes("✔️")) { correct = optMatch[1]; text = text.replace("✔️","").trim(); }
      options.push({label: optMatch[1], text});
    }
    if(correct) questions.push({text: questionText, options, correct});
  }
}

// Show Question
function showQuestion() {
  feedbackDiv.textContent = "";
  nextBtn.style.display = "none";
  restartMenu.innerHTML = "";

  const q = questions[currentIndex];
  q.options = shuffleArray(q.options);

  const progress = (currentIndex / questions.length) * 100;
  progressBar.style.width = progress + "%";
  questionCounter.textContent = `Question ${currentIndex + 1} of ${questions.length}`;

  questionContainer.innerHTML = `<div class="question">${q.text}</div>`;

  q.options.forEach((o, idx) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.innerHTML = `<span class="shortcut">${idx + 1}</span> ${o.label}. ${o.text}`;
    btn.onclick = () => checkAnswer(o.label, btn);
    questionContainer.appendChild(btn);
  });
}


// Handle Answer
function checkAnswer(selected, btnClicked){
  const q = questions[currentIndex];
  document.querySelectorAll(".option").forEach(b=>b.disabled=true);

  if(selected === q.correct){
    btnClicked.style.backgroundColor="#d4edda";
    btnClicked.style.borderColor="#28a745";
    feedbackDiv.innerHTML=`<span class="correct">Correct!</span>`;
    score++;
  }else{
    btnClicked.style.backgroundColor="#f8d7da";
    btnClicked.style.borderColor="#dc3545";
    const correctOption = q.options.find(x=>x.label===q.correct);
    feedbackDiv.innerHTML=`<span class="wrong">Wrong!</span> Correct: ${q.correct}. ${correctOption.text}`;
  }

  if(currentIndex<questions.length-1) nextBtn.style.display="inline-block";
  else finishQuiz();
}

nextBtn.addEventListener("click", ()=>{
  currentIndex++;
  showQuestion();
});

// Finish Quiz
function finishQuiz(){
  progressBar.style.width="100%";
  questionCounter.textContent="";
  feedbackDiv.textContent="";
  nextBtn.style.display="none";
  cancelBtn.classList.add("hidden");

  scoreDiv.textContent=`Quiz Completed! You scored ${score} / ${questions.length}`;
  restartMenu.innerHTML=`<button onclick="location.reload()">Start Over / Main Menu</button>`;
}

// Shuffle
function shuffleArray(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

// Cancel Modal
cancelBtn.addEventListener("click", ()=> cancelModal.classList.remove("hidden"));
closeModal.addEventListener("click", ()=> cancelModal.classList.add("hidden"));
confirmCancel.addEventListener("click", ()=> location.reload());

// Keyboard shortcuts
document.addEventListener("keydown", e => {
  const currentOptions = document.querySelectorAll(".option");
  if (currentOptions.length) {
    // Select option: 1-4
    if (["1", "2", "3", "4"].includes(e.key)) {
      const index = parseInt(e.key) - 1;
      if (currentOptions[index]) currentOptions[index].click();
    }

    // Next question: Enter or N
    else if (e.key.toLowerCase() === "n" || e.key === "Enter") {
      if (nextBtn.style.display !== "none") nextBtn.click();
    }

    // Cancel quiz: Esc
    else if (e.key === "Escape") {
      if (!cancelModal.classList.contains("hidden")) return; // modal already open
      cancelModal.classList.remove("hidden");
    }
  }
});

