# Feature Plan — Resumestan

## How to Read This Document

Har task ke saamne ek status label hai:

| Status | Matlab |
|--------|--------|
| `[ ] MANUAL` | Ye kaam **khud karna hai** (user karega) |
| `[x] DONE` | Ye kaam **agent se karana hai** — bas us task ka poora block copy karke agent ko de do aur saath me ye bhi likho: "FEATURE_PLAN.md padh ke context samjho phir ye karo" |
| `[x] DONE` | Kaam complete ho gaya |

---

## App Overview

**Resumestan** — Ek platform jahan user apne Canva resumes ko AI se analyze karwa sakta hai, issues dhundh sakta hai, recommendations save kar sakta hai, aur AI se detailed guides le sakta hai.

### Full User Journey:
1. User aata hai → Account banata hai (email + password)
2. Email verify karta hai (OTP)
3. Login karta hai
4. Dashboard access karta hai
5. Canva account(s) connect karta hai
6. Kisi connected account se Canva project select karke resume add karta hai
7. Resume pe **"Analyze"** click karta hai → AI analysis aati hai + resume page khulta hai
8. Issues me se select karke AI se **recommendations** maangta hai
9. Recommendations save karta hai
10. Saved recommendations me se select karke AI se **full guide** leta hai
11. Guide save karta hai
12. Account disconnect karne pe us account ki saari resumes + unka data **delete** ho jaata hai

---

## What STAYS (jo rehna chahiye)

- Account create / login / email verify flow
- Dashboard stats: **Total Resumes** + **Best Score** (sirf ye 2)
- Connected Canva Accounts section (multiple accounts allowed)
- Resume list on dashboard

## What Gets REMOVED (jo hatana hai)

- `AddCanvaResumeCard` (link paste wala form) — **HATA DO**
- `ResumeFilterBar` (search + tag filter) — **HATA DO**
- Tags feature — **HATA DO**
- Public / Private toggle — **HATA DO**
- Pin feature — **HATA DO**
- Avg. Score stat card — **HATA DO**
- Best Resume stat card — **HATA DO**
- Legacy link-paste cards (`AddCanvaResumeCard`, `UploadResumeCard`) — **HATA DO**

---

## Feature 1 — Add Resume via Popup

### Flow:
1. Dashboard pe **"+ Add Resume"** button
2. Popup Step 1 — Connected Canva accounts list me se select karo
3. Popup Step 2 — Us account ke designs/projects fetch hokar grid me dikhte hain (thumbnail + naam)
4. User ek design select karta hai
5. Popup Step 3 — Resume title deta hai
6. **"Add"** → DB me save, popup band, list refresh

### Notes:
- Agar koi account connected nahi to message: "Pehle Canva account connect karo"
- Loading state jab designs fetch ho rahi hon

---

## Feature 2 — Resume Analyze

### Flow:
1. Dashboard ya resume card pe **"Analyze"** button
2. Click karte hi **do kaam saath saath** hote hain:
   - User ko resume ki **dynamic page** par redirect kiya jaata hai (`/resume/[id]`)
   - Backend pe analysis shuru hoti hai
3. Backend kya karta hai:
   1. Resume ka Canva link fetch karta hai DB se
   2. Us link se PDF/image **download** karta hai
   3. Download ki huwi file ko **base64** me convert karta hai
   4. Base64 + `analyzeResumePrompt` ko **Gemini API** ke paas bhejta hai
   5. Gemini JSON return karta hai
   6. JSON ko resume ke DB record me **save** karta hai
4. Resume page pe analysis result dikh jaata hai:
   - **Score** (0-100)
   - **Summary**
   - **Good Aspects** list
   - **Issues** list (severity ke saath)
   - **Recommendations** section (collapsed by default)

### Existing Prompt File:
- `utils/prompts/analyzeResumePrompt.js` — already bana hua hai, ye use hoga
- Return schema:
  ```json
  {
    "score": 0,
    "summary": "...",
    "goodAspects": [{ "title": "...", "detail": "..." }],
    "issues": [{ "title": "...", "detail": "...", "severity": "high|medium|low" }],
    "recommendations": [{
      "issueTitle": "...",
      "before": "...",
      "after": "...",
      "canvaSteps": ["..."],
      "whyItWorks": "..."
    }]
  }
  ```

---

## Feature 3 — Issue-Specific Recommendations (AI)

### Flow:
1. Resume page pe issues list dikhti hai
2. User **checkboxes** se issues select karta hai
3. **"Get Recommendations"** button dabata hai
4. Backend pe jaata hai: selected issues + resume base64 + alag prompt
5. AI sirf un selected issues ke liye recommendations return karta hai
6. Page pe recommendations dikti hain
7. User **"Save Recommendations"** button dabata hai
8. Save hoti hain resume ke DB record me `savedRecommendations` array me

### New Prompt File Banana Hai:
- `utils/prompts/issueRecommendationPrompt.js`
- Input: `{ issues: [...], resumeContent: "base64 ya text" }`
- Output schema:
  ```json
  {
    "recommendations": [{
      "issueTitle": "...",
      "before": "...",
      "after": "...",
      "canvaSteps": ["..."],
      "whyItWorks": "..."
    }]
  }
  ```

---

## Feature 4 — Full Guide from Saved Recommendations (AI)

### Flow:
1. Resume page pe **"Saved Recommendations"** section hoga
2. Saved recommendations me se user **checkboxes** se select karta hai
3. **"Get Full Guide"** button dabata hai
4. Backend pe jaata hai: selected recommendations + resume base64 + alag prompt
5. AI step-by-step guide return karta hai (Canva me kaise implement karein)
6. Guide page pe dikh jaati hai
7. User **"Save Guide"** kar sakta hai → resume ke DB record me `savedGuides` array me
8. User **guide delete** bhi kar sakta hai

### New Prompt File Banana Hai:
- `utils/prompts/guidePrompt.js`
- Input: `{ recommendations: [...], resumeContent: "base64 ya text" }`
- Output schema:
  ```json
  {
    "guide": {
      "title": "...",
      "overview": "...",
      "steps": [{
        "stepNumber": 1,
        "title": "...",
        "instruction": "...",
        "canvaAction": "...",
        "tip": "..."
      }]
    }
  }
  ```

---

## Feature 5 — Resume Preview

### How:
- Canva designs ka **embed/preview link** hota hai
- Format: `https://www.canva.com/design/{designId}/view?embed`
- Resume page pe ek `<iframe>` me Canva preview show hoga
- Dashboard resume card pe bhi **thumbnail** dikhega (jo pehle se DB me save hogi)

---

## Feature 6 — Account Disconnect = Data Cleanup

### Rules:
- Jab user koi Canva account **disconnect** kare:
  - **Warning** dikhao: "Is account se linked X resumes aur unka sara data (analysis, recommendations, guides) delete ho jayega."
  - User confirm kare tab:
    1. Us `canvaAccountId` se linked **saari resumes delete** ho jaayein DB se
    2. Har resume ke saath uska analysis, savedRecommendations, savedGuides sab bhi jaayega (embedded in resume document)
    3. `canvaAccounts` array se account remove ho jaaye
- Jab user **resume delete** kare:
  - Warning: "Resume aur uska sara data (analysis, recommendations, guides) delete ho jayega."
  - Confirm pe poora resume document delete ho jaaye

---

## Database Schema

### 1. User Collection (already hai — koi change nahi)
```
users: {
  _id,
  username, email, password,
  verify: { status, otp: { code, expireAt } },
  canvaAccounts: [{
    canvaUserId, accountName,
    accessToken (select:false), refreshToken (select:false),
    expiresAt, connectedAt
  }],
  pendingCanvaState: { state, verifier, expiresAt }
}
```

### 2. Resume Collection (updated schema)
```
resumes: {
  _id,
  userId: ObjectId,             // ref: 'users'
  canvaAccountId: String,       // canvaUserId — kis account se linked
  canvaDesignId: String,        // Canva design ID
  title: String,                // user-given name
  canvaLink: String,            // design view link
  thumbnailUrl: String,         // design thumbnail URL

  // Analysis (Gemini se aata hai)
  analysis: {
    score: Number,              // 0-100, default: 0
    summary: String,
    goodAspects: [{ title: String, detail: String }],
    issues: [{ title: String, detail: String, severity: String }],
    recommendations: [{
      issueTitle: String,
      before: String,
      after: String,
      canvaSteps: [String],
      whyItWorks: String
    }],
    analyzedAt: Date
  },

  // User ke saved recommendations
  savedRecommendations: [{
    issueTitle: String,
    before: String,
    after: String,
    canvaSteps: [String],
    whyItWorks: String,
    savedAt: Date
  }],

  // User ke saved guides
  savedGuides: [{
    _id: ObjectId,
    title: String,
    overview: String,
    steps: [{
      stepNumber: Number,
      title: String,
      instruction: String,
      canvaAction: String,
      tip: String
    }],
    savedAt: Date
  }],

  createdAt: Date,
  updatedAt: Date
}
```

---

## Middleware

### Protected Routes (login zaroori):
- `/dashboard`
- `/resume/*`
- `/api/resumes/*`
- `/api/canva/*`

### Public Routes:
- `/login`, `/create-account`, `/verify-email`
- `/api/auth/*`

### File: `middleware.js` (root me)

---

## Pages

| Page | Route | Kaam |
|------|-------|------|
| Dashboard | `/dashboard` | Resume list, accounts, stats |
| Resume Detail | `/resume/[id]` | Preview + Analysis + Recommendations + Guides |

---

## API Routes

| Method | Route | Kaam |
|--------|-------|------|
| GET | `/api/auth/canva` | OAuth start |
| GET | `/api/canva/callback` | Token exchange + DB save |
| GET | `/api/canva/accounts` | Connected accounts list |
| DELETE | `/api/canva/accounts/[canvaUserId]` | Disconnect + cleanup |
| GET | `/api/canva/designs?accountId=` | Designs list from Canva |
| GET | `/api/resumes` | User resumes list |
| POST | `/api/resumes` | Naya resume add |
| DELETE | `/api/resumes/[id]` | Resume + data delete |
| POST | `/api/resumes/[id]/analyze` | Analyze resume via Gemini |
| POST | `/api/resumes/[id]/recommendations` | Selected issues ke recommendations |
| POST | `/api/resumes/[id]/recommendations/save` | Recommendations save karo |
| DELETE | `/api/resumes/[id]/recommendations/[recId]` | Recommendation delete |
| POST | `/api/resumes/[id]/guide` | Selected recommendations se guide |
| POST | `/api/resumes/[id]/guide/save` | Guide save karo |
| DELETE | `/api/resumes/[id]/guide/[guideId]` | Guide delete |

---

## Tasks

### Task 1 — Middleware banana
- **Status:** `[x] DONE`
- **File:** `middleware.js` (root me)
- **Kaam:** Protected routes check karna — session cookie na ho to `/login` redirect.

---

### Task 2 — Resume Model banana
- **Status:** `[x] DONE`
- **File:** `lib/models/Resume.js`
- **Kaam:** Upar wala full schema implement karna (analysis, savedRecommendations, savedGuides sab ke sath).

---

### Task 3 — OAuth Start Route Fix
- **Status:** `[x] DONE`
- **File:** `app/api/auth/canva/route.js`
- **Kaam:** State + verifier generate karke `pendingCanvaState` DB me save karna. Canva URL me `state` param add karna.

---

### Task 4 — OAuth Callback Route Fix
- **Status:** `[x] DONE`
- **File:** `app/api/canva/callback/route.js`
- **Kaam:** State se user identify, token exchange, Canva `/users/me` se accountName, `canvaAccounts` me save, `pendingCanvaState` clear, `/dashboard?canva=connected` redirect.

---

### Task 5 — Canva Accounts API (GET + DELETE with cleanup)
- **Status:** `[x] DONE`
- **Files:**
  - `app/api/canva/accounts/route.js` — GET
  - `app/api/canva/accounts/[canvaUserId]/route.js` — DELETE (resumes bhi delete kare us account ki)

---

### Task 6 — Canva Designs API
- **Status:** `[x] DONE`
- **File:** `app/api/canva/designs/route.js`
- **Kaam:** `?accountId=` param se DB se token nikalo, Canva `/designs` call karo, list return karo.

---

### Task 7 — Resume CRUD API
- **Status:** `[x] DONE`
- **Files:**
  - `app/api/resumes/route.js` — GET + POST
  - `app/api/resumes/[id]/route.js` — DELETE

---

### Task 8 — Resume Analyze API
- **Status:** `[x] DONE`
- **File:** `app/api/resumes/[id]/analyze/route.js`
- **Kaam:**
  1. DB se resume ka `canvaLink` nikalo
  2. Link se file download karo (PDF/image)
  3. Base64 convert karo
  4. `analyzeResumePrompt` ke sath Gemini API call karo
  5. JSON parse karo aur resume ke `analysis` field me save karo
  6. Updated resume return karo

---

### Task 9 — Issue Recommendations API + Prompt
- **Status:** `[x] DONE`
- **Files:**
  - `utils/prompts/issueRecommendationPrompt.js` — naya prompt banana
  - `app/api/resumes/[id]/recommendations/route.js` — POST: selected issues bhejo, AI recommendations lo
  - `app/api/resumes/[id]/recommendations/save/route.js` — POST: recommendations DB me save karo
  - `app/api/resumes/[id]/recommendations/[recId]/route.js` — DELETE

---

### Task 10 — Guide API + Prompt
- **Status:** `[x] DONE`
- **Files:**
  - `utils/prompts/guidePrompt.js` — naya prompt banana
  - `app/api/resumes/[id]/guide/route.js` — POST: selected recommendations bhejo, AI guide lo
  - `app/api/resumes/[id]/guide/save/route.js` — POST: guide DB me save karo
  - `app/api/resumes/[id]/guide/[guideId]/route.js` — DELETE

---

### Task 11 — Dashboard Cleanup + Redesign
- **Status:** `[x] DONE`
- **Files:** `app/dashboard/page.jsx`, `components/dashboard/`
- **Kaam:**
  - Sirf 2 stat cards (Total Resumes + Best Score)
  - Purane components remove karna
  - "Add Resume" button + popup trigger
  - Simplified resume cards (title, score, account naam, Analyze button, Delete button)

---

### Task 12 — Add Resume Popup/Modal
- **Status:** `[x] DONE`
- **File:** `components/dashboard/AddResumeModal.jsx`
- **Kaam:** 3-step popup (account select → designs grid → title input → add)

---

### Task 13 — Resume Detail Page (`/resume/[id]`)
- **Status:** `[x] DONE`
- **File:** `app/resume/[id]/page.jsx`
- **Kaam:**
  - Canva preview (iframe embed)
  - Analysis results (score, summary, good aspects, issues)
  - Issues checkboxes + "Get Recommendations" button
  - Recommendations display + "Save Recommendations" button
  - Saved Recommendations section (checkboxes + "Get Full Guide")
  - Guide display + "Save Guide" button
  - Saved Guides section (view + delete)

---

### Task 14 — ResumeCard Update (Dashboard)
- **Status:** `[x] DONE`
- **File:** `components/dashboard/ResumeCard.jsx`
- **Kaam:** Simplify — title, score, account naam, **"Analyze"** button (jo `/resume/[id]` pe bhi redirect kare), Delete button. Tags/pin/public/private sab hatao.

---

### Task 15 — Manual Testing
- **Status:** `[ ] MANUAL`
- **Kaam:**
  1. Account banao → verify → login
  2. Canva connect karo
  3. Resume add karo (popup se)
  4. Analyze karo
  5. Issue select karke recommendation lo, save karo
  6. Recommendation select karke guide lo, save karo
  7. Guide delete karo
  8. Recommendation delete karo
  9. Resume delete karo (warning check karo)
  10. Account disconnect karo (warning + cleanup check karo)
  11. Bina login ke protected routes access karne ki koshish karo

---

## Notes

- Gemini API already integrated hai (`GOOGLE_API_KEY` .env me hoga)
- `analyzeResumePrompt.js` already `utils/prompts/` me hai — use karna hai
- Canva preview: `https://www.canva.com/design/{designId}/view?embed` format se iframe me show karo
- Tokens kabhi client ko expose nahi honge (select: false)
- Account disconnect karne se pehle aur resume delete karne se pehle **confirm dialog** zaroor dikhana hai
- Score best wala resume ke score se calculate hoga dashboard stats ke liye
