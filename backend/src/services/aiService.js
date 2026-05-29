import { aiPrompts } from "../prompts/aiPrompts.js";
import { generateStructuredResponse, geminiConfig } from "./geminiService.js";

const normalizeText = (value) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const toLower = (value) => normalizeText(value).toLowerCase();

const countWords = (value) => {
  const text = normalizeText(value);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
};

const splitSentences = (value) => {
  const text = normalizeText(value);
  if (!text) return [];
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
};

const titleCase = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getSeniorityProfile = (level) => {
  const normalized = toLower(level);

  if (normalized.includes("intern")) {
    return {
      label: "internship",
      expectations: "learning agility, fundamentals, and coachability",
      behaviorFocus: "academic projects, curiosity, and willingness to learn",
      depth: "basic"
    };
  }

  if (normalized.includes("senior") || normalized.includes("lead") || normalized.includes("principal")) {
    return {
      label: "senior",
      expectations: "ownership, cross-functional influence, and strategic judgment",
      behaviorFocus: "tradeoffs, mentoring, prioritization, and decision-making",
      depth: "advanced"
    };
  }

  return {
    label: "junior",
    expectations: "solid fundamentals, clarity, and practical execution",
    behaviorFocus: "project ownership, learning from feedback, and problem solving",
    depth: "intermediate"
  };
};

const getDomainProfile = (field, jobTitle) => {
  const haystack = `${toLower(field)} ${toLower(jobTitle)}`;

  if (haystack.match(/design|ux|ui/)) {
    return {
      label: "design",
      technicalFocus: "user research, information hierarchy, accessibility, and design rationale",
      practicalScenario: "a product flow with conversion drop-off and inconsistent visual hierarchy",
      interviewSignals: ["design rationale", "user empathy", "iteration", "accessibility", "tradeoffs"]
    };
  }

  if (haystack.match(/market|growth|brand|content/)) {
    return {
      label: "marketing",
      technicalFocus: "positioning, funnel metrics, experimentation, and channel strategy",
      practicalScenario: "a campaign with weak conversion and unclear audience segmentation",
      interviewSignals: ["metrics", "audience", "experimentation", "copy", "ROI"]
    };
  }

  if (haystack.match(/finance|account|audit|risk/)) {
    return {
      label: "finance",
      technicalFocus: "financial analysis, controls, accuracy, and risk awareness",
      practicalScenario: "a reporting discrepancy that impacts forecast quality and decision-making",
      interviewSignals: ["accuracy", "controls", "analysis", "risk", "business impact"]
    };
  }

  if (haystack.match(/cyber|security|soc|security analyst/)) {
    return {
      label: "cybersecurity",
      technicalFocus: "risk triage, containment, logging, and defensive depth",
      practicalScenario: "a suspicious authentication pattern and a vulnerable dependency chain",
      interviewSignals: ["risk", "containment", "logging", "threat", "remediation"]
    };
  }

  if (haystack.match(/devops|cloud|platform|sre|infrastructure/)) {
    return {
      label: "platform",
      technicalFocus: "reliability, automation, observability, and deployment safety",
      practicalScenario: "a flaky deployment pipeline with inconsistent runtime failures",
      interviewSignals: ["automation", "observability", "rollback", "reliability", "scalability"]
    };
  }

  if (haystack.match(/data|analytics|bi|science|analyst/)) {
    return {
      label: "data",
      technicalFocus: "data quality, interpretation, statistical thinking, and business relevance",
      practicalScenario: "a dashboard with conflicting KPIs and incomplete source data",
      interviewSignals: ["data quality", "insight", "hypothesis", "metrics", "decision"]
    };
  }

  if (haystack.match(/frontend|front-end|react|vue|angular|ui engineer/)) {
    return {
      label: "frontend",
      technicalFocus: "component architecture, state management, accessibility, performance, and UI consistency",
      practicalScenario: "a product page with inconsistent state handling and poor mobile responsiveness",
      interviewSignals: ["components", "state", "accessibility", "performance", "usability"]
    };
  }

  if (haystack.match(/backend|back-end|api|node|server|microservice/)) {
    return {
      label: "backend",
      technicalFocus: "API design, data modeling, reliability, observability, and error handling",
      practicalScenario: "a high-traffic endpoint that times out under load and returns inconsistent payloads",
      interviewSignals: ["api", "data model", "reliability", "scalability", "observability"]
    };
  }

  if (haystack.match(/fullstack|full-stack/)) {
    return {
      label: "fullstack",
      technicalFocus: "end-to-end product delivery, API integration, frontend quality, and deployment awareness",
      practicalScenario: "a feature where the UI, API, and database all need to be coordinated under a deadline",
      interviewSignals: ["integration", "delivery", "tradeoffs", "debugging", "collaboration"]
    };
  }

  if (haystack.match(/mobile|ios|android|react native|flutter/)) {
    return {
      label: "mobile",
      technicalFocus: "mobile UX, offline resilience, release quality, and platform constraints",
      practicalScenario: "a mobile flow with performance issues and unstable offline behavior",
      interviewSignals: ["mobile ux", "offline", "performance", "quality", "release"]
    };
  }

  if (haystack.match(/qa|quality assurance|test automation|tester/)) {
    return {
      label: "qa",
      technicalFocus: "test strategy, coverage, edge cases, automation, and defect triage",
      practicalScenario: "a release with limited test coverage and recurring production defects",
      interviewSignals: ["test", "coverage", "automation", "defect", "quality"]
    };
  }

  if (haystack.match(/product manager|product owner|product/)) {
    return {
      label: "product",
      technicalFocus: "prioritization, user value, experimentation, stakeholder alignment, and roadmap tradeoffs",
      practicalScenario: "a roadmap dispute between growth requests and technical debt reduction",
      interviewSignals: ["prioritization", "user value", "roadmap", "stakeholders", "tradeoffs"]
    };
  }

  return {
    label: "software",
    technicalFocus: "architecture, debugging, code quality, performance, and maintainability",
    practicalScenario: "a production bug affecting user experience and response time",
    interviewSignals: ["architecture", "debugging", "scalability", "quality", "maintainability"]
  };
};

const dedupe = (values) => [...new Set(values.filter(Boolean))];

const containsAny = (text, words) => words.some((word) => text.includes(word));

const tryGemini = async (runner, fallback) => {
  if (!geminiConfig.enabled) {
    return fallback();
  }

  try {
    return await runner();
  } catch (error) {
    console.warn(`Gemini fallback used: ${error.message}`);
    return fallback();
  }
};

const interviewQuestionsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    roleSummary: { type: "string" },
    questionThemes: {
      type: "array",
      items: { type: "string" }
    },
    questions: {
      type: "array",
      minItems: 8,
      maxItems: 8,
      items: { type: "string" }
    }
  },
  required: ["roleSummary", "questionThemes", "questions"]
};

const answerEvaluationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    communication: { type: "integer" },
    clarity: { type: "integer" },
    relevance: { type: "integer" },
    confidence: { type: "integer" },
    overall: { type: "integer" },
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    improvementsNeeded: { type: "array", items: { type: "string" } },
    tips: { type: "array", items: { type: "string" } }
  },
  required: ["communication", "clarity", "relevance", "confidence", "overall", "summary", "strengths", "improvementsNeeded", "tips"]
};

const motivationLetterSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    subject: { type: "string" },
    content: { type: "string" },
    opening: { type: "string" },
    fitParagraph: { type: "string" },
    valueParagraph: { type: "string" },
    closing: { type: "string" }
  },
  required: ["subject", "content", "opening", "fitParagraph", "valueParagraph", "closing"]
};

const motivationLetterReviewSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    grammarCorrections: { type: "array", items: { type: "string" } },
    styleSuggestions: { type: "array", items: { type: "string" } },
    revisedContent: { type: "string" },
    summary: { type: "string" }
  },
  required: ["grammarCorrections", "styleSuggestions", "revisedContent", "summary"]
};

const buildQuestionSet = ({ jobTitle, field, level, skills }) => {
  const seniority = getSeniorityProfile(level);
  const domain = getDomainProfile(field, jobTitle);
  const role = titleCase(jobTitle || "the role");
  const primarySkill = skills[0] || domain.technicalFocus.split(",")[0];
  const secondarySkill = skills[1] || primarySkill;

  return [
    `Walk me through your background and explain why you are specifically interested in this ${role} role.`,
    `Which parts of your experience are the strongest match for this ${role} position, and what evidence supports that fit?`,
    `Tell me about a project where you used ${primarySkill}. What was the business or user impact, and what was your exact contribution?`,
    `Describe a difficult problem you solved in ${field}. How did you diagnose it, what alternatives did you consider, and what was the final outcome?`,
    `How do you approach collaboration and communication when expectations are unclear or priorities change at the ${seniority.label} level?`,
    `Give an example of feedback you received recently. What did you change afterwards, and what improved because of it?`,
    `How would you handle ${domain.practicalScenario}? What would you do first, second, and how would you validate the result?`,
    `Why should we trust you to succeed in this ${role} role, and what would you focus on in your first 90 days?`
  ].map((question, index) => {
    if (index === 2 && secondarySkill && secondarySkill !== primarySkill) {
      return question.replace(primarySkill, `${primarySkill} and ${secondarySkill}`);
    }

    if (index === 4) {
      return `${question} We are hiring for ${seniority.expectations}.`;
    }

    return question;
  });
};

const assessAnswer = ({ question, answer, jobTitle, field, level, skills = [] }) => {
  const cleanAnswer = normalizeText(answer);
  const answerLower = cleanAnswer.toLowerCase();
  const questionLower = normalizeText(question).toLowerCase();
  const seniority = getSeniorityProfile(level);
  const domain = getDomainProfile(field, jobTitle);
  const wordCount = countWords(cleanAnswer);
  const sentences = splitSentences(cleanAnswer);
  const hasNumbers = /\d/.test(cleanAnswer);
  const hasFirstPerson = /\b(i|i've|i'm|i had|i led|i built|i improved|i handled)\b/i.test(cleanAnswer);
  const hasActionVerbs = /\b(led|built|improved|resolved|implemented|designed|analyzed|delivered|reduced|increased|scaled|coordinated|fixed|launched)\b/i.test(cleanAnswer);
  const hasOutcomeWords = /\b(result|outcome|impact|saved|improved|reduced|increased|faster|better|growth|conversion|quality)\b/i.test(cleanAnswer);
  const mentionsSkill = skills.some((skill) => toLower(skill) && answerLower.includes(toLower(skill)));
  const mentionsDomainTerms = containsAny(answerLower, domain.interviewSignals.map(toLower));
  const mentionsQuestionKeywords = questionLower
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .some((word) => answerLower.includes(word));
  const sentenceStarts = sentences.map((sentence) => sentence.split(/\s+/)[0]?.toLowerCase());
  const repetitiveStarts = sentenceStarts.filter(Boolean).length - new Set(sentenceStarts.filter(Boolean)).size;

  let relevance = 48;
  let clarity = 50;
  let communication = 50;
  let confidence = 50;

  if (wordCount >= 40) clarity += 8;
  if (wordCount >= 80) clarity += 6;
  if (wordCount > 160) clarity -= 4;
  if (wordCount < 20) clarity -= 12;

  if (hasFirstPerson) communication += 6;
  if (hasActionVerbs) communication += 8;
  if (hasOutcomeWords) relevance += 10;
  if (hasNumbers) relevance += 8;
  if (mentionsSkill) relevance += 8;
  if (mentionsDomainTerms) relevance += 8;
  if (mentionsQuestionKeywords) relevance += 8;

  if (seniority.label === "senior") {
    if (answerLower.includes("tradeoff") || answerLower.includes("priorit")) confidence += 8;
    if (answerLower.includes("mentor") || answerLower.includes("stakeholder")) confidence += 6;
  } else if (seniority.label === "internship") {
    if (answerLower.includes("learn") || answerLower.includes("feedback")) confidence += 8;
    if (answerLower.includes("project") || answerLower.includes("course")) relevance += 4;
  }

  if (answerLower.includes("star") || answerLower.includes("situation") || answerLower.includes("task")) {
    clarity += 5;
    communication += 5;
  }

  if (repetitiveStarts > 1) clarity -= 5;
  if (sentences.length >= 3) clarity += 5;
  if (sentences.length === 1 && wordCount > 70) clarity -= 5;

  communication += Math.min(8, Math.max(0, Math.floor(wordCount / 35)));
  confidence += answerLower.includes("i can") || answerLower.includes("i am comfortable") ? 4 : 0;

  const score = (value) => Math.max(35, Math.min(100, Math.round(value)));
  const finalCommunication = score(communication);
  const finalClarity = score(clarity);
  const finalRelevance = score(relevance);
  const finalConfidence = score(confidence);
  const overall = Math.round((finalCommunication + finalClarity + finalRelevance + finalConfidence) / 4);

  const strengths = [];
  const improvements = [];
  const tips = [];

  if (hasActionVerbs) strengths.push("Uses active language and shows ownership.");
  else improvements.push("Start more answers with concrete verbs such as built, improved, or resolved.");

  if (hasNumbers) strengths.push("Includes measurable detail, which improves credibility.");
  else improvements.push("Add numbers, scope, or timelines to make the impact more concrete.");

  if (mentionsSkill || mentionsDomainTerms) strengths.push("Stays connected to the role and domain.");
  else improvements.push(`Tie the answer more directly to ${field} and the skills relevant to ${titleCase(jobTitle)}.`);

  if (wordCount < 30) improvements.push("Expand the answer with context, actions, and result.");
  if (wordCount > 180) improvements.push("Trim repetition and keep the answer more focused.");

  if (repetitiveStarts > 1) tips.push("Vary sentence openings to avoid a repetitive delivery.");
  if (!hasOutcomeWords) tips.push("Finish with the result, not just the process.");
  if (!hasFirstPerson) tips.push("Make your personal contribution explicit.");

  if (questionLower.includes("project")) {
    tips.push("Use a short structure: context, your role, action, result.");
  }

  return {
    communication: finalCommunication,
    clarity: finalClarity,
    relevance: finalRelevance,
    confidence: finalConfidence,
    overall,
    summary: `Overall ${overall}/100. Strongest areas: ${[finalRelevance >= finalClarity ? "relevance" : "clarity", finalCommunication >= finalConfidence ? "communication" : "confidence"].join(" and ")}.`,
    strengths: dedupe(
      strengths.length
        ? strengths
        : ["The answer is understandable and addresses the question."]
    ),
    improvementsNeeded: dedupe(
      improvements.length
        ? improvements
        : ["Add one more concrete detail to make the answer more distinctive."]
    ),
    tips: dedupe(
      tips.length
        ? tips
        : [
            seniority.behaviorFocus,
            "Keep the answer specific, professional, and linked to the role."
          ]
    )
  };
};

const formatProfessionalLetter = ({
  name,
  jobTitle,
  field,
  cvSummary,
  strengths = []
}) => {
  const candidateName = normalizeText(name) || "Candidate";
  const role = titleCase(jobTitle || "the position");
  const domain = titleCase(getDomainProfile(field, jobTitle).label || field || "the field");
  const openingStrength = strengths[0] || "strong analytical and communication skills";
  const secondStrength = strengths[1] || "the ability to learn quickly and contribute reliably";
  const thirdStrength = strengths[2] || "a professional approach to teamwork and execution";

  const summarySentence = cvSummary
    ? `My background reflects ${normalizeText(cvSummary).replace(/\.$/, "")}.`
    : `My background combines practical experience, structured thinking, and a strong motivation to contribute.`;

  return [
    `${candidateName}`,
    `${role} Application`,
    "",
    `Dear Hiring Manager,`,
    "",
    `I am writing to express my interest in the ${role} opportunity. ${summarySentence}`,
    "",
    `What particularly aligns me with this position is my ability to contribute with ${openingStrength}, while staying focused on quality, clarity, and measurable results. In addition, I bring ${secondStrength}, which I believe is essential in a professional ${domain} environment.`,
    "",
    `I am especially drawn to this role because it requires ${thirdStrength}. I would welcome the opportunity to contribute to your team, learn from experienced professionals, and add value in a thoughtful and reliable way.`,
    "",
    `Thank you for your time and consideration. I would be pleased to discuss how my profile aligns with your needs.`,
    "",
    `Kind regards,`,
    candidateName
  ].join("\n");
};

const auditLetterContent = (content) => {
  const text = normalizeText(content);
  const lower = text.toLowerCase();
  const sentences = splitSentences(text);
  const wordCount = countWords(text);
  const hasGreeting = /dear|madam|sir|hiring manager|bonjour|madame|monsieur/i.test(text);
  const hasClosing = /sincerely|kind regards|best regards|cordialement|bien cordialement/i.test(text);
  const hasRoleTailoring = /role|position|poste|opportunity|opportunite/i.test(lower);
  const hasCompanyTailoring = /\bcompany\b|\bteam\b|\borganization\b|\bentreprise\b/i.test(text);
  const hasNumbers = /\d/.test(text);
  const hasParagraphs = content.split(/\n\s*\n/).length >= 3;
  const repetitiveStarts = sentences
    .map((sentence) => sentence.split(/\s+/)[0]?.toLowerCase())
    .filter(Boolean);
  const repeated = repetitiveStarts.length - new Set(repetitiveStarts).size;

  const grammarCorrections = [];
  const styleSuggestions = [];

  if (!hasGreeting) grammarCorrections.push("Add a formal greeting at the top of the letter.");
  if (!hasClosing) grammarCorrections.push("Add a professional closing such as 'Kind regards' or 'Sincerely'.");
  if (wordCount < 140) styleSuggestions.push("Expand the letter so the motivation and fit are clearer.");
  if (wordCount > 280) styleSuggestions.push("Shorten long passages to keep the letter focused and readable.");
  if (!hasParagraphs) styleSuggestions.push("Structure the text into clear paragraphs: introduction, fit, value, closing.");
  if (!hasRoleTailoring) styleSuggestions.push("Mention the exact role more explicitly in the body of the letter.");
  if (!hasCompanyTailoring) styleSuggestions.push("Add one sentence showing why you are interested in this company specifically.");
  if (!hasNumbers) styleSuggestions.push("Include at least one measurable achievement to strengthen credibility.");
  if (repeated > 1) styleSuggestions.push("Vary sentence openings to improve flow and professionalism.");
  if (lower.includes("i think")) styleSuggestions.push("Replace hesitant phrasing with confident, direct statements.");
  if (lower.includes("very") || lower.includes("really")) styleSuggestions.push("Use more precise vocabulary instead of vague intensifiers.");

  return {
    grammarCorrections: dedupe(
      grammarCorrections.length
        ? grammarCorrections
        : ["The letter is structurally acceptable and needs only light polishing."]
    ),
    styleSuggestions: dedupe(
      styleSuggestions.length
        ? styleSuggestions
        : ["The letter is already well structured and professionally phrased."]
    )
  };
};

export const aiService = {
  analyzeCV: async ({ fileName }) => {
    const needsImprovement = Math.random() > 0.35;

    return {
      promptUsed: aiPrompts.cvAnalysis,
      summary: `The CV ${fileName} is generally clear and aligns with entry-level software roles.`,
      strengths: [
        "Clear education timeline",
        "Relevant technical stack listed",
        "Projects demonstrate problem solving"
      ],
      improvementsNeeded: needsImprovement,
      improvements: needsImprovement
        ? [
            "Quantify project impact with numbers",
            "Reduce passive language in experience bullet points"
          ]
        : [],
      improvedSentences: needsImprovement
        ? [
            {
              original: "Worked on an e-commerce app with a team.",
              improved: "Collaborated with a 4-person team to deliver an e-commerce app used by 500+ monthly users."
            }
          ]
        : [],
      extractedSkills: ["JavaScript", "React", "Node.js", "SQL", "Git"]
    };
  },

  generateMotivationLetter: async ({ name, jobTitle, field, cvSummary, strengths }) => {
    return tryGemini(
      async () => {
        const generated = await generateStructuredResponse({
          instructions: aiPrompts.motivationLetterGeneration,
          input: JSON.stringify({
            candidateName: name,
            jobTitle,
            field: field || getDomainProfile(field, jobTitle).label,
            cvSummary,
            strengths
          }),
          schemaName: "motivation_letter",
          schema: motivationLetterSchema,
          temperature: 0.4,
          maxOutputTokens: 1200
        });

        return {
          promptUsed: aiPrompts.motivationLetterGeneration,
          ...generated
        };
      },
      () => ({
        promptUsed: aiPrompts.motivationLetterGeneration,
        subject: `${titleCase(jobTitle)} application`,
        content: formatProfessionalLetter({ name, jobTitle, field, cvSummary, strengths }),
        opening: `Dear Hiring Manager,`,
        fitParagraph: `I am writing to express my interest in the ${titleCase(jobTitle)} opportunity.`,
        valueParagraph: `My profile combines professional rigor, clear communication, and measurable contribution.`,
        closing: `Kind regards,\n${normalizeText(name) || "Candidate"}`
      })
    );
  },

  reviewMotivationLetter: async ({ content }) => {
    return tryGemini(
      async () => {
        const review = await generateStructuredResponse({
          instructions: aiPrompts.motivationLetterReview,
          input: JSON.stringify({
            letter: content
          }),
          schemaName: "motivation_letter_review",
          schema: motivationLetterReviewSchema,
          temperature: 0.2,
          maxOutputTokens: 1200
        });

        return {
          promptUsed: aiPrompts.motivationLetterReview,
          ...review
        };
      },
      () => ({
        promptUsed: aiPrompts.motivationLetterReview,
        ...auditLetterContent(content),
        revisedContent: content,
        summary: "Fallback review generated without OpenAI."
      })
    );
  },

  generateInterviewQuestions: async ({ jobTitle, field, level, skills = [] }) => {
    return tryGemini(
      async () => {
        const generated = await generateStructuredResponse({
          instructions: aiPrompts.interviewQuestions,
          input: JSON.stringify({
            jobTitle,
            field,
            level,
            skills,
            domain: getDomainProfile(field, jobTitle),
            seniority: getSeniorityProfile(level)
          }),
          schemaName: "interview_questions",
          schema: interviewQuestionsSchema,
          temperature: 0.7,
          maxOutputTokens: 1000
        });

        return {
          promptUsed: aiPrompts.interviewQuestions,
          questions: generated.questions,
          questionThemes: generated.questionThemes,
          roleSummary: generated.roleSummary
        };
      },
      () => ({
        promptUsed: aiPrompts.interviewQuestions,
        roleSummary: `${titleCase(jobTitle)} interview focus for ${getSeniorityProfile(level).label} level`,
        questionThemes: ["Motivation", "Role fit", "Technical depth", "Behavioral judgment", "Ownership"],
        questions: buildQuestionSet({ jobTitle, field, level, skills })
      })
    );
  },

  evaluateInterviewAnswer: async ({ question, answer, jobTitle, field, level, skills = [] }) => {
    return tryGemini(
      async () => {
        const evaluation = await generateStructuredResponse({
          instructions: aiPrompts.interviewAnswerEvaluation,
          input: JSON.stringify({
            question,
            answer,
            jobTitle,
            field,
            level,
            skills,
            roleProfile: getDomainProfile(field, jobTitle),
            seniority: getSeniorityProfile(level)
          }),
          schemaName: "interview_answer_evaluation",
          schema: answerEvaluationSchema,
          temperature: 0.2,
          maxOutputTokens: 1200
        });

        return {
          promptUsed: aiPrompts.interviewAnswerEvaluation,
          ...evaluation
        };
      },
      () => ({
        promptUsed: aiPrompts.interviewAnswerEvaluation,
        ...assessAnswer({ question, answer, jobTitle, field, level, skills })
      })
    );
  },

  generatePracticalExercise: async ({ field, level }) => {
    const normalized = field.toLowerCase();

    const byField = {
      it: {
        title: `${level} Backend Debugging Challenge`,
        prompt: "You receive an API endpoint returning duplicate records. Explain your debugging plan, likely root causes, and code-level fixes.",
        expectedOutcome: "Structured diagnosis, reproducible test case, and robust fix with validation."
      },
      cybersecurity: {
        title: `${level} Vulnerability Triage Scenario`,
        prompt: "Given a suspicious login pattern and outdated dependency list, prioritize risks and propose mitigations.",
        expectedOutcome: "Risk-ranked action plan and practical containment/remediation steps."
      },
      marketing: {
        title: `${level} Campaign Performance Analysis`,
        prompt: "Analyze a campaign with low CTR and high CPC. Suggest 5 optimizations and expected impact.",
        expectedOutcome: "Data-driven optimization list with measurable KPIs."
      },
      design: {
        title: `${level} UX Improvement Exercise`,
        prompt: "A checkout flow has 40% drop-off at payment. Propose a UX audit and redesign hypotheses.",
        expectedOutcome: "Clear UX issues, prioritized redesign actions, and test plan."
      },
      finance: {
        title: `${level} Financial Reporting Review`,
        prompt: "A monthly report shows a variance between forecast and actuals. Identify the likely causes and explain how you would validate the numbers.",
        expectedOutcome: "Precise reconciliation steps, control checks, and professional risk assessment."
      },
      data: {
        title: `${level} Data Analysis Case`,
        prompt: "You are given a dashboard with conflicting KPIs and incomplete data. Explain your approach to clean, validate, and communicate the findings.",
        expectedOutcome: "Structured analysis plan and business-facing interpretation."
      }
    };

    return tryGemini(
      async () => {
        const practical = await generateStructuredResponse({
          instructions: aiPrompts.practicalExercise,
          input: JSON.stringify({
            field,
            level,
            domain: getDomainProfile(field, ""),
            seniority: getSeniorityProfile(level)
          }),
          schemaName: "practical_exercise",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              prompt: { type: "string" },
              expectedOutcome: { type: "string" }
            },
            required: ["title", "prompt", "expectedOutcome"]
          },
          temperature: 0.5,
          maxOutputTokens: 800
        });

        return {
          promptUsed: aiPrompts.practicalExercise,
          ...practical
        };
      },
      () => ({
        promptUsed: aiPrompts.practicalExercise,
        ...(byField[normalized] || {
          title: `${level} Role-Based Practical Exercise`,
          prompt: "Design a short practical test relevant to your selected role and justify your approach.",
          expectedOutcome: "Role-specific solution with clear rationale and evaluation criteria."
        })
      })
    );
  },

  generateFinalReport: async ({ answers = [], jobTitle, field, level, skills = [] }) => {
    const evaluated = answers.map((item) =>
      item.analysis?.overall
        ? item.analysis
        : assessAnswer({
            question: item.question,
            answer: item.answer,
            jobTitle,
            field,
            level,
            skills
          })
    );

    const averages = evaluated.length
      ? evaluated.reduce(
          (acc, item) => {
            acc.communication += item.communication;
            acc.clarity += item.clarity;
            acc.relevance += item.relevance;
            acc.confidence += item.confidence;
            acc.overall += item.overall;
            return acc;
          },
          { communication: 0, clarity: 0, relevance: 0, confidence: 0, overall: 0 }
        )
      : { communication: 0, clarity: 0, relevance: 0, confidence: 0, overall: 0 };

    const divisor = Math.max(1, evaluated.length);
    const communication = Math.round(averages.communication / divisor);
    const clarity = Math.round(averages.clarity / divisor);
    const relevance = Math.round(averages.relevance / divisor);
    const confidence = Math.round(averages.confidence / divisor);
    const overall = Math.round(averages.overall / divisor);

    const allStrengths = dedupe(evaluated.flatMap((item) => item.strengths));
    const allImprovements = dedupe(evaluated.flatMap((item) => item.improvementsNeeded));
    const allTips = dedupe(evaluated.flatMap((item) => item.tips));

    const generatedStrengths = dedupe([
      ...allStrengths,
      overall >= 80 ? "Answers are generally strong and professionally framed." : null,
      relevance >= 75 ? "The candidate stays reasonably aligned with the role." : null
    ]);

    const generatedImprovements = dedupe([
      ...allImprovements,
      communication < 70 ? "Use more explicit action verbs and clearer sequencing." : null,
      clarity < 70 ? "Reduce vague phrasing and keep each answer tightly structured." : null,
      relevance < 70 ? "Link more answers directly to the role, the field, and measurable outcomes." : null,
      confidence < 70 ? "State decisions and contributions more assertively." : null
    ]);

    const generatedTips = dedupe([
      ...allTips,
      "Use a short opening sentence, then add context, action, and result.",
      "Keep examples specific, role-relevant, and measurable."
    ]);

    return {
      promptUsed: aiPrompts.finalReport,
      communication,
      clarity,
      relevance,
      confidence,
      overall,
      summary: `Interview performance is ${overall >= 80 ? "strong" : overall >= 65 ? "solid but improvable" : "still developing"}.`,
      strengths: generatedStrengths.slice(0, 5),
      improvementsNeeded: generatedImprovements.slice(0, 5),
      tips: generatedTips.slice(0, 5)
    };
  }
};
