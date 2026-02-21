import type { GraphStructure } from "./graph-structure";

export const demoGraph: GraphStructure = {
  title: "Interview Scenario",
  startImageUrl: "https://via.placeholder.com/150",
  prompt:
    "Interviewer-led conversation with five phases: Introduction, Background, Soft Skills, Projection & Values, Closure.",
  startNodeId: "NODE_01_INTRO",
  nodes: [
    // ─── Phase 1 — Introduction & Motivation ───
    {
      id: "NODE_01_INTRO",
      title: "Introduction",
      script:
        "Hello, thank you for joining us today. To start, could you briefly introduce yourself and tell me what motivated you to apply for this position?",
      options: [
        {
          condition: "clear / confident response",
          nodeId: "NODE_02_MOTIVATION",
        },
        { condition: "vague response", nodeId: "NODE_03_CLARIFICATION" },
        { condition: "high stress", nodeId: "NODE_04_REASSURANCE" },
      ],
    },
    {
      id: "NODE_02_MOTIVATION",
      title: "Motivation Deep Dive",
      script:
        "What is it about this role that feels like a good fit for what you're looking for at this stage of your career?",
      options: [
        { condition: "coherent motivation", nodeId: "NODE_05_BACKGROUND" },
        { condition: "generic motivation", nodeId: "NODE_03_CLARIFICATION" },
        {
          condition: "overconfidence detected",
          nodeId: "NODE_06_SELF_AWARENESS",
        },
      ],
    },
    {
      id: "NODE_03_CLARIFICATION",
      title: "Clarification",
      script:
        "If you had to summarize your main motivation in one key idea, what would it be?",
      options: [
        { condition: "clarification successful", nodeId: "NODE_05_BACKGROUND" },
        { condition: "stress increases", nodeId: "NODE_04_REASSURANCE" },
        { condition: "confusion persists", nodeId: "NODE_07_DIFFICULTY" },
      ],
    },
    {
      id: "NODE_04_REASSURANCE",
      title: "Reassurance",
      script:
        "Take your time. There's no rush here. The goal is simply to get to know you better.",
      options: [
        { condition: "candidate recovers", nodeId: "NODE_05_BACKGROUND" },
        { condition: "stress remains", nodeId: "NODE_07_DIFFICULTY" },
      ],
    },
    // ─── Phase 2 — Background & Experience ───
    {
      id: "NODE_05_BACKGROUND",
      title: "Background & Experience",
      script:
        "Could you tell me about an experience or a project you worked on that you feel particularly proud of?",
      options: [
        { condition: "structured experience", nodeId: "NODE_08_TEAMWORK" },
        { condition: "too abstract", nodeId: "NODE_09_EXAMPLE_REQUEST" },
        {
          condition: "disorganized narrative",
          nodeId: "NODE_03_CLARIFICATION",
        },
      ],
    },
    {
      id: "NODE_06_SELF_AWARENESS",
      title: "Self-Awareness",
      script:
        "With some hindsight, what would you say is an area where you're still looking to improve professionally?",
      options: [
        { condition: "balanced self-analysis", nodeId: "NODE_08_TEAMWORK" },
        { condition: "avoidance", nodeId: "NODE_09_EXAMPLE_REQUEST" },
        { condition: "defensive posture", nodeId: "NODE_10_FEEDBACK" },
      ],
    },
    // ─── Phase 3 — Soft Skills & Stress Handling ───
    {
      id: "NODE_07_DIFFICULTY",
      title: "Facing Difficulty",
      script:
        "Have you ever been in a situation where you felt challenged or overwhelmed? How did you handle it?",
      options: [
        { condition: "mature handling", nodeId: "NODE_08_TEAMWORK" },
        { condition: "emotional overload", nodeId: "NODE_04_REASSURANCE" },
        { condition: "avoidance", nodeId: "NODE_10_FEEDBACK" },
      ],
    },
    {
      id: "NODE_08_TEAMWORK",
      title: "Teamwork",
      script:
        "How would you describe the way you usually work with others, especially in team-based environments?",
      options: [
        { condition: "collaborative posture", nodeId: "NODE_11_CONFLICT" },
        { condition: "individualistic posture", nodeId: "NODE_11_CONFLICT" },
        { condition: "unclear positioning", nodeId: "NODE_09_EXAMPLE_REQUEST" },
      ],
    },
    {
      id: "NODE_09_EXAMPLE_REQUEST",
      title: "Request for Example",
      script:
        "Could you give me a concrete example to illustrate what you just mentioned?",
      options: [
        { condition: "example provided", nodeId: "NODE_11_CONFLICT" },
        { condition: "still vague", nodeId: "NODE_10_FEEDBACK" },
      ],
    },
    {
      id: "NODE_10_FEEDBACK",
      title: "Feedback & Stress",
      script:
        "How do you usually react when you receive critical feedback on your work?",
      options: [
        { condition: "open to feedback", nodeId: "NODE_12_PROJECTION" },
        { condition: "defensive but stable", nodeId: "NODE_12_PROJECTION" },
        { condition: "fragility", nodeId: "NODE_04_REASSURANCE" },
      ],
    },
    {
      id: "NODE_11_CONFLICT",
      title: "Conflict Management",
      script:
        "Have you ever experienced a disagreement with someone you worked with? How did you approach that situation?",
      options: [
        { condition: "constructive handling", nodeId: "NODE_12_PROJECTION" },
        { condition: "conflict avoidance", nodeId: "NODE_12_PROJECTION" },
        { condition: "poor conflict management", nodeId: "NODE_10_FEEDBACK" },
      ],
    },
    // ─── Phase 4 — Projection & Values ───
    {
      id: "NODE_12_PROJECTION",
      title: "Projection",
      script:
        "How do you see yourself evolving over the next few years, professionally speaking?",
      options: [
        { condition: "clear projection", nodeId: "NODE_13_VALUES" },
        { condition: "uncertain projection", nodeId: "NODE_13_VALUES" },
      ],
    },
    {
      id: "NODE_13_VALUES",
      title: "Values & Expectations",
      script:
        "What matters most to you when it comes to your future work environment?",
      options: [
        { condition: "aligned values", nodeId: "NODE_14_CANDIDATE_QUESTIONS" },
        { condition: "generic values", nodeId: "NODE_14_CANDIDATE_QUESTIONS" },
      ],
    },
    // ─── Phase 5 — Closure ───
    {
      id: "NODE_14_CANDIDATE_QUESTIONS",
      title: "Candidate Questions",
      script:
        "Is there anything you'd like to ask or any point you'd like to discuss before we wrap up?",
      options: [
        { condition: "has questions", nodeId: "NODE_15_CLOSING" },
        { condition: "no questions", nodeId: "NODE_15_CLOSING" },
      ],
    },
    {
      id: "NODE_15_CLOSING",
      title: "Closing",
      script:
        "Thank you for this conversation. We'll be in touch soon. I wish you a very nice day.",
      options: [],
    },
  ],
};

// ─── Date Game — Café/bar cosy early date, 5 criteria overlay checkpoints ───
export const dateGameGraph: GraphStructure = {
  title: "Date Game",
  startImageUrl: "https://via.placeholder.com/150",
  prompt:
    "Café/bar cosy early date. She is calm, slightly ironic, never explicit about rules. Five criteria: No flexing, No alcohol, Emotionally mature, Can sing, Respectful.",
  startNodeId: "NODE_01_ARRIVAL",
  nodes: [
    // ─── NODE 01 — Arrival / Greeting (Respect soft) ───
    {
      id: "NODE_01_ARRIVAL",
      title: "Arrival / Greeting",
      script: "Hey. Hi. Nice to finally meet you. How are you doing?",
      options: [
        { condition: "polite, normal", nodeId: "NODE_02_SMALL_TALK" },
        { condition: "slightly awkward but OK", nodeId: "NODE_02_SMALL_TALK" },
        { condition: "rude / disrespectful", nodeId: "LOSE_RESPECT" },
      ],
    },
    // ─── NODE 02 — Small Talk Starter (Respect) ───
    {
      id: "NODE_02_SMALL_TALK",
      title: "Small Talk Starter",
      script: "So… how was your day today?",
      options: [
        { condition: "natural back-and-forth", nodeId: "NODE_03_INTERESTS" },
        { condition: "short / dry but not rude", nodeId: "NODE_03_INTERESTS" },
        { condition: "weird or inappropriate", nodeId: "LOSE_RESPECT" },
      ],
    },
    // ─── NODE 03 — Interests & Hobbies (Flexer first pass) ───
    {
      id: "NODE_03_INTERESTS",
      title: "Interests & Hobbies",
      script: "What do you usually like to do when you have free time?",
      options: [
        { condition: "balanced interests", nodeId: "NODE_04_CURIOSITY" },
        {
          condition: "slight flexing (borderline)",
          nodeId: "NODE_05_FLEX_FOLLOWUP",
        },
        { condition: "heavy flexing", nodeId: "LOSE_FLEXER" },
      ],
    },
    // ─── NODE 04 — Curiosity Check (Respect) ───
    {
      id: "NODE_04_CURIOSITY",
      title: "Curiosity Check",
      script: "And what about you, what do you enjoy the most about that?",
      options: [
        { condition: "asks questions back", nodeId: "NODE_06_LIFESTYLE" },
        { condition: "neutral", nodeId: "NODE_06_LIFESTYLE" },
        { condition: "self-centered", nodeId: "LOSE_RESPECT" },
      ],
    },
    // ─── NODE 05 — Flex Follow-Up (Flexer confirmation) [OVERLAY 1/5] ───
    {
      id: "NODE_05_FLEX_FOLLOWUP",
      title: "Flex Follow-Up",
      script: "That sounds intense. Do you ever just… switch off and relax?",
      toast: {
        message: "No flexing",
        type: "positive",
      },
      options: [
        {
          condition: "self-aware / laughs about it",
          nodeId: "NODE_06_LIFESTYLE",
        },
        { condition: "doubles down", nodeId: "LOSE_FLEXER" },
        { condition: "gets defensive", nodeId: "LOSE_FLEXER" },
      ],
    },
    // ─── NODE 06 — Lifestyle & Daily Habits (Alcohol soft foreshadowing) ───
    {
      id: "NODE_06_LIFESTYLE",
      title: "Lifestyle & Routine",
      script: "What does a typical week look like for you?",
      options: [
        { condition: "healthy / neutral habits", nodeId: "NODE_07_DRINK" },
        { condition: "alcohol-neutral mention", nodeId: "NODE_07_DRINK" },
        { condition: "alcohol-centered lifestyle", nodeId: "NODE_07_DRINK" },
      ],
    },
    // ─── NODE 07 — The Drink Moment (Alcohol, Respect) [OVERLAY 2/5] ───
    {
      id: "NODE_07_DRINK",
      title: "The Drink Moment",
      script: "I'm not sure what to get. You can choose for me.",
      toast: {
        message: "Doesn't drink alcohol",
        type: "positive",
      },
      options: [
        {
          condition: "non-alcoholic / asks preferences",
          nodeId: "NODE_08_PAST_EXPERIENCES",
        },
        {
          condition: "hesitates but adapts",
          nodeId: "NODE_08_PAST_EXPERIENCES",
        },
        { condition: "orders alcohol casually", nodeId: "LOSE_ALCOHOL" },
      ],
    },
    // ─── NODE 08 — Past Experiences / Relationships (Victim / Ex-drama) ───
    {
      id: "NODE_08_PAST_EXPERIENCES",
      title: "Past Experiences / Relationships",
      script:
        "Have you had any meaningful relationships or experiences that shaped you?",
      options: [
        { condition: "balanced, reflective", nodeId: "NODE_09_GROWTH" },
        { condition: "slight bitterness", nodeId: "NODE_10_AWKWARD" },
        { condition: "blames ex / victim speech", nodeId: "LOSE_VICTIM" },
      ],
    },
    // ─── NODE 09 — Growth & Self-Awareness (Victim confirmation) [OVERLAY 3/5] ───
    {
      id: "NODE_09_GROWTH",
      title: "Growth & Self-Awareness",
      script:
        "And looking back at that, what do you think you learned about yourself?",
      toast: {
        message: "Emotionally mature",
        type: "positive",
      },
      options: [
        { condition: "shows accountability", nodeId: "NODE_11_MUSIC" },
        { condition: "avoids responsibility", nodeId: "LOSE_VICTIM" },
      ],
    },
    // ─── NODE 10 — Awkward Reaction (Respect) ───
    {
      id: "NODE_10_AWKWARD",
      title: "Awkward Beat / Light Teasing",
      script: "Okay… that got a little deep for a first date.",
      options: [
        { condition: "laughs it off", nodeId: "NODE_11_MUSIC" },
        { condition: "uncomfortable but polite", nodeId: "NODE_11_MUSIC" },
        {
          condition: "defensive / passive-aggressive",
          nodeId: "LOSE_RESPECT",
        },
      ],
    },
    // ─── NODE 11 — Music / Fun Moment (Singing) ───
    {
      id: "NODE_11_MUSIC",
      title: "Music / Fun Moment",
      script: "Random question… are you into music at all?",
      options: [
        { condition: "into music", nodeId: "NODE_12_SINGING" },
        { condition: "neutral", nodeId: "NODE_12_SINGING" },
      ],
    },
    // ─── NODE 12 — Singing Test (Effort > talent) [OVERLAY 4/5] ───
    {
      id: "NODE_12_SINGING",
      title: "Singing Test",
      script: "So… could you sing something? Even just a few seconds.",
      toast: {
        message: "Can sing",
        type: "positive",
      },
      options: [
        {
          condition: "accepts and sings (even badly)",
          nodeId: "NODE_13_CHEMISTRY",
        },
        { condition: "refuses playfully", nodeId: "NODE_13_CHEMISTRY" },
        { condition: "refuses harshly / kills vibe", nodeId: "LOSE_SINGING" },
      ],
    },
    // ─── NODE 13 — Final Chemistry Check (Respect final) [OVERLAY 5/5] ───
    {
      id: "NODE_13_CHEMISTRY",
      title: "Final Chemistry Check",
      script: "I had a nice time tonight. How did you feel about it?",
      toast: {
        message: "Respectful",
        type: "positive",
      },
      options: [
        { condition: "calm, respectful, engaged", nodeId: "NODE_14_CLOSING" },
        { condition: "slightly awkward but OK", nodeId: "NODE_14_CLOSING" },
        { condition: "pushy / intense", nodeId: "LOSE_RESPECT" },
      ],
    },
    // ─── NODE 14 — Closing (WIN entry) ───
    {
      id: "NODE_14_CLOSING",
      title: "Closing",
      script: "Alright. I think that's a good place to stop.",
      options: [],
    },
    // ─── End states ───
    {
      id: "LOSE_RESPECT",
      title: "Lose (respect)",
      script: "Date ends awkwardly. She never explains why.",
      toast: { message: "Not respectful", type: "negative" },
      options: [],
    },
    {
      id: "LOSE_FLEXER",
      title: "Lose (flexer)",
      script: "Date ends awkwardly. She never explains why.",
      toast: { message: "Flexer detected", type: "negative" },
      options: [],
    },
    {
      id: "LOSE_ALCOHOL",
      title: "Lose (alcohol)",
      script: "Date ends awkwardly. She never explains why.",
      toast: { message: "Orders alcohol", type: "negative" },
      options: [],
    },
    {
      id: "LOSE_VICTIM",
      title: "Lose (victim)",
      script: "Date ends awkwardly. She never explains why.",
      toast: { message: "Ex-drama / victim mindset", type: "negative" },
      options: [],
    },
    {
      id: "LOSE_SINGING",
      title: "Lose (singing)",
      script: "Date ends awkwardly. She never explains why.",
      toast: { message: "Refuses to sing", type: "negative" },
      options: [],
    },
  ],
};

/** Registry of scenario graphs by slug for /play/[id] */
export const demoGraphs: Record<string, GraphStructure> = {
  interview: demoGraph,
  date: dateGameGraph,
};
