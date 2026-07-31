// ==========================================
// API DO SISTEMA
// ==========================================
const URL_API_GOOGLE = "https://script.google.com/macros/s/AKfycbxFRiIGmxDp5z0GNFIjkdtx7pbA7qTbO8NfJqT1TgAmh1XlXyzh1GdPXI8XGDW4QBqA/exec";

let dadosGlobais = [];

// ==========================================
// SISTEMA DE LOGIN E UI
// ==========================================
function fazerLogin() {
  var btn = document.querySelector('#telaLogin button');
  var txtOrig = btn.innerText;
  btn.innerText = "Autenticando...";
  
  var usu = document.getElementById('loginUsuario').value;
  var sen = document.getElementById('loginSenha').value;
  
  fetch(URL_API_GOOGLE, { 
    method: 'POST', 
    body: JSON.stringify({ acao: "login", usuario: usu, senha: sen }) 
  })
  .then(res => res.json())
  .then(resp => {
    if(resp.status === "sucesso") {
      if(resp.perfil === "Especialista") {
        document.getElementById('telaLogin').style.display = 'none';
        document.getElementById('loading').style.display = 'block';
        buscarHistoricoGeral(); 
      } else {
        document.getElementById('msgLogin').innerText = "⚠️ Acesso restrito apenas para Especialistas.";
        btn.innerText = txtOrig;
      }
    } else { 
      document.getElementById('msgLogin').innerText = "⚠️ " + resp.mensagem; 
      btn.innerText = txtOrig;
    }
  })
  .catch(err => {
     document.getElementById('msgLogin').innerText = "⚠️ Falha de comunicação com o servidor.";
     btn.innerText = txtOrig;
  });
}

function mudarAbaEspecialista(abaId, elementoBotao) {
  document.querySelectorAll('.secao').forEach(el => el.classList.remove('ativa'));
  document.querySelectorAll('.btn-aba').forEach(el => el.classList.remove('ativa'));
  document.getElementById(abaId).classList.add('ativa');
  elementoBotao.classList.add('ativa');
}

// Função para abrir e fechar o painel de filtros
function toggleFiltros() {
  const painel = document.getElementById('painelFiltrosArea');
  const btn = document.querySelector('.btn-toggle-filtros');
  
  if (painel.style.display === 'grid') {
    painel.style.display = 'none';
    btn.innerHTML = "⚙️ Abrir Filtros Avançados";
  } else {
    painel.style.display = 'grid';
    btn.innerHTML = "❌ Fechar Filtros";
  }
}

// ==========================================
// BUSCA DE DADOS E FILTROS
// ==========================================
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

  preencherCheckboxes('filtroTags', ["Recuperação Trimestral", "Recomposição da Aprendizagem"]);
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
  const profsSelecionados = obterValoresMultiplos('filtroProfessor');
  const compsSelecionados = obterValoresMultiplos('filtroComponente');
  const turmasSelecionadas = obterValoresMultiplos('filtroTurma');
  const tagsSelecionadas = obterValoresMultiplos('filtroTags');
  
  const dInicioStr = document.getElementById('dataInicio').value;
  const dFimStr = document.getElementById('dataFim').value;
  
  const dInicio = dInicioStr ? new Date(dInicioStr + "T00:00:00").getTime() : 0;
  const dFim = dFimStr ? new Date(dFimStr + "T23:59:59").getTime() : Infinity;

  const dadosFiltrados = dadosGlobais.filter(p => {
    const passaProf = (profsSelecionados.length === 0 || profsSelecionados.includes(p.professor));
    const passaComp = (compsSelecionados.length === 0 || compsSelecionados.includes(p.componente));
    const passaTurma = (turmasSelecionadas.length === 0 || turmasSelecionadas.includes(p.turma));
    const passaData = (p.dataTimestamp >= dInicio && p.dataTimestamp <= dFim);
    
    let passaTag = true;
    if (tagsSelecionadas.length > 0) {
      passaTag = tagsSelecionadas.some(tag => p.tagsEstrategicas && p.tagsEstrategicas.includes(tag));
    }
    
    return passaProf && passaComp && passaTurma && passaData && passaTag;
  });

  renderizarListaPlanos(dadosFiltrados);
  renderizarConsolidacao(dadosFiltrados);
}

// ==========================================
// RENDERIZAÇÃO NA TELA
// ==========================================
function renderizarListaPlanos(planos) {
  const container = document.getElementById('listaPlanosHtml');
  const placar = document.getElementById('resumoPlacar');
  
  // Atualiza o Placar de Resultados
  if (planos.length === 0) {
    placar.innerHTML = "Nenhum plano encontrado com estes filtros.";
    container.innerHTML = "";
    return;
  } else if (planos.length === 1) {
    placar.innerHTML = "✔️ 1 Plano Oficial Encontrado";
  } else {
    placar.innerHTML = "✔️ " + planos.length + " Planos Oficiais Encontrados";
  }

  let html = "";
  planos.forEach(p => {
    let tagsHtml = "";
    if (p.tagsEstrategicas && p.tagsEstrategicas !== "-" && p.tagsEstrategicas !== "Nenhuma") {
        let arrayTags = p.tagsEstrategicas.split("|").map(t => t.trim()).filter(t => t);
        arrayTags.forEach(t => {
            tagsHtml += `<span class="tag tag-estrategica">🎯 ${t}</span> `;
        });
    }

    html += `
      <div class="card-plano">
        <span class="tag" style="background:#2980b9;">${p.data}</span>
        ${tagsHtml}
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
