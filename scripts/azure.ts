// Minimal Azure TTS client (REST). Runs locally only; the key never reaches the browser.
const KEY = process.env.AZURE_SPEECH_KEY;
const REGION = process.env.AZURE_SPEECH_REGION;

export const VOICES = ['zh-HK-HiuMaanNeural', 'zh-HK-WanLungNeural', 'zh-HK-HiuGaaiNeural'];

export async function synthesize(text: string, voice = VOICES[0]): Promise<Buffer> {
  if (!KEY || !REGION) throw new Error('AZURE_SPEECH_KEY / AZURE_SPEECH_REGION missing from .env');
  const ssml = `<speak version="1.0" xml:lang="zh-HK"><voice name="${voice}">${text}</voice></speak>`;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'canto-numbers',
      },
      body: ssml,
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    // Free tier allows ~20 requests/min: back off on 429.
    if (res.status === 429 && attempt < 6) {
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
      continue;
    }
    throw new Error(`Azure TTS ${res.status}: ${await res.text()}`);
  }
}
