/**
 * Utility functions for calculating Confidence Scores.
 */

export const calculateTextConfidence = (text: string): number => {
    if (!text) return 0;

    const words = text.split(/\s+/);
    const wordCount = words.length;

    // 1. Filler Word Analysis
    const fillerWords = ["um", "uh", "like", "you know", "i mean", "sort of", "kind of", "actually", "basically", "literally"];
    let fillerCount = 0;
    const lowerText = text.toLowerCase();
    
    fillerWords.forEach(filler => {
        // Simple regex to count occurrences
        const regex = new RegExp(`\\b${filler}\\b`, "g");
        const matches = lowerText.match(regex);
        if (matches) fillerCount += matches.length;
    });

    // Filler density: Fillers per 100 words
    const fillerDensity = wordCount > 0 ? (fillerCount / wordCount) * 100 : 0;
    
    // Score based on filler density (Lower is better)
    // < 2% = 100, > 10% = 40
    let fillerScore = 100 - (fillerDensity * 6); 
    fillerScore = Math.max(40, Math.min(100, fillerScore));


    // 2. Sentence Structure (Avg Sentence Length)
    // Longer sentences often indicate better flow (up to a point)
    const sentences = text.split(/[.!?]+/);
    const avgSentenceLength = sentences.reduce((acc, s) => acc + s.trim().split(/\s+/).length, 0) / (sentences.length || 1);
    
    let structureScore = 70; // Base score
    if (avgSentenceLength > 8 && avgSentenceLength < 25) structureScore = 100;
    else if (avgSentenceLength >= 25) structureScore = 90; // Too long might be rambling
    else structureScore = 60; // Too short/choppy

    // Final Text Score (Weighted)
    return Math.round((fillerScore * 0.7) + (structureScore * 0.3));
};

export const calculateSpeechConfidence = (durationSeconds: number, wordCount: number): number => {
    if (durationSeconds <= 0 || wordCount === 0) return 0;

    // Words Per Minute (WPM)
    const wpm = (wordCount / durationSeconds) * 60;

    // Ideal WPM: 120 - 160
    let wpmScore = 0;
    if (wpm >= 120 && wpm <= 160) wpmScore = 100;
    else if (wpm >= 90 && wpm < 120) wpmScore = 85;
    else if (wpm > 160 && wpm <= 190) wpmScore = 80; // Too fast
    else if (wpm < 90) wpmScore = 60; // Too slow
    else wpmScore = 50; // Very fast (>190)

    // Note: Pause detection is handled via logic in the recorder (start/stop events), 
    // but here we primarily judge on rate. 
    return Math.round(wpmScore);
};

export const calculateWebcamConfidence = (movementScore: number): number => {
    // movementScore is expected to be a value representing "pixels changed" or "instability"
    // Normalize this input based on testing. 
    // Assume input 0 (frozen) -> 100 (chaos). 
    // We want "Natural Movement" (some movement, not frozen, not crazy).
    
    // Heuristic:
    // 0-5: Too still (Maybe frozen/nervous) -> Score 70
    // 5-20: Natural head movement -> Score 90-100
    // 20-50: Fidgeting -> Score 60-80
    // >50: Excessive -> Score 40

    if (movementScore < 5) return 80;
    if (movementScore >= 5 && movementScore <= 25) return 95;
    if (movementScore > 25 && movementScore <= 50) return 70;
    return 50;
};

export const calculateOverallConfidence = (textScore: number, speechScore: number, webcamScore: number, isWebcamActive: boolean): number => {
    if (isWebcamActive) {
        // 40% Text, 30% Speech, 30% Webcam
        return Math.round((textScore * 0.4) + (speechScore * 0.3) + (webcamScore * 0.3));
    } else {
        // 60% Text, 40% Speech
        return Math.round((textScore * 0.6) + (speechScore * 0.4));
    }
};
