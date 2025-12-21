import fs from 'fs';
import path from 'path';
import natural from 'natural';

const dataPath = path.join(process.cwd(), 'chatbot', 'trainingData.json');
const classifierPath = path.join(process.cwd(), 'chatbot', 'classifier.json');

let intentsData = null;
let classifier = null;

function loadIntents() {
  if (!intentsData) {
    intentsData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }
}

function loadClassifierSync() {
  if (classifier) return classifier;
  if (fs.existsSync(classifierPath)) {
    classifier = natural.BayesClassifier.restore(JSON.parse(fs.readFileSync(classifierPath, 'utf8')));
    return classifier;
  }
  // fallback: train on the fly
  const raw = fs.readFileSync(dataPath, 'utf8');
  const data = JSON.parse(raw);
  classifier = new natural.BayesClassifier();
  for (const intent of data.intents) {
    for (const p of intent.patterns) classifier.addDocument(p.toLowerCase(), intent.tag);
  }
  classifier.train();
  return classifier;
}

export async function respond(req, res) {
  try {
    loadIntents();
    const { text, role } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing text' });

    const clf = loadClassifierSync();
    const tag = clf.classify(String(text).toLowerCase());
    const intent = intentsData.intents.find(i => i.tag === tag);
    if (!intent) return res.json({ reply: "Sorry, I didn't get that." });

    const roleKey = (role && role.toLowerCase() === 'moderator') ? 'Moderator' : 'Citizen';
    const reply = intent.responses?.[roleKey] || intent.responses?.Citizen || intent.responses?.Moderator || '';
    // Support role-specific action mapping
    let action = null;
    if (intent.action) {
      if (typeof intent.action === 'string') action = intent.action;
      else if (typeof intent.action === 'object') {
        action = intent.action?.[roleKey] || intent.action?.Citizen || intent.action?.Moderator || null;
      }
    }

    return res.json({ intent: tag, reply, action: action || null });
  } catch (err) {
    console.error('Chatbot respond error', err);
    return res.status(500).json({ error: err.message });
  }
}

export default { respond };
