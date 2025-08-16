<script>
  // Configuração do Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyBQpSLAAcLAGcv25sjFmHAQ30qysN2jv2U",
    authDomain: "pega-de-boi-b179c.firebaseapp.com",
    projectId: "pega-de-boi-b179c",
    storageBucket: "pega-de-boi-b179c.firebasestorage.app",
    messagingSenderId: "915850531026",
    appId: "1:915850531026:web:7f0491acb09ca8441c1d0b",
    databaseURL: "https://pega-de-boi-b179c-default-rtdb.firebaseio.com"
  };

  // Inicializa Firebase
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  const numerosRef = database.ref('numeros');

  let numeros = [];
  let initialLoadComplete = false;

  // Função para salvar dados no Firebase
  function salvarDados() {
    numerosRef.set(numeros)
      .catch(erro => {
        console.error('Erro ao salvar no Firebase:', erro);
        alert('Erro ao salvar os dados. Tente novamente.');
      });
  }

  // Carregar dados iniciais
  numerosRef.once('value').then(snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Transformar em array caso venha como objeto
      numeros = Array.isArray(data) ? data : Array.from(Object.values(data || {}));
    } else {
      // Se não houver dados, criar 50 números iniciais
      numeros = Array.from({ length: 50 }, (_, i) => ({ numero: i + 1, nome: '', pago: false }));
      salvarDados();
    }

    atualizarTabela();
    initialLoadComplete = true;

    // Listener para atualizações em tempo real
    numerosRef.on('value', snapshot => {
      if (initialLoadComplete && snapshot.exists()) {
        const data = snapshot.val();
        numeros = Array.isArray(data) ? data : Array.from(Object.values(data || {}));
        filtrarTabela();
      }
    });
  }).catch(error => {
    console.error("Erro ao carregar dados:", error);
    alert("Erro ao carregar dados. Recarregue a página.");
  });

  // Atualiza a tabela e salva dados
  function atualizarTabela() {
    filtrarTabela();
    salvarDados();
  }

  // Registrar número
  function registrar() {
    const numeroInput = document.getElementById('numero');
    const nomeInput = document.getElementById('nome');
    const numero = parseInt(numeroInput.value);
    const nome = nomeInput.value.trim();

    if (!numero || isNaN(numero) || numero < 1 || numero > numeros.length) {
      alert(`Escolha um número válido entre 1 e ${numeros.length}.`);
      numeroInput.focus();
      return;
    }

    if (!nome) {
      alert('Por favor, insira seu nome.');
      nomeInput.focus();
      return;
    }

    const index = numeros.findIndex(item => item.numero === numero);
    if (index === -1) {
      alert('Número inválido. Tente novamente.');
      return;
    }

    if (numeros[index].nome) {
      alert('Esse número já foi escolhido. Escolha outro.');
      numeroInput.focus();
      return;
    }

    numeros[index].nome = nome;
    atualizarTabela();
    numeroInput.value = '';
    nomeInput.value = '';
  }

  // Marcar como pago ou pendente
  function marcarPago(numero) {
    const index = numeros.findIndex(item => item.numero === numero);
    if (index >= 0) {
      numeros[index].pago = !numeros[index].pago;
      atualizarTabela();
    }
  }

  // Editar nome
  function editar(numero) {
    const index = numeros.findIndex(item => item.numero === numero);
    if (index >= 0) {
      const novoNome = prompt('Digite o novo nome:', numeros[index].nome);
      if (novoNome !== null) {
        const nome = novoNome.trim();
        if (nome) {
          numeros[index].nome = nome;
          atualizarTabela();
        } else {
          alert('O nome não pode estar vazio.');
        }
      }
    }
  }

  // Liberar número
  function disponibilizar(numero) {
    const index = numeros.findIndex(item => item.numero === numero);
    if (index >= 0) {
      if (confirm(`Tem certeza que deseja liberar o número ${numero}?`)) {
        numeros[index].nome = '';
        numeros[index].pago = false;
        atualizarTabela();
      }
    }
  }

  // Gerar lista para WhatsApp
  function gerarLista() {
    const lista = [
      "🎫 Lista de Números - Pega de Boi 🐂",
      "Número | Nome | Status",
      ...numeros.map(item => {
        let status = '';
        if (item.nome) {
          status = item.pago ? '✅ Pago' : '⌛ Pendente';
        } else {
          status = '🟢 Disponível';
        }
        return `${item.numero} | ${item.nome || '---'} | ${status}`;
      })
    ];
    document.getElementById('listaWhatsApp').value = lista.join('\n');
  }

  // Copiar lista
  function copiarLista() {
    const lista = document.getElementById('listaWhatsApp');
    if (!lista.value) {
      alert('Gere a lista primeiro antes de copiar.');
      return;
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(lista.value)
        .then(() => showToast())
        .catch(() => fallbackCopyTextToClipboard(lista));
    } else {
      fallbackCopyTextToClipboard(lista);
    }
  }

  function fallbackCopyTextToClipboard(textElement) {
    textElement.select();
    textElement.setSelectionRange(0, 99999);
    try {
      document.execCommand('copy');
      showToast();
    } catch {
      alert('Erro ao copiar. Use Ctrl+C ou Cmd+C.');
    }
  }

  function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // Limpar lista do textarea
  function limparLista() {
    if (confirm('Tem certeza que deseja limpar todos os números?')) {
      document.getElementById('listaWhatsApp').value = '';
    }
  }

  // Atualizar quantidade de senhas
function atualizarQuantidadeSenhas() {
    const novaQuantidade = parseInt(document.getElementById('quantidadeSenhas').value);
    if (!novaQuantidade || novaQuantidade < 1 || novaQuantidade > 1000) {
        alert('Insira uma quantidade válida entre 1 e 1000.');
        return;
    }

    if (confirm(`Alterar a quantidade para ${novaQuantidade}? Números já registrados podem ser removidos.`)) {
        const novaLista = {};
        for (let i = 1; i <= novaQuantidade; i++) {
            const existente = numeros.find(item => item.numero === i);
            novaLista[i] = existente || { numero: i, nome: '', pago: false };
        }

        numerosRef.set(novaLista)
            .then(() => {
                // Converter objeto para array local
                numeros = Object.values(novaLista);
                atualizarTabela();
                alert(`Lista atualizada com ${novaQuantidade} senhas.`);
                document.getElementById('quantidadeSenhas').value = '';
            })
            .catch(error => {
                console.error("Erro ao atualizar quantidade:", error);
                alert("Erro ao atualizar quantidade. Tente novamente.");
            });
    }
}


  // Filtrar tabela
  function filtrarTabela() {
    const buscarNome = document.getElementById('buscarNome').value.toLowerCase();
    const buscarNumero = document.getElementById('buscarNumero').value;
    const filtroStatus = document.getElementById('filtroStatus').value;
    const tabela = document.getElementById('tabela');
    const resultCount = document.getElementById('resultCount');

    tabela.innerHTML = '';
    resultCount.innerHTML = '';

    const fragment = document.createDocumentFragment();

    let dadosFiltrados = numeros || [];

    // Filtrar por status
    if (filtroStatus !== 'todos') {
      dadosFiltrados = dadosFiltrados.filter(item => {
        if (filtroStatus === 'disponivel') return !item.nome;
        if (filtroStatus === 'pendente') return item.nome && !item.pago;
        if (filtroStatus === 'pago') return item.pago;
        return true;
      });
    }

    // Filtrar por nome e número
    let filtradoPorPesquisa = false;
    if (buscarNome) {
      dadosFiltrados = dadosFiltrados.filter(item => item.nome && item.nome.toLowerCase().includes(buscarNome));
      filtradoPorPesquisa = true;
    }
    if (buscarNumero) {
      dadosFiltrados = dadosFiltrados.filter(item => item.numero.toString().includes(buscarNumero));
      filtradoPorPesquisa = true;
    }

    // Renderizar linhas
    dadosFiltrados.forEach(item => {
      const row = document.createElement('tr');
      let nomeDisplay = item.nome || 'Disponível';
      let numeroDisplay = item.numero.toString();

      if (buscarNome && item.nome) {
        const regex = new RegExp(`(${buscarNome})`, 'gi');
        nomeDisplay = nomeDisplay.replace(regex, '<span class="highlight">$1</span>');
      }

      if (buscarNumero) {
        const regex = new RegExp(`(${buscarNumero})`, 'g');
        numeroDisplay = numeroDisplay.replace(regex, '<span class="highlight">$1</span>');
      }

      row.innerHTML = `
        <td>${numeroDisplay}</td>
        <td>${nomeDisplay}</td>
        <td>${item.pago ? '<span class="pago">Pago</span>' : item.nome ? 'Pendente' : 'Disponível'}</td>
        <td>
          <div class="action-buttons">
            <button onclick="marcarPago(${item.numero})">
              <i class="fas ${item.pago ? 'fa-times-circle' : 'fa-check-circle'}"></i> ${item.pago ? 'Pendente' : 'Pago'}
            </button>
            <button onclick="editar(${item.numero})">
              <i class="fas fa-edit"></i> Editar
            </button>
            <button onclick="disponibilizar(${item.numero})">
              <i class="fas fa-unlock"></i> Liberar
            </button>
          </div>
        </td>
      `;
      fragment.appendChild(row);
    });

    tabela.appendChild(fragment);

    if (filtradoPorPesquisa) {
      resultCount.innerHTML = `Encontrados ${dadosFiltrados.length} resultado(s) para sua busca.`;
    }
  }
</script>
