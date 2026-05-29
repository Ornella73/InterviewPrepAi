# Example AI Prompts

The backend includes prompt templates in `backend/src/prompts/aiPrompts.js`.

## CV Analysis Prompt
```text
You are an ATS + interview coach. Analyze this CV for structure, skills, and experience relevance. Return JSON with: summary, strengths[], improvementsNeeded(boolean), improvements[], improvedSentences[{original, improved}], extractedSkills[]
```

## Motivation Letter Generation Prompt
```text
Generate a professional motivation letter with a formal greeting, role-specific opening, one paragraph on fit, one paragraph on value, and a respectful closing. Return JSON with subject, content, opening, fitParagraph, valueParagraph, and closing. Keep it concise, concrete, and tailored to the candidate profile and target role.
```

## Motivation Letter Review Prompt
```text
Review the letter for grammar, clarity, tone, structure, and impact. Return JSON with grammarCorrections[], styleSuggestions[], revisedContent, and summary. Focus on professional tone, paragraph flow, and concrete achievements.
```

## Interview Questions Prompt
```text
Generate 8 realistic interview questions tailored to the exact job title, field, seniority level, and candidate skills. Mix motivation, experience, role-specific technical depth, behavioral scenarios, and seniority-appropriate ownership. Return JSON with roleSummary, questionThemes[], and questions[].
```

## Interview Answer Evaluation Prompt
```text
Evaluate a candidate answer using the exact question, role, field, level, and skills. Score how specific, relevant, clear, structured, and credible the answer is. Return JSON with communication, clarity, relevance, confidence, overall, summary, strengths[], improvementsNeeded[], and tips[].
```

## Practical Exercise Prompt
```text
Create a practical exercise tailored to role and level. Return JSON with title, prompt, expectedOutcome.
```

## Final Report Prompt
```text
Evaluate interview answers and return JSON with scores (communication, clarity, relevance, confidence, overall, summary) and arrays: strengths, improvementsNeeded, tips. Base the score strictly on the candidate's wording, structure, specificity, measurable outcomes, and alignment with the question.
```

## Integration Note
Current implementation uses placeholders in `backend/src/services/aiService.js`. Replace with OpenAI or other LLM API calls and keep JSON schema constraints for robust parsing.
