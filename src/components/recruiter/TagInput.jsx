import React, { useState } from "react";

function normalizeTag(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export default function TagInput({
  id,
  label,
  placeholder,
  helperText,
  tags,
  onChange,
  disabled = false,
}) {
  const [draft, setDraft] = useState("");

  const addTag = (rawValue) => {
    const value = normalizeTag(rawValue);
    if (!value) return;

    const exists = tags.some(
      (tag) => tag.toLowerCase() === value.toLowerCase()
    );
    if (exists) return;

    onChange([...tags, value]);
    setDraft("");
  };

  const removeTag = (target) => {
    onChange(tags.filter((tag) => tag !== target));
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(draft);
    }

    if (event.key === "Backspace" && !draft && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="rounded-2xl border border-slate-300 bg-white px-3 py-2 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
        <div className="mb-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                disabled={disabled}
                className="rounded-full text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Remove ${tag}`}
              >
                x
              </button>
            </span>
          ))}
        </div>
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(draft)}
          disabled={disabled}
          className="w-full border-none bg-transparent px-1 py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          placeholder={placeholder}
        />
      </div>
      {helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
