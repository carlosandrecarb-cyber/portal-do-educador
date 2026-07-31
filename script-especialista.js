// ==========================================
// COLE A SUA URL DO GOOGLE APPS SCRIPT AQUI (Terminada em /exec)
// ==========================================
const URL_API_GOOGLE = "https://script.google.com/macros/s/AKfycbxFRiIGmxDp5z0GNFIjkdtx7pbA7qTbO8NfJqT1TgAmh1XlXyzh1GdPXI8XGDW4QBqA/exec";

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
      // Processa as datas antes de salvar globalmente
      dadosGlobais = resposta.historico.map(p => {
        let partesData = p.data.split(/[-/]/);
        if (partesData.length >= 3) {
          p.anoValor = partesData[2];
          let numMes = parseInt(partesData[1], 10);
          p.mesValor = obterNomeMes(numMes);
          p.trimestreValor = obterTrimestre(numMes);
        } else {
          p.anoValor = "Desconhecido";
          p.mesValor = "Desconhecido";
          p.trimestreValor = "Desconhecido";
        }
        return p;
      });
      
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

function obterNomeMes(num) {
  const meses = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return meses[num] || "Desconhecido";
}

function obterTrimestre(num) {
  if (num >= 1 && num <= 3) return "1º Trimestre";
  if (num >= 4 && num <= 6) return "2º Trimestre";
  if (num >= 7 && num <= 9) return "3º Trimestre";
  if (num >= 10 && num <= 12) return "4º Trimestre";
  return "Desconhecido";
}

function popularFiltros() {
  const anos = new Set();
  const trimestres = new Set();
  const meses = new Set();
  const profs = new Set();
  const comps = new Set();
  const turmas = new Set();

  dadosGlobais.forEach(p => {
    if(p.anoValor && p.anoValor !== "Desconhecido") anos.add(p.anoValor);
    if(p.trimestreValor && p.trimestreValor !== "Desconhecido") trimestres.add(p.trimestreValor);
    if(p.mesValor && p.mesValor !== "Desconhecido") meses.add(p.mesValor);
    if(p.professor && p.professor !== "-") profs.add(p.professor);
    if(p.componente && p.componente !== "-") comps.add(p.componente);
    if(p.turma && p.turma !== "-") turmas.add(p.turma);
  });

  // O "sort().reverse()" no ano serve para mostrar o ano mais recente primeiro
  preencherCheckboxes('filtroAno', Array.from(anos).sort().reverse());
  preencherCheckboxes('filtroTrimestre', Array.from(trimestres).sort());
  preencherCheckboxes('filtroMes', Array.from(meses));
  preencherCheckboxes('filtroProfessor', Array.from(profs).sort());
  preencherCheckboxes('filtroComponente', Array.from(comps).sort());
  preencherCheckboxes('filtroTurma', Array.from(turmas).sort());
}

function preencherCheckboxes(idContainer, arrayOpcoes) {
  const container = document.getElementById(idContainer);
  container.innerHTML = "";
  arrayOpcoes.forEach(opcao => {
    container.innerHTML += `<label><input type="checkbox" value="${opcao}" onchange="aplicarFiltros()"> ${opcao}</label>`;
  });
}

function obterValoresMultiplos(idContainer) {
  const checkboxesMarcados = document.querySelectorAll(`#${idContainer} input[type="checkbox"]:checked`);
  return Array.from(checkboxesMarcados).map(cb => cb.value);
}

function aplicarFiltros() {
  const anosSelecionados = obterValoresMultiplos('filtroAno');
  const trimestresSelecionados = obterValoresMultiplos('filtroTrimestre');
  const mesesSelecionados = obterValoresMultiplos('filtroMes');
  const profsSelecionados = obterValoresMultiplos('filtroProfessor');
  const compsSelecionados = obterValoresMultiplos('filtroComponente');
  const turmasSelecionadas = obterValoresMultiplos('filtroTurma');

  const dadosFiltrados = dadosGlobais.filter(p => {
    const passaAno = (anosSelecionados.length === 0 || anosSelecionados.includes(p.anoValor));
    const passaTrimestre = (trimestresSelecionados.length === 0 || trimestresSelecionados.includes(p.trimestreValor));
    const passaMes = (mesesSelecionados.length === 0 || mesesSelecionados.includes(p.mesValor));
    const passaProf = (profsSelecionados.length === 0 || profsSelecionados.includes(p.professor));
    const passaComp = (compsSelecionados.length === 0 || compsSelecionados.includes(p.componente));
    const passaTurma = (turmasSelecionadas.length === 0 || turmasSelecionadas.includes(p.turma));
    
    return passaAno && passaTrimestre && passaMes && passaProf && passaComp && passaTurma;
  });

  renderizarListaPlanos(dadosFiltrados);
  renderizarConsolidacao(dadosFiltrados);
}

function renderizarListaPlanos(planos) {
  const container = document.getElementById('listaPlanosHtml');
  if (planos.length === 0) {
    container.innerHTML = "<p style='color:#7f8c8d;'>Nenhum planejamento encontrado para os filtros selecionados.</p>";
    return;
  }

  let html = "";
  planos.forEach(p => {
    html += `
      <div class="card-plano">
        <span class="tag tag-tempo">${p.data}</span>
        <span class="tag">${p.trimestreValor}</span>
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
