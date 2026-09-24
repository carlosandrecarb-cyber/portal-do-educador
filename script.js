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
  msg.innerText = "⏳ A Autenticar...";
  try {
    const res = await fetch(URL_API, { method: 'POST', redirect: 'follow', headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ acao: "login", usuario, senha }) });
    const r = await res.json();
    if (r.status === "sucesso") {
      professorLogado = r.nome;
      document.getElementById('telaLogin').style.display = 'none';
      document.getElementById('nomeProfessor').value = r.nome;
      document.getElementById('infoUsuarioBoasVindas').style.display = 'inline-block';
      document.getElementById('infoUsuarioBoasVindas').innerText = `👋 Docente: ${r.nome}`;
      
      carregarComponentesProfessor(r.componentes, r.turmas);
    } else { msg.innerText = r.mensagem || "Erro de login."; }
  } catch (e) { msg.innerText = "⚠️ Erro de conexão com o servidor."; }
}

function carregarComponentesProfessor(componentesLista, turmasLista) {
  const selComp = document.getElementById('componente');
  const areaTurmas = document.getElementById('areaTurmas');

  let htmlComp = '<option value="">Selecione a disciplina...</option>';
  const compArray = (componentesLista?.length && componentesLista[0] !== "") ? componentesLista : ["Matemática", "Língua Portuguesa", "Geografia", "História", "Ciências", "Arte", "Educação Física", "Ensino Religioso", "Língua Inglesa"];
  compArray.forEach(c => htmlComp += `<option value="${c}">${c}</option>`);
  selComp.innerHTML = htmlComp;

  let htmlTurma = '';
  const turmasArray = (turmasLista?.length && turmasLista[0] !== "") ? turmasLista : ["6º Ano", "7º Ano", "8º Ano", "9º Ano"];
  turmasArray.forEach(t => {
    htmlTurma += `<label style="display:flex; align-items:center; cursor:pointer; padding:6px 10px; background:#f8fafc; border:1px solid #edf2f7; border-radius:8px; margin:0;">
                    <input type="checkbox" name="chkTurmaProf" value="${t}" onchange="buscarMatriz()" style="transform:scale(1.2); margin-right:10px; accent-color:var(--cor-secundaria);">
                    ${t}
                  </label>`;
  });
  areaTurmas.innerHTML = htmlTurma;
}

async function buscarMatriz() {
  const componente = document.getElementById('componente').value;
  const turmasMarcadas = Array.from(document.querySelectorAll('input[name="chkTurmaProf"]:checked')).map(cb => cb.value);
  const trimestre = document.getElementById('selTrimestre') ? document.getElementById('selTrimestre').value : "3º Trimestre";
  
  if (!componente || turmasMarcadas.length === 0 || !trimestre) {
    document.getElementById('blocoCurriculo').style.display = 'none';
    return;
  }
  
  const anoBaseParaBusca = turmasMarcadas[0]; 
  
  document.getElementById('unidade').innerHTML = '<option value="">⏳ Buscando matriz...</option>';
  document.getElementById('blocoCurriculo').style.display = 'block';

  try {
    const res = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "buscarMatrizTrimestre", componente: componente, trimestre: trimestre, ano: anoBaseParaBusca }) });
    const r = await res.json();
    dadosMatrizGlobal = r.itens || [];
    let htmlUnidades = '<option value="">Selecione a Unidade Temática...</option>';
    [...new Set(dadosMatrizGlobal.map(i => i.unidade))].forEach(u => htmlUnidades += `<option value="${u}">${u}</option>`);
    
    if(dadosMatrizGlobal.length === 0) { htmlUnidades = '<option value="">⚠️ Nenhuma matriz encontrada.</option>'; }
    document.getElementById('unidade').innerHTML = htmlUnidades;
  } catch(e) { document.getElementById('unidade').innerHTML = '<option value="">Erro na busca.</option>'; }
}

function montarCheckboxes() {
  const unidadeSelecionada = document.getElementById('unidade').value;
  const componente = document.getElementById('componente').value;
  if (!unidadeSelecionada) return;
  document.getElementById('painelOpcoes').style.display = 'block';

  const itens = dadosMatrizGlobal.filter(i => i.unidade === unidadeSelecionada);
  
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
    if (item.habPriorizada && item.habPriorizada !== "-") htmlPri += `<div class="checkbox-item"><input type="radio" name="radioHabPriorizada" value="${item.habPriorizada}"><label>${item.habPriorizada}</label></div>`;
    
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

// ==========================================
// FUNÇÃO MÁGICA DE INTEGRAÇÃO COM GEMINI / CHATGPT
// ==========================================
function abrirIA(tipoIA) {
  const comp = document.getElementById('componente').value || "[Sua Disciplina]";
  const turmasMarcadas = Array.from(document.querySelectorAll('input[name="chkTurmaProf"]:checked')).map(cb => cb.value);
  const turma = turmasMarcadas.length > 0 ? turmasMarcadas.join(" e ") : "[Sua Turma]";
  const tema = document.getElementById('unidade').value || "[Tema da Aula]";
  
  // O Comando Inteligente e pré-formatado que o professor vai usar
  const promptIA = `Atue como um professor especialista em ${comp}. Crie o "Desenvolvimento da Aula" (um passo a passo claro de como a aula vai acontecer na prática) para a turma: ${turma}. O tema central da aula é: "${tema}". 
Por favor, divida o texto de forma prática nestes 3 tópicos:
1. Introdução (Como engajar os alunos no início)
2. Desenvolvimento (O que será feito, atividades e explicações)
3. Fechamento (Como avaliar ou resumir a aula)

Seja direto, utilize metodologias ativas e evite textos teóricos demais. Escreva de forma que eu possa colar diretamente no meu Plano de Aula oficial.`;

  let urlIA = "";
  let nomeIA = "";

  if (tipoIA === 'gemini') {
    urlIA = "https://gemini.google.com/app";
    nomeIA = "Gemini";
  } else if (tipoIA === 'chatgpt') {
    urlIA = "https://chatgpt.com/";
    nomeIA = "ChatGPT";
  }

  // Tenta copiar para a área de transferência do professor e depois abre a IA
  navigator.clipboard.writeText(promptIA).then(() => {
      alert(`✨ MÁGICA FEITA!\n\nCopiámos um comando (prompt) perfeito para o seu telemóvel/computador.\n\nO ${nomeIA} vai abrir numa nova janela. Basta colar (Ctrl+V) lá na conversa para ele escrever a sua aula!`);
      window.open(urlIA, "_blank");
  }).catch(() => {
      // Caso o dispositivo bloqueie a cópia automática
      alert(`⚠️ Não foi possível copiar automaticamente para a área de transferência do seu dispositivo, mas vamos redirecioná-lo para o ${nomeIA} mesmo assim. Lá você pode pedir-lhe ajuda com a aula!`);
      window.open(urlIA, "_blank");
  });
}

const formatarData = (dataBase) => {
  if (!dataBase) return "-";
  const [ano, mes, dia] = dataBase.split('-');
  return `${dia}/${mes}/${ano}`;
};

async function enviarPlanoAulaAPI() {
  const turmasMarcadas = Array.from(document.querySelectorAll('input[name="chkTurmaProf"]:checked')).map(cb => cb.value);
  if(turmasMarcadas.length === 0) { alert("⚠️ Selecione pelo menos uma Turma marcando a caixinha."); return; }

  const btn = document.getElementById('btnGerar');
  btn.innerText = "⏳ A Gerar Documento Oficial...";
  btn.disabled = true;

  const habPri = document.querySelector('input[name="radioHabPriorizada"]:checked');
  const habPrioTexto = habPri ? habPri.value : "Não selecionada";
  
  const itemMatriz = dadosMatrizGlobal.find(i => i.habPriorizada === habPrioTexto);
  const evidenciasMatriz = (itemMatriz && itemMatriz.evidencias && itemMatriz.evidencias !== "-") ? itemMatriz.evidencias : "Avaliação formativa e contínua.";

  const rec = Array.from(document.querySelectorAll('input[name="chkHabRecomposicao"]:checked')).map(c => c.value).join("\n");
  const sup = Array.from(document.querySelectorAll('input[name="chkHabSuporte"]:checked')).map(c => c.value).join("\n");
  const objs = Array.from(document.querySelectorAll('input[name="chkObjeto"]:checked')).map(c => c.value).join(" | ");
  const recursos = Array.from(document.querySelectorAll('input[name="chk_recursos"]:checked')).map(c => c.value).join(", ");
  
  // Une todas as turmas (Ex: "6º Ano A e 6º Ano B")
  const turmaInteira = turmasMarcadas.join(" e ");
  const anoEscolaridade = turmasMarcadas[0].split('º')[0] + "º Ano"; 

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
      alert("✅ Plano gerado com sucesso!");
      window.open(r.url, '_blank');
      mudarAba('meusPlanos', null);
    } else { alert("Erro: " + r.mensagem); }
  } catch(e) { alert("Erro de conexão com o servidor."); } 
  finally { btn.innerText = "🚀 Gerar Plano Oficial & Enviar para Supervisão"; btn.disabled = false; }
}

async function carregarMeusPlanos() {
  const container = document.getElementById('listaDePlanos');
  container.innerHTML = "⏳ A carregar os seus planos...";
  try {
    const res = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "listarSupervisao" }) });
    const r = await res.json();
    if (r.status === "sucesso" && r.registros) {
      const meus = r.registros.filter(i => i.professor.toLowerCase() === professorLogado.toLowerCase());
      if (!meus.length) return container.innerHTML = "<p>Nenhum plano gerado.</p>";
      let html = "";
      meus.reverse().forEach(p => {
        let corStatus = p.status.includes('Aprovado') ? '#10b981' : (p.status.includes('Devolvido') ? '#ef4444' : '#f59e0b');
        html += `<div class="plano-item"><strong>📅 Data:</strong> ${p.data} | <strong>📚 Disciplina:</strong> ${p.componente} <br><strong>🏷️ Turmas:</strong> ${p.turma}<br><br>
        <span style="display:inline-block; margin-bottom:10px; padding:4px 10px; background:${corStatus}; color:white; border-radius:6px; font-size:0.85rem; font-weight:bold;">${p.status}</span><br>
        <a href="${p.docUrl}" target="_blank" style="background:#2563eb; color:white; padding:6px 12px; text-decoration:none; border-radius:6px; font-weight:bold; margin-right: 10px;">📄 Abrir Google Doc</a> 
        <button onclick="abrirModalQR('${p.pastaUrl}')" style="background:#1e293b; border:none; color:white; padding:6px 12px; text-decoration:none; border-radius:6px; font-weight:bold; cursor:pointer;">📱 Enviar Evidências (QR)</button></div>`;
      });
      container.innerHTML = html;
    }
  } catch (e) { container.innerHTML = "<p>Erro ao carregar lista.</p>"; }
}

function abrirModalQR(url) { document.getElementById('imgQRCode').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`; document.getElementById('modalQR').style.display = 'flex'; }
function fecharModalQR() { document.getElementById('modalQR').style.display = 'none'; }
document.addEventListener("DOMContentLoaded", () => { const btn = document.getElementById('btnGerar'); if(btn) btn.onclick = enviarPlanoAulaAPI; });
