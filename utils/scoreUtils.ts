// Format number with commas for display
export const formatScore = (value: string) => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "");
  // Add commas
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Handle score input change with formatting
export const handleScoreChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setScore: (score: string) => void
) => {
  const formatted = formatScore(e.target.value);
  setScore(formatted);
};