// ── ElevenLabs Voice Service ─────────────────────────────
export const RACHEL_ID  = 'EXAVITQu4vr4xnSDxMaL';
export const DANIEL_ID  = 'onwK4e9ZLuTAKqWW03F9';
export const MATILDA_ID = 'XrExE9yKIg1WjnnlVkGX'; // Premium
export const LIAM_ID    = 'TX3LPaxmHKxFdv7VOQHJ'; // Premium

export const VOICES = [
  { id: RACHEL_ID,  name: 'Rachel',  desc: 'Warm, Clear · Female',            premium: false },
  { id: DANIEL_ID,  name: 'Daniel',  desc: 'Steady · Broadcaster Male',       premium: false },
  { id: MATILDA_ID, name: 'Matilda', desc: 'Expressive · Australian Female',  premium: true  },
  { id: LIAM_ID,    name: 'Liam',    desc: 'Dynamic · Young Male',            premium: true  },
];

class VoiceService {
  constructor() {
    this.source = null;
    this.ctx = null;
    this.playing = false;
    this.onStart = null;
    this.onEnd = null;
    this.onWord = null;
  }

  get apiKey() { return localStorage.getItem('aria_el_key') || import.meta.env.VITE_ELEVENLABS_API_KEY || ''; }
  get voiceId() { return localStorage.getItem('aria_voice_id') || import.meta.env.VITE_ELEVENLABS_VOICE_ID || RACHEL_ID; }

  stop() {
    if (this.source) { try { this.source.stop(); } catch {} this.source = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    this.playing = false;
    this.onEnd?.();
  }

  async speak(text, lang = 'en') {
    this.stop();
    if (!text) return;
    this.onStart?.();
    this.playing = true;

    if (this.apiKey) {
      try { await this._speakEL(text); return; }
      catch (e) { console.warn('EL fallback:', e.message); }
    }
    await this._speakWeb(text, lang);
  }

  async _speakEL(text) {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream`, {
      method: 'POST',
      headers: { 'xi-api-key': this.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text, model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.55, similarity_boost: 0.85, style: 0.1, use_speaker_boost: true },
      }),
    });
    if (!res.ok) throw new Error(`EL ${res.status}`);
    const buf = await res.arrayBuffer();
    if (!this.ctx || this.ctx.state === 'closed') this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    const audio = await this.ctx.decodeAudioData(buf);
    this.source = this.ctx.createBufferSource();
    this.source.buffer = audio;
    this.source.connect(this.ctx.destination);
    this.source.start(0);
    this.playing = true;
    return new Promise(resolve => {
      this.source.onended = () => { this.playing = false; this.onEnd?.(); resolve(); };
    });
  }

  _speakWeb(text, lang = 'en') {
    return new Promise(resolve => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'sw' ? 'sw-KE' : 'en-US';
      u.rate = 0.88; u.pitch = 0.95; u.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const pick = voices.find(v => v.lang.startsWith('en') && /male|google/i.test(v.name))
        || voices.find(v => v.lang.startsWith('en'));
      if (pick) u.voice = pick;
      u.onend = () => { this.playing = false; this.onEnd?.(); resolve(); };
      u.onerror = () => { this.playing = false; this.onEnd?.(); resolve(); };
      window.speechSynthesis.speak(u);
    });
  }

  briefing(user, reminders, lang = 'en') {
    const h = new Date().getHours();
    const grEn = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const grSw = h < 12 ? 'Habari za asubuhi' : h < 17 ? 'Habari za mchana' : 'Habari za jioni';
    const name = user.name.split(' ')[0];
    const top = reminders.slice(0, 4);

    if (lang === 'sw') {
      let t = `${grSw}, ${name}! Mimi ni ARIA. `;
      if (!top.length) return t + 'Huna vikumbusho leo. Siku njema!';
      t += `Una vikumbusho ${top.length} leo. `;
      top.forEach((r, i) => {
        const time = new Date(r.dateTime).toLocaleTimeString('sw-KE', { hour: 'numeric', minute: '2-digit' });
        t += `${i+1}. ${r.title}, saa ${time}. `;
      });
      return t + 'Nitakusaidia kukumbuka kila kitu. Siku njema!';
    }

    let t = `${grEn}, ${name}! I'm ARIA, your AI assistant. `;
    if (!top.length) return t + "Your schedule is clear today. Have a productive day!";
    t += `You have ${top.length} item${top.length > 1 ? 's' : ''} on your schedule. `;
    top.forEach((r, i) => {
      const time = new Date(r.dateTime).toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' });
      t += `${i+1}. ${r.title}, at ${time}. `;
    });
    return t + "I'll keep you on track. Let's have a great day.";
  }
}

let _svc = null;
export const voice = () => { if (!_svc) _svc = new VoiceService(); return _svc; };
