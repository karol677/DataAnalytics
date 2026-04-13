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

// Google Sheets Integration: Configure your endpoint URL here
const SHEETS_ENDPOINT = ""; // Insert your Google Apps Script web app URL

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
    ? (dataAwarenessScores.reduce((a, b) => a + b, 0) / dataAwarenessScores.length).toFixed(2)
    : 0;
  const dataUseAvg = dataUseScores.length > 0 
    ? (dataUseScores.reduce((a, b) => a + b, 0) / dataUseScores.length).toFixed(2)
    : 0;

  // Overall score (average of both subscales)
  const overallScore = ((parseFloat(dataAwarenessAvg) + parseFloat(dataUseAvg)) / 2).toFixed(2);

  return {
    overall: overallScore,
    dataAwarenessAvg: dataAwarenessAvg,
    dataUseAvg: dataUseAvg,
    dataAwarenessScores: dataAwarenessScores,
    dataUseScores: dataUseScores
  };
}

function getResultLevel(overallScore) {
  const score = parseFloat(overallScore);
  if (score >= 4) {
    return {
      level: "Advanced",
      description: "Your organisation has strong data practices and uses data effectively to support performance decisions."
    };
  } else if (score >= 3) {
    return {
      level: "Developing",
      description: "Your organisation is building data capability and making progress on using data to guide decisions."
    };
  } else if (score >= 2) {
    return {
      level: "Emerging",
      description: "Your organisation is starting to use data but there are gaps in how data is collected, understood, and applied."
    };
  } else {
    return {
      level: "Foundational",
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

  // Render results
  renderResults(scores);

  // Show results section, hide form
  formEl.closest("section").style.display = "none";
  resultsEl.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });

  // ============================================================
  // GOOGLE SHEETS INTEGRATION
  // ============================================================
  // If SHEETS_ENDPOINT is configured, send the survey response
  // to a Google Apps Script that writes to Google Sheets.
  // The payload includes all responses, scores, and metadata.
  // ============================================================
  
  if (SHEETS_ENDPOINT) {
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        
        // Company Characteristics (Q1-Q2)
        orgType: formData.get("orgType") || "",
        dataSetup: formData.get("dataSetup") || "",
        
        // Likert responses (Q3-Q10)
        // Data Awareness subscale
        dataStorage: formData.get("q3_data_storage") || "",
        dataSource: formData.get("q4_data_source") || "",
        dataQuality: formData.get("q5_data_quality") || "",
        dataPriority: formData.get("q6_data_priority") || "",
        
        // Data Use subscale
        dataDecisions: formData.get("q7_data_decisions") || "",
        dashboards: formData.get("q8_dashboards") || "",
        dataConsistency: formData.get("q9_consistency") || "",
        dataActions: formData.get("q10_actions") || "",
        
        // Lead capture
        email: formData.get("email") || "",
        
        // Calculated scores
        overallScore: scores.overall,
        dataAwarenessScore: scores.dataAwarenessAvg,
        dataUseScore: scores.dataUseAvg,
        resultLevel: getResultLevel(scores.overall).level
      };

      fetch(SHEETS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(res => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.text();
      }).then(txt => {
        console.log("Survey response saved to Sheets:", txt);
        
        // If email was provided, show confirmation
        if (payload.email) {
          const note = document.createElement("div");
          note.className = "small";
          note.style.marginTop = "16px";
          note.style.color = "var(--accent-green)";
          note.style.fontWeight = "500";
          note.textContent = "✓ Your results have been sent to " + payload.email + ".";
          resultsEl.querySelector(".card").appendChild(note);
        }
      }).catch(err => {
        console.warn("Could not save to Sheets:", err);
        // Silently fail - don't interrupt user experience
      });
    } catch (err) {
      console.error("Survey submission error:", err);
      // Silently fail - don't interrupt user experience
    }
  }
});

// Retake survey button
const retakeBtn = document.getElementById("retake");
if (retakeBtn) {
  retakeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    location.reload();
  });
}

