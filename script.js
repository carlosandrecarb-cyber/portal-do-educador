// ==========================================
// SCRIPT DEFINITIVO - PORTAL DO PROFESSOR
// ==========================================

const URL_API = "https://script.google.com/macros/s/AKfycbzrbfJgz-TSiyWftvEDXH4ZsxZBAYamozeYho2f4KH1T7ZnjBWdwVobHqirP0bDnGMj/exec";
var professorLogado = "";
var dadosMatrizGlobal = [];

// Controle de Abas
function mudarAba(abaId, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tabs button').forEach(el => el.classList.remove('active'));
  document.getElementById(abaId).classList.add('active');
  
  if (btn) {
    btn.classList.add('active');
  } else {
    // Se ativado programaticamente, acha o botão correspondente
    document.querySelectorAll('.tabs button').forEach(b => {
      if ((abaId === 'gerarPlano' && b.innerText.includes('Gerar Plano')) ||
          (abaId === 'meusPlanos' && b.innerText.includes('Meus Planos'))) {
        b.classList.add('active');
      }
    });
  }

  if (abaId === 'meusPlanos') {
    carregarMeusPlanos();
  }
}

// Autenticação Institucional
function verificarEscolaManual() {
  const codigo = document.getElementById('inputCodigoEscola').value.trim().toLowerCase();
  const msg = document.getElementById('msgWorkspace');
  
  if (!codigo) {
    msg.innerText = "Digite o código da instituição.";
    return;
  }

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

// Login do Professor
async function fazerLogin() {
  const usuario = document.getElementById('loginUsuario').value.trim();
  const senha = document.getElementById('loginSenha').value.trim();
  const msg = document.getElementById('msgLogin');

  if (!usuario || !senha) {
    msg.innerText = "Preencha usuário e senha.";
    return;
  }

  msg.innerText = "⏳ Autenticando...";
  try {
    const res = await fetch(URL_API, {
      method: 'POST',
      body: JSON.stringify({ acao: "login", usuario, senha })
    });
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
    console.error(e);
  }
}

function carregarComponentesProfessor(componentes, turmas) {
  const selComp = document.getElementById('componente');
  const selTurma = document.getElementById('turmaSelecionada');

  let htmlComp = '<option value="">Selecione o componente...</option>';
  if (componentes && componentes.length > 0) {
    componentes.forEach(c => { htmlComp += `<option value="${c}">${c}</option>`; });
  } else {
    ["Matemática", "Língua Portuguesa", "Geografia", "História", "Ciências", "Língua Inglesa", "Arte", "Educação Física", "Ensino Religioso"].forEach(c => {
      htmlComp += `<option value="${c}">${c}</option>`;
    });
  }
  selComp.innerHTML = htmlComp;

  let htmlTurma = '<option value="">Selecione a turma...</option>';
  if (turmas && turmas.length > 0) {
    turmas.forEach(t => { htmlTurma += `<option value="${t}">${t}</option>`; });
  } else {
    ["6º Ano", "7º Ano", "8º Ano", "9º Ano", "6º REG 1", "6º REG 2", "7º REG 1", "7º REG 2", "8º REG 1", "8º REG 2", "9º REG 1", "9º REG 2"].forEach(t => {
      htmlTurma += `<option value="${t}">${t}</option>`;
    });
  }
  selTurma.innerHTML = htmlTurma;
}

// BUSCA NA MATRIZ MESTRA
async function buscarMatriz() {
  const componente = document.getElementById('componente').value;
  const ano = document.getElementById('turmaSelecionada').value;
  const trimestre = document.getElementById('selTrimestre') ? document.getElementById('selTrimestre').value : "3º Trimestre";

  if (!componente || !ano || !trimestre) return;

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
    const res = await fetch(URL_API, {
      method: 'POST',
      body: JSON.stringify({ acao: "buscarMatrizTrimestre", componente, trimestre, ano })
    });
    const r = await res.json();
    
    dadosMatrizGlobal = r.itens || [];
    let htmlUnidades = '<option value="">Selecione a Unidade Temática...</option>';

    const unidadesUnicas = [...new Set(dadosMatrizGlobal.map(i => i.unidade))];
    
    if (unidadesUnicas.length > 0) {
      unidadesUnicas.forEach(u => {
        htmlUnidades += `<option value="${u}">${u}</option>`;
      });
      document.getElementById('blocoCurriculo').style.display = 'block';
    } else {
      htmlUnidades = '<option value="">Nenhuma unidade cadastrada para este trimestre</option>';
    }

    selUnidade.innerHTML = htmlUnidades;
  } catch(e) {
    console.error("Erro ao buscar matriz:", e);
    selUnidade.innerHTML = '<option value="">Erro ao conectar com a planilha mestra</option>';
  }
}

// CONSOLIDAÇÃO EM CHECKBOXES INDIVIDUAIS
function montarCheckboxes() {
  const unidadeSelecionada = document.getElementById('unidade').value;
  const componente = document.getElementById('componente').value;
  if (!unidadeSelecionada) return;

  document.getElementById('painelOpcoes').style.display = 'block';

  const itensDaUnidade = dadosMatrizGlobal.filter(i => i.unidade === unidadeSelecionada);

  let htmlPriorizada = "";
  let htmlRecomposicao = "";
  let htmlSuporte = "";
  let objetosSet = new Set();
  let conteudosSet = new Set();
  let generosSet = new Set();

  itensDaUnidade.forEach(item => {
    if (item.habPriorizada && item.habPriorizada !== "-") {
      htmlPriorizada += `<div class="checkbox-item"><input type="radio" name="radioHabPriorizada" value="${item.habPriorizada}"><label>${item.habPriorizada}</label></div>`;
    }
    
    if (componente === "Língua Portuguesa" || componente === "Matemática") {
      if (item.habRecomposicao && item.habRecomposicao !== "-") {
        htmlRecomposicao += `<div class="checkbox-item"><input type="checkbox" name="chkHabRecomposicao" value="${item.habRecomposicao}"><label>${item.habRecomposicao}</label></div>`;
      }
      if (item.habSuporte && item.habSuporte !== "-") {
        htmlSuporte += `<div class="checkbox-item"><input type="checkbox" name="chkHabSuporte" value="${item.habSuporte}"><label>${item.habSuporte}</label></div>`;
      }
    }

    if (item.objetoConhecimento && item.objetoConhecimento !== "-") {
      objetosSet.add(item.objetoConhecimento);
    }
    if (item.conteudosRelacionados && item.conteudosRelacionados !== "-") {
      conteudosSet.add(item.conteudosRelacionados);
    }
    if (item.genero && item.genero !== "-") {
      generosSet.add(item.genero);
    }
  });

  const divHabs = document.getElementById('listaHabilidades');
  divHabs.innerHTML = `
    <label style="font-weight:700; color:#334155; margin-bottom:5px;">Habilidade Priorizada:</label>
    ${htmlPriorizada || '<p style="color:#94a3b8; font-size:0.9rem;">Nenhuma cadastrada.</p>'}
    
    ${(componente === "Língua Portuguesa" || componente === "Matemática") ? `
      <label style="font-weight:700; color:#334155; margin-top:10px; margin-bottom:5px;">Habilidades de Recomposição:</label>
      ${htmlRecomposicao || '<p style="color:#94a3b8; font-size:0.9rem;">Nenhuma cadastrada.</p>'}
      
      <label style="font-weight:700; color:#334155; margin-top:10px; margin-bottom:5px;">Habilidades de Suporte:</label>
      ${htmlSuporte || '<p style="color:#94a3b8; font-size:0.9rem;">Nenhuma cadastrada.</p>'}
    ` : ''}
  `;

  let htmlObjetosCheckboxes = "";
  objetosSet.forEach(obj => {
    htmlObjetosCheckboxes += `<div class="checkbox-item"><input type="checkbox" name="chkObjetoConhecimento" value="${obj}"><label>${obj}</label></div>`;
  });
  conteudosSet.forEach(cont => {
    htmlObjetosCheckboxes += `<div class="checkbox-item"><input type="checkbox" name="chkObjetoConhecimento" value="${cont}"><label>${cont}</label></div>`;
  });

  document.getElementById('listaObjetos').innerHTML = htmlObjetosCheckboxes || '<p style="color:#94a3b8; font-size:0.9rem;">Nenhum objeto cadastrado.</p>';
  
  const campoGenero = document.getElementById('generoTextual');
  if (campoGenero && (componente === "Língua Portuguesa" || componente === "Língua Inglesa")) {
    campoGenero.value = Array.from(generosSet).join(" | ");
  }
}

// GERAR PLANO E ABRIR AUTOMATICAMENTE A ABA "MEUS PLANOS"
async function enviarPlanoAulaAPI() {
  const btnGerar = document.getElementById('btnGerar');
  btnGerar.innerText = "⏳ Gerando Documento Oficial...";
  btnGerar.disabled = true;

  const habPriorizadaSelecionada = document.querySelector('input[name="radioHabPriorizada"]:checked');
  const habPrioTexto = habPriorizadaSelecionada ? habPriorizadaSelecionada.value : "Não selecionada";

  const objetosMarcados = Array.from(document.querySelectorAll('input[name="chkObjetoConhecimento"]:checked'))
    .map(cb => cb.value).join(" | ");

  const recursosSelecionados = Array.from(document.querySelectorAll('input[name="chk_recursos"]:checked'))
    .map(cb => cb.value).join(", ");

  const acoesEstrategicas = Array.from(document.querySelectorAll('.chk-estrategia:checked'))
    .map(cb => cb.value).join(" | ");

  const dadosPlano = {
    professor: document.getElementById('nomeProfessor').value,
    tipoPlano: document.getElementById('tipoPlano').value,
    componente: document.getElementById('componente').value,
    turma: document.getElementById('turmaSelecionada').value,
    trimestre: document.getElementById('selTrimestre').value,
    unidade: document.getElementById('unidade').value,
    habPriorizada: habPrioTexto,
    habRecomposicao: "-",
    habSuporte: "-",
    objetoConhecimento: objetosMarcados || "Nenhum selecionado",
    genero: document.getElementById('generoTextual') ? document.getElementById('generoTextual').value : "-",
    desenvolvimento: document.getElementById('desenvolvimento').value + (acoesEstrategicas ? "\n\nAções Estratégicas: " + acoesEstrategicas : ""),
    recursos: recursosSelecionados,
    periodo: document.getElementById('dataInicioPer').value + " até " + document.getElementById('dataFimPer').value
  };

  try {
    const res = await fetch(URL_API, {
      method: 'POST',
      body: JSON.stringify({ acao: "gerarPlano", planoData: dadosPlano })
    });
    const r = await res.json();

    if(r.status === "sucesso") {
      alert("✅ Plano de aula gerado com sucesso!");
      window.open(r.url, '_blank');
      
      // Mudar automaticamente para a aba "Meus Planos"
      mudarAba('meusPlanos', null);
    } else {
      alert("⚠️ Erro ao gerar plano: " + r.mensagem);
    }
  } catch(e) {
    alert("⚠️ Erro de conexão ao enviar o plano de aula.");
    console.error(e);
  } finally {
    btnGerar.innerText = "🚀 Gerar Plano Oficial & Enviar para Supervisão";
    btnGerar.disabled = false;
  }
}

// HISTÓRICO DE PLANOS ("MEUS PLANOS")
async function carregarMeusPlanos() {
  const container = document.getElementById('listaDePlanos');
  container.innerHTML = "⏳ Carregando seus planos...";

  try {
    const res = await fetch(URL_API, {
      method: 'POST',
      body: JSON.stringify({ acao: "listarSupervisao" })
    });
    const r = await res.json();

    if (r.status === "sucesso" && r.registros) {
      const meus = r.registros.filter(item => item.professor.toLowerCase() === professorLogado.toLowerCase());
      
      if (meus.length === 0) {
        container.innerHTML = "<p>Nenhum plano gerado por você ainda. Crie seu primeiro plano na aba ao lado! 📝</p>";
        return;
      }

      let html = "";
      meus.reverse().forEach(p => {
        html += `
          <div class="plano-item">
            <strong>📅 Data:</strong> ${p.data} | <strong>📚 Disciplina:</strong> ${p.componente} (${p.turma} - ${p.trimestre || 'Trimestre'})<br>
            <strong>🎯 Unidade:</strong> ${p.unidade}<br>
            <strong>📌 Status:</strong> ${p.status}<br>
            <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
              <a href="${p.docUrl}" target="_blank" style="background:#2980b9; color:white; padding:8px 14px; border-radius:10px; text-decoration:none; font-size:0.85rem; font-weight:700;">📄 Abrir Google Doc</a>
              <a href="${p.pastaUrl}" target="_blank" style="background:#e67e22; color:white; padding:8px 14px; border-radius:10px; text-decoration:none; font-size:0.85rem; font-weight:700;">📁 Pasta de Evidências</a>
            </div>
            <button class="btn-camera" style="background:#8e44ad;" onclick="abrirModalQR('${p.pastaUrl}')">📱 Enviar Fotos / Evidências via Celular (QR Code)</button>
          </div>
        `;
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = "<p>Nenhum registro encontrado.</p>";
    }
  } catch (e) {
    container.innerHTML = "<p>Erro ao carregar o histórico de planos.</p>";
  }
}

// QR CODE PARA EVIDÊNCIAS
function abrirModalQR(pastaUrl) {
  const modal = document.getElementById('modalQR');
  const imgQR = document.getElementById('imgQRCode');
  if (modal && imgQR && pastaUrl) {
    imgQR.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pastaUrl)}`;
    modal.style.display = 'flex';
  } else {
    alert("URL da pasta indisponível.");
  }
}

function fecharModalQR() {
  const modal = document.getElementById('modalQR');
  if (modal) modal.style.display = 'none';
}

// Evento de Inicialização
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById('btnGerar');
  if (btn) {
    btn.onclick = enviarPlanoAulaAPI;
  }
});
