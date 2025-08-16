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

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const numerosRef = database.ref('numeros');
let numeros = [];
let initialLoadComplete = false;

// Carregar dados iniciais
numerosRef.once('value').then(snapshot => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        // Converter objeto para array
        numeros = Object.keys(data).map(key => data[key]);
    } else {
        // Se não existir dados, criar array inicial com 50 números
        numeros = Array.from({ length: 50 }, (_, i) => ({
            numero: i + 1,
            nome: '',
            pago: false
        }));
        salvarDados();
    }
    atualizarTabela();
    initialLoadComplete = true;

    // Listener para mudanças em tempo real
    numerosRef.on('value', snapshot => {
        if (initialLoadComplete && snapshot.exists()) {
            const data = snapshot.val();
            numeros = Object.keys(data).map(key => data[key]);
            filtrarTabela();
        }
    });
}).catch(error => {
    console.error("Erro ao carregar dados:", error);
    alert("Erro ao carregar dados. Por favor, recarregue a página.");
});

// Funções principais
function salvarDados() {
    numerosRef.set(numeros).catch(error => {
        console.error('Erro ao salvar no Firebase:', error);
        alert('Erro ao salvar os dados. Tente novamente.');
    });
}

function atualizarTabela() {
    filtrarTabela();
    salvarDados();
}

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
    if (numeros[index].nome) {
        alert('Esse número já foi escolhido.');
        numeroInput.focus();
        return;
    }

    numeros[index].nome = nome;
    atualizarTabela();
    numeroInput.value = '';
    nomeInput.value = '';
}

function marcarPago(numero) {
    const index = numeros.findIndex(item => item.numero === numero);
    if (index >= 0) {
        numeros[index].pago = !numeros[index].pago;
        atualizarTabela();
    }
}

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

function disponibilizar(numero) {
    const index = numeros.findIndex(item => item.numero === numero);
    if (index >= 0 && confirm(`Liberar o número ${numero}?`)) {
        numeros[index].nome = '';
        numeros[index].pago = false;
        atualizarTabela();
    }
}

function gerarLista() {
    const lista = [
        "🎫 Lista de Números - Pega de Boi 🐂",
        "Número | Nome | Status",
        ...numeros.map(item => {
            let status = '';
            if (item.nome) status = item.pago ? '✅ Pago' : '⌛ Pendente';
            else status = '🟢 Disponível';
            return `${item.numero} | ${item.nome || '---'} | ${status}`;
        })
    ];
    document.getElementById('listaWhatsApp').value = lista.join('\n');
}

function copiarLista() {
    const lista = document.getElementById('listaWhatsApp');
    if (!lista.value) return alert('Gere a lista primeiro.');

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(lista.value).then(showToast).catch(() => fallbackCopyTextToClipboard(lista));
    } else {
        fallbackCopyTextToClipboard(lista);
    }
}

function fallbackCopyTextToClipboard(textElement) {
    textElement.select();
    textElement.setSelectionRange(0, 99999);
    document.execCommand('copy');
    showToast();
}

function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function limparLista() {
    if (confirm('Tem certeza que deseja limpar a lista?')) {
        document.getElementById('listaWhatsApp').value = '';
    }
}

function atualizarQuantidadeSenhas() {
    const novaQuantidade = parseInt(document.getElementById('quantidadeSenhas').value);
    if (!novaQuantidade || novaQuantidade < 1 || novaQuantidade > 1000) return alert('Quantidade inválida.');

    if (confirm(`Alterar para ${novaQuantidade} senhas?`)) {
        const novaLista = [];
        for (let i = 1; i <= novaQuantidade; i++) {
            const existente = numeros.find(item => item.numero === i);
            if (existente) novaLista.push(existente);
            else novaLista.push({ numero: i, nome: '', pago: false });
        }
        numerosRef.set(novaLista).then(() => {
            numeros = novaLista;
            atualizarTabela();
            alert(`Lista atualizada para ${novaQuantidade} senhas.`);
            document.getElementById('quantidadeSenhas').value = '';
        }).catch(error => {
            console.error("Erro ao atualizar quantidade:", error);
            alert("Erro ao atualizar quantidade. Tente novamente.");
        });
    }
}

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

    if (filtroStatus !== 'todos') {
        dadosFiltrados = dadosFiltrados.filter(item => {
            if (filtroStatus === 'disponivel') return !item.nome;
            if (filtroStatus === 'pendente') return item.nome && !item.pago;
            if (filtroStatus === 'pago') return item.pago;
            return true;
        });
    }

    if (buscarNome) dadosFiltrados = dadosFiltrados.filter(item => item.nome && item.nome.toLowerCase().includes(buscarNome));
    if (buscarNumero) dadosFiltrados = dadosFiltrados.filter(item => item.numero.toString().includes(buscarNumero));

    dadosFiltrados.forEach(item => {
        const row = document.createElement('tr');
        let nomeDisplay = item.nome || 'Disponível';
        let numeroDisplay = item.numero.toString();

        if (buscarNome && item.nome) nomeDisplay = nomeDisplay.replace(new RegExp(`(${buscarNome})`, 'gi'), '<span class="highlight">$1</span>');
        if (buscarNumero) numeroDisplay = numeroDisplay.replace(new RegExp(`(${buscarNumero})`, 'g'), '<span class="highlight">$1</span>');

        row.innerHTML = `
            <td>${numeroDisplay}</td>
            <td>${nomeDisplay}</td>
            <td>${item.pago ? '<span class="pago">Pago</span>' : item.nome ? 'Pendente' : 'Disponível'}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="marcarPago(${item.numero})"><i class="fas ${item.pago ? 'fa-times-circle' : 'fa-check-circle'}"></i> ${item.pago ? 'Pendente' : 'Pago'}</button>
                    <button onclick="editar(${item.numero})"><i class="fas fa-edit"></i> Editar</button>
                    <button onclick="disponibilizar(${item.numero})"><i class="fas fa-unlock"></i> Liberar</button>
                </div>
            </td>
        `;
        fragment.appendChild(row);
    });

    tabela.appendChild(fragment);
    if (buscarNome || buscarNumero) resultCount.innerHTML = `Encontrados ${dadosFiltrados.length} resultado(s).`;
}
