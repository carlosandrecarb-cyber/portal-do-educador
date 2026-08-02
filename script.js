// ==========================================
// ROTEADOR MASTER E API DA ESCOLA (WHITE-LABEL)
// ==========================================
const URL_API_MASTER = "https://script.google.com/macros/s/AKfycbxvB_wWng0aaZsCB_WaeSKKHuYqhx_EZHLkgiao_c1Cjc8PW1g2YGwnUJapakWHIZ6ObA/exec";
let URL_API_ESCOLA = ""; // Fica vazio até o roteador descobrir de qual escola é o acesso

var dadosLocais = [];
var evidenciaGlobal = ""; 

// ==========================================
// INICIALIZAÇÃO E LINK MÁGICO
// ==========================================
window.onload = function() {
  const urlParams = new URLSearchParams(window.location.search);
  const idEscolaMagico = urlParams.get('escola');
  
  if (idEscolaMagico) {
    // Se o professor usou o link mágico (ex: site.com/?escola=piloto)
    iniciarSetupEscola(idEscolaMagico);
  } else {
    // Se entrou direto no site principal, mostra a tela pedindo o código
    document.getElementById('telaWorkspace').style.display = 'flex';
  }
}

function verificarEscolaBotao(btn) {
  var origTxt = btn.innerText;
  btn.innerText = "Buscando...";
  var idDigitado = document.getElementById('inputCodigoEscola').value.trim();
  
  if (idDigitado === "") {
    document.getElementById('msgWorkspace').innerText = "⚠️ Digite o código da sua escola.";
    btn.innerText = origTxt;
    return;
  }
  iniciarSetupEscola(idDigitado, btn, origTxt);
}

function verificarEscolaManual() {
  var btn = document.querySelector('#telaWorkspace button');
  verificarEscolaBotao(btn);
}

function iniciarSetupEscola(idEscola, btnElement = null, origTxt = "") {
  if(!btnElement) {
    document.getElementById('msgWorkspace').innerText = "Conectando ao ambiente...";
  }

  fetch(URL_API_MASTER, {
    method: 'POST',
    body: JSON.stringify({ acao: "buscarConfig", id_escola: idEscola })
  })
  .then(res => res.json())
  .then(resp => {
    if (resp.status === "sucesso") {
      // 1. Salva a API privada desta escola para usar no resto do sistema
      URL_API_ESCOLA = resp.apiBanco;
      
      // 2. Altera as cores e logos do site todo (White-Label)
      document.documentElement.style.setProperty('--cor-principal', resp.cor1);
      document.documentElement.style.setProperty('--cor-secundaria', resp.cor2);
      
      document.getElementById('logoLogin').src = resp.logo;
      document.getElementById('logoHeader').src = resp.logo;
      document.getElementById('tituloNomeEscola').innerText = resp.nome;

      // 3. Esconde o Workspace e mostra a tela de Login personalizada
      document.getElementById('telaWorkspace').style.display = 'none';
      document.getElementById('telaLogin').style.display = 'flex';

    } else {
      document.getElementById('msgWorkspace').innerText = "⚠️ " + resp.mensagem;
      if (btnElement) btnElement.innerText = origTxt;
    }
  })
  .catch(err => {
    document.getElementById('msgWorkspace').innerText = "⚠️ Falha de comunicação com o servidor Mestre.";
    if (btnElement) btnElement.innerText = origTxt;
  });
}


// ==========================================
// SISTEMA DE LOGIN NO BANCO DA ESCOLA
// ==========================================
function fazerLogin() {
  var btn = document.querySelector('#telaLogin button');
  var txtOrig = btn.innerText;
  btn.innerText = "Autenticando...";
  
  var usu = document.getElementById('loginUsuario').value;
  var sen = document.getElementById('loginSenha').value;
  
  fetch(URL_API_ESCOLA, { 
    method: 'POST', 
    body: JSON.stringify({ acao: "login", usuario: usu, senha: sen }) 
  })
  .then(res => res.json())
  .then(resp => {
    if(resp.status === "sucesso") { 
      document.getElementById('telaLogin').style.display = 'none'; 
      
      const infoDiv = document.getElementById('infoUsuarioBoasVindas');
      infoDiv.innerHTML = "👤 " + resp.nome + " | 🛡️ " + resp.perfil;
      infoDiv.style.display = "inline-block";
      
      document.getElementById('nomeProfessor').value = resp.nome;
      
      var selComp = document.getElementById('componente');
      selComp.innerHTML = '<option value="">Selecione o Componente...</option>';
      if (resp.componentes && resp.componentes.length > 0) {
          resp.componentes.forEach(c => {
              if (c !== "") selComp.innerHTML += `<option value="${c}">${c}</option>`;
          });
      } else {
          selComp.innerHTML = '<option value="">Nenhum componente vinculado</option>';
      }
      
      var selTurma = document.getElementById('turmaSelecionada');
      selTurma.innerHTML = '<option value="">Selecione a Turma...</option>';
      if (resp.turmas && resp.turmas.length > 0) {
          resp.turmas.forEach(t => {
              if (t !== "") selTurma.innerHTML += `<option value="${t}">${t}</option>`;
          });
      } else {
          selTurma.innerHTML = '<option value="">Nenhuma turma vinculada</option>';
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

// ==========================================
// NAVEGAÇÃO E HISTÓRICO
// ==========================================
function mudarAba(abaId, elementoBotao) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(abaId).classList.add('active');
  elementoBotao.classList.add('active');
  window.scrollTo(0, 0); 
  
  if(abaId === 'meusPlanos') { carregarHistorico(); }
}

function carregarHistorico() {
  var container = document.getElementById('listaDePlanos');
  container.innerHTML = "Buscando seu histórico no banco de dados...";
  
  fetch(URL_API_ESCOLA, {
    method: 'POST',
    body: JSON.stringify({ acao: "buscarHistorico" })
  })
  .then(res => res.json())
  .then(resposta => {
    if (resposta.status === "sucesso") {
      var nomeProfessorLogado = document.getElementById('nomeProfessor').value.trim();
      var planos = resposta.historico.filter(p => p.professor.trim() === nomeProfessorLogado);
      
      if (planos.length === 0) {
        container.innerHTML = "Nenhum plano gerado por você ainda.";
        return;
      }
      
      var html = "";
      planos.forEach(function(plano) {
        html += '<div class="plano-item">';
        html += '<strong>' + plano.componente + ' - ' + plano.turma + '</strong><br>';
        html += '<span style="font-size: 0.8rem; color: #7f8c8d;">Gerado em: ' + plano.data + '</span><br>';
        html += '<button class="btn-camera" style="background:var(--cor-secundaria);" onclick="window.open(\''+plano.urlDoc+'\',\'_blank\')">📄 Ver Documento Oficial</button>';
        html += '<button class="btn-camera" style="background:#e67e22; margin-top:5px;" onclick="abrirModalQR(\''+plano.urlPasta+'\')">📷 Mostrar QR Code (Uso no PC)</button>';
        html += '<button class="btn-camera" style="background:var(--cor-principal); margin-top:5px;" onclick="window.open(\''+plano.urlPasta+'\',\'_blank\')">📁 Enviar Evidências (Direto no Celular)</button>';
        html += '</div>';
      });
      container.innerHTML = html;
    } else { container.innerHTML = "Erro ao carregar histórico: " + resposta.mensagem; }
  }).catch(err => {
    container.innerHTML = "Erro de conexão ao buscar histórico.";
    console.error(err);
  });
}

// ==========================================
// LÓGICA DA MATRIZ CURRICULAR E FORMULÁRIO
// ==========================================
function buscarMatriz() {
  var comp = document.getElementById('componente').value;
  var turma = document.getElementById('turmaSelecionada').value;
  var areaGenero = document.getElementById('areaGenero');
  
  if (comp === "Língua Portuguesa" || comp === "Língua Inglesa") { areaGenero.style.display = "block"; } 
  else { areaGenero.style.display = "none"; document.getElementById('generoTextual').value = ""; }

  if (comp !== "" && turma !== "") {
    document.getElementById('blocoCurriculo').style.display = 'block';
    
    var payload = { acao: "buscarMatriz", componente: comp, ano: turma };

    fetch(URL_API_ESCOLA, { method: 'POST', body: JSON.stringify(payload) })
    .then(res => res.json())
    .then(resposta => {
      if(resposta.status === "sucesso") {
        var resultados = resposta.resultados;
        dadosLocais = resultados;
        var select = document.getElementById('unidade');
        select.innerHTML = '<option value="">Escolha a Unidade Temática...</option>';
        if(resultados.length > 0) {
          resultados.forEach((item, index) => {
            select.innerHTML += '<option value="'+index+'">'+item.unidade+'</option>';
          });
        } else { select.innerHTML = '<option value="">Nenhum dado encontrado para esta turma.</option>'; }
      } else { alert("⚠️ Erro ao carregar matriz: " + resposta.mensagem); }
    }).catch(err => {
      console.error("Erro de conexão:", err);
      alert("⚠️ Erro de conexão ao buscar a matriz curricular.");
    });
  }
}

function montarCheckboxes() {
  var idx = document.getElementById('unidade').value;
  if(idx !== "") {
    document.getElementById('painelOpcoes').style.display = 'block';
    evidenciaGlobal = dadosLocais[idx].evidencias; 
    gerarListaHTML('listaHabilidades', dadosLocais[idx].habilidades, 'chk_habilidade');
    gerarListaHTML('listaObjetos', dadosLocais[idx].objetos, 'chk_objeto');
    gerarListaHTML('listaPraticas', dadosLocais[idx].praticas, 'chk_pratica');
  }
}

function gerarListaHTML(containerId, texto, nomeCheckbox) {
  var container = document.getElementById(containerId); container.innerHTML = '';
  if(texto) {
    texto.split('\n').forEach(linha => {
      if(linha.trim() !== "") container.innerHTML += '<div class="checkbox-item"><input type="checkbox" name="'+nomeCheckbox+'" value="'+linha.trim().replace(/"/g, '&quot;')+'"> <label>'+linha.trim()+'</label></div>';
    });
  }
}

function obterSelecionados(nomeCheckbox) {
  return Array.from(document.querySelectorAll('input[name="'+nomeCheckbox+'"]:checked')).map(cb => cb.value);
}

function formatarDataBR(dataIso) {
  if(!dataIso) return "";
  var p = dataIso.split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
}

// ==========================================
// ENVIO PARA O BANCO DE DADOS (GERAR PLANO)
// ==========================================
document.getElementById('btnGerar').addEventListener('click', function() {
  var btn = this; 
  var nomeProf = document.getElementById('nomeProfessor').value;
  if(!nomeProf) { alert("Por favor, certifique-se de estar logado corretamente."); return; }

  var dIni = document.getElementById('dataInicioPer').value;
  var dFim = document.getElementById('dataFimPer').value;
  var stringPeriodo = "";
  if (dIni && dFim) { stringPeriodo = formatarDataBR(dIni) + " a " + formatarDataBR(dFim); } 
  else if (dIni) { stringPeriodo = formatarDataBR(dIni); }

  btn.innerText = "⏳ Gerando Plano no Drive..."; btn.disabled = true;
  
  var selectUnidade = document.getElementById('unidade');
  var dados = {
    professor: nomeProf,
    tipoPlano: document.getElementById('tipoPlano').value,
    componente: document.getElementById('componente').value,
    turma: document.getElementById('turmaSelecionada').value,
    periodo: stringPeriodo, 
    unidade: selectUnidade.options[selectUnidade.selectedIndex] ? selectUnidade.options[selectUnidade.selectedIndex].text : "",
    generoTextual: document.getElementById('generoTextual').value,
    desenvolvimento: document.getElementById('desenvolvimento').value,
    evidencias: evidenciaGlobal, 
    habilidades: obterSelecionados('chk_habilidade'),
    objetos: obterSelecionados('chk_objeto'),
    recursos_marcados: obterSelecionados('chk_recursos'),
    tagsSelecionadas: Array.from(document.querySelectorAll('.chk-estrategia:checked')).map(cb => cb.value)
  };
  
  fetch(URL_API_ESCOLA, {
    method: 'POST',
    body: JSON.stringify(dados)
  })
  .then(res => res.json())
  .then(resposta => {
    btn.innerText = "📄 Gerar Plano Oficial"; btn.disabled = false;
    if(resposta.status === "sucesso") {
      alert("✅ Plano e Pasta gerados com sucesso!");
      window.open(resposta.url, '_blank');
      document.getElementById('desenvolvimento').value = ""; 
      mudarAba('meusPlanos', document.querySelectorAll('.tab-btn')[1]);
    } else {
      alert("⚠️ Erro no servidor: " + resposta.mensagem);
    }
  })
  .catch(err => {
    btn.innerText = "📄 Gerar Plano Oficial"; btn.disabled = false;
    alert("⚠️ Erro de conexão com a API: " + err);
  });
});

// ==========================================
// MODAL DO QR CODE
// ==========================================
function abrirModalQR(urlDeUpload) {
  var urlApi = "https://quickchart.io/qr?text=" + encodeURIComponent(urlDeUpload) + "&size=250";
  document.getElementById('imgQRCode').src = urlApi;
  document.getElementById('modalQR').style.display = "flex";
}

function fecharModalQR() {
  document.getElementById('modalQR').style.display = "none";
}
