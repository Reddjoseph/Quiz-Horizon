const txtFile = document.getElementById('txtFile');
const quizContainer = document.getElementById('quizContainer');
const questionContainer = document.getElementById('questionContainer');
const feedbackDiv = document.getElementById('feedback');
const nextBtn = document.getElementById('nextBtn');
const cancelBtn = document.getElementById('cancelBtn');
const scoreDiv = document.getElementById('score');
const fileContainer = document.getElementById('fileContainer');
const themeToggle = document.getElementById('themeToggle');
const progressBar = document.getElementById('progressBar');
const questionCounter = document.getElementById('questionCounter');

let questions = [];
let currentIndex = 0;
let score = 0;

// Theme toggle
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeToggle.textContent = document.body.classList.contains('dark') ? 'Switch to Light Theme' : 'Switch to Dark Theme';
});

// Load text file
txtFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Reset quiz
  resetQuiz();

  try {
    const text = await file.text();
    parseQuestions(text);

    if (questions.length > 0) {
      questions = shuffleArray(questions);
      quizContainer.style.display = 'block';
      fileContainer.style.display = 'none';
      showQuestion();
    } else {
      alert('No questions detected. Use Q1., options A-D, and ✔️ for correct answers.');
    }
  } catch (err) {
    console.error(err);
    alert('Error reading text file.');
  }
});

// Cancel quiz with confirmation
cancelBtn.addEventListener('click', () => {
  if (confirm("Are you sure you want to cancel the quiz?")) {
    resetQuiz();
  }
});

function resetQuiz() {
  currentIndex = 0;
  score = 0;
  questions = [];
  quizContainer.style.display = 'none';
  fileContainer.style.display = 'block';
  questionContainer.innerHTML = '';
  feedbackDiv.innerHTML = '';
  scoreDiv.innerHTML = '';
  nextBtn.style.display = 'none';
  progressBar.style.width = '0%';
  questionCounter.textContent = '';
}

// Parse questions from text
function parseQuestions(text) {
  const qRegex = /(\d+)\.\s([\s\S]*?)(?=\d+\.|\Z)/g;
  const optRegex = /([A-D])\.\s([^\n]+)/g;
  const highlightRegex = /✔️/;

  let match;
  while ((match = qRegex.exec(text)) !== null) {
    const qText = match[2].trim();
    const options = [];
    let correct = null;

    let optMatch;
    while ((optMatch = optRegex.exec(qText)) !== null) {
      let optText = optMatch[2].trim();
      if (highlightRegex.test(optText)) {
        correct = optMatch[1];
        optText = optText.replace(highlightRegex, '').trim();
      }
      options.push({ label: optMatch[1], text: optText });
    }

    if (options.length > 0 && correct) {
      questions.push({ text: qText.split(/A\./)[0].trim(), options, correct });
    }
  }
}

// Show question
function showQuestion() {
  feedbackDiv.textContent = '';
  nextBtn.style.display = 'none';
  const q = questions[currentIndex];

  // Randomize options
  q.options = shuffleArray(q.options);

  // Update progress
  const progressPercent = ((currentIndex) / questions.length) * 100;
  progressBar.style.width = `${progressPercent}%`;
  questionCounter.textContent = `Question ${currentIndex + 1} of ${questions.length}`;

  questionContainer.innerHTML = `<div class="question">${q.text}</div>`;
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = `${opt.label}. ${opt.text}`;
    btn.className = 'option';
    btn.onclick = () => checkAnswer(opt.label, btn);
    questionContainer.appendChild(btn);
  });
}

// Check answer
function checkAnswer(selected, btnClicked) {
  const q = questions[currentIndex];
  document.querySelectorAll('.option').forEach(b => b.disabled = true);

  if (selected === q.correct) {
    feedbackDiv.innerHTML = '<span class="correct">Correct!</span>';
    btnClicked.style.backgroundColor = '#d4edda';
    btnClicked.style.borderColor = '#28a745';
    score++;
  } else {
    const correctOpt = q.options.find(o => o.label === q.correct);
    feedbackDiv.innerHTML = `<span class="wrong">Wrong!</span> Correct answer: ${q.correct}. ${correctOpt.text}`;
    btnClicked.style.backgroundColor = '#f8d7da';
    btnClicked.style.borderColor = '#dc3545';
  }

  if (currentIndex < questions.length - 1) {
    nextBtn.style.display = 'inline-block';
  } else {
    nextBtn.style.display = 'none';
    progressBar.style.width = '100%';
    scoreDiv.textContent = `Quiz Completed! Your score: ${score} / ${questions.length}`;
    questionCounter.textContent = '';
  }
}

// Next question
nextBtn.addEventListener('click', () => {
  currentIndex++;
  if (currentIndex < questions.length) {
    showQuestion();
  }
});

// Shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const manualInput = document.getElementById('manualInput');
const startManualBtn = document.getElementById('startManualBtn');

// Start quiz from manual input
startManualBtn.addEventListener('click', () => {
  const text = manualInput.value.trim();
  if (!text) {
    alert("Please type or paste your questions.");
    return;
  }

  resetQuiz();
  parseQuestions(text);

  if (questions.length > 0) {
    questions = shuffleArray(questions);
    quizContainer.style.display = 'block';
    fileContainer.style.display = 'none';
    showQuestion();
  } else {
    alert('No questions detected. Make sure to use numbers for questions, A-D for options, and ✔️ for correct answers.');
  }
});
