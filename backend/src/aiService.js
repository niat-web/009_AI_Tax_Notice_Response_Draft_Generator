const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Prompt v4 according to the plan
const systemPrompt = `You are an expert Indian Chartered Accountant assistant working for P.Suuresh & Associates. 
Your task is to generate a formally structured tax notice response letter based on the user's inputs. 
The output MUST follow this exact formal structure:
1. Formal header (Date, To the assessing officer with placeholder [Designation], [Jurisdiction]).
2. Subject line referencing the specific notice type and client.
3. Formal salutation (Respected Sir/Madam).
4. Acknowledgement paragraph referencing the notice.
5. Factual submissions section incorporating the client's facts and amounts.
6. Relevant legal references (Sections, Rules, or Circulars under Indian Tax Law).
7. Prayer/request paragraph stating the desired response strategy (e.g. contest, seek time).
8. Formal closing (Yours faithfully, For P.Suuresh & Associates, Chartered Accountants).

DO NOT include any conversational text. Output ONLY the professional letter text. Use appropriate placeholders like [Client Name], [PAN/GSTIN], [Date] where specific information is missing but necessary. Ensure tone is extremely professional, polite, and legally precise.`;

async function generateDraftLetter(noticeType, issue, clientFacts, strategy, clientName, noticeRef) {
  const userPrompt = `
Notice Type: ${noticeType}
Specific Issue Raised: ${issue}
Relevant Client Facts & Amounts: ${clientFacts}
Desired Response Strategy: ${strategy}
Client Name: ${clientName}
Notice Reference Number: ${noticeRef}

Please generate the formal response letter.`;

  const startTime = Date.now();

  try {
    const modelCandidates = [
      process.env.GEMINI_MODEL,
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-pro-latest'
    ].filter(Boolean);

    let result = null;
    let lastError = null;

    for (const modelName of modelCandidates) {
      try {
        console.log(`Trying model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: systemPrompt 
        });

        const generatePromise = model.generateContent(userPrompt);
        
        // 30-second timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API Timeout: Gemini took longer than 30 seconds')), 30000)
        );

        result = await Promise.race([generatePromise, timeoutPromise]);
        break; // Success! Break out of the loop
      } catch (err) {
        console.warn(`Model ${modelName} failed:`, err.message);
        lastError = err;
        // if it's an auth error, no point in retrying other models
        if (err.status === 401) {
            throw err;
        }
      }
    }

    if (!result) {
      throw lastError || new Error('All Gemini model candidates failed');
    }

    const responseTime = Date.now() - startTime;
    return {
      text: result.response.text().trim(),
      responseTimeMs: responseTime,
      promptVersion: 'v4'
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Mock response for testing if API key is not available or invalid
    if (error.status === 401 || !process.env.GEMINI_API_KEY) {
      console.log("Using fallback mock response since API call failed (likely missing/invalid key).");
      return {
        text: `To
The Assessing Officer,
[Jurisdiction/Ward],
[City]

Date: ${new Date().toLocaleDateString()}

Subject: Reply to ${noticeType} regarding ${issue} for ${clientName} (Notice Ref: ${noticeRef})

Respected Sir/Madam,

This is in reference to the ${noticeType} (Ref: ${noticeRef}) dated [Notice Date] issued to our client ${clientName} regarding ${issue}. 

We respectfully submit the following facts for your kind consideration:
${clientFacts}

In light of the above facts and under the provisions of the relevant sections of the Income Tax / GST Act, we request you to kindly consider our submission. Our strategy is to ${strategy}. We request you to kindly drop the proceedings or grant us further time as necessary.

We hope you find the above in order. Please let us know if any further information is required.

Yours faithfully,

For P.Suuresh & Associates
Chartered Accountants

[CA Name / Partner]
[Membership Number]`,
        responseTimeMs: Date.now() - startTime,
        promptVersion: 'v4-mock'
      }
    }
    throw new Error('Failed to generate draft.');
  }
}

module.exports = { generateDraftLetter };
