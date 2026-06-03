/**
 * PasswordStrength.jsx
 * Reusable component that shows a strength meter + checklist for a password value.
 *
 * Props:
 *   password  {string}  – the current password string (controlled externally)
 *
 * Exports:
 *   default       PasswordStrength   – the visual component
 *   validatePassword(pwd)            – returns "" if valid, error string if not
 */

import React from "react";

export const RULES = [
  { id: "len",     label: "At least 8 characters",        test: (p) => p.length >= 8 },
  { id: "upper",   label: "1 uppercase letter (A–Z)",      test: (p) => /[A-Z]/.test(p) },
  { id: "lower",   label: "1 lowercase letter (a–z)",      test: (p) => /[a-z]/.test(p) },
  { id: "digit",   label: "1 numeric digit (0–9)",         test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "1 special character (!@#$…)",   test: (p) => /[^A-Za-z0-9]/.test(p) },
];

/** Returns "" if password meets all rules, or the first failing rule's label. */
export function validatePassword(pwd) {
  for (const rule of RULES) {
    if (!rule.test(pwd)) return `Password must contain: ${rule.label.toLowerCase()}`;
  }
  return "";
}

/** Maps number of passing rules to a strength label + colour. */
function getStrength(pwd) {
  if (!pwd) return { score: 0, label: "", color: "bg-slate-200 dark:bg-zinc-700", width: "0%" };
  const score = RULES.filter((r) => r.test(pwd)).length;
  if (score <= 1) return { score, label: "Very Weak",  color: "bg-red-500",    width: "20%" };
  if (score === 2) return { score, label: "Weak",       color: "bg-orange-500", width: "40%" };
  if (score === 3) return { score, label: "Fair",       color: "bg-yellow-500", width: "60%" };
  if (score === 4) return { score, label: "Good",       color: "bg-blue-500",   width: "80%" };
  return             { score, label: "Strong",     color: "bg-emerald-500", width: "100%" };
}

export default function PasswordStrength({ password }) {
  if (!password) return null;

  const { label, color, width } = getStrength(password);

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${color}`}
            style={{ width }}
          />
        </div>
        <span className={`text-xs font-semibold w-20 text-right transition-colors ${
          label === "Strong" ? "text-emerald-500"
          : label === "Good" ? "text-blue-500"
          : label === "Fair" ? "text-yellow-600 dark:text-yellow-400"
          : "text-red-500"
        }`}>
          {label}
        </span>
      </div>

      {/* Rule checklist */}
      <ul className="space-y-1">
        {RULES.map((rule) => {
          const pass = rule.test(password);
          return (
            <li key={rule.id} className="flex items-center gap-1.5 text-xs">
              {pass ? (
                <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="9" strokeWidth={2} />
                </svg>
              )}
              <span className={pass ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-zinc-500"}>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
