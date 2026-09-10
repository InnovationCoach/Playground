import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY!);

interface AIAnalysis {
  aerodynamics: "poor" | "fair" | "good" | "excellent";
  dragCoefficient: number;
  solarCoverage: number;
  weightBalance: "unbalanced" | "slight" | "balanced";
  suggestions: string[];
}

/**
 * Analyzes a solar car prototype image using Gemini Vision API
 * Returns structured feedback on aerodynamics, drag, panel placement, and weight distribution
 */
export async function analyzePrototypeWithGemini(imageUrl: string): Promise<AIAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const analysisPrompt = `You are an expert automotive engineer specializing in solar vehicle design. Analyze this solar car prototype image and provide detailed technical feedback.

CRITICAL: Return your response as a VALID JSON object with NO markdown formatting, NO code blocks, and NO additional text. Start directly with { and end with }.

Analyze the following aspects:

1. **Aerodynamic Shape Quality**: Evaluate the overall aerodynamic design
   - Rate as: "poor" (very boxy/inefficient), "fair" (some streamlining), "good" (well-optimized), or "excellent" (professional aerodynamic design)
   - Consider: nose profile, side profile, rear end shape, overall continuity

2. **Drag Coefficient (Cd) Estimate**: Provide a realistic drag coefficient estimate
   - Typical values: 0.08-0.12 (excellent), 0.12-0.18 (good), 0.18-0.25 (fair), >0.25 (poor)
   - For a solar car: target is <0.15
   - Base estimate on: frontal area, shape continuity, edge sharpness, aerodynamic appendages

3. **Solar Panel Coverage Percentage**: Estimate the percentage of the car body covered by visible solar panels
   - Range: 0-100%
   - Consider: panel orientation (horizontal is best, angled is acceptable)
   - Note any visible shading or obstruction
   - Optimal coverage for solar cars: 70%+

4. **Weight Distribution Balance**: Assess how evenly weight appears distributed
   - Rate as: "unbalanced" (visible tilt or asymmetry), "slight" (minor imbalance), or "balanced" (even distribution)
   - Check: motor position (should be center), battery placement (should be low and centered), panel weight distribution
   - Look for visual cues of weight concentration

5. **Specific Improvement Suggestions**: Provide 3-5 actionable engineering improvements
   - Format as specific, measurable suggestions
   - Example: "Reduce windshield angle from 45° to 25° to decrease drag by ~0.04 Cd"
   - Focus on feasible changes for student prototypes
   - Prioritize high-impact, low-cost modifications

RESPONSE FORMAT (return ONLY this JSON structure):
{
  "aerodynamics": "good",
  "dragCoefficient": 0.16,
  "solarCoverage": 72,
  "weightBalance": "balanced",
  "suggestions": [
    "Taper the rear section more aggressively - current slope is too gradual. Target a 15° angle for rear deck.",
    "Reposition the solar panel 5cm forward to center it better over the battery pack. Current offset adds unnecessary drag.",
    "Add wheel fairings to reduce wheel area exposure. This can reduce drag by ~0.02 Cd.",
    "Smooth any visible seams or gaps in the body. Discontinuities create micro-vortices that increase drag.",
    "Consider lowering the motor mounting point by 10mm to improve center of gravity."
  ]
}

IMPORTANT CONSTRAINTS:
- Drag coefficient MUST be a number between 0.05 and 0.35
- Solar coverage MUST be a number between 0 and 100
- Suggestions array MUST have 3-5 strings
- Return ONLY valid JSON. No explanations, no markdown, no code blocks.
- If you cannot see the image clearly, make best-effort estimates based on visible geometry`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: await fileUrlToBase64(imageUrl),
        },
      },
      analysisPrompt,
    ]);

    const responseText = result.response.text();

    // Parse JSON response
    const analysis: AIAnalysis = JSON.parse(responseText);

    // Validate response structure
    validateAnalysisResponse(analysis);

    return analysis;
  } catch (error) {
    console.error("Error analyzing prototype with Gemini:", error);

    // Return fallback analysis if API fails
    return getFallbackAnalysis();
  }
}

/**
 * Enhanced version for comparing two iterations and tracking improvements
 */
export async function comparePrototypeIterations(
  currentImageUrl: string,
  previousImageUrl: string | null,
  iterationNumber: number
): Promise<{
  current: AIAnalysis;
  improvement?: {
    dragImprovement: number;
    coverageImprovement: number;
    balanceImproved: boolean;
  };
}> {
  try {
    const current = await analyzePrototypeWithGemini(currentImageUrl);

    if (!previousImageUrl) {
      return { current };
    }

    const previous = await analyzePrototypeWithGemini(previousImageUrl);

    const improvement = {
      dragImprovement: Number(
        (previous.dragCoefficient - current.dragCoefficient).toFixed(3)
      ),
      coverageImprovement: current.solarCoverage - previous.solarCoverage,
      balanceImproved:
        previous.weightBalance !== "balanced" && current.weightBalance === "balanced",
    };

    return { current, improvement };
  } catch (error) {
    console.error("Error comparing iterations:", error);
    throw error;
  }
}

/**
 * Analyze batch images for competition judging
 */
export async function analyzeBatchPrototypes(
  imageUrls: string[]
): Promise<AIAnalysis[]> {
  try {
    const analyses = await Promise.all(
      imageUrls.map(url => analyzePrototypeWithGemini(url))
    );
    return analyses;
  } catch (error) {
    console.error("Error batch analyzing prototypes:", error);
    throw error;
  }
}

/**
 * Validate the AI analysis response has required fields and valid values
 */
function validateAnalysisResponse(analysis: any): asserts analysis is AIAnalysis {
  if (!analysis || typeof analysis !== "object") {
    throw new Error("Invalid response format: not an object");
  }

  const requiredFields = ["aerodynamics", "dragCoefficient", "solarCoverage", "weightBalance", "suggestions"];
  for (const field of requiredFields) {
    if (!(field in analysis)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate aerodynamics enum
  if (!["poor", "fair", "good", "excellent"].includes(analysis.aerodynamics)) {
    throw new Error(
      `Invalid aerodynamics value: ${analysis.aerodynamics}`
    );
  }

  // Validate dragCoefficient is a reasonable number
  if (
    typeof analysis.dragCoefficient !== "number" ||
    analysis.dragCoefficient < 0.05 ||
    analysis.dragCoefficient > 0.35
  ) {
    throw new Error(
      `Invalid drag coefficient: ${analysis.dragCoefficient} (must be 0.05-0.35)`
    );
  }

  // Validate solarCoverage percentage
  if (
    typeof analysis.solarCoverage !== "number" ||
    analysis.solarCoverage < 0 ||
    analysis.solarCoverage > 100
  ) {
    throw new Error(
      `Invalid solar coverage: ${analysis.solarCoverage} (must be 0-100)`
    );
  }

  // Validate weightBalance enum
  if (!["unbalanced", "slight", "balanced"].includes(analysis.weightBalance)) {
    throw new Error(`Invalid weight balance value: ${analysis.weightBalance}`);
  }

  // Validate suggestions array
  if (
    !Array.isArray(analysis.suggestions) ||
    analysis.suggestions.length < 3 ||
    analysis.suggestions.length > 5
  ) {
    throw new Error(
      `Invalid suggestions array: must have 3-5 items, got ${analysis.suggestions.length}`
    );
  }

  for (let i = 0; i < analysis.suggestions.length; i++) {
    if (typeof analysis.suggestions[i] !== "string") {
      throw new Error(
        `Suggestion ${i} is not a string: ${typeof analysis.suggestions[i]}`
      );
    }
  }
}

/**
 * Fallback analysis when API fails
 * Returns conservative estimates based on common student prototype patterns
 */
function getFallbackAnalysis(): AIAnalysis {
  return {
    aerodynamics: "fair",
    dragCoefficient: 0.18,
    solarCoverage: 65,
    weightBalance: "slight",
    suggestions: [
      "Smooth any visible seams or rough edges on the body to reduce drag.",
      "Consider repositioning the solar panel to ensure it receives maximum sunlight exposure.",
      "Optimize weight distribution by moving heavier components closer to the center of gravity.",
      "Test different body shapes to find the most aerodynamic configuration for your design.",
      "Review motor and battery placement to ensure balanced weight distribution.",
    ],
  };
}

/**
 * Convert image URL to base64 for Gemini API
 */
async function fileUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting URL to base64:", error);
    throw error;
  }
}

/**
 * Generate personalized AI feedback based on team's current design and iteration history
 */
export async function generatePersonalizedFeedback(
  imageUrl: string,
  teamName: string,
  iterationCount: number,
  previousAnalyses?: AIAnalysis[]
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let contextPrompt = `You are a supportive engineering coach for a high school solar car team.
Team Name: ${teamName}
Current Iteration: #${iterationCount}`;

    if (previousAnalyses && previousAnalyses.length > 0) {
      const previousAnalysis = previousAnalyses[previousAnalyses.length - 1];
      contextPrompt += `

Previous Iteration Results:
- Aerodynamics: ${previousAnalysis.aerodynamics}
- Drag Coefficient: ${previousAnalysis.dragCoefficient}
- Solar Coverage: ${previousAnalysis.solarCoverage}%
- Weight Balance: ${previousAnalysis.weightBalance}`;
    }

    contextPrompt += `

Based on the current prototype image, provide encouraging, specific feedback on:
1. What the team did well
2. One specific area to focus on improving next
3. A concrete suggestion for the next iteration

Keep tone supportive and motivating. Limit response to 150 words.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: await fileUrlToBase64(imageUrl),
        },
      },
      contextPrompt,
    ]);

    return result.response.text();
  } catch (error) {
    console.error("Error generating personalized feedback:", error);
    return "Keep iterating! Your team is building great engineering skills.";
  }
}
