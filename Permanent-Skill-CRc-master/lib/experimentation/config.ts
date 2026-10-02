export const COMMUNITY_EXPERIMENT = {
  id: "EXP-COMM-COMPOSER-V1",
  name: "Action-Oriented Intent Chips vs Generic Composer",
  description: "Test action-oriented intent starter chips on the Community post composer to reduce blank-canvas friction and increase post creation conversion.",
  targetMetric: "Post Creation Rate (PCR)",
  variants: {
    control: {
      key: "control" as const,
      name: "Variant A (Control)",
      description: "Standard passive 'Write something' composer bar",
    },
    treatment: {
      key: "treatment" as const,
      name: "Variant B (Treatment)",
      description: "Interactive intent chips: Ask Question, Share a Win, Leave Review + contextual placeholders",
    },
  },
  trafficSplit: 0.5, // 50/50 split
  status: "active" as const,
};
