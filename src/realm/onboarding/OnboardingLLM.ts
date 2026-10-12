/**
 * Onboarding LLM — Sage NPC communication layer
 *
 * Uses Gemini Flash via the existing LLM proxy to interpret free-form
 * user responses and extract structured onboarding data.
 */

import { callLLMProxy } from '../../lib/llm-proxy';
import type { CharacterClass } from '../../rpg/engine/types';
import { logger } from '../../utils/logger';

// ── Types ────────────────────────────────────────

export type OnboardingScene =
  | 'awakening'
  | 'path_selection'
  | 'identity'
  | 'first_seed'
  | 'the_dream'
  | 'first_words'
  | 'reveal';

export type EsbiClass = 'E' | 'S' | 'B' | 'I';

export interface ExtractedOnboardingData {
  motivation: string;
  esbiClass: EsbiClass;
  characterClass: CharacterClass;
  characterName: string;
  habitName: string;
  habitCategory: string;
  goalTitle: string;
  goalDescription: string;
  journalContent: string;
  journalMood: number;
  wakeDescription?: string;
  procrastinatedTask?: string;
  habitTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  goalTimeframe?: string;
}

export interface SageResponse {
  sageReply: string;
  extractedData?: Partial<ExtractedOnboardingData>;
  sceneComplete?: boolean;
  classScores?: Record<CharacterClass, number>;
}

export interface ConversationMessage {
  role: 'sage' | 'user';
  text: string;
}

// ── System prompt builders ───────────────────────

export function buildAwakeningPrompt(exchangeCount: number): string {
  return `Você é o Sábio, um antigo guia sábio em um reino de RPG fantástico chamado LifeOS. Um novo aventureiro acabou de despertar. Guie-o através de 3 perguntas:

1. O que os motiva (extraia a palavra-chave "motivation": fitness, learning, business, wellness, creative, balance)
2. Como é um bom dia para eles (extraia "wakeDescription")
3. O que eles têm adiado (extraia "procrastinatedTask")

Responda como JSON:
{
  "sageReply": "sua resposta no personagem (1-3 frases, calorosa e mística) EM PORTUGUÊS",
  "extractedData": { "motivation": "...", "wakeDescription": "...", "procrastinatedTask": "..." },
  "sceneComplete": true or false
}

Sempre responda em Português do Brasil.
${exchangeCount < 1 ? 'Esta é a primeira troca. Extraia a motivação, depois pergunte sobre um bom dia. sceneComplete: false.'
  : exchangeCount < 2 ? 'Segunda troca. Extraia wakeDescription, depois pergunte o que eles têm adiado. sceneComplete: false.'
  : 'Terceira troca. Extraia procrastinatedTask. Defina sceneComplete: true.'}`;
}

export function buildIdentityPrompt(exchangeCount: number): string {
  return `Você é o Sábio, guiando um novo aventureiro no LifeOS. Você está ajudando-o a descobrir sua área de foco de vida.

As 5 áreas de foco (mapeadas para IDs de classe internos):
- warrior: Saúde & Fitness — construindo força, disciplina, treinamento físico
- mage: Educação & Pesquisa — aprendizado, leitura, buscas intelectuais
- ranger: Negócios & Finanças — estratégia, empreendedorismo, mercados
- healer: Bem-estar & Cura — atenção plena, equilíbrio emocional, espiritualidade
- engineer: Tecnologia & Criação — criando, projetando, projetos, código

Descubra a área de foco com base no que eles dizem sobre seus interesses/estilo de vida.
Extraia o ID de "characterClass" correspondente (warrior/mage/ranger/healer/engineer).
NÃO pergunte o nome — a UI de criação de personagem lida com isso separadamente.

Responda como JSON:
{
  "sageReply": "sua resposta no personagem reconhecendo o caminho deles (1-3 frases, calorosa) EM PORTUGUÊS",
  "extractedData": { "characterClass": "id da classe" },
  "classScores": { "warrior": 0.0, "mage": 0.0, "ranger": 0.0, "healer": 0.0, "engineer": 0.0 },
  "sceneComplete": false
}

Sempre responda em Português do Brasil.
${exchangeCount < 1 ? 'Primeira troca. Extraia characterClass da resposta deles. sceneComplete: false — o painel de criação de personagem cuidará do resto.'
  : 'Troca de acompanhamento. Se a classe já é conhecida, reconheça calorosamente. sceneComplete: false.'}`;
}

export function buildFirstSeedPrompt(exchangeCount: number): string {
  return `Você é o Sábio no LifeOS. O aventureiro escolheu sua classe. Agora ajude-o a plantar sua primeira semente — seu primeiro hábito diário.

Guie-o através de 2 perguntas:
1. Nomeie um hábito que querem criar (extraia "habitName" e "habitCategory": health/learning/finance/wellness/productivity/creative)
2. Quando querem fazer (extraia "habitTimeOfDay": morning/afternoon/evening/anytime)

Responda como JSON:
{
  "sageReply": "sua resposta no personagem (1-3 frases, encorajadora) EM PORTUGUÊS",
  "extractedData": { "habitName": "...", "habitCategory": "...", "habitTimeOfDay": "..." },
  "sceneComplete": true or false
}

Sempre responda em Português do Brasil.
${exchangeCount < 1 ? 'Primeira troca. Extraia habitName e habitCategory, depois pergunte sobre o horário. sceneComplete: false.'
  : 'Segunda troca. Extraia habitTimeOfDay. Defina sceneComplete: true.'}`;
}

export function buildTheDreamPrompt(exchangeCount: number): string {
  return `Você é o Sábio no LifeOS. O aventureiro plantou seu primeiro hábito. Agora ajude-o a visualizar seu sonho — seu primeiro objetivo.

Guie-o através de 2 perguntas:
1. Descreva um objetivo (extraia "goalTitle" e "goalDescription")
2. Para quando (extraia "goalTimeframe" como texto livre como "3 meses", "até o verão")

Responda como JSON:
{
  "sageReply": "sua resposta no personagem (1-3 frases, inspiradora) EM PORTUGUÊS",
  "extractedData": { "goalTitle": "...", "goalDescription": "...", "goalTimeframe": "..." },
  "sceneComplete": true or false
}

Sempre responda em Português do Brasil.
${exchangeCount < 1 ? 'Primeira troca. Extraia goalTitle e goalDescription, depois pergunte "para quando?". sceneComplete: false.'
  : 'Segunda troca. Extraia goalTimeframe. Defina sceneComplete: true.'}`;
}

export function buildFirstWordsPrompt(): string {
  return `Você é o Sábio no LifeOS. O aventureiro está prestes a escrever sua primeira entrada no diário — suas primeiras palavras na crônica do Realm. A Crônica aguarda suas primeiras palavras — elas não precisam ser grandiosas, apenas verdadeiras.

Reconheça o que eles escrevem calorosamente e reflita sobre o humor que você percebe. Extraia o humor deles em uma escala de 1-5 (1=lutando, 3=neutro, 5=prosperando) com base no tom.

Responda como JSON:
{
  "sageReply": "seu reconhecimento no personagem com reflexão de humor (2-3 frases) EM PORTUGUÊS",
  "extractedData": { "journalMood": 3 },
  "sceneComplete": true
}

Sempre defina sceneComplete como true — qualquer entrada de diário é válida.
Sempre responda em Português do Brasil.`;
}

function getSystemPrompt(scene: OnboardingScene, exchangeCount: number): string {
  switch (scene) {
    case 'awakening': return buildAwakeningPrompt(exchangeCount);
    case 'identity': return buildIdentityPrompt(exchangeCount);
    case 'first_seed': return buildFirstSeedPrompt(exchangeCount);
    case 'the_dream': return buildTheDreamPrompt(exchangeCount);
    case 'first_words': return buildFirstWordsPrompt();
    default: return '';
  }
}

// ── Main function ────────────────────────────────

/**
 * Parse and validate a raw LLM response string into a SageResponse.
 * Returns null if parsing fails.
 * @param scene - current scene (for guards)
 * @param exchangeCount - number of user messages so far (for guards)
 */
function parseSageResponse(rawContent: string, scene?: OnboardingScene, exchangeCount?: number): SageResponse | null {
  let jsonStr = rawContent.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  let parsed: SageResponse;
  try {
    parsed = JSON.parse(jsonStr) as SageResponse;
  } catch {
    // Fallback: extract first {...} block via regex
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]) as SageResponse;
      } catch {
        logger.warn('[OnboardingLLM] Regex-extracted JSON also invalid:', match[0].slice(0, 200));
        return null;
      }
    } else {
      logger.warn('[OnboardingLLM] Could not extract JSON from response:', rawContent.slice(0, 300));
      return null;
    }
  }

  // Validate required field
  if (!parsed.sageReply || typeof parsed.sageReply !== 'string') {
    logger.warn('[OnboardingLLM] Missing sageReply in parsed response:', JSON.stringify(parsed).slice(0, 200));
    return null;
  }

  // Clean up extracted class — ensure it's a valid CharacterClass
  if (parsed.extractedData?.characterClass) {
    const valid: CharacterClass[] = ['warrior', 'mage', 'ranger', 'healer', 'engineer'];
    if (!valid.includes(parsed.extractedData.characterClass)) {
      delete parsed.extractedData.characterClass;
    }
  }

  // Clamp mood
  if (parsed.extractedData?.journalMood != null) {
    parsed.extractedData.journalMood = Math.max(1, Math.min(5, Math.round(parsed.extractedData.journalMood)));
  }

  // Guard: identity scene should never complete on first exchange
  // (needs both class + name, which requires at least 2 exchanges)
  if (scene === 'identity' && (exchangeCount ?? 0) < 1 && parsed.sceneComplete) {
    logger.warn('[OnboardingLLM] Blocked premature sceneComplete on identity first exchange');
    parsed.sceneComplete = false;
  }

  return parsed;
}

export async function askSage(
  scene: OnboardingScene,
  userMessage: string,
  history: ConversationMessage[],
  extractedSoFar: Partial<ExtractedOnboardingData>,
): Promise<SageResponse | null> {
  if (scene === 'reveal') return null;

  const exchangeCount = history.filter(m => m.role === 'user').length;

  const messages: { role: string; content: string }[] = [
    { role: 'system', content: getSystemPrompt(scene, exchangeCount) },
  ];

  // Add context about what we've already extracted
  if (Object.keys(extractedSoFar).length > 0) {
    messages.push({
      role: 'system',
      content: `Already extracted from previous scenes: ${JSON.stringify(extractedSoFar)}`,
    });
  }

  // Add conversation history
  for (const msg of history) {
    messages.push({
      role: msg.role === 'sage' ? 'assistant' : 'user',
      content: msg.text,
    });
  }

  // Add latest user message
  messages.push({ role: 'user', content: userMessage });

  const isLocalMode = import.meta.env.VITE_USE_LOCAL_API === 'true';
  const callOptions = {
    format: 'json' as const,
    timeoutMs: 25000,
    provider: isLocalMode ? 'groq' : 'openrouter',
    model: isLocalMode ? 'openai/gpt-oss-120b' : 'google/gemini-2.0-flash-001',
  };

  // Attempt with one internal retry (callLLMProxy already retries on non-timeout errors,
  // but we also retry at the askSage level for parse failures)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      logger.info(`[OnboardingLLM] askSage attempt=${attempt + 1} scene=${scene} exchangeCount=${exchangeCount}`);
      const response = await callLLMProxy(messages, callOptions);

      const parsed = parseSageResponse(response.content, scene, exchangeCount);
      if (parsed) {
        logger.info(`[OnboardingLLM] askSage success on attempt ${attempt + 1}`);
        return parsed;
      }

      // Parse failed — if first attempt, retry
      if (attempt === 0) {
        logger.warn('[OnboardingLLM] Parse failed on attempt 1, retrying...');
        continue;
      }

      logger.warn('[OnboardingLLM] Parse failed on attempt 2, giving up');
      return null;
    } catch (err) {
      logger.warn(`[OnboardingLLM] askSage attempt ${attempt + 1} threw:`, err);
      if (attempt === 0) {
        // Wait briefly before retry
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      return null;
    }
  }

  return null;
}
