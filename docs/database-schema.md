# Database Schema (MongoDB)

## Collections

### `users`
- `_id: ObjectId`
- `name: String`
- `email: String (unique)`
- `password: String (hashed)`
- `role: "user" | "admin"`
- `isActive: Boolean`
- `plan: "free" | "premium"`
- `stripeCustomerId: String | null`
- `usage.cvAnalyses: Number`
- `usage.simulations: Number`
- `createdAt, updatedAt`

### `paymenttransactions`
- `_id: ObjectId`
- `user: ObjectId -> users._id`
- `provider: "stripe"`
- `sessionId: String (unique)`
- `customerId: String`
- `amountTotal: Number`
- `currency: String`
- `status: "pending" | "succeeded" | "failed" | "expired"`
- `plan: "premium"`
- `createdAt, updatedAt`

### `cvanalyses`
- `_id: ObjectId`
- `user: ObjectId -> users._id`
- `fileName: String`
- `filePath: String`
- `summary: String`
- `strengths: String[]`
- `improvementsNeeded: Boolean`
- `improvements: String[]`
- `improvedSentences: { original, improved }[]`
- `extractedSkills: String[]`
- `createdAt, updatedAt`

### `motivationletters`
- `_id: ObjectId`
- `user: ObjectId -> users._id`
- `source: "generated" | "uploaded"`
- `jobTitle: String`
- `content: String`
- `grammarCorrections: String[]`
- `styleSuggestions: String[]`
- `createdAt, updatedAt`

### `interviewsessions`
- `_id: ObjectId`
- `user: ObjectId -> users._id`
- `jobTitle: String`
- `field: String`
- `level: String`
- `cvAnalysis: ObjectId -> cvanalyses._id`
- `questions: String[]`
- `answers: { question, answer, feedback }[]`
- `currentQuestionIndex: Number`
- `practicalExercise: { title, prompt, expectedOutcome }`
- `finalReport: { communication, clarity, relevance, confidence, strengths[], improvementsNeeded[], tips[] }`
- `status: "in_progress" | "completed"`
- `createdAt, updatedAt`

## Logical ERD
```text
User 1---N CVAnalysis
User 1---N MotivationLetter
User 1---N InterviewSession
User 1---N PaymentTransaction
CVAnalysis 1---N InterviewSession (optional reference)
```
