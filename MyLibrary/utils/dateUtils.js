export function toJsDate(value) {
  if (!value) return null;
  return value.toDate ? value.toDate() : new Date(value);
}

// আজকের তারিখ থেকে dueDate পর্যন্ত কত দিন বাকি (নেগেটিভ মানে overdue)
export function getDaysLeft(dueDate) {
  const due = toJsDate(dueDate);
  if (!due) return null;
  const now = new Date();
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((due - now) / (1000 * 60 * 60 * 24));
}

// প্রতিদিন ৫ টাকা জরিমানা, overdue হলে
export function calculateFine(daysLeft, ratePerDay = 5) {
  if (daysLeft >= 0) return 0;
  return Math.abs(daysLeft) * ratePerDay;
}

// student এর daysLeft অনুযায়ী কোন bucket এ পড়বে — admin এই bucket ধরেই notify করে
export function getBucket(daysLeft) {
  if (daysLeft === null) return null;
  if (daysLeft <= 10) return "last10";
  if (daysLeft <= 20) return "last20";
  return "last30";
}

export const BUCKET_LABELS = {
  last10: "শেষ ১০ দিনের মধ্যে (জরুরি)",
  last20: "শেষ ১১–২০ দিনের মধ্যে",
  last30: "শেষ ২১–৩০ দিনের মধ্যে",
};
