// Arquivo: api-mock.js
// Descrição: Implementação da API com dados simulados para o dashboard

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mockData = require('./data-mock');

// Configuração do ambiente
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Endpoint: Obter KPIs principais
app.get('/backend/kpis', (req, res) => {
  res.json(mockData.getKpisMock());
});

// Endpoint: Obter distribuição de propostas por situação
app.get('/backend/monitoracao/v1/relatorios/situacoes', (req, res) => {
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

 // Endpoint: Filtrar propostas com paginação
app.get('/backend/monitoracao/v1/propostas/filtros', (req, res) => {
  const params = {
    nuPropostaSeguridade: req.query.nuPropostaSeguridade,
    sgSituacaoProposta: req.query.sgSituacaoProposta,
    dataInicio: req.query.dataInicio,
    dataFim: req.query.dataFim,
    offset: req.query.offset,
    limit: req.query.limit
  };

  res.json(mockData.filtrarPropostas(params));
});

// Inicialização do servidor
const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor mock rodando na porta ${PORT}`);
});

module.exports = app;
