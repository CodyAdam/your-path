import type { GraphStructure } from "./graph-structure";

// Tech Behavior Interview — matches app/data/scenarios/interview.json + interview-video-prompts.json
export const demoGraph: GraphStructure = {
  title: "Tech Behavior Interview",
  startImageUrl: "/images/characters/interview-character.jpg",
  idleVideoUrl: "/videos/node-node-01-idle.mp4",
  prompt:
    "A professional job interview in a modern tech office. A confident female interviewer in business casual sits behind a clean desk with a laptop. She speaks directly to the camera as if the viewer is the candidate. Neutral lighting, corporate but friendly environment.",
  startNodeId: "node-01",
  nodes: [
    {
      id: "node-01",
      title: "Welcome & Icebreaker",
      videoUrl: "/videos/node-node-01-main.mp4",
      script:
        "The interviewer smiles warmly and gestures to the chair. She says: 'Welcome! Thanks for coming in today. Before we dive in, tell me a bit about yourself and what brought you here.'",
      options: [
        {
          condition:
            "Player gives a concise, relevant introduction covering their background and motivation for applying",
          nodeId: "node-02",
        },
        {
          condition:
            "Player rambles without focus, gives irrelevant personal details, or seems unprepared",
          nodeId: "node-02-skeptical",
        },
        {
          condition:
            "Player is arrogant, dismissive of the question, or shows no interest in the role",
          nodeId: "lose-attitude",
        },
      ],
      fallbackNodeId: "node-02",
    },
    {
      id: "node-02",
      title: "Leadership Challenge",
      videoUrl: "/videos/node-node-02-main.mp4",
      script:
        "She nods approvingly and leans forward. She says: 'Great. Tell me about a time you led a challenging project. What was the situation and what did you do?'",
      options: [
        {
          condition:
            "Player provides a specific example using STAR structure (Situation, Task, Action, Result) with clear leadership and impact",
          nodeId: "node-03-impressed",
        },
        {
          condition:
            "Player gives a vague or generic answer without specific details or clear personal contribution",
          nodeId: "node-03-probing",
        },
        {
          condition:
            "Player takes all credit, dismisses team contributions, or gives a clearly fabricated story",
          nodeId: "lose-credibility",
        },
      ],
      fallbackNodeId: "node-03-probing",
    },
    {
      id: "node-02-skeptical",
      title: "Redirect — Focus",
      videoUrl: "/videos/node-node-02-skeptical-main.mp4",
      script:
        "She tilts her head slightly, maintaining a professional smile. She says: 'Interesting. Let me ask you something more specific — can you walk me through a project you're most proud of?'",
      options: [
        {
          condition:
            "Player recovers with a clear, structured answer about a specific project with measurable outcomes",
          nodeId: "node-03-impressed",
        },
        {
          condition:
            "Player continues to be vague or unfocused but shows some relevant experience",
          nodeId: "node-03-probing",
        },
        {
          condition:
            "Player still can't provide any concrete examples or seems to be making things up",
          nodeId: "lose-credibility",
        },
      ],
      fallbackNodeId: "node-03-probing",
    },
    {
      id: "node-03-impressed",
      title: "Conflict Resolution",
      videoUrl: "/videos/node-node-03-impressed-main.mp4",
      script:
        "She's visibly engaged, taking notes. She says: 'That's impressive. Now, in that project or another — how did you handle disagreements or conflict within the team?'",
      options: [
        {
          condition:
            "Player describes a mature approach to conflict: active listening, finding compromise, focusing on the problem not the person",
          nodeId: "node-04",
        },
        {
          condition:
            "Player shows they avoid conflict entirely or escalate it rather than resolving it",
          nodeId: "node-04-concern",
        },
      ],
      fallbackNodeId: "node-04",
    },
    {
      id: "node-03-probing",
      title: "Digging Deeper",
      videoUrl: "/videos/node-node-03-probing-main.mp4",
      script:
        "She pauses, then says: 'I'd like to understand your approach better. Can you give me a specific example of a technical challenge you solved and walk me through your thought process?'",
      options: [
        {
          condition:
            "Player provides a clear technical example with structured problem-solving and explains their reasoning",
          nodeId: "node-04",
        },
        {
          condition:
            "Player gives a surface-level answer without demonstrating deep technical thinking",
          nodeId: "node-04-concern",
        },
        {
          condition:
            "Player can't provide any technical example or clearly lacks the required skills",
          nodeId: "lose-technical",
        },
      ],
      fallbackNodeId: "node-04-concern",
    },
    {
      id: "node-04",
      title: "Failure & Growth",
      videoUrl: "/videos/node-node-04-main.mp4",
      script:
        "She puts down her pen and looks directly at the candidate. She says: 'Tell me about a time you failed. What happened and what did you learn from it?'",
      options: [
        {
          condition:
            "Player shares a genuine failure, takes ownership, and clearly explains what they learned and how they grew",
          nodeId: "node-05",
        },
        {
          condition:
            "Player gives a disguised success story as a failure, or claims they've never really failed",
          nodeId: "node-05-skeptical",
        },
        {
          condition:
            "Player blames others entirely for the failure, shows no self-awareness or accountability",
          nodeId: "lose-attitude",
        },
      ],
      fallbackNodeId: "node-05",
    },
    {
      id: "node-04-concern",
      title: "Pressure Question",
      videoUrl: "/videos/node-node-04-concern-main.mp4",
      script:
        "She leans back slightly. She says: 'Let me put it differently. If you joined our team tomorrow and the main service went down, what would be your first steps?'",
      options: [
        {
          condition:
            "Player describes a calm, systematic approach: check monitoring, communicate with team, isolate the issue, prioritize",
          nodeId: "node-05",
        },
        {
          condition:
            "Player shows panic, no structure, or unrealistic answers that suggest lack of experience",
          nodeId: "lose-technical",
        },
      ],
      fallbackNodeId: "node-05",
    },
    {
      id: "node-05",
      title: "Why This Company",
      videoUrl: "/videos/node-node-05-main.mp4",
      script:
        "She smiles. She says: 'We're getting close to the end. Why do you want to work here specifically? What excites you about this role?'",
      options: [
        {
          condition:
            "Player shows genuine knowledge of the company, connects their skills to the role, and expresses authentic enthusiasm",
          nodeId: "node-06-closing",
        },
        {
          condition:
            "Player gives generic answers that could apply to any company, showing no research or real interest",
          nodeId: "node-06-closing-neutral",
        },
      ],
      fallbackNodeId: "node-06-closing",
    },
    {
      id: "node-05-skeptical",
      title: "Authenticity Check",
      videoUrl: "/videos/node-node-05-skeptical-main.mp4",
      script:
        "She raises an eyebrow slightly. She says: 'I appreciate the positivity, but I'm curious — what's something you genuinely struggled with and how did it change your approach?'",
      options: [
        {
          condition:
            "Player opens up with a real struggle, showing vulnerability and genuine growth",
          nodeId: "node-06-closing",
        },
        {
          condition:
            "Player continues to dodge, gives another non-answer, or remains inauthentic",
          nodeId: "lose-attitude",
        },
      ],
      fallbackNodeId: "node-06-closing",
    },
    {
      id: "node-06-closing",
      title: "Interview Success",
      videoUrl: "/videos/node-node-06-closing-main.mp4",
      script:
        "She closes her notebook and gives a warm, genuine smile. She says: 'This has been a great conversation. I'm impressed with your experience and how you think about problems. We'll be in touch very soon — I have a really good feeling about this.'",
      options: [],
    },
    {
      id: "node-06-closing-neutral",
      title: "Interview — On the Fence",
      videoUrl: "/videos/node-node-06-closing-neutral-main.mp4",
      script:
        "She nods politely. She says: 'Thank you for your time today. We have a few more candidates to meet, but we'll definitely be in touch with next steps.' Professional but non-committal.",
      options: [],
    },
    {
      id: "lose-attitude",
      title: "Interview Failed — Attitude",
      videoUrl: "/videos/node-lose-attitude-main.mp4",
      script:
        "She pauses, then closes her notebook. She says: 'Thank you for coming in. I think we're looking for a slightly different fit for this role. We appreciate your time.' Polite but final.",
      options: [],
    },
    {
      id: "lose-credibility",
      title: "Interview Failed — Credibility",
      videoUrl: "/videos/node-lose-credibility-main.mp4",
      script:
        "She stops writing and looks up. She says: 'I appreciate you coming in today. I'll be honest — I think there might be a gap between what we need and where you are right now. But I wish you the best.' Direct but respectful.",
      options: [],
    },
    {
      id: "lose-technical",
      title: "Interview Failed — Technical",
      videoUrl: "/videos/node-lose-technical-main.mp4",
      script:
        "She sets her pen down and sighs slightly. She says: 'Thank you for your time. The role requires a strong technical foundation and I think you'd benefit from more hands-on experience first. Let's keep in touch for the future.' Kind but clear.",
      options: [],
    },
  ],
};

// ─── Date Game — Café/bar cosy early date, 5 criteria overlay checkpoints ───
export const dateGameGraph: GraphStructure = {
  title: "Date Game",
  startImageUrl: "/images/characters/interview-character.jpg",
  idleVideoUrl: "/videos/date-idle.mp4",
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
