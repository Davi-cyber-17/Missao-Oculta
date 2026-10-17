'use strict';

/* =========================================================
   MISSÃO OCULTA — online (WebRTC via PeerJS) + modo local
   Apenas HTML, CSS e JS. Sem servidor próprio.
   O anfitrião (quem cria a sala) é a "autoridade" do jogo.
   ========================================================= */

const PREFIX = 'missaoculta-jogo-';
const MAX_PLAYERS = 10;

const WORD_DATABASE = {
  lugares: ["Cinema", "Praia", "Escola", "Hospital", "Futebol", "Biblioteca", "Supermercado", "Restaurante", "Aeroporto", "Academia", "Parque de Diversões", "Hotel"],
  comida: ["Pizza", "Hambúrguer", "Sushi", "Sorvete", "Lasanha", "Churrasco", "Pastel", "Chocolate", "Pipoca", "Açaí", "Coxinha", "Taco"],
  profissoes: ["Médico", "Professor", "Astronauta", "Bombeiro", "Policial", "Cozinheiro", "Programador", "Ator", "Piloto", "Dentista", "Arquiteto", "Jornalista"],
  pop: ["Harry Potter", "Marvel", "Star Wars", "Batman", "Minecraft", "Pokemon", "Stranger Things", "Barbie", "Mario", "Shrek", "Game of Thrones", "Matrix"],
  objetos: ["Celular", "Notebook", "Relógio", "Garrafa", "Espelho", "Mochila", "Cadeira", "Televisão", "Fone de Ouvido", "Chaveiro", "Guarda-chuva", "Óculos"]
};

const CATS = {
  all: '🔀 Todas as Categorias',
  lugares: '🏙️ Lugares & Locais',
  comida: '🍕 Comidas & Bebidas',
  profissoes: '💼 Profissões & Trabalhos',
  pop: '🍿 Filmes & Pop Culture',
  objetos: '📦 Objetos do Dia a Dia'
};

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

/* ---------- utilidades ---------- */
const $ = id => document.getElementById(id);
const rand = n => Math.floor(Math.random() * n);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};
const TOKEN = (() => {
  const mk = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  try { let t = sessionStorage.getItem('impostor-token'); if (!t) { t = mk(); sessionStorage.setItem('impostor-token', t); } return t; }
  catch (e) { return mk(); }
})();
const cleanName = s => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 16);

function genCode() {
  let c = '';
  for (let i = 0; i < 4; i++) c += CODE_CHARS[rand(CODE_CHARS.length)];
  return c;
}

function pickWord(category) {
  let pool = [];
  if (category === 'all') Object.values(WORD_DATABASE).forEach(c => pool.push(...c));
  else pool = WORD_DATABASE[category] || WORD_DATABASE.lugares;
  return pool[rand(pool.length)];
}

let toastTimer = null;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

let cur = 's-home';
function show(id) {
  cur = id;
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('hidden', s.id !== id));
}

/* Mantém a tela acesa durante a partida (quando o navegador permite) */
let wakeLock = null;
async function keepAwake() {
  try { if (navigator.wakeLock && !wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && mode) { wakeLock = null; keepAwake(); }
});

/* ---------- estado ---------- */
let mode = null;                       // 'local' | 'host' | 'guest'
let net = { peer: null, conn: null, active: false };
let G = null;                          // estado do anfitrião (autoridade)
let ME = freshME();                    // visão do cliente (vale para host e guest)
const L = { n: 4, idx: 0, imp: 0, word: '' };            // partida local
const LS = { category: 'all', time: 3, custom: '' };                 // configurações do modo local
let revealDone = () => {};

function freshME() {
  return { id: null, code: '', role: null, players: [], hostId: null, phase: 'lobby',
           settings: { category: 'all', time: 3 }, myVote: null, suggestions: 0, mySuggest: '' };
}

/* ---------- configurações (categoria + tempo) ---------- */
function mountSettings(el, obj, onChange) {
  el.innerHTML =
    '<div class="field"><label class="lbl">Categoria de palavras</label><select class="select">' +
    Object.entries(CATS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('') +
    '</select></div>' +
    '<div class="field" style="margin-top:1.25rem"><label class="lbl">Tempo de discussão</label><div class="grid4">' +
    [[2, '2 min'], [3, '3 min'], [5, '5 min'], [0, 'Sem tempo']]
      .map(([v, l]) => `<button type="button" class="timer-btn" data-time="${v}">${l}</button>`).join('') +
    '</div></div>';
  const sel = el.querySelector('select');
  const btns = [...el.querySelectorAll('.timer-btn')];
  const paint = () => btns.forEach(b => b.classList.toggle('active', +b.dataset.time === obj.time));
  sel.value = obj.category;
  sel.onchange = () => { obj.category = sel.value; if (onChange) onChange(); };
  btns.forEach(b => b.onclick = () => { obj.time = +b.dataset.time; paint(); if (onChange) onChange(); });
  paint();
}

/* ---------- cronômetro ---------- */
const T = { enabled: false, remaining: 0, running: false, h: null };

function timerSet(enabled, remaining, running) {
  clearInterval(T.h);
  T.enabled = enabled; T.remaining = remaining; T.running = running;
  renderTimer();
  if (enabled && running && remaining > 0) T.h = setInterval(timerTick, 1000);
}
function timerStop() { clearInterval(T.h); T.running = false; }

function timerTick() {
  T.remaining--;
  if (T.remaining <= 0) {
    T.remaining = 0; T.running = false; clearInterval(T.h);
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
  }
  renderTimer();
  // o anfitrião ressincroniza os convidados a cada 5s
  if (mode === 'host' && T.remaining % 5 === 0) broadcast({ t: 'timer', remaining: T.remaining, running: T.running }, true);
}

function renderTimer() {
  $('timer-box').classList.toggle('hidden', !T.enabled);
  const m = String(Math.floor(T.remaining / 60)).padStart(2, '0');
  const s = String(T.remaining % 60).padStart(2, '0');
  $('timer-display').textContent = `${m}:${s}`;
  $('timer-display').classList.toggle('danger', T.enabled && T.remaining === 0);
  $('timer-status').textContent =
    T.remaining === 0 ? '⏰ Tempo esgotado! Votem no impostor.' : (T.running ? 'Conversa liberada' : 'Tempo pausado');
  $('btn-toggle-timer').textContent = T.running ? 'Pausar tempo' : 'Continuar tempo';
  $('btn-toggle-timer').classList.toggle('hidden', !T.enabled || mode === 'guest');
  $('btn-toggle-timer').disabled = T.remaining === 0;
}

/* ---------- cartão do papel ---------- */
let cardShown = false;
function renderCard(visible) {
  cardShown = visible;
  const c = $('role-card'), r = ME.role;
  if (!visible || !r) {
    c.className = 'rolecard';
    $('card-icon').textContent = '🔒';
    $('card-text').textContent = 'Toque para ver';
    $('card-sub').textContent = 'Certifique-se de que ninguém está olhando.';
  } else if (r.impostor) {
    c.className = 'rolecard imp';
    $('card-icon').textContent = '🤫';
    $('card-text').textContent = 'VOCÊ É O IMPOSTOR!';
    $('card-sub').textContent = 'Tente descobrir a palavra sem que percebam!';
  } else {
    c.className = 'rolecard ok';
    $('card-icon').textContent = '💡';
    $('card-text').textContent = r.word;
    $('card-sub').textContent = 'Essa é a palavra secreta dos inocentes.';
  }
}
$('role-card').onclick = () => renderCard(!cardShown);
$('btn-reveal-done').onclick = () => { renderCard(false); revealDone(); };

/* ---------- resultado (comum) ---------- */
function showResult(m) {
  show('s-result');
  const box = $('result-box');
  const won = m.winner === 'inocentes';
  box.className = 'result center ' + (won ? 'win' : 'lose');
  $('result-title').textContent = won ? '🎉 Os inocentes venceram!' : '😈 O impostor venceu!';
  let d;
  if (won) d = `${m.accused} era realmente o Impostor!`;
  else if (m.tie) d = (m.noVotes ? 'Ninguém votou.' : 'Houve empate na votação.') + ` O Impostor era ${m.impostorName}.`;
  else d = `${m.accused} era inocente! O verdadeiro Impostor era ${m.impostorName}.`;
  const by = (m.suggestedBy && m.suggestedBy.length) ? ` (tema sugerido por ${m.suggestedBy.join(', ')})` : '';
  $('result-desc').textContent = `${d} A palavra secreta era: "${m.word}"${by}.`;

  const ul = $('tally');
  ul.classList.toggle('hidden', !m.tally);
  ul.innerHTML = '';
  (m.tally || []).forEach(t => {
    const li = document.createElement('li');
    li.className = 'pitem' + (t.impostor ? ' imp' : '');
    const a = document.createElement('span');
    a.textContent = (t.impostor ? '🤫 ' : '') + t.name;
    const b = document.createElement('span');
    b.className = 'pstat';
    b.textContent = `${t.count} voto${t.count === 1 ? '' : 's'}`;
    li.append(a, b);
    ul.append(li);
  });

  $('btn-again').classList.toggle('hidden', mode === 'guest');
  $('result-guest').classList.toggle('hidden', mode !== 'guest');
  $('btn-exit').classList.toggle('hidden', mode === 'local');
}

/* =========================================================
   MODO LOCAL (um só celular)
   ========================================================= */
mountSettings($('local-settings'), LS);

$('num-players').addEventListener('input', e => {
  L.n = parseInt(e.target.value, 10);
  $('num-players-val').textContent = L.n;
});

$('btn-local').onclick = () => { mode = 'local'; show('s-local'); };
$('btn-online').onclick = () => show('s-online');
$('btn-online-back').onclick = () => show('s-home');
$('btn-local-back').onclick = () => { mode = null; show('s-home'); };

/* palavra da rodada (modo local): quem a digita é o Jogador 1 e não é sorteado como impostor */
function renderLocalCustom() {
  const w = LS.custom;
  $('btn-lcustom-clear').classList.toggle('hidden', !w);
  $('lcustom-status').classList.toggle('hidden', !w);
  $('lcustom-status').textContent = w ? '✔ Palavra definida (oculta). Quem a digitou deve ser o Jogador 1, que não será sorteado como impostor.' : '';
  $('btn-lcustom-toggle').textContent = w ? '✍️ Alterar palavra da rodada' : '✍️ Definir palavra da rodada';
  $('in-lcustom-word').value = '';
}
$('btn-lcustom-toggle').onclick = () => {
  $('lcustom-panel').classList.toggle('hidden');
  if (!$('lcustom-panel').classList.contains('hidden')) $('in-lcustom-word').focus();
};
function saveLocalCustom() {
  const w = cleanWord($('in-lcustom-word').value);
  if (w.length < 2) return toast('Digite uma palavra com pelo menos 2 letras.');
  LS.custom = w;
  renderLocalCustom();
  $('lcustom-panel').classList.add('hidden');
  toast('Palavra da rodada definida!');
}
$('btn-lcustom-save').onclick = saveLocalCustom;
$('in-lcustom-word').addEventListener('keydown', e => { if (e.key === 'Enter') saveLocalCustom(); });
$('btn-lcustom-clear').onclick = () => {
  LS.custom = '';
  renderLocalCustom();
  $('lcustom-panel').classList.add('hidden');
  toast('Palavra removida. Será sorteada automaticamente.');
};

$('btn-local-start').onclick = () => {
  L.word = LS.custom || pickWord(LS.category);
  L.imp = LS.custom ? 1 + rand(L.n - 1) : rand(L.n);
  L.idx = 0;
  keepAwake();
  localPass();
};

function localPass() {
  $('pass-name').textContent = `Jogador ${L.idx + 1}`;
  show('s-pass');
}

$('btn-pass-ok').onclick = () => {
  ME.role = { impostor: L.idx === L.imp, word: L.word };
  $('reveal-label').textContent = `Jogador ${L.idx + 1}`;
  renderCard(true);
  revealDone = () => {
    ME.role = null;
    L.idx++;
    if (L.idx < L.n) localPass();
    else enterDiscussion({ enabled: LS.time > 0, remaining: LS.time * 60, running: LS.time > 0 });
  };
  show('s-reveal');
};

function enterLocalVote() {
  timerStop();
  show('s-vote');
  $('vote-sub').textContent = 'Selecione quem o grupo acha que é o Impostor:';
  $('vote-progress').textContent = '';
  $('btn-end-vote').classList.add('hidden');
  const list = $('vote-list');
  list.innerHTML = '';
  for (let i = 0; i < L.n; i++) {
    const b = document.createElement('button');
    b.className = 'votebtn';
    b.innerHTML = `<span>Jogador ${i + 1}</span><small>Votar</small>`;
    b.onclick = () => showResult({
      winner: i === L.imp ? 'inocentes' : 'impostor',
      accused: `Jogador ${i + 1}`, impostorName: `Jogador ${L.imp + 1}`,
      word: L.word, tie: false, tally: null
    });
    list.appendChild(b);
  }
}

/* =========================================================
   TELAS COMUNS (discussão / votação)
   ========================================================= */
function enterDiscussion(m) {
  show('s-disc');
  const canControl = mode !== 'guest';
  $('btn-go-vote').classList.toggle('hidden', !canControl);
  $('disc-guest').classList.toggle('hidden', canControl);
  $('btn-peek').classList.toggle('hidden', mode === 'local');
  $('peek-card').classList.add('hidden');
  timerSet(m.enabled, m.remaining, m.running);
}

let peekTimer = null;
$('btn-peek').onclick = () => {
  const p = $('peek-card');
  if (!p.classList.contains('hidden')) { p.classList.add('hidden'); return; }
  const r = ME.role;
  if (!r) return;
  p.className = 'peek' + (r.impostor ? ' imp' : '');
  p.textContent = r.impostor ? '🤫 Você é o IMPOSTOR' : `💡 Palavra: ${r.word}`;
  clearTimeout(peekTimer);
  peekTimer = setTimeout(() => p.classList.add('hidden'), 4000);
};

$('btn-toggle-timer').onclick = () => {
  if (mode === 'guest' || T.remaining === 0) return;
  timerSet(true, T.remaining, !T.running);
  if (mode === 'host') broadcast({ t: 'timer', remaining: T.remaining, running: T.running }, true);
};

$('btn-go-vote').onclick = () => {
  if (mode === 'local') enterLocalVote();
  else if (mode === 'host') hostGoVote();
};

function enterVote(mine) {
  timerStop();
  ME.myVote = mine == null ? null : mine;
  show('s-vote');
  $('vote-sub').textContent = 'Quem é o Impostor? Escolha um jogador:';
  $('btn-end-vote').classList.toggle('hidden', mode !== 'host');
  renderVoteList();
  refreshLive();
}

function renderVoteList() {
  const list = $('vote-list');
  list.innerHTML = '';
  ME.players.filter(p => p.id !== ME.id).forEach(p => {
    const b = document.createElement('button');
    b.className = 'votebtn' + (ME.myVote === p.id ? ' selected' : '');
    const n = document.createElement('span');
    n.textContent = p.name;
    const s = document.createElement('small');
    s.textContent = !p.connected ? 'offline' : (ME.myVote === p.id ? '✔ seu voto' : 'Votar');
    b.append(n, s);
    b.onclick = () => castVote(p.id);
    list.appendChild(b);
  });
}

function castVote(targetId) {
  ME.myVote = targetId;
  if (mode === 'host') hostVote('p0', targetId);
  else if (net.conn && net.conn.open) net.conn.send({ t: 'vote', target: targetId });
  renderVoteList();
}

$('btn-end-vote').onclick = () => { if (mode === 'host') hostFinishVote(); };

/* =========================================================
   ONLINE — mensagens recebidas pelo cliente (host e guest)
   ========================================================= */
function handleClientMsg(m) {
  if (!m || typeof m !== 'object') return;
  switch (m.t) {
    case 'welcome':
      ME.id = m.you;
      rejoin.tries = 0; setBanner('');
      break;
    case 'players': {
      const first = ME.players.length === 0;
      ME.players = m.list; ME.hostId = m.hostId; ME.phase = m.phase; ME.settings = m.settings; ME.suggestions = m.suggestions || 0;
      if (first && m.phase === 'lobby') showLobby();
      refreshLive();
      break;
    }
    case 'mysuggest':
      ME.mySuggest = m.word || '';
      renderSuggest();
      break;
    case 'lobby':
      ME.role = null; ME.myVote = null; ME.mySuggest = ''; timerStop();
      showLobby();
      break;
    case 'role':
      ME.role = { impostor: !!m.impostor, word: m.word };
      if (!m.silent) openReveal();
      break;
    case 'wait':
      showWaiting();
      break;
    case 'discussion':
      enterDiscussion(m);
      break;
    case 'timer':
      timerSet(true, m.remaining, m.running);
      break;
    case 'vote':
      enterVote(m.mine);
      break;
    case 'result':
      showResult(m);
      break;
    case 'error':
      leave(m.msg || 'Erro na sala.');
      break;
  }
}

function myName() {
  const p = ME.players.find(x => x.id === ME.id);
  return p ? p.name : '';
}

function renderPlayerList(ul, list, statusFn) {
  ul.innerHTML = '';
  list.forEach(p => {
    const li = document.createElement('li');
    li.className = 'pitem';
    const a = document.createElement('span');
    a.textContent = p.name + (p.id === ME.hostId ? ' 👑' : '') + (p.id === ME.id ? ' (você)' : '');
    const b = document.createElement('span');
    b.className = 'pstat';
    b.textContent = statusFn(p);
    li.append(a, b);
    ul.append(li);
  });
}

function refreshLive() {
  const list = ME.players;
  const online = list.filter(p => p.connected);

  $('lobby-count').textContent = list.length;
  renderPlayerList($('lobby-list'), list, p => p.connected ? '' : 'offline');

  const ready = online.filter(p => p.ready).length;
  $('wait-count').textContent = `${ready} de ${online.length} prontos`;
  renderPlayerList($('wait-list'), list, p => !p.connected ? '⚠️ offline' : (p.ready ? '✅ pronto' : '⏳ lendo…'));

  const voted = online.filter(p => p.voted).length;
  $('vote-progress').textContent = `${voted} de ${online.length} votaram`;

  const s = ME.settings;
  $('lobby-settings-guest').textContent = ME.suggestions
    ? `💡 Tema sorteado entre as sugestões • ${s.time ? s.time + ' min de discussão' : 'sem tempo'}`
    : `${CATS[s.category] || ''} • ${s.time ? s.time + ' min de discussão' : 'sem tempo'}`;
  renderSuggest();

  if (mode === 'host') {
    $('btn-start-online').disabled = online.length < 3;
    $('lobby-hint').textContent = online.length < 3 ? 'Mínimo de 3 jogadores para começar.' : '';
  }
  if (cur === 's-vote' && mode !== 'local') renderVoteList();
}

function showLobby() {
  show('s-lobby');
  $('room-code').textContent = ME.code;
  const host = mode === 'host';
  $('lobby-settings-host').classList.toggle('hidden', !host);
  $('lobby-settings-guest').classList.toggle('hidden', host);
  $('btn-start-online').classList.toggle('hidden', !host);
  $('btn-leave-lobby').textContent = host ? 'Encerrar sala' : 'Sair da sala';
  if (host) mountSettings($('lobby-settings-host'), G.settings, () => pushPlayers());
  else $('lobby-hint').textContent = 'Aguardando o anfitrião iniciar a partida…';
  refreshLive();
  keepAwake();
}

function openReveal() {
  $('reveal-label').textContent = myName();
  renderCard(false);
  revealDone = sendReady;
  show('s-reveal');
}

function sendReady() {
  if (mode === 'host') { G.players[0].ready = true; pushPlayers(); }
  else if (net.conn && net.conn.open) net.conn.send({ t: 'ready' });
  showWaiting();
}

function showWaiting() {
  show('s-wait');
  $('btn-start-disc').classList.toggle('hidden', mode !== 'host');
  $('wait-guest').classList.toggle('hidden', mode === 'host');
  refreshLive();
}

/* =========================================================
   ONLINE — lógica do anfitrião
   ========================================================= */
function playersMsg() {
  return {
    t: 'players', phase: G.phase, hostId: 'p0', settings: G.settings,
    suggestions: G.players.filter(p => p.connected && p.suggestion).length,
    list: G.players.map(p => ({ id: p.id, name: p.name, connected: p.connected, ready: !!p.ready, voted: p.vote != null }))
  };
}
function sendTo(p, msg) {
  if (p.id === 'p0') handleClientMsg(msg);
  else if (p.conn && p.conn.open) { try { p.conn.send(msg); } catch (e) {} }
}
function broadcast(msg, skipHost) {
  if (!G) return;
  G.players.forEach(p => { if (!(skipHost && p.id === 'p0')) sendTo(p, msg); });
}
function pushPlayers() { if (G) broadcast(playersMsg()); }

function sendStateTo(p) {
  sendTo(p, { t: 'welcome', you: p.id });
  sendTo(p, playersMsg());
  if (G.phase === 'lobby') { sendTo(p, { t: 'mysuggest', word: p.suggestion || '' }); return; }
  sendTo(p, { t: 'role', impostor: p.id === G.impostorId, word: G.word, silent: G.phase !== 'reveal' });
  if (G.phase === 'reveal' && p.ready) sendTo(p, { t: 'wait' });
  if (G.phase === 'discussion') sendTo(p, { t: 'discussion', enabled: T.enabled, remaining: T.remaining, running: T.running });
  if (G.phase === 'vote') sendTo(p, { t: 'vote', mine: p.vote });
  if (G.phase === 'result' && G.result) sendTo(p, G.result);
}

function createRoom(retry) {
  retry = retry || 0;
  const name = cleanName($('in-name').value);
  if (!name) return toast('Digite seu nome.');
  if (typeof Peer === 'undefined') return toast('Não foi possível carregar a biblioteca online. Verifique sua conexão.');
  store.set('impostor-name', name);

  const code = genCode();
  const peer = new Peer(PREFIX + code);
  net.peer = peer;
  $('btn-create').disabled = true;

  peer.on('open', () => {
    $('btn-create').disabled = false;
    mode = 'host'; net.active = true;
    G = {
      code, phase: 'lobby', settings: { category: 'all', time: 3 },
      players: [{ id: 'p0', name, conn: null, connected: true, ready: false, vote: null, suggestion: null }],
      nextId: 1, word: null, impostorId: null, result: null
    };
    ME = freshME();
    ME.code = code;
    sendTo(G.players[0], { t: 'welcome', you: 'p0' });
    pushPlayers();
    showLobby();
  });
  peer.on('connection', conn => {
    conn.on('data', m => hostRecv(conn, m));
    conn.on('close', () => hostDrop(conn));
    conn.on('error', () => hostDrop(conn));
  });
  peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) {} });
  peer.on('error', err => {
    if (err.type === 'unavailable-id' && retry < 5 && !net.active) {
      peer.destroy(); net.peer = null; createRoom(retry + 1);
    } else if (!net.active) {
      $('btn-create').disabled = false;
      try { peer.destroy(); } catch (e) {}
      net.peer = null;
      toast('Não foi possível criar a sala (' + err.type + ').');
    } else if (err.type !== 'peer-unavailable') {
      toast('Instabilidade de conexão (' + err.type + ').');
    }
  });
}

function rejectConn(conn, msg) {
  try { conn.send({ t: 'error', msg }); } catch (e) {}
  setTimeout(() => { try { conn.close(); } catch (e) {} }, 500);
}

function hostRecv(conn, m) {
  if (!G || !m || typeof m !== 'object') return;
  const p = G.players.find(x => x.conn === conn);

  if (m.t === 'join') {
    if (p) return;
    const name = cleanName(m.name);
    if (!name) return rejectConn(conn, 'Nome inválido.');
    const ex = G.players.find(x => x.name.toLowerCase() === name.toLowerCase());
    if (ex) {
      const same = ex.token && m.token === ex.token;
      if (ex.connected && !same) return rejectConn(conn, 'Já existe um jogador com esse nome na sala.');
      const old = ex.conn;
      ex.conn = conn; ex.connected = true;          // reconexão (assume o lugar da conexão antiga)
      if (old && old !== conn) {
        try { old.send({ t: 'error', msg: 'Sua vaga foi assumida por outra aba ou aparelho.' }); } catch (e) {}
        setTimeout(() => { try { old.close(); } catch (e) {} }, 300);
      }
      sendStateTo(ex); pushPlayers();
      return;
    }
    if (G.phase !== 'lobby') return rejectConn(conn, 'A partida já começou. Aguarde a próxima rodada.');
    if (G.players.length >= MAX_PLAYERS) return rejectConn(conn, `Sala cheia (máx. ${MAX_PLAYERS} jogadores).`);
    const np = { id: 'p' + G.nextId++, name, conn, connected: true, ready: false, vote: null, suggestion: null, token: m.token };
    G.players.push(np);
    sendStateTo(np); pushPlayers();
    return;
  }

  if (!p) return;
  if (m.t === 'ready') { p.ready = true; pushPlayers(); }
  else if (m.t === 'vote') hostVote(p.id, m.target);
  else if (m.t === 'suggest') hostSuggest(p.id, m.word);
}

function hostDrop(conn) {
  if (!G) return;
  const p = G.players.find(x => x.conn === conn);
  if (!p) return;
  if (G.phase === 'lobby') G.players = G.players.filter(x => x !== p);
  else { p.connected = false; p.conn = null; }
  pushPlayers();
  if (G.phase === 'vote') maybeFinishVote();
}

/* ---------- sugestão de tema (todos os jogadores) ---------- */
const cleanWord = s => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 30);

function renderSuggest() {
  const box = $('lobby-suggest');
  if (!box) return;
  const mine = ME.mySuggest;
  const online = ME.players.filter(p => p.connected).length;
  $('btn-suggest-clear').classList.toggle('hidden', !mine);
  $('btn-suggest').textContent = mine ? 'Alterar' : 'Enviar';
  let t = mine ? `✔ Sua sugestão: "${mine}" (os outros não veem). ` : 'Sugira um tema e ele entra no sorteio. ';
  t += ME.suggestions
    ? `${ME.suggestions} de ${online} jogador${online === 1 ? '' : 'es'} já sugeriram.`
    : 'Sem sugestões, o tema sai da categoria escolhida pelo anfitrião.';
  $('suggest-status').textContent = t;
}

function sendSuggest(word) {
  if (mode === 'host') hostSuggest('p0', word);
  else if (net.conn && net.conn.open) net.conn.send({ t: 'suggest', word });
}
function submitSuggest() {
  if (mode !== 'host' && mode !== 'guest') return;
  const w = cleanWord($('in-suggest').value);
  if (w.length < 2) return toast('Digite um tema com pelo menos 2 letras.');
  sendSuggest(w);
  $('in-suggest').value = '';
  toast('Sugestão enviada!');
}
$('btn-suggest').onclick = submitSuggest;
$('in-suggest').addEventListener('keydown', e => { if (e.key === 'Enter') submitSuggest(); });
$('btn-suggest-clear').onclick = () => { sendSuggest(''); toast('Sugestão removida.'); };

function hostSuggest(pid, word) {
  if (!G || G.phase !== 'lobby') return;
  const p = G.players.find(x => x.id === pid);
  if (!p) return;
  const w = cleanWord(word);
  p.suggestion = w.length >= 2 ? w : null;
  sendTo(p, { t: 'mysuggest', word: p.suggestion || '' });
  pushPlayers();
}

function hostStart() {
  const online = G.players.filter(p => p.connected);
  if (online.length < 3) return toast('São necessários pelo menos 3 jogadores.');
  // sorteia UM tema entre as sugestões dos jogadores; sem sugestões, usa a categoria
  const sugg = online.filter(p => p.suggestion);
  const chosen = sugg.length ? sugg[rand(sugg.length)] : null;
  G.word = chosen ? chosen.suggestion : pickWord(G.settings.category);
  // quem sugeriu o tema sorteado já conhece a palavra: não pode ser o impostor
  const key = chosen ? chosen.suggestion.toLowerCase() : null;
  const authors = chosen ? online.filter(p => p.suggestion && p.suggestion.toLowerCase() === key) : [];
  G.suggestedBy = authors.map(p => p.name);
  let pool = online.filter(p => !authors.includes(p));
  if (!pool.length) pool = online;
  G.impostorId = pool[rand(pool.length)].id;
  G.phase = 'reveal';
  G.result = null;
  G.players.forEach(p => { p.ready = false; p.vote = null; });
  G.players.forEach(p => {
    if (p.connected) sendTo(p, { t: 'role', impostor: p.id === G.impostorId, word: G.word, silent: false });
  });
  pushPlayers();
}
$('btn-start-online').onclick = hostStart;

function hostStartDiscussion() {
  const mins = G.settings.time;
  G.phase = 'discussion';
  broadcast({ t: 'discussion', enabled: mins > 0, remaining: mins * 60, running: mins > 0 });
  pushPlayers();
}
$('btn-start-disc').onclick = hostStartDiscussion;

function hostGoVote() {
  G.phase = 'vote';
  G.players.forEach(p => { p.vote = null; });
  broadcast({ t: 'vote', mine: null });
  pushPlayers();
}

function hostVote(pid, target) {
  if (!G || G.phase !== 'vote' || pid === target) return;
  const voter = G.players.find(p => p.id === pid);
  if (!voter || !G.players.some(p => p.id === target)) return;
  voter.vote = target;
  pushPlayers();
  maybeFinishVote();
}

function maybeFinishVote() {
  const online = G.players.filter(p => p.connected);
  if (online.length && online.every(p => p.vote != null)) hostFinishVote();
}

function hostFinishVote() {
  if (!G || G.phase !== 'vote') return;
  G.phase = 'result';
  const counts = {};
  G.players.forEach(p => { if (p.vote) counts[p.vote] = (counts[p.vote] || 0) + 1; });
  const tally = G.players
    .map(p => ({ name: p.name, count: counts[p.id] || 0, impostor: p.id === G.impostorId }))
    .sort((a, b) => b.count - a.count);
  const max = tally[0] ? tally[0].count : 0;
  const leaders = tally.filter(t => t.count === max);
  const tie = max === 0 || leaders.length > 1;
  const caught = !tie && leaders[0].impostor;
  const imp = G.players.find(p => p.id === G.impostorId);
  G.result = {
    t: 'result', winner: caught ? 'inocentes' : 'impostor', tie, noVotes: max === 0,
    accused: tie ? null : leaders[0].name, impostorName: imp.name, word: G.word, tally,
    suggestedBy: G.suggestedBy || []
  };
  broadcast(G.result);
  pushPlayers();
}

function hostNewGame() {
  G.players = G.players.filter(p => p.connected);
  G.phase = 'lobby';
  G.word = null; G.impostorId = null; G.result = null; G.suggestedBy = [];
  G.players.forEach(p => { p.ready = false; p.vote = null; p.suggestion = null; });   // sugestões valem só para uma rodada
  timerStop();
  broadcast({ t: 'lobby' });
  pushPlayers();
}

$('btn-again').onclick = () => {
  if (mode === 'local') { LS.custom = ''; renderLocalCustom(); show('s-local'); }   // a palavra vale só para uma rodada
  else if (mode === 'host') hostNewGame();
};

/* =========================================================
   ONLINE — entrar em uma sala
   ========================================================= */
let session = null;                       // { name, code } do convidado atual
const rejoin = { tries: 0, timer: null };
const MAX_REJOIN = 6;

function setBanner(text) {
  const el = $('conn-banner');
  el.textContent = text || '';
  el.classList.toggle('hidden', !text);
}

function joinRoom() {
  const name = cleanName($('in-name').value);
  const code = ($('in-code').value || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (!name) return toast('Digite seu nome.');
  if (code.length !== 4) return toast('Digite o código de 4 letras da sala.');
  if (typeof Peer === 'undefined') return toast('Não foi possível carregar a biblioteca online. Verifique sua conexão.');
  store.set('impostor-name', name);
  session = { name, code };
  rejoin.tries = 0;
  $('btn-join').disabled = true;
  connectGuest(false);
}

function connectGuest(retrying) {
  if (!session) return;
  const { name, code } = session;
  const peer = new Peer();
  net.peer = peer;
  let opened = false;
  const fail = msg => {
    if (net.peer !== peer) return;
    if (retrying || net.active) lost(); else leave(msg);
  };

  peer.on('open', () => {
    const conn = peer.connect(PREFIX + code, { reliable: true });
    net.conn = conn;
    const to = setTimeout(() => { if (!opened) fail('Não foi possível entrar na sala. Confira o código.'); }, 12000);
    conn.on('open', () => {
      opened = true; clearTimeout(to);
      mode = 'guest'; net.active = true;
      if (!retrying) { ME = freshME(); ME.code = code; }
      $('btn-join').disabled = false;
      conn.send({ t: 'join', name, token: TOKEN });
    });
    conn.on('data', handleClientMsg);
    conn.on('close', () => { clearTimeout(to); fail('A sala foi encerrada ou a conexão caiu.'); });
  });
  peer.on('error', e => {
    fail(e.type === 'peer-unavailable' ? 'Sala não encontrada. Confira o código.' : `Erro de conexão (${e.type}).`);
  });
}

/* Conexão caiu (tela bloqueada, troca de rede, aba em segundo plano): tenta voltar sozinho */
function lost() {
  if (!session) return;
  if (rejoin.tries >= MAX_REJOIN) return leave('A sala foi encerrada ou a conexão caiu.');
  rejoin.tries++;
  setBanner(`Reconectando… (${rejoin.tries}/${MAX_REJOIN})`);
  const old = net.peer;
  net.peer = null; net.conn = null; net.active = true;
  try { if (old) old.destroy(); } catch (e) {}
  clearTimeout(rejoin.timer);
  rejoin.timer = setTimeout(() => connectGuest(true), Math.min(1000 * rejoin.tries, 4000));
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (mode === 'host' && net.peer && net.peer.disconnected) { try { net.peer.reconnect(); } catch (e) {} }
  if (mode === 'guest' && session && !(net.conn && net.conn.open)) {
    clearTimeout(rejoin.timer);
    rejoin.tries = Math.min(rejoin.tries, 2);
    rejoin.timer = setTimeout(() => { if (net.peer) { try { net.peer.destroy(); } catch (e) {} net.peer = null; } connectGuest(true); }, 200);
  }
});

function leave(msg) {
  session = null; clearTimeout(rejoin.timer); rejoin.tries = 0; setBanner('');
  net.active = false;
  clearInterval(T.h);
  const p = net.peer;
  const wasHost = mode === 'host';
  if (wasHost && G) broadcast({ t: 'error', msg: 'O anfitrião encerrou a sala.' }, true);
  net = { peer: null, conn: null, active: false };
  setTimeout(() => { try { if (p) p.destroy(); } catch (e) {} }, wasHost ? 400 : 0);
  G = null; mode = null; ME = freshME();
  $('btn-create').disabled = false; $('btn-join').disabled = false;
  show('s-online');
  if (msg) toast(msg);
}

function leaveWithConfirm() {
  if (mode === 'host' && !confirm('Encerrar a sala para todos os jogadores?')) return;
  leave();
}
$('btn-leave-lobby').onclick = leaveWithConfirm;
$('btn-exit').onclick = leaveWithConfirm;

/* ---------- compartilhar convite ---------- */
$('btn-share').onclick = async () => {
  const url = `${location.origin}${location.pathname}?sala=${ME.code}`;
  const text = `Entre na minha sala do Jogo do Impostor! Código: ${ME.code}`;
  if (navigator.share) {
    try { await navigator.share({ title: 'Jogo do Impostor', text, url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(url); toast('Link copiado!'); }
  catch (e) { window.prompt('Copie o link da sala:', url); }
};

/* ---------- início ---------- */
$('btn-create').onclick = () => createRoom(0);
$('btn-join').onclick = joinRoom;
$('in-code').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''); });
$('in-code').addEventListener('keydown', e => { if (e.key === 'Enter') joinRoom(); });
$('in-name').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if ($('in-code').value.trim().length === 4) joinRoom(); else createRoom(0);
});

(function init() {
  $('in-name').value = store.get('impostor-name') || '';
  const sala = (new URLSearchParams(location.search).get('sala') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  if (sala) {
    $('in-code').value = sala;
    show('s-online');
    if (!$('in-name').value) $('in-name').focus();
  }
})();
