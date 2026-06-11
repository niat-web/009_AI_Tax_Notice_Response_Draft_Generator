const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require("groq-sdk");
let pdfParse = require('pdf-parse');
if (typeof pdfParse !== 'function' && typeof pdfParse.PDFParse === 'function') {
  pdfParse = pdfParse.PDFParse;
}

require('dotenv').config();

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Prompt v4 according to the plan
const systemPrompt = `You are an expert Indian Chartered Accountant assistant working for P.Suuresh & Associates. 
Your task is to generate a formally structured tax notice response letter based on the user's inputs. 
The output MUST follow this exact formal structure:
1. Formal header (Date, To the assessing officer with placeholder [Designation], [Jurisdiction]).
2. Subject line referencing the specific notice type and client.
3. Formal salutation (Use strictly "Respected Sir/Madam," or if Hindi use "आदरणीय महोदय/महोदया,").
4. Acknowledgement paragraph referencing the notice.
5. Factual submissions section incorporating the client's facts and amounts.
6. Relevant legal references (Sections, Rules, or Circulars under Indian Tax Law).
7. Prayer/request paragraph stating the desired response strategy (e.g. contest, seek time).
8. Formal closing (Use strictly "Yours faithfully, For P.Suuresh & Associates, Chartered Accountants", or if Hindi use "भवदीय, कृते पी. सुरेश एंड एसोसिएट्स, चार्टर्ड एकाउंटेंट्स").

DO NOT include any conversational text. Output ONLY the professional letter text. Use appropriate placeholders like [PAN/GSTIN] where specific information is missing. Use the provided Current Date in the header. Ensure tone is extremely professional, polite, and legally precise. Never use literal strange translations for formal terms.`;

async function generateDraftLetter(noticeType, issue, clientFacts, strategy, clientName, noticeRef, language = 'English') {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const userPrompt = `
Notice Type: ${noticeType}
Specific Issue Raised: ${issue}
Relevant Client Facts & Amounts: ${clientFacts}
Desired Response Strategy: ${strategy}
Client Name: ${clientName}
Notice Reference Number: ${noticeRef}
Current Date: ${currentDate}

Please generate the formal response letter and ensure you use the Current Date (${currentDate}) in the letter's header instead of a placeholder.
CRITICAL: You MUST explicitly and clearly state the Desired Response Strategy ("${strategy}") in the letter. Do not be vague. If the strategy is 'accept with payment', explicitly state that the client accepts the liability and payment has been/will be made. If 'contest', state why it is being contested.
CRITICAL: The entire generated response letter MUST be written entirely in ${language}. Ensure professional and accurate legal terminology in ${language}.`;

  const startTime = Date.now();

  try {
    const modelCandidates = [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant"
    ].filter(Boolean);

    let result = null;
    let lastError = null;

    for (const modelName of modelCandidates) {
      try {
        console.log(`Trying model: ${modelName}...`);
        let generatePromise;
        
        if (modelName.startsWith('llama') || modelName.startsWith('mixtral') || modelName.startsWith('gemma')) {
          if (!groq) throw new Error("Groq API key missing");
          generatePromise = groq.chat.completions.create({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            model: modelName,
          }).then(chatCompletion => {
            return { response: { text: () => chatCompletion.choices[0]?.message?.content || "" } };
          });
        } else {
          if (!genAI) throw new Error("Gemini API key missing");
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt
          });
          generatePromise = model.generateContent(userPrompt);
        }

        // 30-second timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('API Timeout: Model took longer than 30 seconds')), 30000)
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
      throw lastError || new Error('All model candidates failed');
    }

    const responseTime = Date.now() - startTime;
    return {
      text: result.response.text().trim(),
      responseTimeMs: responseTime,
      promptVersion: 'v4'
    };
  } catch (error) {
    console.error("API Error:", error);
    if (error.status === 401 || (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY)) {
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

const extractionSystemPrompt = `You are an expert Indian Chartered Accountant assistant working for P.Suuresh & Associates.
Your task is to analyze the provided tax notice document (PDF or image) and extract the key details needed to draft a response letter.
You MUST output the extracted details strictly in JSON format matching this schema:
{
  "noticeType": "Identify the type of notice (e.g., Income Tax Scrutiny, GST Audit Notice, TDS Demand, Advance Tax Demand, Assessment Order)",
  "issue": "Briefly summarize the specific issue or discrepancy raised in the notice",
  "clientFacts": "Extract relevant facts, amounts, periods, and context mentioned that relate to the client's position",
  "strategy": "Suggest a logical response strategy based on the notice context (e.g., 'contest with explanation', 'accept with payment', 'seek time extension')",
  "clientName": "Extract the name of the individual or entity the notice is addressed to",
  "noticeRef": "Extract the formal notice reference number or DIN"
}
Output ONLY valid JSON. Do not include markdown formatting like \`\`\`json.`;

async function extractNoticeDetails(fileBuffer, mimeType) {
  try {
    const modelCandidates = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro-vision',
      'gemini-pro',
      'gemini-1.0-pro-vision',
      'gemini-1.0-pro'
    ].filter(Boolean);

    let result = null;
    let lastError = null;

    let documentText = "";
    if (mimeType === 'application/pdf') {
       try {
         const pdfData = await pdfParse(fileBuffer);
         documentText = pdfData.text;
       } catch (e) {
         console.warn("PDF parse failed:", e.message);
       }
    }

    const filePart = {
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType
      }
    };

    for (const modelName of modelCandidates) {
      try {
        console.log(`Trying model ${modelName} for extraction...`);
        let generatePromise;

        if (modelName.startsWith('llama') || modelName.startsWith('mixtral') || modelName.startsWith('gemma')) {
          if (!groq) throw new Error("Groq API key missing");
          
          let messages = [{ role: "system", content: extractionSystemPrompt }];
          
          if (mimeType === 'application/pdf' && documentText) {
             messages.push({ role: "user", content: `Extract the details from this tax notice text into the requested JSON format:\n\n${documentText}` });
             
             generatePromise = groq.chat.completions.create({
               messages: messages,
               model: modelName,
               response_format: { type: "json_object" }
             }).then(chatCompletion => {
               return { response: { text: () => chatCompletion.choices[0]?.message?.content || "" } };
             });
          } else if (mimeType.startsWith('image/')) {
             const visionModel = "llama-3.2-11b-vision-preview";
             messages.push({
               role: "user", 
               content: [
                 { type: "text", text: "Extract the details from this tax notice image into the requested JSON format." },
                 { type: "image_url", image_url: { url: `data:${mimeType};base64,${fileBuffer.toString("base64")}` } }
               ]
             });
             generatePromise = groq.chat.completions.create({
               messages: messages,
               model: visionModel
             }).then(chatCompletion => {
               return { response: { text: () => chatCompletion.choices[0]?.message?.content || "" } };
             });
          } else {
             throw new Error("Unsupported file type for Groq extraction");
          }
        } else {
          if (!genAI) throw new Error("Gemini API key missing. Gemini is required for document extraction.");
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: extractionSystemPrompt,
            generationConfig: { responseMimeType: "application/json" }
          });
          generatePromise = model.generateContent([
            "Extract the details from this tax notice document into the requested JSON format.",
            filePart
          ]);
        }

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('API Timeout: Model took longer than 30 seconds for extraction')), 30000)
        );

        result = await Promise.race([generatePromise, timeoutPromise]);
        break;
      } catch (err) {
        console.warn(`Model ${modelName} extraction failed:`, err.message);
        lastError = err;
        if (err.status === 401) throw err;
      }
    }

    if (!result) {
      throw lastError || new Error('All models failed for extraction');
    }

    const text = result.response.text().trim();
    const cleanText = text.replace(/^```json/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleanText);

  } catch (error) {
    console.error("Extraction API Error:", error);
    if (error.status === 401 || (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY)) {
      console.log("Using fallback mock extraction since API call failed.");
      return {
        noticeType: "Income Tax Scrutiny",
        issue: "Mock issue extracted from document",
        clientFacts: "Mock facts and figures extracted.",
        strategy: "contest with explanation",
        clientName: "Mock Client Name",
        noticeRef: "MOCK-REF-12345"
      };
    }
    throw new Error('Failed to extract notice details.');
  }
}

module.exports = { generateDraftLetter, extractNoticeDetails };
