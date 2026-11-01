'use strict';

/* =========================================================
   MISSÃO OCULTA — online (WebRTC via PeerJS) + modo local
   Apenas HTML, CSS e JS. Sem servidor próprio.
   O anfitrião (quem cria a sala) é a "autoridade" do jogo.
   ========================================================= */

const PREFIX = 'missaoculta-jogo-';
const MAX_PLAYERS = 50;

const WORD_DATABASE = {
  lugares: ["Cinema", "Praia", "Escola", "Hospital", "Estádio de Futebol", "Biblioteca", "Supermercado", "Restaurante", "Aeroporto", "Academia", "Parque de Diversões", "Hotel", "Igreja", "Zoológico", "Museu", "Shopping", "Padaria", "Farmácia", "Banco", "Rodoviária", "Teatro", "Circo", "Fazenda", "Cemitério", "Prisão", "Delegacia", "Posto de Gasolina", "Lavanderia", "Salão de Beleza", "Barbearia", "Piscina", "Ponte", "Castelo", "Universidade", "Acampamento", "Praça", "Feira", "Cassino", "Lanchonete", "Tribunal"],
  comida: ["Pizza", "Hambúrguer", "Sushi", "Sorvete", "Lasanha", "Churrasco", "Pastel", "Chocolate", "Pipoca", "Açaí", "Coxinha", "Taco", "Feijoada", "Brigadeiro", "Pão de Queijo", "Macarrão", "Strogonoff", "Omelete", "Panqueca", "Bolo", "Pudim", "Salada", "Sopa", "Hot Dog", "Batata Frita", "Café", "Suco de Laranja", "Refrigerante", "Leite", "Vitamina", "Milkshake", "Chá", "Água de Coco", "Pamonha", "Tapioca", "Cuscuz", "Moqueca", "Esfiha", "Kibe", "Empadão", "Queijo", "Ovo Frito", "Arroz com Feijão", "Mel", "Pão Francês", "Churros", "Waffle", "Donut", "Algodão Doce", "Maçã do Amor"],
  profissoes: ["Médico", "Professor", "Astronauta", "Bombeiro", "Policial", "Cozinheiro", "Programador", "Ator", "Piloto", "Dentista", "Arquiteto", "Jornalista", "Advogado", "Engenheiro", "Pedreiro", "Mecânico", "Eletricista", "Encanador", "Padeiro", "Açougueiro", "Fotógrafo", "Cantor", "Veterinário", "Enfermeiro", "Motorista", "Carteiro", "Garçom", "Barista", "Cabeleireiro", "Jardineiro", "Pintor", "Escritor", "Juiz", "Detetive", "Cientista", "Palhaço", "Mágico", "Youtuber", "Streamer", "Salva-vidas", "Agricultor", "Faxineiro"],
  pop: ["Harry Potter", "Marvel", "Star Wars", "Batman", "Minecraft", "Pokémon", "Stranger Things", "Barbie", "Mario", "Shrek", "Game of Thrones", "Matrix", "Homem-Aranha", "Titanic", "Frozen", "O Rei Leão", "Toy Story", "Vingadores", "Senhor dos Anéis", "Jurassic Park", "Avatar", "Naruto", "Dragon Ball", "Turma da Mônica", "Chaves", "Bob Esponja", "Os Simpsons", "Mickey Mouse", "Sonic", "Zelda", "Fortnite", "Among Us", "Free Fire", "Roblox", "Squid Game", "Procurando Nemo", "Mulher-Maravilha", "Coringa", "Pantera Negra", "Velozes e Furiosos"],
  objetos: ["Celular", "Notebook", "Relógio", "Garrafa", "Espelho", "Mochila", "Cadeira", "Televisão", "Fone de Ouvido", "Chaveiro", "Guarda-chuva", "Óculos", "Carteira", "Chave", "Tesoura", "Caneta", "Lápis", "Caderno", "Borracha", "Régua", "Vassoura", "Escova de Dentes", "Pente", "Travesseiro", "Cobertor", "Lanterna", "Pilha", "Controle Remoto", "Ventilador", "Geladeira", "Microondas", "Panela", "Garfo", "Faca", "Colher", "Copo", "Prato", "Martelo", "Chave de Fenda", "Bola", "Vela", "Fósforo", "Cadeado", "Moeda", "Balão", "Sacola", "Toalha"],
  animais: ["Cachorro", "Gato", "Leão", "Elefante", "Girafa", "Macaco", "Cobra", "Jacaré", "Tubarão", "Golfinho", "Baleia", "Pinguim", "Urso", "Lobo", "Raposa", "Coelho", "Cavalo", "Vaca", "Porco", "Galinha", "Pato", "Ovelha", "Cabra", "Zebra", "Tigre", "Onça", "Capivara", "Tartaruga", "Sapo", "Borboleta", "Abelha", "Formiga", "Aranha", "Águia", "Coruja", "Papagaio", "Tucano", "Canguru", "Coala", "Panda", "Hipopótamo", "Rinoceronte", "Camelo", "Polvo", "Caranguejo", "Morcego", "Camaleão"],
  esportes: ["Futebol", "Basquete", "Vôlei", "Natação", "Tênis", "Judô", "Boxe", "Surfe", "Skate", "Ciclismo", "Corrida", "Ginástica", "Xadrez", "Handebol", "Rúgbi", "Golfe", "Beisebol", "Karatê", "Capoeira", "Escalada", "Esqui", "Patinação", "Remo", "Hóquei", "Futsal", "Atletismo", "Salto com Vara", "Arco e Flecha", "Esgrima", "Boliche", "Sinuca", "Dardos", "Pingue-Pongue", "Badminton", "Maratona", "Triatlo"],
  paises: ["Brasil", "Argentina", "Japão", "Itália", "França", "Egito", "Canadá", "Austrália", "Portugal", "México", "China", "Índia", "Rússia", "Alemanha", "Espanha", "Inglaterra", "Estados Unidos", "Chile", "Peru", "Colômbia", "Suíça", "Grécia", "Turquia", "Coreia do Sul", "África do Sul", "Paris", "Londres", "Nova York", "Tóquio", "Rio de Janeiro", "São Paulo", "Roma", "Veneza", "Dubai", "Las Vegas", "Hollywood", "Amazônia", "Cataratas do Iguaçu", "Machu Picchu", "Torre Eiffel"],
  natureza: ["Floresta", "Deserto", "Ilha", "Montanha", "Rio", "Lago", "Oceano", "Cachoeira", "Caverna", "Vulcão", "Geleira", "Pântano", "Savana", "Selva", "Recife de Coral", "Chuva", "Neve", "Terremoto", "Furacão", "Arco-íris", "Trovão", "Raio", "Neblina", "Tsunami", "Tempestade", "Tornado", "Seca", "Enchente", "Sol", "Lua", "Estrelas", "Nuvem", "Vento", "Orvalho", "Areia", "Pedra", "Cogumelo", "Girassol", "Rosa", "Cacto", "Bambu", "Palmeira"],
  tecnologia: ["Wi-Fi", "Bluetooth", "Robô", "Drone", "Inteligência Artificial", "Videogame", "Joystick", "Teclado", "Mouse", "Monitor", "Impressora", "Câmera", "Satélite", "Antena", "Bateria", "Carregador", "Pen Drive", "Aplicativo", "Rede Social", "Emoji", "Senha", "Hacker", "Vírus", "Site", "E-mail", "Podcast", "Streaming", "Realidade Virtual", "Smartwatch", "Tablet", "QR Code", "GPS", "Calculadora", "Servidor", "Código", "Jogo Online"],
  musica: ["Violão", "Guitarra", "Bateria", "Piano", "Violino", "Flauta", "Saxofone", "Trompete", "Acordeão", "Cavaquinho", "Pandeiro", "Tambor", "Microfone", "Harpa", "Xilofone", "Samba", "Funk", "Sertanejo", "Rock", "Pagode", "Forró", "Rap", "Ópera", "Orquestra", "Coral", "Karaokê", "DJ", "Maestro", "Banda", "Disco de Vinil", "Show de Rock"],
  transporte: ["Carro", "Ônibus", "Metrô", "Trem", "Avião", "Helicóptero", "Navio", "Barco", "Bicicleta", "Moto", "Caminhão", "Ambulância", "Táxi", "Patinete", "Balão de Ar Quente", "Submarino", "Foguete", "Jet Ski", "Trator", "Trenó", "Carroça", "Teleférico", "Bonde", "Van", "Caminhonete", "Kart", "Barco a Vela", "Lancha", "Ônibus Espacial", "Carro de Bombeiro"],
  roupas: ["Camiseta", "Calça Jeans", "Vestido", "Saia", "Bermuda", "Moletom", "Jaqueta", "Casaco", "Terno", "Gravata", "Meia", "Tênis", "Chinelo", "Sandália", "Bota", "Sapato", "Boné", "Chapéu", "Gorro", "Cachecol", "Luvas", "Cinto", "Óculos de Sol", "Biquíni", "Sunga", "Pijama", "Uniforme", "Fantasia", "Avental", "Colar", "Pulseira", "Anel", "Brinco", "Lenço", "Bolsa"],
  casa: ["Cozinha", "Banheiro", "Quarto", "Sala de Estar", "Garagem", "Quintal", "Varanda", "Sótão", "Porão", "Escada", "Janela", "Porta", "Telhado", "Chuveiro", "Privada", "Pia", "Banheira", "Fogão", "Máquina de Lavar", "Aspirador de Pó", "Sofá", "Cama", "Armário", "Estante", "Mesa de Jantar", "Tapete", "Cortina", "Lustre", "Campainha", "Portão", "Churrasqueira", "Rede", "Varal", "Despensa", "Lareira", "Escrivaninha"],
  escola: ["Matemática", "Português", "História", "Geografia", "Ciências", "Educação Física", "Inglês", "Artes", "Química", "Física", "Biologia", "Recreio", "Prova", "Lição de Casa", "Quadro Negro", "Giz", "Diretor", "Merenda", "Formatura", "Boletim", "Vestibular", "Apostila", "Lousa", "Sala de Aula", "Intervalo", "Trabalho em Grupo", "Nota", "Reprovação", "Cola", "Excursão", "Gincana", "Feira de Ciências"],
  festas: ["Aniversário", "Natal", "Ano Novo", "Carnaval", "Páscoa", "Halloween", "Festa Junina", "Casamento", "Chá de Bebê", "Dia dos Namorados", "Dia das Mães", "Dia dos Pais", "Réveillon", "Bolo de Aniversário", "Presente", "Confete", "Serpentina", "Fogos de Artifício", "Piñata", "Quadrilha", "Fogueira", "Papai Noel", "Árvore de Natal", "Ovo de Páscoa", "Baile", "Balada", "Piquenique", "Amigo Secreto"],
  corpo: ["Coração", "Cérebro", "Pulmão", "Estômago", "Fígado", "Rim", "Osso", "Músculo", "Pele", "Cabelo", "Unha", "Dente", "Língua", "Olho", "Nariz", "Orelha", "Joelho", "Cotovelo", "Tornozelo", "Umbigo", "Barriga", "Costas", "Pescoço", "Ombro", "Pé", "Mão", "Dedo", "Sangue", "Esqueleto", "Coluna"],
  fantasia: ["Dragão", "Unicórnio", "Fada", "Bruxa", "Mago", "Vampiro", "Lobisomem", "Zumbi", "Fantasma", "Sereia", "Gigante", "Duende", "Elfo", "Anão", "Troll", "Ogro", "Fênix", "Minotauro", "Centauro", "Gênio da Lâmpada", "Varinha Mágica", "Poção", "Espada", "Escudo", "Castelo Mal-Assombrado", "Tesouro", "Pirata", "Cavaleiro", "Princesa", "Rei", "Rainha", "Ninja", "Samurai", "Super-Herói", "Vilão", "Alienígena", "Zeus", "Hércules"],
  brasil: ["Saci-Pererê", "Curupira", "Boto Cor-de-Rosa", "Mula sem Cabeça", "Iara", "Cuca", "Cristo Redentor", "Pão de Açúcar", "Copacabana", "Pantanal", "Lençóis Maranhenses", "Fernando de Noronha", "Maracanã", "Pelé", "Santos Dumont", "Guaraná", "Caipirinha", "Chimarrão", "Jabuticaba", "Caju", "Mandioca", "Maracatu", "Frevo", "Berimbau", "Arraiá", "Cangaceiro", "Gaúcho", "Jangada", "Axé", "Lampião", "Literatura de Cordel", "Arara", "Mico-Leão-Dourado", "Escola de Samba", "Futebol de Várzea"],
  espaco: ["Marte", "Júpiter", "Saturno", "Vênus", "Mercúrio", "Netuno", "Urano", "Plutão", "Via Láctea", "Galáxia", "Buraco Negro", "Cometa", "Asteroide", "Meteoro", "Eclipse", "Constelação", "Telescópio", "Estação Espacial", "OVNI", "Big Bang", "Gravidade", "Átomo", "Microscópio", "Laboratório", "Fórmula", "DNA", "Dinossauro", "Fóssil", "Eletricidade", "Magnetismo", "Bússola"]
};

const CATS = {
  all: '🔀 Todas as Categorias',
  lugares: '🏙️ Lugares & Locais',
  comida: '🍕 Comidas & Bebidas',
  profissoes: '💼 Profissões & Trabalhos',
  pop: '🍿 Filmes & Pop Culture',
  objetos: '📦 Objetos do Dia a Dia',
  animais: '🐾 Animais',
  esportes: '⚽ Esportes & Jogos',
  paises: '🌍 Países & Cidades',
  natureza: '🌿 Natureza & Clima',
  tecnologia: '💻 Tecnologia & Internet',
  musica: '🎵 Música & Instrumentos',
  transporte: '🚗 Transportes & Veículos',
  roupas: '👕 Roupas & Acessórios',
  casa: '🏠 Casa & Cômodos',
  escola: '🎓 Escola & Matérias',
  festas: '🎉 Festas & Datas',
  corpo: '🧠 Corpo Humano',
  fantasia: '🧙 Fantasia & Mitologia',
  brasil: '🇧🇷 Cultura Brasileira',
  espaco: '🚀 Espaço & Ciência'
};

/* STUN + TURN: permite conectar aparelhos em redes diferentes (PC no Wi-Fi + celular no 4G/5G) */
const PEER_OPTS = {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
      { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp'],
        username: 'openrelayproject', credential: 'openrelayproject' }
    ],
    iceCandidatePoolSize: 4
  }
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

/* quantidade de impostores: no máximo metade dos jogadores (menos 1), sempre pelo menos 1 */
const maxImp = n => Math.max(1, Math.floor((n - 1) / 2));
const effImp = (want, n) => Math.max(1, Math.min(want || 1, maxImp(n)));
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const joinNames = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1];
const impLabel = k => k + ' impostor' + (k > 1 ? 'es' : '');

/* sorteia uma palavra evitando repetir as últimas usadas neste aparelho */
function pickWord(category) {
  let pool = [];
  if (category === 'all') Object.values(WORD_DATABASE).forEach(c => pool.push(...c));
  else pool = WORD_DATABASE[category] || WORD_DATABASE.lugares;
  pool = [...new Set(pool)];
  let recent = [];
  try { recent = JSON.parse(store.get('impostor-recent') || '[]'); } catch (e) {}
  if (!Array.isArray(recent)) recent = [];
  const fresh = pool.filter(w => !recent.includes(w));
  const src = fresh.length ? fresh : pool;
  const w = src[rand(src.length)];
  recent.push(w);
  store.set('impostor-recent', JSON.stringify(recent.slice(-Math.max(1, Math.min(30, Math.floor(pool.length / 2))))));
  return w;
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
const L = { n: 4, idx: 0, imps: [], word: '' };            // partida local
const LS = { category: 'all', time: 3, custom: '', impostors: 1 };                 // configurações do modo local
let revealDone = () => {};
let revealRole = null;                // papel exibido no cartão (jogadores adicionados no mesmo celular)
let revealQ = null;
let settingsUI = null;               // seletor de configurações do anfitrião (lobby)

function freshME() {
  return { id: null, code: '', role: null, players: [], hostId: null, phase: 'lobby',
           settings: { category: 'all', time: 3, impostors: 1 }, imps: 1, myVote: null, suggestions: 0, mySuggest: '',
           locals: [], votes: {}, voteAs: null };
}

/* ---------- configurações (categoria + tempo) ---------- */
function mountSettings(el, obj, onChange, getN) {
  getN = getN || (() => 3);
  el.innerHTML =
    '<div class="field"><label class="lbl">Categoria de palavras</label><select class="select">' +
    Object.entries(CATS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('') +
    '</select></div>' +
    '<div class="field" style="margin-top:1.25rem"><label class="lbl">Quantidade de impostores</label>' +
    '<div class="stepper">' +
    '<button type="button" class="step-btn" data-d="-1" aria-label="Menos impostores">−</button>' +
    '<div class="step-val"><strong class="imp-val">1</strong><small class="imp-hint muted small"></small></div>' +
    '<button type="button" class="step-btn" data-d="1" aria-label="Mais impostores">+</button>' +
    '</div></div>' +
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

  // quantidade de impostores (limitada pelo número de jogadores)
  const stepBtns = [...el.querySelectorAll('.step-btn')];
  const valEl = el.querySelector('.imp-val'), hintEl = el.querySelector('.imp-hint');
  const paintImp = () => {
    const n = getN(), max = maxImp(n), v = effImp(obj.impostors, n);
    valEl.textContent = v;
    hintEl.textContent = `Máximo de ${impLabel(max)} com ${n} jogadores`;
    stepBtns[0].disabled = v <= 1;
    stepBtns[1].disabled = v >= max;
  };
  stepBtns.forEach(b => b.onclick = () => {
    const n = getN();
    obj.impostors = effImp(effImp(obj.impostors, n) + (+b.dataset.d), n);
    paintImp();
    if (onChange) onChange();
  });
  paintImp();
  return { refresh: paintImp };
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
  const c = $('role-card'), r = revealRole || ME.role;
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
  const k = m.k || 1;
  const imps = m.impostors || [];
  const impTxt = k > 1 ? `Os impostores eram ${joinNames(imps)}` : `O Impostor era ${imps[0]}`;
  $('result-title').textContent = won
    ? '🎉 Os inocentes venceram!'
    : (k > 1 ? '😈 Os impostores venceram!' : '😈 O impostor venceu!');
  let d;
  if (won) d = k > 1 ? `Os ${k} impostores foram descobertos: ${joinNames(imps)}!` : `${imps[0]} era realmente o Impostor!`;
  else if (m.tie) d = (m.noVotes ? 'Ninguém votou.' : (k > 1 ? 'A votação terminou empatada ou sem votos suficientes.' : 'Houve empate na votação.')) + ` ${impTxt}.`;
  else if (k > 1) d = `O grupo acusou ${joinNames(m.accused || [])} e acertou ${m.hits || 0} de ${k}. ${impTxt}.`;
  else d = `${(m.accused || [])[0]} era inocente! O verdadeiro Impostor era ${imps[0]}.`;
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
const localUI = mountSettings($('local-settings'), LS, null, () => L.n);

$('num-players').addEventListener('input', e => {
  L.n = parseInt(e.target.value, 10);
  $('num-players-val').textContent = L.n;
  localUI.refresh();
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
  // com palavra definida pelo Jogador 1, ele não entra no sorteio de impostores
  const k = effImp(LS.impostors, L.n);
  const cand = [...Array(L.n).keys()].slice(LS.custom ? 1 : 0);
  L.imps = shuffle(cand).slice(0, k);
  L.idx = 0;
  keepAwake();
  localPass();
};

function localPass() {
  $('pass-name').textContent = `Jogador ${L.idx + 1}`;
  show('s-pass');
}

$('btn-pass-ok').onclick = () => {
  if (mode !== 'local') { showRevealStep(); return; }
  ME.role = { impostor: L.imps.includes(L.idx), word: L.word };
  $('reveal-label').textContent = `Jogador ${L.idx + 1}`;
  renderCard(true);
  revealDone = () => {
    ME.role = null;
    L.idx++;
    if (L.idx < L.n) localPass();
    else enterDiscussion({ enabled: LS.time > 0, remaining: LS.time * 60, running: LS.time > 0, first: 'Jogador ' + (1 + rand(L.n)), imps: L.imps.length });
  };
  show('s-reveal');
};

let localConfirm = null;
function enterLocalVote() {
  timerStop();
  show('s-vote');
  const k = L.imps.length;
  const sel = [];
  $('vote-progress').textContent = '';
  $('btn-end-vote').classList.add('hidden');
  $('vote-as').classList.add('hidden');
  const confirmBtn = $('btn-local-confirm');
  confirmBtn.classList.toggle('hidden', k < 2);
  const name = i => `Jogador ${i + 1}`;
  const finish = () => {
    const hits = sel.filter(i => L.imps.includes(i)).length;
    showResult({
      winner: hits === k ? 'inocentes' : 'impostor', tie: false,
      accused: sel.map(name), impostors: L.imps.slice().sort((a, b) => a - b).map(name),
      k, hits, word: L.word, tally: null
    });
  };
  localConfirm = () => { if (sel.length === k) finish(); };
  const list = $('vote-list');
  const btns = [];
  const paint = () => {
    $('vote-sub').textContent = k === 1
      ? 'Selecione quem o grupo acha que é o Impostor:'
      : `Há ${k} impostores. Selecione ${k} jogadores que o grupo acha que são os impostores (${sel.length}/${k}):`;
    btns.forEach((b, i) => {
      b.classList.toggle('selected', sel.includes(i));
      b.querySelector('small').textContent = sel.includes(i) ? '✔ escolhido' : 'Votar';
    });
    confirmBtn.disabled = sel.length !== k;
  };
  list.innerHTML = '';
  for (let i = 0; i < L.n; i++) {
    const b = document.createElement('button');
    b.className = 'votebtn';
    b.innerHTML = `<span>Jogador ${i + 1}</span><small>Votar</small>`;
    b.onclick = () => {
      if (k === 1) { sel.length = 0; sel.push(i); finish(); return; }
      const at = sel.indexOf(i);
      if (at >= 0) sel.splice(at, 1);
      else { sel.push(i); if (sel.length > k) sel.shift(); }
      paint();
    };
    btns.push(b);
    list.appendChild(b);
  }
  paint();
}
$('btn-local-confirm').onclick = () => { if (localConfirm) localConfirm(); };

/* =========================================================
   TELAS COMUNS (discussão / votação)
   ========================================================= */
function enterDiscussion(m) {
  show('s-disc');
  const nImp = m.imps || 1;
  $('disc-title').textContent = nImp > 1 ? 'Descubram os Impostores!' : 'Descubram o Impostor!';
  $('disc-sub').textContent = 'Façam perguntas sobre o assunto sem dar pistas óbvias.' + (nImp > 1 ? ` Há ${nImp} impostores entre vocês.` : '');
  const canControl = mode !== 'guest';
  $('btn-go-vote').classList.toggle('hidden', !canControl);
  $('disc-guest').classList.toggle('hidden', canControl);
  $('btn-peek').classList.toggle('hidden', mode === 'local');
  $('peek-card').classList.add('hidden');
  $('first-name').textContent = m.first || '';
  $('first-box').classList.toggle('hidden', !m.first);
  timerSet(m.enabled, m.remaining, m.running);
}

let peekTimer = null;
function showPeek(r, name) {
  const p = $('peek-card');
  p.className = 'peek' + (r.impostor ? ' imp' : '');
  const who = name ? name + ': ' : '';
  p.textContent = r.impostor ? `🤫 ${who}Você é o IMPOSTOR` : `💡 ${who}Palavra: ${r.word}`;
  clearTimeout(peekTimer);
  peekTimer = setTimeout(() => p.classList.add('hidden'), 4000);
}
$('btn-peek').onclick = () => {
  const p = $('peek-card');
  if (!p.classList.contains('hidden')) { p.classList.add('hidden'); return; }
  const r = ME.role;
  if (!r) return;
  const loc = ME.locals || [];
  if (!loc.length) { p.classList.remove('hidden'); showPeek(r); return; }
  // há jogadores neste celular: cada um toca no próprio nome para ver o seu papel
  p.className = 'peek';
  p.innerHTML = '';
  [{ name: myName(), role: r }].concat(loc.map(l => ({ name: l.name, role: { impostor: l.impostor, word: l.word } }))).forEach(it => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn ghost small';
    b.textContent = 'Ver papel de ' + it.name;
    b.onclick = e => { e.stopPropagation(); showPeek(it.role, it.name); };
    p.append(b);
  });
  clearTimeout(peekTimer);
  peekTimer = setTimeout(() => p.classList.add('hidden'), 8000);
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

function enterVote(mine, imps) {
  timerStop();
  ME.imps = imps || 1;
  ME.votes = {};
  if (mine && typeof mine === 'object') Object.keys(mine).forEach(id => {
    ME.votes[id] = Array.isArray(mine[id]) ? mine[id] : [mine[id]];
  });
  ME.voteAs = ME.id;
  show('s-vote');
  $('vote-sub').textContent = ME.imps > 1 ? `Quem são os ${ME.imps} impostores?` : 'Quem é o Impostor? Escolha um jogador:';
  $('btn-end-vote').classList.toggle('hidden', mode !== 'host');
  renderVoteList();
  refreshLive();
}

function myIdentities() {
  return [{ id: ME.id, name: myName() }]
    .concat(ME.players.filter(p => p.owner === ME.id).map(p => ({ id: p.id, name: p.name })));
}

function renderVoteList() {
  const ids = myIdentities();
  const k = ME.imps || 1;
  if (!ids.some(x => x.id === ME.voteAs)) ME.voteAs = ME.id;
  const picked = ME.votes[ME.voteAs] || [];
  const as = $('vote-as');
  as.innerHTML = '';
  as.classList.toggle('hidden', ids.length < 2);
  const ask = k > 1 ? `Quem são os ${k} impostores? Escolha ${k} jogadores (${picked.length}/${k}).` : 'Quem é o Impostor? Escolha um jogador:';
  if (ids.length > 1) {
    ids.forEach(x => {
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'chip' + (ME.voteAs === x.id ? ' active' : '');
      c.textContent = x.name + ((ME.votes[x.id] || []).length >= k ? ' ✔' : '');
      c.onclick = () => { ME.voteAs = x.id; renderVoteList(); };
      as.appendChild(c);
    });
    const cur = ids.find(x => x.id === ME.voteAs);
    $('vote-sub').textContent = `Votando como ${cur ? cur.name : ''}. ${ask}`;
  } else {
    $('vote-sub').textContent = ask;
  }
  const list = $('vote-list');
  list.innerHTML = '';
  ME.players.filter(p => p.id !== ME.voteAs).forEach(p => {
    const on = picked.includes(p.id);
    const b = document.createElement('button');
    b.className = 'votebtn' + (on ? ' selected' : '');
    const n = document.createElement('span');
    n.textContent = p.name;
    const s = document.createElement('small');
    s.textContent = !p.connected ? 'offline' : (on ? '✔ seu voto' : 'Votar');
    b.append(n, s);
    b.onclick = () => castVote(p.id);
    list.appendChild(b);
  });
}

function castVote(targetId) {
  const as = ME.voteAs || ME.id;
  const k = ME.imps || 1;
  let arr = (ME.votes[as] || []).slice();
  const at = arr.indexOf(targetId);
  if (k === 1) arr = [targetId];
  else if (at >= 0) arr.splice(at, 1);
  else { arr.push(targetId); if (arr.length > k) arr.shift(); }
  ME.votes[as] = arr;
  if (mode === 'host') hostVote(as, arr);
  else if (net.conn && net.conn.open) net.conn.send({ t: 'vote', targets: arr, as });
  // quando este jogador completa o voto, passa para o próximo jogador deste celular que ainda não votou
  if (arr.length >= k) {
    const next = myIdentities().find(x => (ME.votes[x.id] || []).length < k);
    if (next) ME.voteAs = next.id;
  }
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
      ME.role = null; ME.locals = []; ME.votes = {}; ME.voteAs = null; ME.mySuggest = ''; timerStop();
      showLobby();
      break;
    case 'role':
      ME.role = { impostor: !!m.impostor, word: m.word };
      ME.locals = Array.isArray(m.locals) ? m.locals : [];
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
      enterVote(m.mine, m.imps);
      break;
    case 'result':
      showResult(m);
      break;
    case 'toast':
      toast(m.msg || '');
      break;
    case 'localok':
      $('in-local-name').value = '';
      toast('Jogador adicionado!');
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
    a.textContent = (p.owner ? '📱 ' : '') + p.name + (p.id === ME.hostId ? ' 👑' : '') + (p.id === ME.id ? ' (você)' : '');
    const b = document.createElement('span');
    b.className = 'pstat';
    b.textContent = statusFn(p);
    li.append(a, b);
    ul.append(li);
  });
}

function renderLobbyList(list) {
  const ul = $('lobby-list');
  ul.innerHTML = '';
  list.forEach(p => {
    const li = document.createElement('li');
    li.className = 'pitem';
    const a = document.createElement('span');
    a.textContent = (p.owner ? '📱 ' : '') + p.name + (p.id === ME.hostId ? ' 👑' : '') + (p.id === ME.id ? ' (você)' : '');
    const b = document.createElement('span');
    b.className = 'pstat';
    if (p.owner) {
      const o = list.find(x => x.id === p.owner);
      b.textContent = 'no celular de ' + (o ? (o.id === ME.id ? 'você' : o.name) : '?');
      if (p.owner === ME.id || mode === 'host') {
        const x = document.createElement('button');
        x.type = 'button'; x.className = 'rm'; x.textContent = '✕';
        x.setAttribute('aria-label', 'Remover ' + p.name);
        x.onclick = () => removeLocal(p.id);
        b.append(x);
      }
    } else b.textContent = p.connected ? '' : 'offline';
    li.append(a, b);
    ul.append(li);
  });
}

function addLocal() {
  const name = cleanName($('in-local-name').value);
  if (!name) return toast('Digite o nome do jogador.');
  if (mode === 'host') hostAddLocal('p0', name);
  else if (net.conn && net.conn.open) net.conn.send({ t: 'addlocal', name });
}
function removeLocal(id) {
  if (mode === 'host') hostRemoveLocal('p0', id);
  else if (net.conn && net.conn.open) net.conn.send({ t: 'rmlocal', id });
}
$('btn-local-add').onclick = addLocal;
$('in-local-name').addEventListener('keydown', e => { if (e.key === 'Enter') addLocal(); });

function refreshLive() {
  const list = ME.players;
  const online = list.filter(p => p.connected);

  $('lobby-count').textContent = list.length;
  renderLobbyList(list);

  const ready = online.filter(p => p.ready).length;
  $('wait-count').textContent = `${ready} de ${online.length} prontos`;
  renderPlayerList($('wait-list'), list, p => !p.connected ? '⚠️ offline' : (p.ready ? '✅ pronto' : '⏳ lendo…'));

  const voted = online.filter(p => p.voted).length;
  $('vote-progress').textContent = `${voted} de ${online.length} votaram`;

  const s = ME.settings;
  const kImp = effImp(s.impostors, Math.max(online.length, 1));
  const tm = s.time ? s.time + ' min de discussão' : 'sem tempo';
  $('lobby-settings-guest').textContent = ME.suggestions
    ? `💡 Tema sorteado entre as sugestões • ${impLabel(kImp)} • ${tm}`
    : `${CATS[s.category] || ''} • ${impLabel(kImp)} • ${tm}`;
  if (mode === 'host' && settingsUI) settingsUI.refresh();
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
  if (host) settingsUI = mountSettings($('lobby-settings-host'), G.settings, () => pushPlayers(), () => Math.max(ME.players.filter(p => p.connected).length, 1));
  else $('lobby-hint').textContent = 'Aguardando o anfitrião iniciar a partida…';
  refreshLive();
  keepAwake();
}

function openReveal() {
  const loc = ME.locals || [];
  revealQ = {
    i: 0,
    q: [{ name: myName(), role: ME.role }]
      .concat(loc.map(l => ({ name: l.name, role: { impostor: l.impostor, word: l.word } })))
  };
  revealDone = () => {
    revealQ.i++;
    if (revealQ.i < revealQ.q.length) onlinePass();
    else { revealRole = null; revealQ = null; sendReady(); }
  };
  showRevealStep();
}
function showRevealStep() {
  const it = revealQ.q[revealQ.i];
  revealRole = it.role;
  $('reveal-label').textContent = it.name;
  renderCard(false);
  show('s-reveal');
}
function onlinePass() {
  $('pass-name').textContent = revealQ.q[revealQ.i].name;
  show('s-pass');
}

function sendReady() {
  if (mode === 'host') { setReady(G.players[0]); pushPlayers(); }
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
    list: G.players.map(p => ({ id: p.id, name: p.name, owner: p.owner || null, connected: p.connected, ready: !!p.ready, voted: Array.isArray(p.vote) && p.vote.length >= (G.impCount || 1) }))
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
/* Agrupa atualizações da lista: com até 50 jogadores, votos e entradas simultâneas
   gerariam centenas de mensagens; assim sai no máximo 1 envio a cada ~80 ms. */
let pushTimer = null;
function pushPlayers() {
  if (!G || pushTimer) return;
  pushTimer = setTimeout(() => { pushTimer = null; if (G) broadcast(playersMsg()); }, 80);
}

/* jogadores adicionados no celular de outro jogador (owner = id do dono do aparelho) */
const localRoles = p => G.players.filter(x => x.owner === p.id)
  .map(x => ({ id: x.id, name: x.name, impostor: G.impostorIds.includes(x.id), word: G.word }));
const votesOf = p => { const o = {}; G.players.forEach(x => { if ((x.id === p.id || x.owner === p.id) && x.vote != null) o[x.id] = x.vote; }); return o; };
const syncLocals = o => G.players.forEach(x => { if (x.owner === o.id) x.connected = o.connected; });
const setReady = p => { p.ready = true; G.players.forEach(x => { if (x.owner === p.id) x.ready = true; }); };

function hostAddLocal(ownerId, rawName) {
  if (!G) return;
  const owner = G.players.find(p => p.id === ownerId);
  if (!owner || owner.owner) return;
  const fail = msg => sendTo(owner, { t: 'toast', msg });
  if (G.phase !== 'lobby') return fail('Só dá para adicionar jogadores antes da partida começar.');
  const name = cleanName(rawName);
  if (!name) return fail('Nome inválido.');
  if (G.players.some(x => x.name.toLowerCase() === name.toLowerCase())) return fail('Já existe um jogador com esse nome na sala.');
  if (G.players.length >= MAX_PLAYERS) return fail(`Sala cheia (máx. ${MAX_PLAYERS} jogadores).`);
  G.players.push({ id: 'p' + G.nextId++, name, conn: null, connected: owner.connected, ready: false, vote: null, suggestion: null, owner: ownerId });
  sendTo(owner, { t: 'localok' });
  pushPlayers();
}
function hostRemoveLocal(requesterId, id) {
  if (!G || G.phase !== 'lobby') return;
  const p = G.players.find(x => x.id === id);
  if (!p || !p.owner) return;
  if (p.owner !== requesterId && requesterId !== 'p0') return;
  G.players = G.players.filter(x => x !== p);
  pushPlayers();
}

function sendStateTo(p) {
  sendTo(p, { t: 'welcome', you: p.id });
  sendTo(p, playersMsg());
  if (G.phase === 'lobby') { sendTo(p, { t: 'mysuggest', word: p.suggestion || '' }); return; }
  sendTo(p, { t: 'role', impostor: G.impostorIds.includes(p.id), word: G.word, silent: G.phase !== 'reveal', locals: localRoles(p) });
  if (G.phase === 'reveal' && p.ready) sendTo(p, { t: 'wait' });
  if (G.phase === 'discussion') sendTo(p, { t: 'discussion', enabled: T.enabled, remaining: T.remaining, running: T.running, first: G.first, imps: G.impCount });
  if (G.phase === 'vote') sendTo(p, { t: 'vote', mine: votesOf(p), imps: G.impCount });
  if (G.phase === 'result' && G.result) sendTo(p, G.result);
}

function createRoom(retry) {
  retry = retry || 0;
  const name = cleanName($('in-name').value);
  if (!name) return toast('Digite seu nome.');
  if (typeof Peer === 'undefined') return toast('Não foi possível carregar a biblioteca online. Verifique sua conexão.');
  store.set('impostor-name', name);

  const code = genCode();
  const peer = new Peer(PREFIX + code, PEER_OPTS);
  net.peer = peer;
  $('btn-create').disabled = true;

  peer.on('open', () => {
    $('btn-create').disabled = false;
    mode = 'host'; net.active = true;
    G = {
      code, phase: 'lobby', settings: { category: 'all', time: 3, impostors: 1 },
      players: [{ id: 'p0', name, conn: null, connected: true, ready: false, vote: null, suggestion: null }],
      nextId: 1, word: null, impostorIds: [], impCount: 1, result: null
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
      if (ex.owner) return rejectConn(conn, 'Já existe um jogador com esse nome na sala.');
      const same = ex.token && m.token === ex.token;
      if (ex.connected && !same) return rejectConn(conn, 'Já existe um jogador com esse nome na sala.');
      const old = ex.conn;
      ex.conn = conn; ex.connected = true; syncLocals(ex);          // reconexão (assume o lugar da conexão antiga)
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
  if (m.t === 'ready') { setReady(p); pushPlayers(); }
  else if (m.t === 'vote') {
    const as = m.as && m.as !== p.id ? m.as : p.id;
    const v = G.players.find(x => x.id === as);
    const targets = Array.isArray(m.targets) ? m.targets : (m.target ? [m.target] : []);
    if (v && (as === p.id || v.owner === p.id)) hostVote(as, targets);
  }
  else if (m.t === 'addlocal') hostAddLocal(p.id, m.name);
  else if (m.t === 'rmlocal') hostRemoveLocal(p.id, m.id);
  else if (m.t === 'suggest') hostSuggest(p.id, m.word);
}

function hostDrop(conn) {
  if (!G) return;
  const p = G.players.find(x => x.conn === conn);
  if (!p) return;
  if (G.phase === 'lobby') G.players = G.players.filter(x => x !== p && x.owner !== p.id);
  else { p.connected = false; p.conn = null; syncLocals(p); }
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
  const k = effImp(G.settings.impostors, online.length);
  G.impCount = k;
  let pool = shuffle(online.filter(p => !authors.includes(p)));
  if (pool.length < k) pool = pool.concat(shuffle(authors));      // só usa quem sugeriu se faltar gente
  G.impostorIds = pool.slice(0, k).map(p => p.id);
  G.phase = 'reveal';
  G.result = null;
  G.players.forEach(p => { p.ready = false; p.vote = null; });
  G.players.forEach(p => {
    if (p.connected && !p.owner) sendTo(p, { t: 'role', impostor: G.impostorIds.includes(p.id), word: G.word, silent: false, locals: localRoles(p) });
  });
  pushPlayers();
}
$('btn-start-online').onclick = hostStart;

function hostStartDiscussion() {
  const mins = G.settings.time;
  const online = G.players.filter(p => p.connected);
  G.first = online[rand(online.length)].name;     // sorteia só quem começa falando
  G.phase = 'discussion';
  broadcast({ t: 'discussion', enabled: mins > 0, remaining: mins * 60, running: mins > 0, first: G.first, imps: G.impCount });
  pushPlayers();
}
$('btn-start-disc').onclick = hostStartDiscussion;

function hostGoVote() {
  G.phase = 'vote';
  G.players.forEach(p => { p.vote = null; });
  broadcast({ t: 'vote', mine: null, imps: G.impCount });
  pushPlayers();
}

function hostVote(pid, targets) {
  if (!G || G.phase !== 'vote') return;
  const voter = G.players.find(p => p.id === pid);
  if (!voter) return;
  const k = G.impCount || 1;
  const clean = [];
  (Array.isArray(targets) ? targets : []).forEach(t => {
    if (t !== pid && G.players.some(p => p.id === t) && !clean.includes(t)) clean.push(t);
  });
  voter.vote = clean.length ? clean.slice(0, k) : null;
  pushPlayers();
  maybeFinishVote();
}

function maybeFinishVote() {
  const k = G.impCount || 1;
  const online = G.players.filter(p => p.connected);
  if (online.length && online.every(p => Array.isArray(p.vote) && p.vote.length >= k)) hostFinishVote();
}

function hostFinishVote() {
  if (!G || G.phase !== 'vote') return;
  G.phase = 'result';
  const k = G.impCount || 1;
  const counts = {};
  G.players.forEach(p => { (p.vote || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; }); });
  const tally = G.players
    .map(p => ({ name: p.name, count: counts[p.id] || 0, impostor: G.impostorIds.includes(p.id) }))
    .sort((a, b) => b.count - a.count);
  // os k mais votados são os acusados; empate na fronteira (ou votos insuficientes) = ninguém é acusado
  const kth = tally[k - 1] ? tally[k - 1].count : 0;
  const next = tally[k] ? tally[k].count : -1;
  const noVotes = !tally[0] || tally[0].count === 0;
  const tie = kth === 0 || kth === next;
  const accusedList = tie ? [] : tally.slice(0, k);
  const hits = accusedList.filter(t => t.impostor).length;
  const caught = !tie && hits === k;
  const impNames = G.players.filter(p => G.impostorIds.includes(p.id)).map(p => p.name);
  G.result = {
    t: 'result', winner: caught ? 'inocentes' : 'impostor', tie, noVotes,
    accused: accusedList.map(t => t.name), impostors: impNames, k, hits, word: G.word, tally,
    suggestedBy: G.suggestedBy || []
  };
  broadcast(G.result);
  pushPlayers();
}

function hostNewGame() {
  G.players = G.players.filter(p => p.connected);
  G.phase = 'lobby';
  G.word = null; G.impostorIds = []; G.impCount = 1; G.result = null; G.suggestedBy = [];
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
  const peer = new Peer(undefined, PEER_OPTS);
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
