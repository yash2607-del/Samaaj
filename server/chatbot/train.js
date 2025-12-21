import fs from 'fs';
import path from 'path';
import natural from 'natural';

const dataPath = path.join(process.cwd(), 'chatbot', 'trainingData.json');
const outPath = path.join(process.cwd(), 'chatbot', 'classifier.json');

async function main() {
  const raw = fs.readFileSync(dataPath, 'utf8');
  const data = JSON.parse(raw);
  const classifier = new natural.BayesClassifier();

  for (const intent of data.intents) {
    for (const pattern of intent.patterns) {
      classifier.addDocument(pattern.toLowerCase(), intent.tag);
    }
  }

  console.log('Training classifier...');
  classifier.train();
  classifier.save(outPath, (err) => {
    if (err) {
      console.error('Failed to save classifier', err);
      process.exit(1);
    }
    console.log('Classifier saved to', outPath);
    process.exit(0);
  });
}

main().catch(err => { console.error(err); process.exit(1); });
