const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

const llm = {
  async invoke(input) {
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: String(input || ""),
        },
      ],
      temperature: 0.3,
    });

    return {
      content: completion.choices?.[0]?.message?.content || "",
    };
  },
};

module.exports = { llm };
