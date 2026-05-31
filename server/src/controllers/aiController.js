const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const { getDatabaseContextSummary } = require("../services/aiService");

/**
 * Handle POST /api/v1/ai/chat
 * Securely query Gemini API with dynamically injected live database facts using direct HTTPS REST.
 * Rebranded as Synapse AI.
 */
const queryAIAssistant = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid message or question.",
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Secure generic alert - No .env or key templates leaked in JSON
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return successResponse(res, 200, "AI Service Offline", {
      response: `⚠️ **Service Integration Alert**: Synapse AI is currently offline. Please configure the required API credentials in the server environment variables.`
    });
  }

  // 1. Gather live database metrics
  const databaseFactsContext = await getDatabaseContextSummary();

  // 2. Formulate System Prompt
  const systemInstruction = `You are "Synapse AI", the elite, premium operations intelligence engine of the Task & Expense Management Workspace Portal.
You are helping the Portal Administrator audit team metrics, discover productivity bottlenecks, review resource scopes, and trace financial anomalies.

Below is the absolute, real-time facts context fetched directly from our live SQL Server database connection pools. 
Use this data exclusively to answer the administrator's questions. 

Be highly professional, analytical, concise, and structured in your explanations. Use Markdown tables, bold headers, bullet lists, and rupee signs (₹) for values where appropriate.

If the user asks questions unrelated to this dashboard or project management, politely guide them back to portal audits.

${databaseFactsContext}`;

  try {
    // Make a direct REST API call to Google Gemini to bypass old SDK hardcoded prefix bugs and use stable gemini-2.5-flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: message
              }
            ]
          }
        ],
        systemInstruction: {
          parts: [
            {
              text: systemInstruction
            }
          ]
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || `HTTP error ${response.status}`;
      throw new Error(errMsg);
    }

    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error("No response text returned from Gemini API.");
    }

    return successResponse(res, 200, "AI Response Generated", {
      response: responseText
    });
  } catch (error) {
    console.error("Gemini API call failed:", error);
    
    // Secure generic fallback - absolutely no raw key or configuration details returned to the client UI
    return successResponse(res, 200, "AI Response Failed", {
      response: `⚠️ **Service Integration Alert**: Synapse AI failed to generate a response. Please verify that your API credentials are valid and active.`
    });
  }
});

module.exports = {
  queryAIAssistant,
};
