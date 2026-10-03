// Garde-fou de la base du bot Discord Celeste VD (MISSION-BOT-DISCORD-V2, P0, 2026-10-03).
// La base doit dire ce que dit le site en production (celestevtt.com) et la source de vérité Kickstarter.
// Usage : node verifier-base.mjs [fichiers en plus à balayer, ex. ../celeste-discord-bot/index.js]
// Sortie 0 = propre ; 1 = une phrase interdite est revenue ou un fait obligatoire a disparu.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const base = readdirSync(ici).filter((f) => f.endsWith('.md') && f !== 'README.md').map((f) => join(ici, f));
const fichiers = [...base, ...process.argv.slice(2)];

// Phrases fausses ou interdites — chacune avec sa raison (insensible à la casse).
const INTERDITS = [
  [/D&D|Dungeons?\s*&\s*Dragons/i, '« compatible 5E », jamais D&D (source de vérité v3.3)'],
  [/dungeon\s*master|\bDMs?\b/i, '« MJ » / « GM » / « Game Master », jamais DM (décision Game Master partout)'],
  [/\bTSR\b|propriétaire/i, 'ancienne réponse sur les règles « propriétaires »'],
  [/40\s*\$|\$\s*40\b/, 'ancien prix (le jeu est en $ CA : 55 / 69 / 99)'],
  [/19,99|29,99|19\.99|29\.99/, 'anciens prix de modules (Tyria et Reign of Blood sont inclus)'],
  [/~\s*400|400\s*sorts|400\s*spells/i, '377 sorts, pas ~400'],
  [/Gemma\s*4|AI\s*Studio|aistudio/i, 'Gemma passe par Ollama (le jeu ne branche pas Google AI Studio)'],
  [/OpenAI|\bGroq\b/i, 'le jeu prend Ollama et Claude seulement (providerSelector.ts)'],
  [/gratuite?s?\s+à\s+vie|free\s+for\s+life|Fondateurs/i, 'AstraLumen « gratuit à vie » INTERDIT (source de vérité §6)'],
  [/Anuire|Lathander|Spellplague|Tighmaevril|Nyanzaru|Vecna|Bhaal|Selûne|Moradin|Umberlee|Lolth|Spelljammer/i,
    'ancien nom de Wizards, renommé en 2.1.14'],
  [/carte\s+maîtresse|\bMMO\b/i, 'vision interne qui ne s\'écrit nulle part'],
];

// Faits qui doivent rester dans la base (au moins un fichier).
const OBLIGATOIRES = [
  [/377/, '377 sorts'],
  [/55\s*\$\s*CA/, 'early bird 55 $ CA'],
  [/99\s*\$\s*CA/, 'prix public 99 $ CA'],
  [/compatible\s+5E/i, '« compatible 5E »'],
  [/Ollama/, 'Ollama'],
  [/Claude/, 'Claude'],
  [/joueurs\s+jouent\s+gratuitement/i, 'seul le MJ paie'],
  [/Anuyse/, 'Anuyse'],
];

let fautes = 0;
for (const f of fichiers) {
  // Dans un fichier .js, on ne balaie que l'invite système (const SYSTEM = … ;) : c'est elle que le modèle lit.
  const brut = readFileSync(f, 'utf8');
  let texte = brut;
  if (f.endsWith('.js')) {
    const m = brut.match(/const SYSTEM =([\s\S]*?);\n/);
    if (!m) { fautes++; console.log(`INTROUVABLE ${f} — pas de « const SYSTEM = … ; »`); continue; }
    texte = m[1];
  }
  texte.split('\n').forEach((ligne, i) => {
    for (const [re, raison] of INTERDITS) {
      if (re.test(ligne)) {
        fautes++;
        console.log(`INTERDIT ${f.replace(ici + '/', '')}:${f.endsWith('.js') ? '(SYSTEM)' : i + 1} — ${raison}\n   ${ligne.trim().slice(0, 140)}`);
      }
    }
  });
}
const tout = base.map((f) => readFileSync(f, 'utf8')).join('\n');
for (const [re, quoi] of OBLIGATOIRES) {
  if (!re.test(tout)) {
    fautes++;
    console.log(`MANQUANT dans la base — ${quoi}`);
  }
}
console.log(fautes ? `\n${fautes} faute(s) — base REFUSÉE` : `base OK : ${fichiers.length} fichier(s), ${INTERDITS.length} interdits, ${OBLIGATOIRES.length} faits obligatoires`);
process.exit(fautes ? 1 : 0);
