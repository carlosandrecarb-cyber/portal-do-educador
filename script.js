// ==========================================
// COLE A SUA URL DO GOOGLE APPS SCRIPT AQUI (Terminada em /exec)
// ==========================================
const URL_API_GOOGLE = "https://script.google.com/macros/s/AKfycbxFRiIGmxDp5z0GNFIjkdtx7pbA7qTbO8NfJqT1TgAmh1XlXyzh1GdPXI8XGDW4QBqA/exec";

var dadosLocais = [];
var evidenciaGlobal = ""; 

function mudarAba(abaId, elementoBotao) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(abaId).classList.add('active');
  elementoBotao.classList.add('active');
  window.scrollTo(0, 0); 
  
  // Quando clicar na aba "Meus Planos", carrega o histórico
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
      var planos = resposta.historico;
      if (planos.length === 0) {
        container.innerHTML = "Nenhum plano gerado ainda.";
        return;
      }
      
      var html = "";
      planos.forEach(function(plano) {
        html += '<div class="plano-item">';
        html += '<strong>' + plano.componente + ' - ' + plano.turma + '</strong><br>';
        html += '<span style="font-size: 0.8rem; color: #7f8c8d;">Prof: ' + plano.professor + ' | Gerado em: ' + plano.data + '</span><br>';
        html += '<button class="btn-camera" style="background:#2980b9;" onclick="window.open(\''+plano.urlDoc+'\',\'_blank\')">📄 Ver Documento Oficial</button>';
        html += '<button class="btn-camera" style="background:#e67e22; margin-top:5px;" onclick="abrirModalQR(\''+plano.urlPasta+'\')">📷 Abrir Pasta de Evidências</button>';
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

function buscarMatriz() {
  var comp = document.getElementById('componente').value;
  var ano = document.getElementById('ano').value;
  var areaGenero = document.getElementById('areaGenero');
  
  if (comp === "Língua Portuguesa" || comp === "Língua Inglesa") { areaGenero.style.display = "block"; } 
  else { areaGenero.style.display = "none"; document.getElementById('generoTextual').value = ""; }

  if (comp !== "" && ano !== "") {
    document.getElementById('blocoCurriculo').style.display = 'block';
    
    var payload = {
      acao: "buscarMatriz",
      componente: comp,
      ano: ano
    };

    fetch(URL_API_GOOGLE, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
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
          select.innerHTML = '<option value="">Nenhum dado encontrado para este ano</option>';
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

document.getElementById('btnGerar').addEventListener('click', function() {
  var btn = this; 
  var nomeProf = document.getElementById('nomeProfessor').value;
  if(!nomeProf) { alert("Por favor, preencha o nome do(a) professor(a)."); return; }

  btn.innerText = "⏳ Gerando Plano no Drive..."; btn.disabled = true;
  
  var selectUnidade = document.getElementById('unidade');
  var dados = {
    professor: nomeProf,
    tipoPlano: document.getElementById('tipoPlano').value,
    componente: document.getElementById('componente').value,
    turma: document.getElementById('ano').value + " " + document.getElementById('turma').value,
    periodo: document.getElementById('periodo').value,
    unidade: selectUnidade.options[selectUnidade.selectedIndex] ? selectUnidade.options[selectUnidade.selectedIndex].text : "",
    generoTextual: document.getElementById('generoTextual').value,
    desenvolvimento: document.getElementById('desenvolvimento').value,
    evidencias: evidenciaGlobal, 
    habilidades: obterSelecionados('chk_habilidade'),
    objetos: obterSelecionados('chk_objeto'),
    recursos_marcados: obterSelecionados('chk_recursos')
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
      
      // Muda de aba automaticamente para o professor ver o plano no histórico
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

function abrirModalQR(urlDeUpload) {
  var urlApi = "https://quickchart.io/qr?text=" + encodeURIComponent(urlDeUpload) + "&size=250";
  document.getElementById('imgQRCode').src = urlApi;
  document.getElementById('modalQR').style.display = "flex";
}

function fecharModalQR() {
  document.getElementById('modalQR').style.display = "none";
}
