// ==========================================
// COLE A SUA URL DO GOOGLE APPS SCRIPT AQUI (A que termina com /exec)
// ==========================================
const URL_API_GOOGLE = "COLE_SUA_URL_DO_APPS_SCRIPT_AQUI";

var dadosLocais = [];
var evidenciaGlobal = ""; 

function mudarAba(abaId, elementoBotao) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(abaId).classList.add('active');
  elementoBotao.classList.add('active');
  window.scrollTo(0, 0); 
}

function buscarMatriz() {
  var comp = document.getElementById('componente').value;
  var ano = document.getElementById('ano').value;
  var areaGenero = document.getElementById('areaGenero');
  
  if (comp === "Língua Portuguesa" || comp === "Língua Inglesa") { areaGenero.style.display = "block"; } 
  else { areaGenero.style.display = "none"; document.getElementById('generoTextual').value = ""; }

  if (comp !== "" && ano !== "") {
    document.getElementById('blocoCurriculo').style.display = 'block';
    
    // Faz a chamada para a API do Google buscar os dados da planilha
    fetch(URL_API_GOOGLE + "?acao=buscarMatriz&componente=" + encodeURIComponent(comp) + "&ano=" + encodeURIComponent(ano))
      .then(res => res.json())
      .then(resultados => {
        dadosLocais = resultados;
        var select = document.getElementById('unidade');
        select.innerHTML = '<option value="">Escolha...</option>';
        resultados.forEach((item, index) => select.innerHTML += '<option value="'+index+'">'+item.unidade+'</option>');
      }).catch(err => console.error("Erro ao buscar matriz:", err));
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
  
  // Envia os dados via POST para o Google Apps Script
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
