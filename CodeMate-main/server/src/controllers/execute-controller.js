require("dotenv").config()
const { main } = require("../execute");

const executeCode = async (req, res) => {
    const code = req.body.code;
    const language_id = req.body.language_id;
    const stdin = req.body.stdin;

    if (!code) {
        return res.status(400).json({ error: "Code is required" });
    }
    if (!language_id) {
        return res.status(400).json({ error: "Language ID is required" });
    }

    try {
        const { type, output } = await main(code, language_id, stdin);

        if (type === 'stdout') {
            res.status(200).json({ success: true, output });
        }
        else if (type === 'stderr') {
            res.status(200).json({ success: false, error: output });
        }
    }
    catch (error) {
        console.error("Error during code execution:", error.message || error);
        res.status(200).json({ success: false, error: error.message || "An error occurred during code execution" });
    }
};

const getLanguages = async (req, res) => {
  const localLanguages = [
    { id: "c", name: "C" },
    { id: "cpp", name: "C++" },
    { id: "java", name: "Java" },
    { id: "python", name: "Python" },
    { id: "javascript", name: "JavaScript" }
  ];

  return res.status(200).json({ result: localLanguages });
};

module.exports = {
    executeCode,
    getLanguages,
}