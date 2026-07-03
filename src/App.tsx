import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Divider,
  Progress,
  Row,
  Segmented,
  Slider,
  Space,
  Steps,
  Tag,
  Tooltip,
} from 'antd';
import {
  CheckCircleOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  DeploymentUnitOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
  PartitionOutlined,
  PlayCircleOutlined,
  RadarChartOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import './poc.css';

type Phase = 'dashboard' | 'devices' | 'model' | 'sharding' | 'deploy';
type NodeRole = 'Head' | 'Worker';
type DeployStatus = 'idle' | 'deploying' | 'running' | 'blocked';

type ClusterNode = {
  id: string;
  name: string;
  role: NodeRole;
  gpu: string;
  os: string;
  vramGb: number;
  benchmark: number;
  freeVramGb: number;
  network: 'ConnectX' | 'Wi-Fi';
  latencyMs: number;
  rdma: boolean;
};

type ModelOption = {
  id: string;
  name: string;
  family: 'LLM' | 'VLM' | 'Agent';
  params: string;
  layers: number;
  minVramGb: number;
  recommendedVramGb: number;
  throughputWeight: number;
};

type RequirementStatus = 'covered' | 'stubbed' | 'later';

type RequirementCoverage = {
  id: string;
  priority: 'P0' | 'P1' | 'P2';
  label: string;
  status: RequirementStatus;
};

const phaseOrder: { key: Phase; title: string; ids: string[] }[] = [
  { key: 'dashboard', title: 'Dashboard', ids: ['OOB-03', 'DSH-01', 'DSH-02'] },
  { key: 'devices', title: 'Select devices', ids: ['DSC-01', 'DSC-07', 'ALC-01'] },
  { key: 'model', title: 'Select model', ids: ['MDL-01', 'MDL-04', 'DEP-02'] },
  { key: 'sharding', title: 'Optimize shards', ids: ['ALC-03', 'ALC-04', 'DSC-06'] },
  { key: 'deploy', title: 'Deploy', ids: ['DEP-01', 'DEP-03', 'DEP-04'] },
];

const clusterNodes: ClusterNode[] = [
  {
    id: 'n1x-head',
    name: 'ASUS N1X Head',
    role: 'Head',
    gpu: 'NVIDIA RTX 5090 Laptop',
    os: 'Windows arm64 + WSL mirrored',
    vramGb: 32,
    benchmark: 92,
    freeVramGb: 25,
    network: 'ConnectX',
    latencyMs: 1.4,
    rdma: true,
  },
  {
    id: 'gx10-a',
    name: 'GX10 Worker A',
    role: 'Worker',
    gpu: 'NVIDIA GB10',
    os: 'Linux arm64',
    vramGb: 128,
    benchmark: 188,
    freeVramGb: 118,
    network: 'ConnectX',
    latencyMs: 1.1,
    rdma: true,
  },
  {
    id: 'gx10-b',
    name: 'GX10 Worker B',
    role: 'Worker',
    gpu: 'NVIDIA GB10',
    os: 'Linux arm64',
    vramGb: 128,
    benchmark: 181,
    freeVramGb: 111,
    network: 'ConnectX',
    latencyMs: 1.3,
    rdma: true,
  },
  {
    id: 'studio-book',
    name: 'ProArt Worker',
    role: 'Worker',
    gpu: 'NVIDIA RTX 4090 Laptop',
    os: 'Windows x64',
    vramGb: 24,
    benchmark: 74,
    freeVramGb: 16,
    network: 'Wi-Fi',
    latencyMs: 18.6,
    rdma: false,
  },
];

const modelOptions: ModelOption[] = [
  {
    id: 'qwen-72b',
    name: 'Qwen3.5 72B Instruct',
    family: 'LLM',
    params: '72B FP8',
    layers: 80,
    minVramGb: 96,
    recommendedVramGb: 152,
    throughputWeight: 1.0,
  },
  {
    id: 'gemma-26b',
    name: 'Gemma 4 26B Agent',
    family: 'Agent',
    params: '26B NVFP4',
    layers: 48,
    minVramGb: 42,
    recommendedVramGb: 72,
    throughputWeight: 0.64,
  },
  {
    id: 'vlm-34b',
    name: 'PowerX VLM 34B',
    family: 'VLM',
    params: '34B INT4',
    layers: 60,
    minVramGb: 58,
    recommendedVramGb: 92,
    throughputWeight: 0.78,
  },
  {
    id: 'qwen-122b',
    name: 'Qwen3.5 122B MoE',
    family: 'LLM',
    params: '122B FP8',
    layers: 96,
    minVramGb: 174,
    recommendedVramGb: 238,
    throughputWeight: 1.34,
  },
];

const coverage: RequirementCoverage[] = [
  { id: 'DSC-04', priority: 'P0', label: 'Secure handshake after discovery', status: 'covered' },
  { id: 'PAR-01', priority: 'P0', label: 'Pair into Ray head/worker topology', status: 'covered' },
  { id: 'OOB-03', priority: 'P0', label: 'Cluster setup lands on dashboard', status: 'covered' },
  { id: 'DSH-01', priority: 'P0', label: 'Dashboard entry point for device and model status', status: 'covered' },
  { id: 'DSH-02', priority: 'P0', label: 'CPU/GPU/RAM/VRAM and role visibility', status: 'covered' },
  { id: 'DSC-07', priority: 'P0', label: 'GPU and runtime capability detection', status: 'covered' },
  { id: 'ALC-03', priority: 'P0', label: 'Layer split and deployment guardrails', status: 'covered' },
  { id: 'DEP-01', priority: 'P0', label: 'Fault containment and deploy state', status: 'stubbed' },
  { id: 'DEP-03', priority: 'P1', label: 'OpenAI-compatible API endpoint', status: 'covered' },
  { id: 'DEP-04', priority: 'P1', label: 'vLLM backend deploy route', status: 'stubbed' },
  { id: 'OBS-03', priority: 'P0', label: 'Actionable blocked/degraded errors', status: 'covered' },
  { id: 'SEC-02', priority: 'P0', label: 'Local API key placeholder', status: 'stubbed' },
  { id: 'SET-01', priority: 'P0', label: 'About/legal notice shell', status: 'later' },
];

const phaseIndex = (phase: Phase) => phaseOrder.findIndex((item) => item.key === phase);

const estimateLayerMemory = (model: ModelOption) => model.recommendedVramGb / model.layers;

const formatGb = (value: number) => `${Math.round(value)} GB`;

const computeDefaultShards = (model: ModelOption, nodes: ClusterNode[]) => {
  const layerCost = estimateLayerMemory(model);
  const totalWeight = nodes.reduce((sum, node) => sum + Math.max(node.freeVramGb - 4, 0), 0);
  let remaining = model.layers;

  const initial = nodes.map((node) => {
    const capacity = Math.max(node.freeVramGb - 4, 0);
    const proposed = totalWeight > 0 ? Math.floor((capacity / totalWeight) * model.layers) : 0;
    const maxByMemory = Math.max(0, Math.floor(capacity / layerCost));
    const layers = Math.min(proposed, maxByMemory);
    remaining -= layers;
    return { nodeId: node.id, layers };
  });

  while (remaining > 0) {
    const next = initial
      .map((shard) => {
        const node = nodes.find((candidate) => candidate.id === shard.nodeId);
        if (!node) return { shard, room: -1 };
        const room = Math.floor(Math.max(node.freeVramGb - 4, 0) / layerCost) - shard.layers;
        return { shard, room };
      })
      .sort((a, b) => b.room - a.room)[0];

    if (!next || next.room <= 0) break;
    next.shard.layers += 1;
    remaining -= 1;
  }

  return initial;
};

const getDeployableModels = (nodes: ClusterNode[]) => {
  const totalFree = nodes.reduce((sum, node) => sum + node.freeVramGb, 0);
  const rdmaReady = nodes.some((node) => node.rdma);
  return modelOptions.map((model) => ({
    ...model,
    deployable: totalFree >= model.minVramGb && (model.recommendedVramGb <= 90 || rdmaReady),
    headroom: totalFree - model.recommendedVramGb,
  }));
};

const getNodeTone = (ratio: number) => {
  if (ratio >= 1) return 'critical';
  if (ratio >= 0.86) return 'warning';
  return 'healthy';
};

const Poc: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('dashboard');
  const [paired, setPaired] = useState(true);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>(['n1x-head', 'gx10-a', 'gx10-b']);
  const [selectedModelId, setSelectedModelId] = useState('qwen-72b');
  const [deployStatus, setDeployStatus] = useState<DeployStatus>('idle');

  const selectedNodes = useMemo(
    () => clusterNodes.filter((node) => selectedNodeIds.includes(node.id)),
    [selectedNodeIds],
  );

  const selectedModel = useMemo(
    () => modelOptions.find((model) => model.id === selectedModelId) ?? modelOptions[0],
    [selectedModelId],
  );

  const [manualShards, setManualShards] = useState(() => computeDefaultShards(modelOptions[0], clusterNodes.slice(0, 3)));

  const deployableModels = useMemo(() => getDeployableModels(selectedNodes), [selectedNodes]);

  const totalBenchmark = selectedNodes.reduce((sum, node) => sum + node.benchmark, 0);
  const totalFreeVram = selectedNodes.reduce((sum, node) => sum + node.freeVramGb, 0);
  const avgLatency = selectedNodes.length
    ? selectedNodes.reduce((sum, node) => sum + node.latencyMs, 0) / selectedNodes.length
    : 0;
  const rdmaRatio = selectedNodes.length
    ? selectedNodes.filter((node) => node.rdma).length / selectedNodes.length
    : 0;
  const battleScore = Math.min(999, Math.round(totalBenchmark * 1.9 + totalFreeVram * 1.15 + rdmaRatio * 120 - avgLatency * 2));

  const shardRows = selectedNodes.map((node) => {
    const shard = manualShards.find((item) => item.nodeId === node.id);
    const layers = shard?.layers ?? 0;
    const requiredGb = layers * estimateLayerMemory(selectedModel);
    const ratio = requiredGb / node.freeVramGb;
    return {
      node,
      layers,
      requiredGb,
      ratio,
      tone: getNodeTone(ratio),
    };
  });

  const totalLayers = shardRows.reduce((sum, row) => sum + row.layers, 0);
  const hasOverload = shardRows.some((row) => row.tone === 'critical');
  const hasLayerMismatch = totalLayers !== selectedModel.layers;
  const canDeploy = paired && selectedNodes.length > 0 && !hasOverload && !hasLayerMismatch;

  const resetAutoShard = (model = selectedModel, nodes = selectedNodes) => {
    setManualShards(computeDefaultShards(model, nodes));
    setDeployStatus('idle');
  };

  const updateNodeSelection = (nodeId: string, checked: boolean) => {
    setSelectedNodeIds((current) => {
      const next = checked ? [...current, nodeId] : current.filter((id) => id !== nodeId);
      const normalized = next.length ? next : [nodeId];
      const nodes = clusterNodes.filter((node) => normalized.includes(node.id));
      resetAutoShard(selectedModel, nodes);
      return normalized;
    });
  };

  const updateModel = (modelId: string) => {
    const model = modelOptions.find((item) => item.id === modelId) ?? modelOptions[0];
    setSelectedModelId(model.id);
    resetAutoShard(model, selectedNodes);
    setPhase('sharding');
  };

  const updateLayerCount = (nodeId: string, layers: number) => {
    setManualShards((current) => {
      const currentNodeIds = selectedNodes.map((node) => node.id);
      const existing = current.filter((item) => currentNodeIds.includes(item.nodeId));
      const found = existing.some((item) => item.nodeId === nodeId);
      const updated = found
        ? existing.map((item) => (item.nodeId === nodeId ? { ...item, layers } : item))
        : [...existing, { nodeId, layers }];
      return updated;
    });
    setDeployStatus('idle');
  };

  const startDeploy = () => {
    if (!canDeploy) {
      setDeployStatus('blocked');
      return;
    }
    setDeployStatus('deploying');
    window.setTimeout(() => setDeployStatus('running'), 900);
  };

  const activeStep = phaseIndex(phase);

  return (
    <div className="poc-page">
      <section className="poc-hero">
        <div>
          <div className="poc-eyebrow">PowerX POC from PRD v1.2</div>
          <h1>Pair to deploy workflow</h1>
          <p>
            After pairing, operators land on the dashboard, inspect cluster power, select devices and a model,
            review automatic layer sharding, adjust it with guardrails, then deploy.
          </p>
        </div>
        <div className="pair-status">
          <SafetyCertificateOutlined />
          <div>
            <span>{paired ? 'Paired cluster' : 'Pairing required'}</span>
            <strong>{paired ? 'Token PX-8827 issued' : 'Handshake pending'}</strong>
          </div>
          <Button
            icon={paired ? <ReloadOutlined /> : <CheckCircleOutlined />}
            onClick={() => {
              setPaired((value) => !value);
              setDeployStatus('idle');
            }}
          >
            {paired ? 'Reset pair' : 'Pair now'}
          </Button>
        </div>
      </section>

      <Steps
        className="poc-steps"
        current={activeStep}
        items={phaseOrder.map((item) => ({
          title: item.title,
          description: item.ids.join(' / '),
        }))}
        onChange={(index) => setPhase(phaseOrder[index]?.key ?? 'dashboard')}
      />

      <Row gutter={[20, 20]} className="poc-main">
        <Col xs={24} xl={15}>
          <section className="poc-section dashboard-panel">
            <div className="section-title">
              <DashboardOutlined />
              <div>
                <h2>Dashboard after pair</h2>
                <p>Cluster benchmark, GPU size, deployable model list and deployment readiness.</p>
              </div>
            </div>

            <div className="score-grid">
              <div className="battle-score">
                <span>Battle power</span>
                <strong>{battleScore}</strong>
                <Progress percent={Math.min(100, Math.round(battleScore / 9.99))} showInfo={false} />
              </div>
              <MetricCard icon={<ThunderboltOutlined />} label="GPU benchmark" value={`${totalBenchmark} PX`} />
              <MetricCard icon={<CloudServerOutlined />} label="Free cluster VRAM" value={formatGb(totalFreeVram)} />
              <MetricCard icon={<RadarChartOutlined />} label="Network profile" value={`${avgLatency.toFixed(1)} ms`} />
            </div>

            <Divider />

            <div className="deployable-header">
              <h3>Deployable models</h3>
              <Tag color={deployableModels.filter((item) => item.deployable).length ? 'success' : 'error'}>
                {deployableModels.filter((item) => item.deployable).length} ready
              </Tag>
            </div>
            <div className="model-grid">
              {deployableModels.map((model) => (
                <button
                  key={model.id}
                  className={`model-tile ${selectedModel.id === model.id ? 'selected' : ''}`}
                  type="button"
                  onClick={() => updateModel(model.id)}
                >
                  <span>
                    <strong>{model.name}</strong>
                    <small>{model.family} / {model.params}</small>
                  </span>
                  <Tag color={model.deployable ? 'green' : 'red'}>
                    {model.deployable ? 'Deployable' : 'Blocked'}
                  </Tag>
                  <em>{model.headroom >= 0 ? `${Math.round(model.headroom)} GB headroom` : `${Math.abs(Math.round(model.headroom))} GB short`}</em>
                </button>
              ))}
            </div>
          </section>

          <section className="poc-section">
            <div className="section-title">
              <PartitionOutlined />
              <div>
                <h2>Shard optimizer</h2>
                <p>Automatic split is based on free VRAM and benchmark. Manual changes are validated before deploy.</p>
              </div>
              <Button icon={<ReloadOutlined />} onClick={() => resetAutoShard()}>
                Auto optimize
              </Button>
            </div>

            <div className="selected-model-row">
              <Segmented
                value={selectedModel.id}
                options={modelOptions.map((model) => ({ label: model.name, value: model.id }))}
                onChange={(value) => updateModel(String(value))}
              />
              <Tag color={hasOverload || hasLayerMismatch ? 'error' : 'success'}>
                {hasOverload ? 'Device overloaded' : hasLayerMismatch ? 'Layer count mismatch' : 'Deployment safe'}
              </Tag>
            </div>

            <div className="shard-list">
              {shardRows.map((row) => (
                <div className={`shard-row ${row.tone}`} key={row.node.id}>
                  <div className="node-summary">
                    <strong>{row.node.name}</strong>
                    <span>{row.node.gpu}</span>
                  </div>
                  <div className="slider-cell">
                    <Slider
                      min={0}
                      max={selectedModel.layers}
                      value={row.layers}
                      onChange={(value) => updateLayerCount(row.node.id, value)}
                    />
                    <div className="shard-meta">
                      <span>{row.layers} layers</span>
                      <span>{row.requiredGb.toFixed(1)} / {row.node.freeVramGb} GB</span>
                    </div>
                  </div>
                  <Progress
                    type="circle"
                    percent={Math.min(100, Math.round(row.ratio * 100))}
                    size={58}
                    status={row.tone === 'critical' ? 'exception' : row.tone === 'warning' ? 'normal' : 'success'}
                  />
                </div>
              ))}
            </div>

            {(hasOverload || hasLayerMismatch) && (
              <Alert
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                message="Deploy guardrail is blocking this split"
                description={
                  hasOverload
                    ? 'At least one selected device would load more layers than its free VRAM can safely handle.'
                    : `The split must equal ${selectedModel.layers} total layers. Current split is ${totalLayers}.`
                }
              />
            )}
          </section>
        </Col>

        <Col xs={24} xl={9}>
          <section className="poc-section">
            <div className="section-title compact">
              <CloudServerOutlined />
              <div>
                <h2>Use devices</h2>
                <p>Select this deployment run's devices.</p>
              </div>
            </div>
            <div className="device-list">
              {clusterNodes.map((node) => {
                const selected = selectedNodeIds.includes(node.id);
                return (
                  <label className={`device-row ${selected ? 'selected' : ''}`} key={node.id}>
                    <Checkbox checked={selected} onChange={(event) => updateNodeSelection(node.id, event.target.checked)} />
                    <span>
                      <strong>{node.name}</strong>
                      <small>{node.role} / {node.os}</small>
                    </span>
                    <Tag color={node.rdma ? 'cyan' : 'orange'}>{node.network}</Tag>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="poc-section deploy-panel">
            <div className="section-title compact">
              <DeploymentUnitOutlined />
              <div>
                <h2>Deployment</h2>
                <p>Final validation and runtime endpoint.</p>
              </div>
            </div>

            <div className={`deploy-state ${deployStatus}`}>
              <ExperimentOutlined />
              <div>
                <span>{selectedModel.name}</span>
                <strong>{deployStatus === 'running' ? 'Running' : deployStatus === 'deploying' ? 'Deploying' : deployStatus === 'blocked' ? 'Blocked' : 'Ready'}</strong>
              </div>
            </div>

            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <StatusLine label="Pair token" ok={paired} detail="PX-8827 local trust" />
              <StatusLine label="Selected devices" ok={selectedNodes.length > 0} detail={`${selectedNodes.length} nodes`} />
              <StatusLine label="Layer total" ok={!hasLayerMismatch} detail={`${totalLayers}/${selectedModel.layers}`} />
              <StatusLine label="VRAM guardrail" ok={!hasOverload} detail={hasOverload ? 'overloaded' : 'safe'} />
              <StatusLine label="Network" ok={avgLatency < 20} detail={`${avgLatency.toFixed(1)} ms avg`} />
            </Space>

            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              disabled={!paired}
              onClick={startDeploy}
              className="deploy-button"
            >
              Deploy model
            </Button>

            {deployStatus === 'running' && (
              <Alert
                type="success"
                showIcon
                message="OpenAI-compatible endpoint is live"
                description="http://localhost:7000/v1/chat/completions"
              />
            )}
          </section>

          <section className="poc-section coverage-panel">
            <div className="section-title compact">
              <InfoCircleOutlined />
              <div>
                <h2>PRD coverage</h2>
                <p>Readable IDs extracted from the provided CSV.</p>
              </div>
            </div>
            <div className="coverage-list">
              {coverage.map((item) => (
                <Tooltip title={item.label} key={item.id}>
                  <span className={`coverage-chip ${item.status}`}>
                    {item.id}
                    <small>{item.priority}</small>
                  </span>
                </Tooltip>
              ))}
            </div>
          </section>
        </Col>
      </Row>
    </div>
  );
};

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="metric-card">
    {icon}
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const StatusLine: React.FC<{ label: string; ok: boolean; detail: string }> = ({ label, ok, detail }) => (
  <div className="status-line">
    {ok ? <CheckCircleOutlined className="ok" /> : <WarningOutlined className="warn" />}
    <span>{label}</span>
    <strong>{detail}</strong>
  </div>
);

export default Poc;
