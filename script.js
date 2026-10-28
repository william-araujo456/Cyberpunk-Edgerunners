const lista = document.getElementById("character-list");
const detalhes = document.getElementById("character-details");
const reduzMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;

const esc = t => String(t ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const normalizar = t => String(t ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

async function buscarJSON(url) {
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`${resposta.status} em ${url}`);
    return resposta.json();
}

const MSG_ERRO = `Falha ao carregar os dados. Abra o site por um servidor local (ex.: extensão Live Server) e confira a pasta api/.`;

function decodificar(el, texto) {
    if (reduzMovimento) { el.textContent = texto; return; }
    const simbolos = "▓▒░#$%&@01<>/";
    const total = 28;
    let quadro = 0;
    const timer = setInterval(() => {
        const fixos = Math.floor(texto.length * quadro / total);
        el.textContent = [...texto].map((c, i) =>
            c === " " || i < fixos ? c : simbolos[Math.floor(Math.random() * simbolos.length)]
        ).join("");
        if (++quadro > total) { clearInterval(timer); el.textContent = texto; }
    }, 35);
}

async function iniciarCatalogo() {
    const pesquisa = document.getElementById("search");
    const contador = document.getElementById("counter");
    let personagens = [];

    function renderizar(itens, animar = false) {
        contador.textContent = `${itens.length} de ${personagens.length} personagens`;

        if (!itens.length) {
            lista.innerHTML = `<p class="empty">Nenhum personagem encontrado para "${esc(pesquisa.value)}". Tente outro nome ou cargo.</p>`;
            return;
        }

        lista.classList.toggle("entrando", animar);
        lista.innerHTML = itens.map((p, i) => `
            <a class="card" href="edgerunners.html?id=${encodeURIComponent(p.id)}" style="--i:${Math.min(i, 12)}">
                <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">
                <div class="card-info">
                    <h2>${esc(p.name)}</h2>
                    <p>${esc(p.role)}</p>
                </div>
            </a>
        `).join("");
    }

    try {
        personagens = await buscarJSON("api/characters.json");
    } catch (e) {
        lista.innerHTML = `<p class="erro">${MSG_ERRO}</p>`;
        return;
    }

    renderizar(personagens, true);

    pesquisa.addEventListener("input", () => {
        const termo = normalizar(pesquisa.value.trim());
        renderizar(personagens.filter(p =>
            normalizar(p.name).includes(termo) || normalizar(p.role).includes(termo)
        ));
    });

    document.addEventListener("keydown", e => {
        if (e.key === "/" && document.activeElement !== pesquisa) {
            e.preventDefault();
            pesquisa.focus();
        }
    });

    pesquisa.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            pesquisa.value = "";
            pesquisa.dispatchEvent(new Event("input"));
            pesquisa.blur();
        }
    });
}

function classeStatus(status) {
    const s = normalizar(status);
    if (/morto|morta|falecid|dead|deceased/.test(s)) return "off";
    if (/vivo|viva|alive/.test(s)) return "on";
    return "neutro";
}

async function iniciarDetalhes() {
    const id = new URLSearchParams(location.search).get("id");

    try {
        if (!id) throw new Error("id ausente");

        const [p, todos] = await Promise.all([
            buscarJSON(`api/characters/${encodeURIComponent(id)}.json`),
            buscarJSON("api/characters.json").catch(() => [])
        ]);

        const pos = todos.findIndex(x => String(x.id) === String(id));
        const anterior = pos >= 0 ? todos[(pos - 1 + todos.length) % todos.length] : null;
        const proximo = pos >= 0 ? todos[(pos + 1) % todos.length] : null;
        const link = x => `edgerunners.html?id=${encodeURIComponent(x.id)}`;

        document.title = `${p.name} — Cyberpunk: Edgerunners`;

        detalhes.innerHTML = `
            <a href="index.html" class="back-btn">← Voltar</a>

            <div class="profile">
                <img src="${esc(p.image)}" alt="${esc(p.name)}">
                <h1 id="nome">${esc(p.name)}</h1>
            </div>

            <div class="info-section">
                <h2>Cargo</h2>
                <p>${esc(p.role)}</p>

                <h2>Idade</h2>
                <p>${esc(p.age)}</p>

                <h2>Ocupação</h2>
                <p>${esc(p.occupation)}</p>

                <h2>Status</h2>
                <p><span class="badge ${classeStatus(p.status)}">${esc(p.status)}</span></p>

                <h2>Descrição</h2>
                <p>${esc(p.description)}</p>
            </div>

            ${anterior && proximo ? `
            <nav class="pager" aria-label="Outros personagens">
                <a href="${link(anterior)}" rel="prev">← ${esc(anterior.name)}</a>
                <a href="${link(proximo)}" rel="next">${esc(proximo.name)} →</a>
            </nav>` : ""}
        `;

        decodificar(document.getElementById("nome"), p.name);

        if (anterior && proximo) {
            document.addEventListener("keydown", e => {
                if (e.key === "ArrowLeft") location.href = link(anterior);
                if (e.key === "ArrowRight") location.href = link(proximo);
            });
        }
    } catch (e) {
        detalhes.innerHTML = `
            <a href="index.html" class="back-btn">← Voltar</a>
            <p class="erro">Personagem não encontrado. ${MSG_ERRO}</p>
        `;
    }
}

if (lista) iniciarCatalogo();
if (detalhes) iniciarDetalhes();
