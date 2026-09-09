const URL_API = "https://script.google.com/macros/s/AKfycbzrbfJgz-TSiyWftvEDXH4ZsxZBAYamozeYho2f4KH1T7ZnjBWdwVobHqirP0bDnGMj/exec";
var professorLogado = "";
var dadosMatrizGlobal = [];

function mudarAba(abaId, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tabs button').forEach(el => el.classList.remove('active'));
  document.getElementById(abaId).classList.add('active');
  if (btn) btn.classList.add('active');
  else document.querySelectorAll('.tabs button').forEach(b => { if (b.innerText.includes(abaId === 'gerarPlano' ? 'Gerar' : 'Meus')) b.classList.add('active'); });
  if (abaId === 'meusPlanos') carregarMeusPlanos();
}

function verificarEscolaManual() {
  const codigo = document.getElementById('inputCodigoEscola').value.trim().toLowerCase();
  if (codigo.length > 1) {
    document.getElementById('telaWorkspace').style.display = 'none';
    document.getElementById('telaLogin').style.display = 'flex';
    document.getElementById('tituloNomeEscola').innerText = "Escola Mestra Aurora";
    document.getElementById('logoLogin').src = "https://lh3.googleusercontent.com/d/1A2c_3Me99qofg25uyoor4roLHybutll5";
    document.getElementById('logoHeader').src = "https://lh3.googleusercontent.com/d/1A2c_3Me99qofg25uyoor4roLHybutll5";
  } else { document.getElementById('msgWorkspace').innerText = "Código não reconhecido."; }
}

async function fazerLogin() {
  const usuario = document.getElementById('loginUsuario').value.trim();
  const senha = document.getElementById('loginSenha').value.trim();
  const msg = document.getElementById('msgLogin');
  msg.innerText = "⏳ Autenticando...";
  try {
    const res = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "login", usuario, senha }) });
    const r = await res.json();
    if (r.status === "sucesso") {
      professorLogado = r.nome;
      document.getElementById('telaLogin').style.display = 'none';
      document.getElementById('nomeProfessor').value = r.nome;
      document.getElementById('infoUsuarioBoasVindas').style.display = 'inline-block';
      document.getElementById('infoUsuarioBoasVindas').innerText = `👋 Docente: ${r.nome}`;
      carregarComponentesProfessor(r.componentes, r.turmas);
    } else { msg.innerText = r.mensagem || "Erro."; }
  } catch (e) { msg.innerText = "⚠️ Erro de conexão."; }
}

function carregarComponentesProfessor(componentes, turmas) {
  let htmlComp = '<option value="">Selecione...</option>';
  (componentes?.length ? componentes : ["Matemática", "Língua Portuguesa", "Geografia", "História", "Ciências", "Arte", "Educação Física", "Ensino Religioso"]).forEach(c => htmlComp += `<option value="${c}">${c}</option>`);
  document.getElementById('componente').innerHTML = htmlComp;
  let htmlTurma = '<option value="">Selecione...</option>';
  (turmas?.length ? turmas : ["6º Ano", "7º Ano", "8º Ano", "9º Ano"]).forEach(t => htmlTurma += `<option value="${t}">${t}</option>`);
  document.getElementById('turmaSelecionada').innerHTML = htmlTurma;
}

async function buscarMatriz() {
  const componente = document.getElementById('componente').value;
  const ano = document.getElementById('turmaSelecionada').value;
  const trimestre = document.getElementById('selTrimestre') ? document.getElementById('selTrimestre').value : "3º Trimestre";
  if (!componente || !ano || !trimestre) return;
  
  document.getElementById('unidade').innerHTML = '<option value="">Buscando...</option>';
  try {
    const res = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "buscarMatrizTrimestre", componente, trimestre, ano }) });
    const r = await res.json();
    dadosMatrizGlobal = r.itens || [];
    let htmlUnidades = '<option value="">Selecione a Unidade...</option>';
    [...new Set(dadosMatrizGlobal.map(i => i.unidade))].forEach(u => htmlUnidades += `<option value="${u}">${u}</option>`);
    document.getElementById('unidade').innerHTML = htmlUnidades;
    document.getElementById('blocoCurriculo').style.display = 'block';
  } catch(e) { document.getElementById('unidade').innerHTML = '<option value="">Erro.</option>'; }
}

function montarCheckboxes() {
  const unidadeSelecionada = document.getElementById('unidade').value;
  const componente = document.getElementById('componente').value;
  if (!unidadeSelecionada) return;
  document.getElementById('painelOpcoes').style.display = 'block';

  const itens = dadosMatrizGlobal.filter(i => i.unidade === unidadeSelecionada);
  
  // Títulos dinâmicos exigidos pelo Estado
  let tituloHabPrincipal = "Habilidade do CRMG:";
  let tituloConteudo = "Conteúdos Relacionados:";
  let mostrarRecSup = false;
  let mostrarSocioemocional = false;

  if (componente === "Língua Portuguesa" || componente === "Matemática") {
    tituloHabPrincipal = "Habilidade Priorizada do ano escolar:";
    tituloConteudo = "Objeto do conhecimento da habilidade priorizada:";
    mostrarRecSup = true;
  } else if (componente === "Ensino Religioso") {
    mostrarSocioemocional = true;
  }

  let htmlPri = "", htmlRec = "", htmlSup = "";
  let conteudoSet = new Set();

  itens.forEach(item => {
    if (item.habPriorizada && item.habPriorizada !== "-") {
      htmlPri += `<div class="checkbox-item"><input type="radio" name="radioHabPriorizada" value="${item.habPriorizada}"><label>${item.habPriorizada}</label></div>`;
    }
    
    if (mostrarRecSup) {
      if (item.habRecomposicao && item.habRecomposicao !== "-") htmlRec += `<div class="checkbox-item"><input type="checkbox" name="chkHabRecomposicao" value="${item.habRecomposicao}"><label>${item.habRecomposicao}</label></div>`;
      if (item.habSuporte && item.habSuporte !== "-") htmlSup += `<div class="checkbox-item"><input type="checkbox" name="chkHabSuporte" value="${item.habSuporte}"><label>${item.habSuporte}</label></div>`;
    } else if (mostrarSocioemocional) {
      if (item.habRecomposicao && item.habRecomposicao !== "-") htmlRec += `<div class="checkbox-item"><input type="checkbox" name="chkHabRecomposicao" value="${item.habRecomposicao}"><label>${item.habRecomposicao}</label></div>`;
    }

    if (componente === "Língua Portuguesa" || componente === "Matemática") {
      if (item.objetoConhecimento && item.objetoConhecimento !== "-") conteudoSet.add(item.objetoConhecimento);
    } else {
      if (item.conteudosRelacionados && item.conteudosRelacionados !== "-") conteudoSet.add(item.conteudosRelacionados);
    }
  });

  let painelHabilidades = `<label style="font-weight:700; color:#d97706;">${tituloHabPrincipal}</label>${htmlPri || '<p>Nenhuma.</p>'}`;
  if (mostrarRecSup) {
    painelHabilidades += `${htmlRec ? `<label style="font-weight:700; color:#d97706; margin-top:10px;">Habilidades de Recomposição:</label>${htmlRec}` : ''}`;
    painelHabilidades += `${htmlSup ? `<label style="font-weight:700; color:#d97706; margin-top:10px;">Habilidades de Suporte:</label>${htmlSup}` : ''}`;
  } else if (mostrarSocioemocional) {
    painelHabilidades += `${htmlRec ? `<label style="font-weight:700; color:#d97706; margin-top:10px;">Habilidades Socioemocionais:</label>${htmlRec}` : ''}`;
  }

  document.getElementById('listaHabilidades').innerHTML = painelHabilidades;

  let htmlObj = `<label style="font-weight:700; color:#0284c7; display:block; margin-bottom:8px;">${tituloConteudo}</label>`;
  conteudoSet.forEach(cont => htmlObj += `<div class="checkbox-item"><input type="checkbox" name="chkObjeto" value="${cont}"><label>${cont}</label></div>`);
  document.getElementById('listaObjetos').innerHTML = conteudoSet.size > 0 ? htmlObj : '<p>Nenhum conteúdo localizado.</p>';
}

const formatarData = (dataBase) => {
  if (!dataBase) return "-";
  const [ano, mes, dia] = dataBase.split('-');
  return `${dia}/${mes}/${ano}`;
};

async function enviarPlanoAulaAPI() {
  const btn = document.getElementById('btnGerar');
  btn.innerText = "⏳ Gerando Documento Oficial...";
  btn.disabled = true;

  const habPri = document.querySelector('input[name="radioHabPriorizada"]:checked');
  const habPrioTexto = habPri ? habPri.value : "Não selecionada";
  
  // Extrai evidências da planilha mestra e atrela ao documento
  const itemMatriz = dadosMatrizGlobal.find(i => i.habPriorizada === habPrioTexto);
  const evidenciasMatriz = (itemMatriz && itemMatriz.evidencias && itemMatriz.evidencias !== "-") ? itemMatriz.evidencias : "Avaliação formativa e contínua do processo de aprendizagem.";

  const rec = Array.from(document.querySelectorAll('input[name="chkHabRecomposicao"]:checked')).map(c => c.value).join("\n");
  const sup = Array.from(document.querySelectorAll('input[name="chkHabSuporte"]:checked')).map(c => c.value).join("\n");
  const objs = Array.from(document.querySelectorAll('input[name="chkObjeto"]:checked')).map(c => c.value).join(" | ");
  const recursos = Array.from(document.querySelectorAll('input[name="chk_recursos"]:checked')).map(c => c.value).join(", ");
  
  const turmaInteira = document.getElementById('turmaSelecionada').value;
  const anoEscolaridade = turmaInteira.split(' ')[0] + " Ano"; 

  const dadosPlano = {
    professor: document.getElementById('nomeProfessor').value,
    tipoPlano: document.getElementById('tipoPlano').value,
    componente: document.getElementById('componente').value,
    qtdAulas: document.getElementById('qtdAulas').value,
    dataInicio: formatarData(document.getElementById('dataInicioPer').value),
    dataFim: formatarData(document.getElementById('dataFimPer').value),
    turma: turmaInteira,
    ano: anoEscolaridade,
    trimestre: document.getElementById('selTrimestre').value,
    unidade: document.getElementById('unidade').value,
    habPriorizada: habPrioTexto,
    habRecomposicao: rec,
    habSuporte: sup,
    objetoConhecimento: objs || "-",
    desenvolvimento: document.getElementById('desenvolvimento').value,
    recursos: recursos || "-",
    evidencias: evidenciasMatriz
  };

  try {
    const res = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "gerarPlano", planoData: dadosPlano }) });
    const r = await res.json();
    if (r.status === "sucesso") {
      alert("✅ Plano de aula gerado com sucesso!");
      window.open(r.url, '_blank');
      mudarAba('meusPlanos', null);
    } else { alert("Erro: " + r.mensagem); }
  } catch(e) { alert("Erro de conexão."); } 
  finally { btn.innerText = "🚀 Gerar Plano Oficial & Enviar para Supervisão"; btn.disabled = false; }
}

async function carregarMeusPlanos() {
  const container = document.getElementById('listaDePlanos');
  container.innerHTML = "⏳ Carregando...";
  try {
    const res = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "listarSupervisao" }) });
    const r = await res.json();
    if (r.status === "sucesso" && r.registros) {
      const meus = r.registros.filter(i => i.professor.toLowerCase() === professorLogado.toLowerCase());
      if (!meus.length) return container.innerHTML = "<p>Nenhum plano gerado.</p>";
      let html = "";
      meus.reverse().forEach(p => {
        html += `<div class="plano-item"><strong>📅 Data:</strong> ${p.data} | <strong>📚 Disciplina:</strong> ${p.componente} (${p.turma})<br>
        <a href="${p.docUrl}" target="_blank">📄 Abrir Google Doc</a> <button onclick="abrirModalQR('${p.pastaUrl}')">📱 QR Code</button></div>`;
      });
      container.innerHTML = html;
    }
  } catch (e) { container.innerHTML = "<p>Erro.</p>"; }
}

function abrirModalQR(url) { document.getElementById('imgQRCode').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`; document.getElementById('modalQR').style.display = 'flex'; }
function fecharModalQR() { document.getElementById('modalQR').style.display = 'none'; }
document.addEventListener("DOMContentLoaded", () => { const btn = document.getElementById('btnGerar'); if(btn) btn.onclick = enviarPlanoAulaAPI; });
