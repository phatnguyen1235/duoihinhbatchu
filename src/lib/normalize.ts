/**
 * Chuẩn hóa chuỗi trả lời cơ bản
 */
export function normalizeAnswer(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.!?,;:]+$/g, '')
    .toLowerCase();
}

/**
 * Chuẩn hóa + loại bỏ dấu tiếng Việt
 */
export function normalizeVietnamese(input: string): string {
  const normalized = normalizeAnswer(input);
  
  return normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * So sánh 2 câu trả lời
 * @param flexible - true: bỏ dấu tiếng Việt khi so sánh
 */
export function compareAnswers(
  userAnswer: string,
  correctAnswer: string,
  flexible: boolean = false
): boolean {
  const normalize = flexible ? normalizeVietnamese : normalizeAnswer;
  return normalize(userAnswer) === normalize(correctAnswer);
}
