/**
 * Mathura Overseas — AI Chat Worker
 * ------------------------------------------------------------
 * This runs on Cloudflare Workers (free tier: 100,000 requests/day).
 * It receives chat messages from the website's widget, adds your
 * business knowledge as context, calls Google's free Gemini API,
 * and returns the answer. The Gemini API key lives here (server-side)
 * and is NEVER exposed to visitors' browsers.
 *
 * DEPLOY:
 * 1. Go to https://dash.cloudflare.com -> Workers & Pages -> Create -> Worker
 * 2. Name it (e.g. "mathura-ai-chat") -> Deploy
 * 3. Click "Edit code", delete the sample code, paste this entire file
 * 4. Go to Settings -> Variables -> add an Environment Variable:
 *      Name: GEMINI_API_KEY
 *      Value: <paste your key from aistudio.google.com>
 *      (click "Encrypt" so it's hidden from view afterward)
 * 5. Deploy again
 * 6. Copy your Worker's URL (looks like https://mathura-ai-chat.YOURNAME.workers.dev)
 *    — you'll paste this into script.js as AI_CHAT_CONFIG.WORKER_URL
 */

// Only these origins are allowed to call this Worker. Add your real
// domain here once it's live (mathuraoverseas.com), keep the netlify
// one only if you're still testing there.
const ALLOWED_ORIGINS = [
  'https://mathuraoverseas.com',
  'https://www.mathuraoverseas.com',
  'https://mathuraoverseas.netlify.app',
  'http://127.0.0.1:5500',
  'http://localhost:5500'
];

// Your business knowledge — the AI answers using ONLY this context,
// so it stays accurate to your real offerings instead of guessing.
const SYSTEM_PROMPT = `You are the AI assistant for Mathura Overseas, an MBBS-abroad admissions consultancy based in Tiruchirapalli, Tamil Nadu, India. Answer visitor questions helpfully, warmly, and CONCISELY (2-4 sentences unless asked for detail). Only use the facts below — if you don't know something, say so and suggest they contact a counsellor rather than guessing.

PRIORITY DESTINATIONS (NMC/WHO recognised, no donation/capitation fees):

PHILIPPINES ((added as a priority destination)):
- Davao Medical School Foundation — Davao City, Est. 1976, 6 yrs, ~$5,100/yr, our flagship pick
- UV Gullas College of Medicine — Cebu City, Est. 1919, 6 yrs, ~$4,800/yr, 1,400+ Indian students
- Lyceum Northwestern University — Dagupan City, Est. 1969, 6 yrs, ₹1.4L/semester, our best-value pick
- Southwestern University PHINMA — Cebu City, 5.5 yrs, ~$4,500/yr, students from 34 countries
- Brokenshire College of Medicine — Davao City, Est. 1954, 6 yrs, ~$4,300/yr, safest city in Philippines
- AMA School of Medicine — Manila, 6 yrs, ~$3,500/yr, affordable, central Manila location

TIMOR-LESTE:
- Universidade Católica Timorense (UCT) — Dili, Est. 2021, 5.5 yrs, ~$35,000-40,000 total, built on Indian curriculum, low competition

UZBEKISTAN (3 partner institutes):
- Tashkent Medical Academy — capital city, 6 yrs, ~$3,500-5,000/yr
- Samarkand State Medical University — Est. 1930, 6 yrs, ~$3,500-4,500/yr, largest Indian student community there
- Fergana Medical Institute — 6 yrs, ~$3,200-4,250/yr, most budget-friendly Uzbek option

VIETNAM :
- NMC/WHO recognised universities incl. Hanoi Medical University, 6 yrs, ₹2L-4.6L/yr tuition, ~4-hour flight from India (closest destination), Indian mess on most campuses

ALSO AVAILABLE (secondary destinations): Russia (~$3,000-6,000/yr, no entrance exam), Georgia (~$5,000-8,000/yr, European standard), Kazakhstan (~$4,000-5,500/yr), Kyrgyzstan (~$3,500-4,500/yr, most budget-friendly), Central America/Belize/Nicaragua (US-style curriculum, newer pathway — always confirm current accreditation with a counsellor before recommending strongly).

ELIGIBILITY:
- Passed 10+2 with Physics, Chemistry, Biology
- Minimum 50% aggregate in PCB (40% for SC/ST/OBC)
- Age 17+ by December 31st of admission year
- Must have qualified NEET
- Valid passport with 18+ months validity at travel
- No IELTS/TOEFL required for most partner universities

ADMISSION PROCESS (4 steps): 1) Choose country & university based on budget/NEET score, 2) Submit documents (10+2 marksheets, NEET scorecard, passport, photos), 3) Receive official admission letter (2-3 weeks), 4) Visa filing, ticketing, pre-departure briefing.

WHY MBBS ABROAD: transparent lower fees than Indian private donations, NMC/WHO/ECFMG-recognised degrees, no donation/capitation required — only a qualifying NEET score, English-medium instruction throughout, real clinical exposure via affiliated teaching hospitals, pathway to FMGE/NExT (India) or USMLE (USA).

CONTACT: Phone/WhatsApp +91 93608 59919, Email mathuraoverseas@gmail.com, Based in Tiruchirapalli, Tamil Nadu.

If a visitor asks something you can answer from the above, answer directly and warmly. If they ask something requiring current/specific info you don't have (exact current fee quotes, seat availability, personal eligibility assessment, visa-specific legal questions), say a counsellor can help with specifics and suggest they use the "Apply Now" form or WhatsApp. Never invent facts not listed above. Keep responses short and conversational, not like a brochure.`;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = buildCorsHeaders(origin);

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, corsHeaders);
    }

    if (!ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: 'Origin not allowed' }, 403, corsHeaders);
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ error: 'Invalid request body' }, 400, corsHeaders);
    }

    const message = (body.message || '').toString().trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message || message.length > 800) {
      return json({ error: 'Message must be 1-800 characters' }, 400, corsHeaders);
    }

    if (!env.GEMINI_API_KEY) {
      return json({ error: 'Server not configured — GEMINI_API_KEY missing' }, 500, corsHeaders);
    }

    // Build the conversation for Gemini: system context + prior turns + new message
    const contents = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Understood — I\'ll answer visitor questions about Mathura Overseas using only that information.' }] },
      ...history.slice(-10).map(function (turn) {
        return { role: turn.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(turn.text || '').slice(0, 800) }] };
      }),
      { role: 'user', parts: [{ text: message }] }
    ];

    try {
      const geminiRes = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + env.GEMINI_API_KEY,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: contents,
            generationConfig: { temperature: 0.4, maxOutputTokens: 400 }
          })
        }
      );

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.log('Gemini error:', geminiRes.status, errText);
        if (geminiRes.status === 429) {
          return json({ error: 'We\'ve hit today\'s free usage limit — please try again tomorrow, or contact us directly on WhatsApp.' }, 429, corsHeaders);
        }
        return json({ error: 'Could not get a response right now. Please try again shortly.' }, 502, corsHeaders);
      }

      const data = await geminiRes.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response. Please try rephrasing, or contact us on WhatsApp.';

      return json({ reply: reply }, 200, corsHeaders);
    } catch (err) {
      console.log('Worker error:', err.message);
      return json({ error: 'Something went wrong. Please try again or contact us on WhatsApp.' }, 500, corsHeaders);
    }
  }
};

function buildCorsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status: status, headers: headers });
}