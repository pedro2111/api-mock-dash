// Arquivo: api-mock.js
// Descrição: Implementação da API com dados simulados para o dashboard

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https')
const fs = require('fs')
const qs = require('qs');
const dotenv = require('dotenv');
const mockData = require('./data-mock');
const httpClient = require('./httpClient');

//const ca = fs.readFileSync('acicptestesraiz.cer')
//const agent = new https.Agent({ca:ca});

// Configuração do ambiente
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const apiUrlPRD = 'https://sigpf-servicos-prd.apps.apl4.caixa'
const apiUrlCredito = 'https://novocredito.caixa'
//https://novocredito.caixa/api/credito/contratos/api/v2/contrato?nuContrato=16604865&size=5&page=1

// Endpoint: Obter informações de contrato
app.get('/backend/credito/contrato', async (req, res) => {
  try {
    const { nuContrato, size = 5, page = 1 } = req.query;
    const authorization = req.headers['authorization'];

    if (!authorization) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    if (!nuContrato) {
      return res.status(400).json({ error: 'Número do contrato é obrigatório' });
    }

    const apiUrl = `${apiUrlCredito}/api/credito/contratos/api/v2/contrato?nuContrato=${nuContrato}&size=${size}&page=${page}`;

    const response = await httpClient.get(apiUrl, {
      headers: {
        Authorization: authorization
      },
      maxBodyLength: Infinity
    });

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      console.log("error", error.message)
      res.status(error.response.status).json(error.response.data);
      
    } else {
      console.log("error", error.message)
      res.status(500).json({ error: 'Erro ao consultar informações do contrato', details: error.message });
    }
  }
});

// Endpoint: Obter informações de seguro de contrato
app.get('/backend/credito/contrato/seguro/:coContrato', async (req, res) => {
  try {
    const { coContrato } = req.params;
    const authorization = req.headers['authorization'];

    if (!authorization) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const apiUrl = `${apiUrlCredito}/api/credito/contratos/api/contrato/seguro/${coContrato}`;

    const response = await httpClient.get(apiUrl, {
      headers: {
        Authorization: authorization
      },
      maxBodyLength: Infinity
    });

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Erro ao consultar informações de seguro do contrato', details: error.message });
    }
  }
});

// Endpoint: Gerar token de serviço (client credentials grant)
app.post('/backend/auth/realms/intranet/protocol/openid-connect/token', async (req, res) => {
  try {
    const { client_id, client_secret } = req.body;
    console.log("body", req.body)
    if (!client_id || !client_secret) {
      console.log("cliente", client_id)
      console.log("secret", client_secret)
      return res.status(400).json({ error: 'client_id and client_secret are required' });
    }

    const data = qs.stringify({
      grant_type: 'client_credentials',
      client_id,
      client_secret
    });
    console.log("data", data)
    const response = await httpClient.post(
      'https://login.des.caixa/auth/realms/intranet/protocol/openid-connect/token',
      data,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    res.json(response.data); // Retorna o token completo (access_token, expires_in, etc.)

  } catch (error) {
    if (error.response) {
      // Retorna o erro do servidor de autenticação
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Erro ao tentar autenticar no Keycloak', details: error.message });
    }
  }
});

// Endpoint: Gerar token com usuário e senha (password grant)
app.post('/backend/auth/realms/intranet/protocol/openid-connect/token', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username e password são obrigatórios' });
    }

    const data = qs.stringify({
      grant_type: 'password',
      client_id: 'cli-web-pnc', // pode tornar dinâmico se necessário
      username,
      password
    });

    const response = await httpClient.post(
      'https://login.des.caixa/auth/realms/intranet/protocol/openid-connect/token',
      data,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        maxBodyLength: Infinity
      }
    );

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Erro ao gerar token de usuário', details: error.message });
    }
  }
});

// Endpoint: Obter histórico de uma proposta específica
app.get('/backend/monitoracao/v1/propostas/:id/historico', async (req, res) => {
  try {
    const propostaId = req.params.id;
    const { offset = 0, limit = 100 } = req.query;
    const authorization = req.headers['authorization'];

    if (!authorization) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const apiUrl = `${apiUrlPRD}/backoffice/monitoracao/v1/propostas/${propostaId}/historico?offset=${offset}&limit=${limit}`;

    const response = await httpClient.get(apiUrl, {
      headers: {
        Authorization: authorization
      },
      maxBodyLength: Infinity
    });

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Erro ao consultar histórico da proposta', details: error.message });
    }
  }
});

// Endpoint: Filtrar propostas com paginação (proxy real)
app.get('/backend/monitoracao/v1/propostas/filtros', async (req, res) => {
  try {
    const {
      nuPropostaSeguridade,
      sgSituacaoProposta,
      dataInicio,
      dataFim,
      offset = 0,
      limit = 100
    } = req.query;

    const authorization = req.headers['authorization'];

    if (!authorization) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    // Montar query string
    const queryParams = new URLSearchParams();

    if (nuPropostaSeguridade) queryParams.append('nuPropostaSeguridade', nuPropostaSeguridade);
    if (sgSituacaoProposta) queryParams.append('sgSituacaoProposta', sgSituacaoProposta);
    if (dataInicio) queryParams.append('dataInicio', dataInicio);
    if (dataFim) queryParams.append('dataFim', dataFim);
    queryParams.append('offset', offset);
    queryParams.append('limit', limit);

    const apiUrl = `${apiUrlPRD}/backoffice/monitoracao/v1/propostas/filtros?${queryParams.toString()}`;
    
    const response = await httpClient.get(apiUrl, {
      headers: {
        Authorization: authorization
      },
      maxBodyLength: Infinity
    });

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Erro ao consultar a API SIGPF (filtros)', details: error.message });
    }
  }
});

// Endpoint: Obter última situação das propostas
app.get('/backend/monitoracao/v1/propostas/ultimaSituacao', async (req, res) => {
  try {
    const {
      nuPropostaSeguridade,
      sgSituacaoProposta,
      dataInicio,
      dataFim,
      offset = 0,
      limit = 100
    } = req.query;

    const authorization = req.headers['authorization'];

    if (!authorization) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    // Monta query string igual à de /filtros
    const queryParams = new URLSearchParams();
    if (nuPropostaSeguridade) queryParams.append('nuPropostaSeguridade', nuPropostaSeguridade);
    if (sgSituacaoProposta) queryParams.append('sgSituacaoProposta', sgSituacaoProposta);
    if (dataInicio) queryParams.append('dataInicio', dataInicio);
    if (dataFim) queryParams.append('dataFim', dataFim);
    queryParams.append('offset', offset);
    queryParams.append('limit', limit);

    const apiUrl = `${apiUrlPRD}/backoffice/monitoracao/v1/propostas/ultimaSituacao?${queryParams.toString()}`;

    const response = await httpClient.get(apiUrl, {
      headers: {
        Authorization: authorization
      },
      maxBodyLength: Infinity
    });

    res.json(response.data);
  } catch (error) {
    console.error("Erro ao consultar ultimaSituacao:", error.message);
    // Retorna mock em caso de falha
    const mock = require('./ultimaSituacaoProposta.json');
    res.status(200).json(mock);
  }
});


// Endpoint: Obter distribuição de propostas por situação
app.get('/backend/monitoracao/v1/relatorios/situacoes', async (req, res) => {
  try {
    const { dataInicio, dataFim, offset = 0, limit = 100 } = req.query;
    const authorization = req.headers['authorization'];

    if (!authorization) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const queryParams = new URLSearchParams();

    if (dataInicio) queryParams.append('dataInicio', dataInicio);
    if (dataFim) queryParams.append('dataFim', dataFim);
    queryParams.append('offset', offset);
    queryParams.append('limit', limit);

    const apiUrl = `${apiUrlPRD}/backoffice/monitoracao/v1/relatorios/situacoes?${queryParams.toString()}`;

    const response = await httpClient.get(apiUrl, {
      headers: {
        Authorization: authorization
      },
      maxBodyLength: Infinity
    });

    res.json(response.data);
    
  } catch (error) {
    if (error.response) {
      
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error({ error: 'Erro ao consultar relatório de situações', details: error.message });
      const mock = mockData.getDistribuicaoSituacaoMock();
      res.status(200).json(mock);
      //res.status(500).json({ error: 'Erro ao consultar relatório de situações', details: error.message });
    }
  }
});

// Endpoint: Obter KPIs principais
// Endpoint: Obter KPIs principais
app.get('/backend/kpis', async (req, res) => {
  const authorization = req.headers['authorization'];

  // JSON mockado de fallback
  const mockResponse = {
    totalPropostas: 0,
    propostasAtivas: 0,
    taxaConversao: 0.0
  };

  try {
    if (!authorization) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    // Endpoints a serem chamados
    const urls = {
      total: `${apiUrlPRD}/backoffice/monitoracao/v1/propostas/total`,
      ativas: `${apiUrlPRD}/backoffice/monitoracao/v1/propostas/ativas`,
      taxa: `${apiUrlPRD}/backoffice/monitoracao/v1/propostas/taxaConversaoEMT`
    };

    // Executa as 3 chamadas em paralelo
    const [respTotal, respAtivas, respTaxa] = await Promise.all([
      httpClient.get(urls.total, { headers: { Authorization: authorization } }),
      httpClient.get(urls.ativas, { headers: { Authorization: authorization } }),
      httpClient.get(urls.taxa, { headers: { Authorization: authorization } })
    ]);

    // Monta JSON final
    const result = {
      totalPropostas: respTotal.data.totalPropostas,
      propostasAtivas: respAtivas.data.propostasAtivas,
      taxaConversao: respTaxa.data.taxaConversao
    };

    res.json(result);
  } catch (error) {
    console.error("Erro ao consultar KPIs:", error.message);
    res.json(mockResponse); // se qualquer chamada falhar, devolve mock
  }
});

// Endpoint: Obter distribuição de propostas por situação
app.get('mock/backend/monitoracao/v1/relatorios/situacoes', (req, res) => {
  const params = {
    dataInicio: req.query.dataInicio,
    dataFim: req.query.dataFim,
    offset: req.query.offset,
    limit: req.query.limit
  };
  res.json(mockData.getDistribuicaoSituacaoMock(params));
});

// Endpoint: Obter propostas em GER por mais de 2 horas
app.get('/backend/propostas-ger-2h', (req, res) => {
  res.json(mockData.getPropostasGer2hMock());
});

// Endpoint: Obter evolução de propostas ao longo do tempo
app.get('/backend/evolucao-propostas', (req, res) => {
  res.json(mockData.getEvolucaoPropostasMock());
});

// Endpoint: Obter tempo médio em cada situação
app.get('/backend/tempo-medio-situacao', (req, res) => {
  res.json(mockData.getTempoMedioSituacaoMock());
});

// Endpoint: Obter conversão entre etapas principais (funil)
app.get('/backend/conversao-etapas', (req, res) => {
  res.json(mockData.getConversaoEtapasMock());
});

// Endpoint: Obter motivos de rejeição/cancelamento
app.get('/backend/motivos-rejeicao', (req, res) => {
  res.json(mockData.getMotivosRejeicaoMock());
});

// Endpoint: Obter desempenho por canal
app.get('/backend/desempenho-canal', (req, res) => {
  res.json(mockData.getDesempenhoCanaisMock());
});

// Endpoint: Obter volume de registros de monitoração
app.get('/backend/volume-monitoracao', (req, res) => {
  res.json(mockData.getVolumeMonitoracaoMock());
});

// Endpoint: Obter monitoração de propostas
app.get('/backend/monitoracao/v1/propostas/monitoracao', async (req, res) => {
  try {
    const authorization = req.headers['authorization'];

    if (!authorization) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const apiUrl = `${apiUrlPRD}/backoffice/monitoracao/v1/propostas/monitoracao`;

    const response = await httpClient.get(apiUrl, {
      headers: {
        Authorization: authorization
      },
      maxBodyLength: Infinity
    });

    res.json(response.data);
    
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error({ error: 'Erro ao consultar monitoração de propostas', details: error.message });
      const mock = mockData.getMonitoracaoPropostasMock();
      res.status(200).json(mock);
    }
  }
});

 // Endpoint: Filtrar propostas com paginação (mock sem autenticação)
app.get('/mock/backend/monitoracao/v1/propostas/filtros', (req, res) => {
  res.json(mockData.filtrarPropostas());
});

// Endpoint: Obter monitoração de propostas (mock sem autenticação)
app.get('/mock/backend/monitoracao/v1/propostas/monitoracao', (req, res) => {
  res.json(mockData.getMonitoracaoPropostasMock());
});



// Inicialização do servidor
const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor mock rodando na porta ${PORT}`);
});

module.exports = app;
