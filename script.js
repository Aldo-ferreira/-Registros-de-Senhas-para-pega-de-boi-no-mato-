// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const numerosRef = database.ref('numeros');
let numeros = [];

// Carregar dados
numerosRef.once('value')
    .then(snapshot => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            numeros = Object.values(data || {});
        } else {
            const inicial = {};
            for (let i = 1; i <= 50; i++) {
                inicial[i] = { numero: i, nome: '', pago: false };
            }
            numerosRef.set(inicial);
            numeros = Object.values(inicial);
        }
        atualizarTabela();
    })
    .catch(error => {
        console.error("Erro ao carregar dados:", error);
        alert("Erro ao carregar dados. Recarregue a página.");
    });

// Salvar dados no Firebase
function salvarDados() {
    const obj = {};
    numeros.forEach(item => {
        obj[item.numero] = item;
    });
    numerosRef.set(obj).catch(err => {
        console.error('Erro ao salvar:', err);
        alert('Erro ao salvar dados. Tente novamente.');
    });
}

// Atualizar tabela na tela
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

    if (!numero || numero < 1 || numero > numeros.length) {
        alert(`Escolha um número válido entre 1 e ${numeros.length}.`);
        numeroInput.focus();
        return;
    }
    if (!nome) {
        alert('Digite seu nome.');
        nomeInput.focus();
        return;
    }

    const index = numeros.findIndex(item => item.numero === numero);
    if (numeros[index].nome) {
        alert('Número já escolhido. Escolha outro.');
        numeroInput.focus();
        return;
    }

    numeros[index].nome = nome;
    atualizarTabela();
    numeroInput.value = '';
    nomeInput.value = '';
}

// Marcar pago
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
        if (novoNome !== null && novoNome.trim()) {
            numeros[index].nome = novoNome.trim();
            atualizarTabela();
        }
    }
}

// Liberar número
function disponibilizar(numero) {
    const index = numeros.findIndex(item => item.numero === numero);
    if (index >= 0 && confirm(`Liberar número ${numero}?`)) {
        numeros[index].nome = '';
        numeros[index].pago = false;
        atualizarTabela();
    }
}

// Gerar lista para WhatsApp
function gerarLista() {
    const lista = ["🎫 Lista de Números - Pega de Boi 🐂", "Número | Nome | Status"];
    numeros.forEach(item => {
        let status = item.nome ? (item.pago ? '✅ Pago' : '⌛ Pendente') : '🟢 Disponível';
        lista.push(`${item.numero} | ${item.nome || '---'} | ${status}`);
    });
    document.getElementById('listaWhatsApp').value = lista.join('\n');
}

// Copiar lista
function copiarLista() {
    const lista = document.getElementById('listaWhatsApp');
    if (!lista.value) { alert('Gere a lista primeiro.'); return; }

    navigator.clipboard.writeText(lista.value).then(() => {
        const toast = document.getElementById('toast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }).catch(err => alert('Erro ao copiar: ' + err));
}

// Limpar lista de WhatsApp
function limparLista() {
    if (confirm('Deseja limpar a lista?')) document.getElementById('listaWhatsApp').value = '';
}

// Atualizar quantidade de senhas
function atualizarQuantidadeSenhas() {
    const novaQuantidade = parseInt(document.getElementById('quantidadeSenhas').value);
    if (!novaQuantidade || novaQuantidade < 1 || novaQuantidade > 1000) {
        alert('Insira uma quantidade válida entre 1 e 1000.');
        return;
    }
    if (!confirm(`Alterar quantidade para ${novaQuantidade}?`)) return;

    const novaLista = {};
    for (let i = 1; i <= novaQuantidade; i++) {
        const existente = numeros.find(item => item.numero === i);
        novaLista[i] = existente || { numero: i, nome: '', pago: false };
    }
    numerosRef.set(novaLista).then(() => {
        numeros = Object.values(novaLista);
        atualizarTabela();
        alert(`Lista atualizada com ${novaQuantidade} senhas.`);
        document.getElementById('quantidadeSenhas').value = '';
    }).catch(err => alert('Erro ao atualizar quantidade: ' + err));
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
    let dadosFiltrados = numeros;

    if (filtroStatus !== 'todos') {
        dadosFiltrados = dadosFiltrados.filter(item => {
            if (filtroStatus === 'disponivel') return !item.nome;
            if (filtroStatus === 'pendente') return item.nome && !item.pago;
            if (filtroStatus === 'pago') return item.pago;
        });
    }

    if (buscarNome) dadosFiltrados = dadosFiltrados.filter(item => item.nome && item.nome.toLowerCase().includes(buscarNome));
    if (buscarNumero) dadosFiltrados = dadosFiltrados.filter(item => item.numero.toString().includes(buscarNumero));

    dadosFiltrados.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
      <td>${item.numero}</td>
      <td>${item.nome || 'Disponível'}</td>
      <td>${item.pago ? 'Pago' : item.nome ? 'Pendente' : 'Disponível'}</td>
      <td>
        <button onclick="marcarPago(${item.numero})">${item.pago ? 'Pendente' : 'Pago'}</button>
        <button onclick="editar(${item.numero})">Editar</button>
        <button onclick="disponibilizar(${item.numero})">Liberar</button>
      </td>`;
        fragment.appendChild(row);
    });

    tabela.appendChild(fragment);
    if (buscarNome || buscarNumero) resultCount.innerHTML = `Encontrados ${dadosFiltrados.length} resultados.`;
}
