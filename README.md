# Project Summary: Symptom Advocate

The Problem
Acute coronary syndrome (ACS) — the umbrella term for heart attacks and unstable angina — is significantly more likely to be misdiagnosed in women than in men. Women presenting with classic ACS symptoms are 50% more likely than men to receive the wrong diagnosis, often being sent home with a label of anxiety or panic instead. When women present with the most severe form of heart attack (complete coronary artery blockage), they're 59% more likely to be misdiagnosed than men. Researchers studying this gap aren't certain whether it stems from biological differences in presentation, differences in how women describe their symptoms, or how doctors interpret that reporting — but that ambiguity is exactly why better symptom documentation matters: a doctor typically sees a patient for a matter of minutes and has to reconstruct any lead-up symptoms from memory or a rushed intake conversation, with no view of how those symptoms built over the preceding days or weeks.

The Solution
A two-sided web app that gives doctors a supplemental tool built on patient-logged, longitudinal symptom data — with AI surfacing patterns specifically associated with ACS risk in women that a doctor working from a single intake conversation would likely miss.

Two Interfaces

Patient site (symptomadvicate)

Patient logs in and fills out a daily diary: symptoms (chest pain/pressure, shortness of breath, fatigue, nausea, jaw/back pain, palpitations, etc.), severity (1–10 scale), sleep hours, free-text notes
Basic profile info captured at signup: age, height, weight
Simple calendar/list view of past entries

Doctor site (symptomadvicate/admin)

Doctor logs in, sees a sidebar list of their patients
Clicking a patient shows their full log history (timeline/table) plus basic patient info
An "AI Insight" panel analyzes the patient's cumulative log and flags patterns consistent with the atypical, often-missed ACS presentation in women (e.g., fatigue and shortness of breath without classic crushing chest pain, symptom clusters building over days rather than a single acute event) — citing which specific log entries support the flag
Explicitly framed as risk-pattern flagging for clinician review, not a diagnosis — keeps it honest and realistically deployable

Why This Framing Works

Narrowing to ACS gives you one well-documented, high-stakes condition to ground the whole demo in, rather than spreading the AI thin across several conditions — sharper pitch, easier to build a credible knowledge base for in 5 hours
Putting the AI in front of the doctor rather than the patient avoids the liability and credibility problems of "AI diagnoses you," while still being genuinely useful
The AI's real job is finding a build-up pattern across time (e.g., fatigue and breathlessness escalating over a week, low sleep correlating with symptom spikes) — something a doctor working from a single intake snapshot would likely miss, which is a much sharper "AI does real work" story than a chatbot wrapper
Grounding the AI's output in a small curated reference set of documented ACS-in-women presentation patterns (RAG-lite) rather than letting it freelance keeps the output credible for a doctor-facing tool

Planned Tech Stack

Frontend: React/Next.js for both patient and doctor sites
Backend/auth/DB: Supabase (fast to set up, handles auth + Postgres + client library)
AI: Claude/OpenAI API called server-side with the patient's full log history + age as context, prompted against a curated ACS-in-women symptom reference set to flag patterns (not diagnose) and cite supporting entries
Simplified for hackathon scope: lightweight/fake auth, text-only input (no file uploads or images), pre-seeded demo data
