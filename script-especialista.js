// ==========================================
// COLE A SUA URL DO GOOGLE APPS SCRIPT AQUI (Terminada em /exec)
// ==========================================
const URL_API_GOOGLE = "COLE_SUA_URL_DO_APPS_SCRIPT_AQUI";

let dadosGlobais = [];

window.onload = function() {
  buscarHistoricoGeral();
};

function mudarAbaEspecialista(abaId, elementoBotao) {
  document.querySelectorAll('.secao').forEach(el => el.classList.remove('ativa'));
  document.querySelectorAll('.btn-aba').forEach(el => el.classList.remove('ativa'));
  document.getElementById(abaId).classList.add('ativa');
  elementoBotao.classList.add('ativa');
}

function buscarHistoricoGeral() {
  fetch(URL_API_GOOGLE, {
    method: 'POST',
    body: JSON.stringify({ acao: "buscarHistorico" })
  })
  .then(res => res.json())
  .then(resposta => {
    document.getElementById('loading').style.display = 'none';
    if (resposta.status === "sucesso") {
      dadosGlobais = resposta.historico;
      popularFiltros();
      aplicarFiltros();
    } else {
      alert("Erro ao carregar os dados: " + resposta.mensagem);
    }
  })
  .catch(err => {
    document.getElementById('loading').innerHTML = "⚠️ Falha ao conectar com o banco de dados.";
    console.error(err);
  });
}

function popularFiltros() {
  const profs = new Set();
  const comps = new Set();
  const turmas = new Set();

  dadosGlobais.forEach(p => {
    if(p.professor && p.professor !== "-") profs.add(p.professor);
    if(p.componente && p.componente !== "-") comps.add(p.componente);
    if(p.turma && p.turma !== "-") turmas.add(p.turma);
  });

  preencherSelect('filtroProfessor', Array.from(profs).sort());
  preencherSelect('filtroComponente', Array.from(comps).sort());
  preencherSelect('filtroTurma', Array.from(turmas).sort());
}

function preencherSelect(id, arrayOpcoes) {
  const select = document.getElementById(id);
  select.innerHTML = ""; // Limpa opções antigas
  arrayOpcoes.forEach(opcao => {
    select.innerHTML += `<option value="${opcao}">${opcao}</option>`;
  });
}

// Função para pegar todos os itens que o usuário selecionou na caixa múltipla
function obterValoresMultiplos(idSelect) {
  const select = document.getElementById(idSelect);
  const selecionados = [];
  for (let i = 0; i < select.options.length; i++) {
    if (select.options[i].selected) {
      selecionados.push(select.options[i].value);
    }
  }
  return selecionados;
}

function aplicarFiltros() {
  const profsSelecionados = obterValoresMultiplos('filtroProfessor');
  const compsSelecionados = obterValoresMultiplos('filtroComponente');
  const turmasSelecionadas = obterValoresMultiplos('filtroTurma');

  const dadosFiltrados = dadosGlobais.filter(p => {
    // Se o array estiver vazio (nenhum selecionado), consideramos que ele quer ver TODOS daquela categoria
    const passaProf = (profsSelecionados.length === 0 || profsSelecionados.includes(p.professor));
    const passaComp = (compsSelecionados.length === 0 || compsSelecionados.includes(p.componente));
    const passaTurma = (turmasSelecionadas.length === 0 || turmasSelecionadas.includes(p.turma));
    
    return passaProf && passaComp && passaTurma;
  });

  renderizarListaPlanos(dadosFiltrados);
  renderizarConsolidacao(dadosFiltrados);
}

function renderizarListaPlanos(planos) {
  const container = document.getElementById('listaPlanosHtml');
  if (planos.length === 0) {
    container.innerHTML = "<p style='color:#7f8c8d;'>Nenhum planejamento encontrado para a combinação selecionada.</p>";
    return;
  }

  let html = "";
  planos.forEach(p => {
    html += `
      <div class="card-plano">
        <span class="tag">${p.data}</span>
        <h4>${p.componente} - ${p.turma}</h4>
        <div class="detalhes">
          <strong>Professor(a):</strong> ${p.professor}<br>
          <strong>Unidade Temática:</strong> ${p.unidade}<br>
          <strong>Habilidades:</strong> ${p.habilidades.substring(0, 100)}...
        </div>
        <a href="${p.urlDoc}" target="_blank" class="btn-acao">📄 Ver Plano Oficial</a>
        <a href="${p.urlPasta}" target="_blank" class="btn-acao pasta">📁 Auditar Evidências</a>
      </div>
    `;
  });
  container.innerHTML = html;
}

function renderizarConsolidacao(planos) {
  const contagemHab = {};
  const contagemObj = {};

  planos.forEach(p => {
    const habs = p.habilidades.split("|").map(s => s.trim()).filter(s => s !== "" && s !== "-");
    const objs = p.objetos.split("|").map(s => s.trim()).filter(s => s !== "" && s !== "-");

    habs.forEach(h => { contagemHab[h] = (contagemHab[h] || 0) + 1; });
    objs.forEach(o => { contagemObj[o] = (contagemObj[o] || 0) + 1; });
  });

  gerarHTMLRanking('listaHabConsolidada', contagemHab);
  gerarHTMLRanking('listaObjConsolidada', contagemObj);
}

function gerarHTMLRanking(containerId, objContagem) {
  const container = document.getElementById(containerId);
  const itensOrdenados = Object.keys(objContagem).sort((a, b) => objContagem[b] - objContagem[a]);

  if (itensOrdenados.length === 0) {
    container.innerHTML = "<li><span style='color:#7f8c8d;'>Nenhum dado registrado para este filtro.</span></li>";
    return;
  }

  let html = "";
  itensOrdenados.forEach(item => {
    html += `<li><span>${item}</span> <span class="badge-count">${objContagem[item]}x</span></li>`;
  });
  container.innerHTML = html;
}
