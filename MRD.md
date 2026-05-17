# Market Requirements Document (MRD) - Promtal HRBot

## 1. Executive Summary
Promtal HRBot is an intelligent, embedded HR Helpdesk Assistant. Built to address the massive operational overhead faced by SME Human Resource teams, HRBot provides instant, accurate, and policy-backed answers to employee queries regarding payroll, leave, onboarding, and general policies.

## 2. Problem Statement
**The Challenge:** HR teams in Small to Medium Enterprises (SMEs) with 50-500 employees spend approximately 40% of their bandwidth answering repetitive, policy-based questions (e.g., "How many sick leaves do I have?", "When is the payslip generated?"). 
- **Employee Friction:** Employees experience delays in getting simple answers.
- **HR Burnout:** HR professionals spend time on clerical responses rather than strategic initiatives.
- **Compliance Risks:** Manual answers can sometimes be inconsistent with official policies.

## 3. Target Market
- **Primary Audience:** HR Departments in SMEs (50 - 500 employees) primarily in the Indian market.
- **End Users:** Employees of the tenant companies.

## 4. Market Potential & Revenue Model (SaaS)
- **Multi-Tenant Architecture:** The system is designed to isolate policy sets per company, allowing a B2B SaaS distribution model.
- **Pricing Strategy:** ₹5,000 – ₹25,000 / month per company, tiered by the number of active employees and the volume of uploaded policy documents.
- **ROI for Client:** Automating 40% of inquiries saves roughly 8 hours/week per HR executive, effectively paying for the software within the first week of a given month.

## 5. Core Value Propositions
1. **Instant Resolution (0-Wait Time):** Employees get their answers immediately via a conversational interface.
2. **High Accuracy via RAG:** Answers are generated strictly from the company's uploaded documents, eliminating hallucinations.
3. **Smart Escalation:** Sensitive issues (e.g., harassment, disputes) or low-confidence queries bypass the AI and immediately alert human HR with priority tags.
4. **Policy Gap Detection:** The system flags areas where employees are asking questions that have no answers in the current handbook, enabling HR to iteratively improve company policies.
