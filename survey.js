// Optional: configure a Google Apps Script / webhook endpoint that writes to Google Sheets.
// Set this to your endpoint URL (e.g. a Google Apps Script web app URL) to enable saving.
const SHEETS_ENDPOINT = ""; // insert your endpoint URL here

const QUESTION_BANK = [
  { text: "Do you know where your organisation's data is stored?" },
  { text: "Do you understand where your data comes from?" },
  { text: "How often do you use data to make decisions?" },
  { text: "When was your last data-driven decision?" },
  { text: "Do you track performance over time?" },
  { text: "Do you understand what drives performance in your organisation?" }
];

const questionsEl = document.getElementById("questions");
const formEl = document.getElementById("diagnosticForm");
const resultsEl = document.getElementById("results");
const overallEl = document.getElementById("overall");
const breakdownEl = document.getElementById("domainBreakdown");

function renderQuestions() {
  QUESTION_BANK.forEach((q, idx) => {
    const wrapper = document.createElement("div");
    wrapper.className = "card";
    wrapper.style.margin = "12px 0";
    wrapper.innerHTML = `
      <p style="margin-top:0; margin-bottom: 12px;">${idx + 1}. ${q.text}</p>
      <div role="group" aria-label="Answer">
        <label style="margin-right:16px;">
          <input required type="radio" name="q${idx}" value="yes" />
          Yes
        </label>
        <label>
          <input required type="radio" name="q${idx}" value="no" />
          No
        </label>
      </div>
    `;
    questionsEl.appendChild(wrapper);
  });
}

function score(formData) {
  let yesCount = 0;
  
  QUESTION_BANK.forEach((q, idx) => {
    const answer = formData.get(`q${idx}`);
    if (answer === 'yes') yesCount++;
  });

  const percentage = Math.round((yesCount / QUESTION_BANK.length) * 100);
  
  return { yesCount, percentage, totalQuestions: QUESTION_BANK.length };
}

function getResultLevel(percentage) {
  if (percentage >= 80) return { level: "Advanced", description: "Your organisation has strong data practices and uses data effectively to improve performance." };
  if (percentage >= 60) return { level: "Developing", description: "Your organisation is building data capability and making progress on using data for decisions." };
  if (percentage >= 40) return { level: "Emerging", description: "Your organisation is starting to use data but there are gaps in how data is collected, understood, or applied." };
  return { level: "Foundational", description: "Your organisation has significant opportunities to strengthen how data is managed and used for decision-making." };
}

function renderResults(yesCount, percentage) {
  const result = getResultLevel(percentage);
  breakdownEl.innerHTML = `
    <h3 style="color: var(--accent-blue); margin-top: 0;">Your organisation is at: ${result.level}</h3>
    <p>${result.description}</p>
    <p style="margin-bottom: 0;"><strong>${yesCount} out of ${QUESTION_BANK.length}</strong> questions answered positively.</p>
  `;
}

renderQuestions();

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  
  // Check agreement checkbox
  if (!formEl.agreement.checked) {
    alert("Please agree to the data usage statement to continue.");
    return;
  }
  
  const formData = new FormData(formEl);
  const { yesCount, percentage } = score(formData);

  overallEl.innerHTML = `<strong>Your Data Use Score: ${percentage}%</strong>`;
  renderResults(yesCount, percentage);

  formEl.closest("section").style.display = "none";
  resultsEl.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Optional: send results to a backend / Google Sheets handler if configured.
  try {
    if (SHEETS_ENDPOINT) {
      const payload = {
        timestamp: new Date().toISOString(),
        org: formData.get('org') || '',
        role: formData.get('role') || '',
        email: formData.get('email') || '',
        percentage: percentage,
        yesCount: yesCount,
        answers: Array.from({length: QUESTION_BANK.length}).map((_,i)=> formData.get(`q${i}`) || '')
      };

      fetch(SHEETS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.text();
      }).then(txt => {
        console.log('Saved to Sheets:', txt);
        // indicate save success to user
        if (formData.get('email')) {
          var note = document.createElement('div');
          note.className = 'small';
          note.style.marginTop = '12px';
          note.style.color = 'var(--accent-green)';
          note.textContent = 'Your results have been sent to your email.';
          resultsEl.querySelector('.card').appendChild(note);
        }
      }).catch(err => {
        console.warn('Could not save to Sheets:', err);
      });
    }
  } catch (err) {
    console.error('Save attempt failed', err);
  }
});

