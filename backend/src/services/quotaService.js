export const canUseCVAnalysis = (user) => user.plan === "premium" || user.usage.cvAnalyses < 1;

export const canUseSimulation = (user) => user.plan === "premium" || user.usage.simulations < 1;

export const canUsePracticalExercise = (user) => user.plan === "premium";

export const incrementUsage = async (user, key) => {
  user.usage[key] += 1;
  await user.save();
};
