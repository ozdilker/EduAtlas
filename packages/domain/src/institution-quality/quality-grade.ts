/**
 * Letter grade for internal quality dashboards (A–F).
 */
export enum QualityGrade {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  E = "E",
  F = "F",
}

const GRADE_VALUES: ReadonlySet<string> = new Set(Object.values(QualityGrade));

export function isQualityGrade(value: string): value is QualityGrade {
  return GRADE_VALUES.has(value);
}

export function parseQualityGrade(raw: string): QualityGrade {
  const value = raw.trim().toUpperCase();
  if (!isQualityGrade(value)) {
    throw new Error(`Unknown QualityGrade: ${raw}`);
  }
  return value;
}

/**
 * Maps a 0–100 score to QualityGrade.
 * A ≥90 · B ≥80 · C ≥70 · D ≥60 · E ≥50 · F <50
 */
export function qualityGradeFromScore(score: number): QualityGrade {
  if (score >= 90) return QualityGrade.A;
  if (score >= 80) return QualityGrade.B;
  if (score >= 70) return QualityGrade.C;
  if (score >= 60) return QualityGrade.D;
  if (score >= 50) return QualityGrade.E;
  return QualityGrade.F;
}
