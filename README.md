# CSWN Indy Hackathon 9/30

Private repository for the CSWN Indianapolis hackathon on September 30.

Project Summary: Symptom Advocate

The Problem
Women's symptoms are more often dismissed or misdiagnosed than men's — not necessarily because doctors lack knowledge, but because they lack longitudinal data. A doctor sees a patient for 15 minutes every few months and has to reconstruct weeks of symptom history from memory, which makes patterns easy to miss. This shows up starkly in real outcomes: women presenting with classic heart attack symptoms are 50% more likely than men to get the wrong diagnosis, often being sent home with an anxiety/panic label instead, and conditions like endometriosis and PCOS routinely take years longer to diagnose in women than comparable conditions do in men.

The Solution
A two-sided web app that gives doctors a supplemental diagnostic tool built on patient-logged, longitudinal symptom data — with AI surfacing patterns in that data that a doctor skimming a chart would likely miss.

Two Interfaces

Patient site (symptomadvicate)

Patient logs in and fills out a daily diary: symptoms, severity (1–10 scale), sleep hours, free-text notes
Basic profile info captured at signup: age, height, weight
Simple calendar/list view of past entries

Doctor site (symptomadvicate/admin)

Doctor logs in, sees a sidebar list of their patients
Clicking a patient shows their full log history (timeline/table) plus basic patient info
An "AI Insight" panel analyzes the patient's cumulative log and flags patterns consistent with conditions commonly underdiagnosed in women (endometriosis, PCOS, autoimmune conditions, cardiac symptoms in women) — citing which specific log entries support the pattern
Explicitly framed as pattern-flagging for clinician review, not a diagnosis — this keeps it both more honest and more realistically deployable

Why This Framing Works

Putting the AI in front of the doctor rather than the patient avoids the liability and credibility problems of "AI diagnoses you," while still being genuinely useful
The AI's real job is finding correlations across time (e.g., pain spikes following low-sleep days, or a symptom cluster matching a known underdiagnosed pattern) — something a human glancing at a log wouldn't easily catch, which is a much sharper "AI does real work" story than a chatbot wrapper
Grounding the AI's output in a small curated reference set of known symptom patterns (RAG-lite) rather than letting it freelance keeps the output credible for a doctor-facing tool

Planned Tech Stack

Frontend: React/Next.js for both patient and doctor sites
Backend/auth/DB: Supabase (fast to set up, handles auth + Postgres + client library)
AI: Claude/OpenAI API called server-side with the patient's full log history + age as context, prompted to flag patterns (not diagnose) and cite supporting entries
Simplified for hackathon scope: lightweight/fake auth, text-only input (no file uploads or images), pre-seeded demo data
