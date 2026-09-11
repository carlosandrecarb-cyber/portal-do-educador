const URL_API = "https://script.google.com/macros/s/AKfycbzrbfJgz-TSiyWftvEDXH4ZsxZBAYamozeYho2f4KH1T7ZnjBWdwVobHqirP0bDnGMj/exec";
var professorLogado = "";
var dadosMatrizGlobal = [];

function mudarAba(abaId, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tabs button').forEach(el => el.classList.remove('active'));
  document.getElementById(abaId).classList.add('active');
  
  if (btn) {
    btn.classList.add('active');
  } else {
    document.querySelectorAll('.tabs button').forEach(b => {
      if ((abaId === 'gerarPlano' && b.innerText.includes('Gerar Plano')) ||
          (abaId === 'meusPlanos' && b.innerText.includes('Meus Planos'))) {
        b.classList.add('active');
      }
    });
  }

  if (abaId === 'meusPlanos') carregarMeusPlanos();
}

function verificarEscolaManual() {
  const codigo = document.getElementById('inputCodigoEscola').value.trim().toLowerCase();
  const msg = document.getElementById('msgWorkspace');
  
  if (!codigo) { msg.innerText = "Digite o código da instituição."; return; }

  if (codigo.length > 1) {
    document.getElementById('telaWorkspace').style.display = 'none';
    document.getElementById('telaLogin').style.display = 'flex';
    document.getElementById('tituloNomeEscola').innerText = "Escola Mestra Aurora";
    document.getElementById('logoLogin').src = "https://lh3.googleusercontent.com/d/1A2c_3Me99qofg25uyoor4roLHybutll5";
    document.getElementById('logoHeader').src = "https://lh3.googleusercontent.com/d/1A2c_3Me99qofg25uyoor4roLHybutll5";
  } else {
    msg.innerText = "Código institucional não reconhecido.";
  }
}

async function fazerLogin() {
  const usuario = document.getElementById('loginUsuario').value.trim();
  const senha = document.getElementById('loginSenha').value.trim();
  const msg = document.getElementById('msgLogin');

  if (!usuario || !senha) { msg.innerText = "Preencha usuário e senha."; return; }

  msg.innerText = "⏳ Autenticando...";
  try {
    const res = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "login", usuario, senha }) });
    const r = await res.json();

    if (r.status === "sucesso") {
      professorLogado = r.nome;
      document.getElementById('telaLogin').style.display = 'none';
      document.getElementById('nomeProfessor').value = r.nome;
      
      const headerBoasVindas = document.getElementById('infoUsuarioBoasVindas');
      headerBoasVindas.style.display = 'inline-block';
      headerBoasVindas.innerText = `👋 Docente: ${r.nome}`;

      carregarComponentesProfessor(r.componentes, r.turmas);
    } else {
      msg.innerText = r.mensagem || "Usuário ou senha incorretos.";
    }
  } catch (e) {
    msg.innerText = "⚠️ Erro de conexão com o servidor.";
  }
}

function carregarComponentesProfessor(componentes, turmas) {
  const selComp = document.getElementById('componente');
  const divTurmas = document.getElementById('turmaSelecionada');

  let htmlComp = '<option value="">Selecione o componente...</option>';
  (componentes?.length ? componentes : ["Matemática", "Língua Portuguesa", "Geografia", "História", "Ciências", "Língua Inglesa", "Arte", "Educação Física", "Ensino Religioso"]).forEach(c => {
    htmlComp += `<option value="${c}">${c}</option>`;
  });
  selComp.innerHTML = htmlComp;

  let htmlTurma = '';
  (turmas?.length ? turmas : ["6º Ano", "7º Ano", "8º Ano", "9º Ano"]).forEach(t => {
    htmlTurma += `<label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.95rem; color:#334155;">
                    <input type="checkbox" name="chkTurma" value="${t}" onchange="buscarMatriz()" style="width:16px; height:16px; accent-color:var(--cor-secundaria);"> ${t}
                  </label>`;
  });
  divTurmas.innerHTML = htmlTurma;
}

async function buscarMatriz() {
  const componente = document.getElementById('componente').value;
  const turmasMarcadas = Array.from(document.querySelectorAll('input[name="chkTurma"]:checked')).map(cb => cb.value);
  const trimestre = document.getElementById('selTrimestre') ? document.getElementById('selTrimestre').value : "3º Trimestre";

  if (!componente || turmasMarcadas.length === 0 || !trimestre) {
    document.getElementById('blocoCurriculo').style.display = 'none';
    return;
  }

  const ano = turmasMarcadas[0];
  const labelUnidade = document.getElementById('labelUnidadeDinamica');
  if (componente === "Língua Portuguesa" || componente === "Língua Inglesa") {
    labelUnidade.innerText = "Unidade Temática / Prática de Linguagem";
    if(document.getElementById('areaGenero')) document.getElementById('areaGenero').style.display = 'block';
  } else {
    labelUnidade.innerText = "Unidade Temática";
    if(document.getElementById('areaGenero')) document.getElementById('areaGenero').style.display = 'none';
  }

  const selUnidade = document.getElementById('unidade');
  selUnidade.innerHTML = '<option value="">Buscando unidades do trimestre...</option>';

  try {
    const res = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "buscarMatrizTrimestre", componente, trimestre, ano }) });
    const r = await res.json();
    
    dadosMatrizGlobal = r.itens || [];
    let htmlUnidades = '<option value="">Selecione a Unidade Temática...</option>';
    const unidadesUnicas = [...new Set(dadosMatrizGlobal.map(i => i.unidade))];
    
    if (unidadesUnicas.length > 0) {
      unidadesUnicas.forEach(u => { htmlUnidades += `<option value="${u}">${u}</option>`; });
      document.getElementById('blocoCurriculo').style.display = 'block';
    } else {
      htmlUnidades = '<option value="">Nenhuma unidade cadastrada para este trimestre</option>';
    }
    selUnidade.innerHTML = htmlUnidades;
  } catch(e) {
    selUnidade.innerHTML = '<option value="">Erro ao conectar com a planilha mestra</option>';
  }
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
  let generosSet = new Set();

  itens.forEach(item => {
    if (item.habPriorizada && item.habPriorizada !== "-") {
      htmlPri += `<div class="checkbox-item"><input type="checkbox" name="chkHabPriorizada" value="${item.habPriorizada}"><label>${item.habPriorizada}</label></div>`;
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
    
    if (item.genero && item.genero !== "-") {
      generosSet.add(item.genero);
    }
  });

  // MONTAGEM DAS CAIXAS COLORIDAS SEPARADAS
  let painelHabilidades = `<div style="background:#fffbeb; padding:15px; border-radius:12px; border:1px solid #fde68a; margin-bottom:15px;">
                              <label style="font-weight:700; color:#d97706; margin-bottom:10px; display:block;">🎯 ${tituloHabPrincipal}</label>
                              ${htmlPri || '<p style="color:#94a3b8; font-size:0.9rem;">Nenhuma cadastrada.</p>'}
                           </div>`;

  if (mostrarRecSup) {
    painelHabilidades += `<div style="background:#f0fdf4; padding:15px; border-radius:12px; border:1px solid #bbf7d0; margin-bottom:15px;">
                              <label style="font-weight:700; color:#166534; margin-bottom:10px; display:block;">🩹 Habilidades de Recomposição:</label>
                              ${htmlRec || '<p style="color:#94a3b8; font-size:0.9rem;">Nenhuma cadastrada.</p>'}
                          </div>`;
    painelHabilidades += `<div style="background:#eff6ff; padding:15px; border-radius:12px; border:1px solid #bfdbfe; margin-bottom:15px;">
                              <label style="font-weight:700; color:#1e40af; margin-bottom:10px; display:block;">🛠️ Habilidades de Suporte:</label>
                              ${htmlSup || '<p style="color:#94a3b8; font-size:0.9rem;">Nenhuma cadastrada.</p>'}
                          </div>`;
  } else if (mostrarSocioemocional) {
    painelHabilidades += `<div style="background:#f0fdf4; padding:15px; border-radius:12px; border:1px solid #bbf7d0; margin-bottom:15px;">
                              <label style="font-weight:700; color:#166534; margin-bottom:10px; display:block;">🤝 Habilidades Socioemocionais:</label>
                              ${htmlRec || '<p style="color:#94a3b8; font-size:0.9rem;">Nenhuma cadastrada.</p>'}
                          </div>`;
  }

  document.getElementById('areaHabilidades').innerHTML = painelHabilidades;

  let htmlObj = `<label style="font-weight:700; color:#0284c7; display:block; margin-bottom:8px;">${tituloConteudo}</label>`;
  conteudoSet.forEach(cont => htmlObj += `<div class="checkbox-item"><input type="checkbox" name="chkObjeto" value="${cont}"><label>${cont}</label></div>`);
  document.getElementById('listaObjetos').innerHTML = conteudoSet.size > 0 ? htmlObj : '<p style="color:#94a3b8; font-size:0.9rem;">Nenhum conteúdo localizado.</p>';

  const campoGenero = document.getElementById('generoTextual');
  if (campoGenero && (componente === "Língua Portuguesa" || componente === "Língua Inglesa")) {
    campoGenero.value = Array.from(generosSet).join(" | ");
  }
}

const formatarData = (dataBase) => {
  if (!dataBase) return "-";
  const [ano, mes, dia] = dataBase.split('-');
  return `${dia}/${mes}/${ano}`;
};

async function enviarPlanoAulaAPI() {
  const btnGerar = document.getElementById('btnGerar');
  const turmasMarcadas = Array.from(document.querySelectorAll('input[name="chkTurma"]:checked')).map(cb => cb.value);

  if (turmasMarcadas.length === 0) {
    alert("⚠️ Por favor, marque pelo menos uma turma na Etapa 1.");
    return;
  }

  btnGerar.innerText = "⏳ Gerando Documento Oficial...";
  btnGerar.disabled = true;

  // Extrai as seleções (agora a Priorizada permite múltiplas marcações)
  const pri = Array.from(document.querySelectorAll('input[name="chkHabPriorizada"]:checked')).map(c => c.value).join("\n");
  const rec = Array.from(document.querySelectorAll('input[name="chkHabRecomposicao"]:checked')).map(c => c.value).join("\n");
  const sup = Array.from(document.querySelectorAll('input[name="chkHabSuporte"]:checked')).map(c => c.value).join("\n");
  
  // Extração das evidências com base em qualquer habilidade marcada
  let evidenciasMatriz = "Avaliação formativa e contínua do processo de aprendizagem.";
  let todasSelecionadas = [
    ...document.querySelectorAll('input[name="chkHabPriorizada"]:checked'),
    ...document.querySelectorAll('input[name="chkHabRecomposicao"]:checked'),
    ...document.querySelectorAll('input[name="chkHabSuporte"]:checked')
  ];

  if (todasSelecionadas.length > 0) {
    let textoBusca = todasSelecionadas[0].value;
    let itemAchado = dadosMatrizGlobal.find(i => i.habPriorizada === textoBusca || i.habRecomposicao === textoBusca || i.habSuporte === textoBusca);
    if (itemAchado && itemAchado.evidencias && itemAchado.evidencias !== "-") {
      evidenciasMatriz = itemAchado.evidencias;
    }
  }

  const objs = Array.from(document.querySelectorAll('input[name="chkObjeto"]:checked')).map(c => c.value).join(" | ");
  const recursosSelecionados = Array.from(document.querySelectorAll('input[name="chk_recursos"]:checked')).map(c => c.value).join(", ");
  const acoesEstrategicas = Array.from(document.querySelectorAll('.chk-estrategia:checked')).map(cb => cb.value).join(" | ");
  
  const turmaInteira = turmasMarcadas.join(" e ");
  const anoEscolaridade = turmasMarcadas[0].split(' ')[0] + " Ano"; 

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
    habPriorizada: pri || "",
    habRecomposicao: rec || "",
    habSuporte: sup || "",
    objetoConhecimento: objs || "-",
    genero: document.getElementById('generoTextual') ? document.getElementById('generoTextual').value : "-",
    desenvolvimento: document.getElementById('desenvolvimento').value + (acoesEstrategicas ? "\n\nAções Estratégicas: " + acoesEstrategicas : ""),
    recursos: recursosSelecionados || "-",
    evidencias: evidenciasMatriz
  };

  try {
    const res = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "gerarPlano", planoData: dadosPlano }) });
    const r = await res.json();
    if (r.status === "sucesso") {
      alert("✅ Plano de aula gerado com sucesso!");
      window.open(r.url, '_blank');
      mudarAba('meusPlanos', null);
    } else {
      alert("⚠️ Erro ao gerar plano: " + r.mensagem);
    }
  } catch(e) { 
    alert("⚠️ Erro de conexão ao enviar o plano de aula."); 
  } finally { 
    btnGerar.innerText = "🚀 Gerar Plano Oficial & Enviar"; 
    btnGerar.disabled = false; 
  }
}

async function carregarMeusPlanos() {
  const container = document.getElementById('listaDePlanos');
  container.innerHTML = "⏳ Carregando seus planos...";
  try {
    const res = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "listarSupervisao" }) });
    const r = await res.json();
    if (r.status === "sucesso" && r.registros) {
      const meus = r.registros.filter(i => i.professor.toLowerCase() === professorLogado.toLowerCase());
      if (!meus.length) {
        container.innerHTML = "<p>Nenhum plano gerado por você ainda. Crie seu primeiro plano na aba ao lado! 📝</p>";
        return;
      }
      let html = "";
      meus.reverse().forEach(p => {
        html += `<div class="plano-item">
          <strong>📅 Data:</strong> ${p.data} | <strong>📚 Disciplina:</strong> ${p.componente} (${p.turma} - ${p.trimestre || 'Trimestre'})<br>
          <strong>🎯 Unidade:</strong> ${p.unidade}<br>
          <strong>📌 Status:</strong> ${p.status}<br>
          <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
            <a href="${p.docUrl}" target="_blank" style="background:#2980b9; color:white; padding:8px 14px; border-radius:10px; text-decoration:none; font-size:0.85rem; font-weight:700;">📄 Abrir Google Doc</a>
            <a href="${p.pastaUrl}" target="_blank" style="background:#e67e22; color:white; padding:8px 14px; border-radius:10px; text-decoration:none; font-size:0.85rem; font-weight:700;">📁 Pasta de Evidências</a>
          </div>
          <button class="btn-camera" style="background:#8e44ad;" onclick="abrirModalQR('${p.pastaUrl}')">📱 Enviar Fotos / Evidências via Celular (QR Code)</button>
        </div>`;
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = "<p>Nenhum registro encontrado.</p>";
    }
  } catch (e) { container.innerHTML = "<p>Erro ao carregar o histórico de planos.</p>"; }
}

function abrirModalQR(url) {
  const modal = document.getElementById('modalQR');
  const imgQR = document.getElementById('imgQRCode');
  if (modal && imgQR && url) {
    imgQR.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`; 
    modal.style.display = 'flex';
  } else { alert("URL da pasta indisponível."); }
}

function fecharModalQR() { document.getElementById('modalQR').style.display = 'none'; }

function sairDoSistema() {
  professorLogado = "";
  document.getElementById('loginSenha').value = ""; 
  document.getElementById('infoUsuarioBoasVindas').style.display = 'none';
  document.getElementById('telaWorkspace').style.display = 'flex';
  document.getElementById('telaLogin').style.display = 'none';
  document.getElementById('inputCodigoEscola').value = "";
  document.getElementById('msgWorkspace').innerText = "";
  document.getElementById('msgLogin').innerText = "";
  mudarAba('gerarPlano', null);
}

function limparFormulario() {
  if(!confirm("Tem certeza que deseja limpar o formulário? O texto do desenvolvimento será apagado.")) return;
  document.getElementById('tipoPlano').selectedIndex = 0;
  document.getElementById('qtdAulas').value = 1;
  document.getElementById('componente').selectedIndex = 0;
  document.getElementById('selTrimestre').selectedIndex = 2;
  document.getElementById('dataInicioPer').value = "";
  document.getElementById('dataFimPer').value = "";
  document.querySelectorAll('input[name="chkTurma"]').forEach(cb => cb.checked = false);
  document.getElementById('blocoCurriculo').style.display = 'none';
  document.getElementById('painelOpcoes').style.display = 'none';
  document.getElementById('unidade').innerHTML = '<option value="">Selecione a Unidade Temática...</option>';
  document.getElementById('desenvolvimento').value = "";
  if(document.getElementById('generoTextual')) document.getElementById('generoTextual').value = "";
  document.querySelectorAll('input[name="chk_recursos"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('.chk-estrategia').forEach(cb => cb.checked = false);
}

document.addEventListener("DOMContentLoaded", () => { 
  const btn = document.getElementById('btnGerar'); 
  if(btn) btn.onclick = enviarPlanoAulaAPI; 
});
