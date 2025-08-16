
        // Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyBQpSLAAcLAGcv25sjFmHAQ30qysN2jv2U",
            authDomain: "pega-de-boi-b179c.firebaseapp.com",
            projectId: "pega-de-boi-b179c",
            storageBucket: "pega-de-boi-b179c.firebasestorage.app",
            messagingSenderId: "915850531026",
            appId: "1:915850531026:web:7f0491acb09ca8441c1d0b",
            databaseURL: "https://pega-de-boi-b179c-default-rtdb.firebaseio.com"
        };
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();
        const numerosRef = database.ref('numeros');
        let numeros = [];
        let initialLoadComplete = false;

        // Load initial data
        numerosRef.once('value').then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                // Convertendo objeto para array se necessário
                numeros = Array.isArray(data) ? data : Object.values(data || {});
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
            numerosRef.on('value', (snapshot) => {
                if (initialLoadComplete && snapshot.exists()) {
                    const data = snapshot.val();
                    numeros = Array.isArray(data) ? data : Object.values(data || {});
                    filtrarTabela();
                }
            });
        }).catch(error => {
            console.error("Error loading data:", error);
            alert("Erro ao carregar dados. Por favor, recarregue a página.");
        });

        function salvarDados() {
            try {
                numerosRef.set(numeros)
                    .catch(erro => {
                        console.error('Erro ao salvar no Firebase:', erro);
                        alert('Erro ao salvar os dados. Por favor, tente novamente.');
                    });
            } catch (erro) {
                alert('Erro ao salvar os dados. Por favor, tente novamente.');
                console.error('Save error:', erro);
            }
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
            if (index === -1) {
                alert('Número inválido. Por favor, tente novamente.');
                return;
            }
            
            if (numeros[index].nome) {
                alert('Esse número já foi escolhido. Por favor, escolha outro.');
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
                    return `${item.numero} | ${item.nome || '---'} | ${status}`
                })
            ];
            const textoLista = lista.join('\n');
            document.getElementById('listaWhatsApp').value = textoLista;
        }

        function copiarLista() {
            const lista = document.getElementById('listaWhatsApp');
            if (!lista.value) {
                alert('Gere a lista primeiro antes de copiar.');
                return;
            }

            // Melhor compatibilidade entre navegadores
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(lista.value)
                    .then(() => showToast())
                    .catch(err => {
                        console.error('Erro de clipboard API:', err);
                        fallbackCopyTextToClipboard(lista);
                    });
            } else {
                fallbackCopyTextToClipboard(lista);
            }
        }

        function fallbackCopyTextToClipboard(textElement) {
            textElement.select();
            textElement.setSelectionRange(0, 99999);

            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    showToast();
                } else {
                    alert('Não foi possível copiar o texto. Seu navegador pode não suportar esta funcionalidade.');
                }
            } catch (err) {
                console.error('Falha ao copiar:', err);
                alert('Erro ao copiar. Tente selecionar o texto manualmente e usar Ctrl+C ou Cmd+C.');
            }
        }

        function showToast() {
            const toast = document.getElementById('toast');
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }

        function limparLista() {
            if (confirm('Tem certeza que deseja limpar todos os números? Esta ação não pode ser desfeita.')) {
                document.getElementById('listaWhatsApp').value = '';
            }
        }

        function atualizarQuantidadeSenhas() {
            const novaQuantidade = parseInt(document.getElementById('quantidadeSenhas').value);
            if (!novaQuantidade || isNaN(novaQuantidade) || novaQuantidade < 1 || novaQuantidade > 1000) {
                alert('Por favor, insira uma quantidade válida entre 1 e 1000.');
                return;
            }

            if (confirm(`Tem certeza que deseja alterar a quantidade para ${novaQuantidade} senhas? Esta ação pode remover números já registrados.`)) {
                // Criar nova lista com a nova quantidade
                const novaLista = [];
                for (let i = 1; i <= novaQuantidade; i++) {
                    // Verificar se já existe esse número na lista atual
                    const existente = numeros.find(item => item.numero === i);
                    if (existente) {
                        novaLista.push(existente);
                    } else {
                        novaLista.push({
                            numero: i,
                            nome: '',
                            pago: false
                        });
                    }
                }

                // Update list in Firebase
                numerosRef.set(novaLista)
                    .then(() => {
                        numeros = novaLista;
                        atualizarTabela();
                        alert(`Lista atualizada com ${novaQuantidade} senhas.`);
                        document.getElementById('quantidadeSenhas').value = '';
                    })
                    .catch(error => {
                        console.error("Error updating quantity:", error);
                        alert("Erro ao atualizar quantidade. Por favor, tente novamente.");
                    });
            }
        }

        function filtrarTabela() {
            const buscarNome = document.getElementById('buscarNome').value.toLowerCase();
            const buscarNumero = document.getElementById('buscarNumero').value;
            const filtroStatus = document.getElementById('filtroStatus').value;
            let tabela = document.getElementById('tabela');
            let resultCount = document.getElementById('resultCount');

            tabela.innerHTML = '';
            resultCount.innerHTML = '';

            // Usar fragment para melhor performance
            const fragment = document.createDocumentFragment();

            let dadosFiltrados = numeros || [];

            // Primeiro filtrar por status
            if (filtroStatus !== 'todos') {
                dadosFiltrados = dadosFiltrados.filter(item => {
                    if (filtroStatus === 'disponivel') return !item.nome;
                    if (filtroStatus === 'pendente') return item.nome && !item.pago;
                    if (filtroStatus === 'pago') return item.pago;
                    return true;
                });
            }

            // Depois filtrar por nome ou número
            let filtradoPorPesquisa = false;

            if (buscarNome) {
                dadosFiltrados = dadosFiltrados.filter(item =>
                    item.nome && item.nome.toLowerCase().includes(buscarNome)
                );
                filtradoPorPesquisa = true;
            }

            if (buscarNumero) {
                dadosFiltrados = dadosFiltrados.filter(item =>
                    item.numero.toString().includes(buscarNumero)
                );
                filtradoPorPesquisa = true;
            }

            // Renderizar os dados filtrados
            dadosFiltrados.forEach(item => {
                const row = document.createElement('tr');

                // Destacar o texto que corresponde à busca
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

            // Mostrar contagem de resultados
            if (filtradoPorPesquisa) {
                resultCount.innerHTML = `Encontrados ${dadosFiltrados.length} resultado(s) para sua busca.`;
            }
        }
