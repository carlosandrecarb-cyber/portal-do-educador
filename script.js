// ==========================================
// API DO SISTEMA
// ==========================================
const URL_API_GOOGLE = "https://script.google.com/macros/s/AKfycbxFRiIGmxDp5z0GNFIjkdtx7pbA7qTbO8NfJqT1TgAmh1XlXyzh1GdPXI8XGDW4QBqA/exec";

var dadosLocais = [];
var evidenciaGlobal = ""; 

// ==========================================
// SISTEMA DE LOGIN E INJEÇÃO DINÂMICA
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
      document.getElementById('telaLogin').style.display = 'none'; 
      
      // Crachá de Boas Vindas
      const infoDiv = document.getElementById('infoUsuarioBoasVindas');
      infoDiv.innerHTML = "👤 " + resp.nome + " | 🛡️ " + resp.perfil;
      infoDiv.style.display = "inline-block";
      
      // Preenche Nome travado
      document.getElementById('nomeProfessor').value = resp.nome;
      
      // Injeta os Componentes específicos do Professor
      var selComp = document.getElementById('componente');
      selComp.innerHTML = '<option value="">Selecione o Componente...</option>';
      if (resp.componentes && resp.componentes.length > 0) {
          resp.componentes.forEach(c => {
              if (c !== "") selComp.innerHTML += `<option value="${c}">${c}</option>`;
          });
      } else {
          selComp.innerHTML = '<option value="">Nenhum componente vinculado</option>';
      }
      
      // Injeta as Turmas específicas do Professor
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
  
  if(abaId === 'meusPlanos') {
    carregarHistorico();
  }
}

function carregarHistorico() {
  var container = document.getElementById('listaDePlanos');
  container.innerHTML = "Buscando seu histórico no banco de dados...";
  
  fetch(URL_API_GOOGLE, {
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
        html += '<button class="btn-camera" style="background:#2980b9;" onclick="window.open(\''+plano.urlDoc+'\',\'_blank\')">📄 Ver Documento Oficial</button>';
        html += '<button class="btn-camera" style="background:#e67e22; margin-top:5px;" onclick="abrirModalQR(\''+plano.urlPasta+'\')">📷 Mostrar QR Code (Uso no PC)</button>';
        html += '<button class="btn-camera" style="background:#27ae60; margin-top:5px;" onclick="window.open(\''+plano.urlPasta+'\',\'_blank\')">📁 Enviar Evidências (Direto no Celular)</button>';
        html += '</div>';
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = "Erro ao carregar histórico: " + resposta.mensagem;
    }
  })
  .catch(err => {
    container.innerHTML = "Erro de conexão ao buscar histórico.";
    console.error(err);
  });
}

// ==========================================
// LÓGICA DA MATRIZ CURRICULAR E FORMULÁRIO
// ==========================================
function buscarMatriz() {
  var comp = document.getElementById('componente').value;
  var turma = document.getElementById('turmaSelecionada').value; // Ex: "6º Ano A"
  var areaGenero = document.getElementById('areaGenero');
  
  if (comp === "Língua Portuguesa" || comp === "Língua Inglesa") { areaGenero.style.display = "block"; } 
  else { areaGenero.style.display = "none"; document.getElementById('generoTextual').value = ""; }

  if (comp !== "" && turma !== "") {
    document.getElementById('blocoCurriculo').style.display = 'block';
    
    // O backend já faz o recorte do "6º Ano" para buscar na planilha
    var payload = { acao: "buscarMatriz", componente: comp, ano: turma };

    fetch(URL_API_GOOGLE, { method: 'POST', body: JSON.stringify(payload) })
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
        } else {
          select.innerHTML = '<option value="">Nenhum dado encontrado para esta turma.</option>';
        }
      } else {
        alert("⚠️ Erro ao carregar matriz: " + resposta.mensagem);
      }
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

// ==========================================
// ENVIO PARA O BANCO DE DADOS (GERAR PLANO)
// ==========================================
document.getElementById('btnGerar').addEventListener('click', function() {
  var btn = this; 
  var nomeProf = document.getElementById('nomeProfessor').value;
  if(!nomeProf) { alert("Por favor, certifique-se de estar logado corretamente."); return; }

  btn.innerText = "⏳ Gerando Plano no Drive..."; btn.disabled = true;
  
  var selectUnidade = document.getElementById('unidade');
  var dados = {
    professor: nomeProf,
    tipoPlano: document.getElementById('tipoPlano').value,
    componente: document.getElementById('componente').value,
    turma: document.getElementById('turmaSelecionada').value, // Envia a turma formatada 
    periodo: document.getElementById('periodo').value,
    unidade: selectUnidade.options[selectUnidade.selectedIndex] ? selectUnidade.options[selectUnidade.selectedIndex].text : "",
    generoTextual: document.getElementById('generoTextual').value,
    desenvolvimento: document.getElementById('desenvolvimento').value,
    evidencias: evidenciaGlobal, 
    habilidades: obterSelecionados('chk_habilidade'),
    objetos: obterSelecionados('chk_objeto'),
    recursos_marcados: obterSelecionados('chk_recursos'),
    tagsSelecionadas: Array.from(document.querySelectorAll('.chk-estrategia:checked')).map(cb => cb.value)
  };
  
  fetch(URL_API_GOOGLE, {
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
