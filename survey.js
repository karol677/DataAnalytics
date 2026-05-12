// ============================================================
// Data Use & Performance Survey - JavaScript Handler
// ============================================================
// This survey collects data about how organisations use data
// to support performance. The form is structured to support:
// - 5-point Likert scale responses (Q3-Q10)
// - Dropdown selections for organisation type and data setup (Q1-Q2)
// - Optional email capture for lead generation
// - Future integration with Google Sheets via Apps Script
//
// GOOGLE SHEETS INTEGRATION NOTES:
// - Form field names use descriptive IDs (e.g., q3_data_storage, q7_data_decisions)
// - Responses are structured in JSON format for easy transmission
// - When SHEETS_ENDPOINT is configured, data is POSTed to a Google Apps Script
// - Configure the endpoint URL in the SHEETS_ENDPOINT constant below
// ============================================================

// Google Sheets Integration: Google Apps Script web app endpoint
const SHEETS_ENDPOINT = "https://script.google.com/macros/s/AKfycbyqiSs6wZuUIAiklSoshDU52eKB9I0CcpIDkhDHIY58FxE5bx0Lt2d1gmQQMY1ZNlcd/exec";

// Form element references
const formEl = document.getElementById("diagnosticForm");
const resultsEl = document.getElementById("results");
const overallEl = document.getElementById("overall");
const breakdownEl = document.getElementById("domainBreakdown");

// Question subscales for scoring
// Data Awareness: questions about understanding data
// Data Use: questions about actually using data
const SUBSCALES = {
  dataAwareness: [
    { name: "q3_data_storage", label: "Data Storage Knowledge" },
    { name: "q4_data_source", label: "Data Source Understanding" },
    { name: "q5_data_quality", label: "Data Quality Confidence" },
    { name: "q6_data_priority", label: "Performance Data Priority" }
  ],
  dataUse: [
    { name: "q7_data_decisions", label: "Data-Driven Decisions" },
    { name: "q8_dashboards", label: "Dashboard Effectiveness" },
    { name: "q9_consistency", label: "Data Review Consistency" },
    { name: "q10_actions", label: "Data-to-Action Translation" }
  ]
};

// ============================================================
// Scoring Functions
// ============================================================

function score(formData) {
  // Calculate subscale scores
  const dataAwarenessScores = SUBSCALES.dataAwareness.map(q => 
    parseInt(formData.get(q.name)) || 0
  );
  const dataUseScores = SUBSCALES.dataUse.map(q => 
    parseInt(formData.get(q.name)) || 0
  );

  // Calculate averages (1-5 scale)
  const dataAwarenessAvg = dataAwarenessScores.length > 0
    ? roundScore(dataAwarenessScores.reduce((a, b) => a + b, 0) / dataAwarenessScores.length)
    : 0;
  const dataUseAvg = dataUseScores.length > 0
    ? roundScore(dataUseScores.reduce((a, b) => a + b, 0) / dataUseScores.length)
    : 0;

  // Overall score (average of both subscales)
  const overallScore = roundScore((dataAwarenessAvg + dataUseAvg) / 2);

  return {
    overall: overallScore,
    dataAwarenessAvg: dataAwarenessAvg,
    dataUseAvg: dataUseAvg,
    dataAwarenessScores: dataAwarenessScores,
    dataUseScores: dataUseScores
  };
}

function roundScore(value) {
  return Number(value.toFixed(2));
}

function getResultLevel(overallScore) {
  const score = parseFloat(overallScore);
  if (score >= 3.7) {
    return {
      level: "Data-Ready Organisation",
      description: "Your organisation has strong data practices and uses data effectively to support performance decisions."
    };
  } else if (score >= 2.5) {
    return {
      level: "Emerging Data System",
      description: "Your organisation is building data capability and making progress on using data to guide decisions."
    };
  } else {
    return {
      level: "Fragmented Data",
      description: "Your organisation has significant opportunities to strengthen how data is managed and used for decision-making."
    };
  }
}

function renderResults(scores) {
  const result = getResultLevel(scores.overall);
  
  overallEl.innerHTML = `<strong>Your Organisation's Data Use Score: ${scores.overall} / 5.0</strong>`;
  
  breakdownEl.innerHTML = `
    <h3 style="color: var(--accent-blue); margin-top: 0;">Your organisation is at: ${result.level}</h3>
    <p>${result.description}</p>
    
    <div style="margin-top: 20px; padding: 16px; background: #FFFFFF; border: 1px solid var(--line); border-radius: var(--radius);">
      <h4 style="color: var(--text); margin-top: 0; font-size: 0.95rem;">Score Breakdown</h4>
      <p style="margin: 8px 0; font-size: 0.9rem;">
        <strong>Data Awareness:</strong> ${scores.dataAwarenessAvg} / 5.0
        <br />
        <em style="color: var(--muted); font-size: 0.85rem;">Understanding where data is, where it comes from, and whether it's trustworthy.</em>
      </p>
      <p style="margin: 8px 0; font-size: 0.9rem;">
        <strong>Data Use:</strong> ${scores.dataUseAvg} / 5.0
        <br />
        <em style="color: var(--muted); font-size: 0.85rem;">Using data regularly to make decisions and translate insights into actions.</em>
      </p>
    </div>
  `;
}

function buildPayload(formData, scores) {
  const result = getResultLevel(scores.overall);

  return {
    org_type: formData.get("orgType") || "",
    data_setup: formData.get("dataSetup") || "",
    awareness_storage: Number(formData.get("q3_data_storage")) || 0,
    awareness_source: Number(formData.get("q4_data_source")) || 0,
    awareness_quality: Number(formData.get("q5_data_quality")) || 0,
    awareness_priority: Number(formData.get("q6_data_priority")) || 0,
    use_decisions: Number(formData.get("q7_data_decisions")) || 0,
    use_dashboard: Number(formData.get("q8_dashboards")) || 0,
    use_review: Number(formData.get("q9_consistency")) || 0,
    use_actions: Number(formData.get("q10_actions")) || 0,
    score_awareness: scores.dataAwarenessAvg,
    score_use: scores.dataUseAvg,
    score_total: scores.overall,
    result_level: result.level,
    email_optional: formData.get("email") || "",
    consent_data_use: formEl.agreement.checked,
    user_agent: window.navigator.userAgent,
    page_url: window.location.href
  };
}

function showSaveMessage(message, isError) {
  const card = resultsEl.querySelector(".card");
  if (!card) return;

  const existing = document.getElementById("submissionStatus");
  if (existing) existing.remove();

  const note = document.createElement("div");
  note.id = "submissionStatus";
  note.className = "small";
  note.style.marginTop = "16px";
  note.style.color = isError ? "#9A3412" : "var(--accent-green)";
  note.style.fontWeight = "500";
  note.textContent = message;
  card.appendChild(note);
}

function submitToSheets(payload) {
  console.log("Survey payload:", payload);

  return fetch(SHEETS_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  }).then(response => {
    console.log("Survey response:", response);
    if (!response.ok) {
      throw new Error("Network response was not ok: " + response.status);
    }
    return response.text();
  }).then(text => {
    console.log("Survey response body:", text);
    return text;
  });
}

// ============================================================
// Form Submission Handler
// ============================================================

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  
  // Validate consent checkbox
  if (!formEl.agreement.checked) {
    alert("Please agree to the data use terms to continue.");
    return;
  }
  
  // Collect form data
  const formData = new FormData(formEl);
  const scores = score(formData);
  const payload = buildPayload(formData, scores);

  // Render results
  renderResults(scores);

  // Show results section, hide form
  formEl.closest("section").style.display = "none";
  resultsEl.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });

  submitToSheets(payload)
    .then(() => {
      showSaveMessage("Your responses were saved.", false);
    })
    .catch(error => {
      console.error("Survey submission error:", error);
      showSaveMessage(
        "Your result is shown below, but the response could not be saved. Please contact karol@eanalyticsstudio.com.",
        true
      );
    });
});

// Retake survey button
const retakeBtn = document.getElementById("retake");
if (retakeBtn) {
  retakeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    location.reload();
  });
}
