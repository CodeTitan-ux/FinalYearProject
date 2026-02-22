import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TechStackInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
}

export const TechStackInput: React.FC<TechStackInputProps> = ({
  value,
  onChange,
  disabled,
  placeholder = "e.g. React, Node.js, Python...",
  error,
}) => {
  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  // Initialize tags from the parent value string (comma-separated)
  useEffect(() => {
    if (value) {
      const initialTags = value
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      
      // Only update if different to avoid infinite loops if parent updates often
      // A simple JSON stringify check is usually enough here or checking lengths/contents
       setTags((prev) => {
           const prevString = JSON.stringify(prev);
           const newString = JSON.stringify(initialTags);
           return prevString === newString ? prev : initialTags;
       });
    } else {
        setTags([]);
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    if (["Enter", ","].includes(e.key)) {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        const newTags = [...tags, newTag];
        setTags(newTags);
        onChange(newTags.join(", ")); // Update parent with comma-separated string
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      const newTags = tags.slice(0, -1);
      setTags(newTags);
      onChange(newTags.join(", "));
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (disabled) return;
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    onChange(newTags.join(", "));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className={`flex flex-wrap gap-2 p-2 border rounded-md min-h-[50px] items-center bg-background ${error ? "border-red-500" : "border-input"} focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background`}>
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="gap-1 pr-1 text-sm font-medium">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:bg-destructive/10 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {tag}</span>
            </button>
          </Badge>
        ))}
        <Input
          type="text"
          className="flex-1 border-none shadow-none focus-visible:ring-0 p-0 h-auto min-w-[120px] placeholder:text-muted-foreground"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
              // Add tag on blur if there's text
              const newTag = inputValue.trim();
              if (newTag && !tags.includes(newTag)) {
                  const newTags = [...tags, newTag];
                  setTags(newTags);
                  onChange(newTags.join(", "));
                  setInputValue("");
              }
          }}
          disabled={disabled}
          placeholder={tags.length === 0 ? placeholder : ""}
        />
      </div>
       {/* Helper text for keyboard users */}
       <p className="text-xs text-muted-foreground mt-1">
        Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">Enter</kbd> or <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">,</kbd> to add a tag.
      </p>
    </div>
  );
};
