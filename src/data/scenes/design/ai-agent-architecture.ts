// @ts-nocheck
/* eslint-disable */
import { makeBlock, makeDb, makeLink, makeZone } from '@/lib/simulator/scene-builders';

export const aiAgentArchitectureLesson = {
  id: 'ai-agent-architecture',
  title: 'The Anatomy of Modern AI Agent Architecture',
  trackId: 'system-design',
  badge: 'Flagship · Advanced',
  summary: 'Deconstruct the AI Agent stack using the 8-Layer Concentric Onion Model: from the bare Next-Token Predictor LLM core through RAG, MCP tool interfaces, ReAct cognitive loops, execution harness sandboxes, modular skills, LangGraph state machines, and multi-agent swarm orchestration.',
  metrics: ['llm_tokens', 'mcp_servers', 'context_depth', 'swarm_agents'],
  goals: [
    { step: 1, text: "Layer 1: Bare Next-Token LLM" },
    { step: 2, text: "Layer 2: RAG Context Buffer" },
    { step: 3, text: "Layer 3: MCP Tool Adapters" },
    { step: 4, text: "Layer 4: ReAct Cognitive Loop" },
    { step: 5, text: "Layer 5: OS Execution Harness" },
    { step: 6, text: "Layer 6: Modular On-Demand Skills" },
    { step: 7, text: "Layer 7: LangGraph State Machine" },
    { step: 8, text: "Layer 8: Swarm Multi-Agent Board" },
  ],
  steps: [
    {
      title: 'Layer 1: The Naked LLM Core',
      short: 'Next-Token Predictor',
      body: [
        'At the deepest center of the onion sits the foundation LLM: a statistical next-token prediction engine.',
        'By itself, it has no limbs, no filesystem access, no stateful memory, and no ability to observe real-world runtime execution.',
      ],
      scene: {
        entities: {
          llmCore: makeBlock(0, 0, { s: 5.6, h: 54, color: 'purple', glyph: 'server', label: ['Foundation LLM', 'Next-Token Core'] }),
        },
        links: {},
      },
    },
    {
      title: 'Layer 2: RAG & Knowledge Buffer',
      short: 'Semantic Retrieval Layer',
      body: [
        'The first protective wrapper around the core is the Knowledge Layer (RAG).',
        'Private code repositories, documentation, and database schemas are chunked, embedded, and injected into the prompt context to eliminate hallucinations.',
      ],
      scene: {
        entities: {
          ragZone: makeZone({ x0: -12, x1: 12, y0: -12, y1: 12 }, 'Layer 2: RAG & Context Buffer', { color: 'blue' }),
          llmCore: makeBlock(0, 0, { s: 5.6, h: 54, color: 'purple', glyph: 'server', label: ['Foundation LLM', 'Augmented Prompt'] }),
          vectorDb: makeDb(-12, 10, { r: 2.8, h: 38, color: 'store', label: ['Vector Store', 'ChromaDB'] }),
        },
        links: {
          rag_inject: makeLink('vectorDb', 'llmCore', ['vectorDb', 'llmCore'], { label: 'inject context chunks' }),
        },
      },
    },
    {
      title: 'Layer 3: The Model Context Protocol (MCP)',
      short: 'Standardized Tool USB-C',
      body: [
        'Wrapping around RAG is the Tool Interface Layer powered by Anthropic’s Model Context Protocol (MCP).',
        'MCP acts as a universal USB-C standard: rather than hardcoding proprietary API connectors, the agent discovers and invokes tools via standardized JSON-RPC.',
      ],
      scene: {
        entities: {
          mcpZone: makeZone({ x0: -15, x1: 15, y0: -15, y1: 15 }, 'Layer 3: MCP Tool Interface (USB-C)', { color: 'orange' }),
          ragZone: makeZone({ x0: -8, x1: 8, y0: -8, y1: 8 }, 'RAG Buffer', { color: 'blue' }),
          llmCore: makeBlock(0, 0, { s: 5.6, h: 54, color: 'purple', glyph: 'server', label: ['Foundation LLM', 'Tool-Call Aware'] }),
          fileSystemTool: makeBlock(-14, 4, { s: 4.6, h: 50, color: 'blue', label: ['Filesystem MCP', 'read / edit'] }),
          terminalTool: makeBlock(14, -4, { s: 4.6, h: 50, color: 'green', label: ['Terminal MCP', 'run_command'] }),
        },
        links: {
          mcp_fs: makeLink('llmCore', 'fileSystemTool', ['llmCore', 'fileSystemTool'], { label: 'read_file request' }),
          mcp_term: makeLink('llmCore', 'terminalTool', ['llmCore', 'terminalTool'], { label: 'run_command request' }),
        },
      },
    },
    {
      title: 'Layer 4: The Cognitive ReAct Loop',
      short: 'Reason + Act + Observe',
      body: [
        'A single tool call is not an agent. The Cognitive Loop wraps tools and models in a continuous evaluation cycle.',
        'Following the ReAct pattern (Reason → Act → Observe → Reflect), the agent executes commands, catches compiler/linter outputs, and self-corrects until completion.',
      ],
      scene: {
        entities: {
          reactZone: makeZone({ x0: -13, x1: 13, y0: -13, y1: 13 }, 'Layer 4: Cognitive ReAct Loop', { color: 'purple' }),
          mcpZone: makeZone({ x0: -6, x1: 6, y0: -6, y1: 6 }, 'Tool Core', { color: 'orange' }),
          llmCore: makeBlock(0, 0, { s: 5.4, h: 52, color: 'purple', glyph: 'server', label: ['Foundation LLM', 'Controller'] }),
          thinkNode: makeBlock(-11, -11, { s: 4.4, h: 48, color: 'purple', label: ['1. Think', 'Analyze Goal'] }),
          actNode: makeBlock(11, -11, { s: 4.4, h: 48, color: 'orange', label: ['2. Act', 'Invoke Tool'] }),
          observeNode: makeBlock(11, 11, { s: 4.4, h: 48, color: 'green', label: ['3. Observe', 'Capture Stdout'] }),
          reflectNode: makeBlock(-11, 11, { s: 4.4, h: 48, color: 'blue', label: ['4. Reflect', 'Self-Healing'] }),
        },
        links: {
          react_think_act: makeLink('thinkNode', 'actNode', ['thinkNode', 'actNode'], { label: 'emits tool_call' }),
          react_act_obs: makeLink('actNode', 'observeNode', ['actNode', 'observeNode'], { label: 'captures stdout' }),
          react_obs_ref: makeLink('observeNode', 'reflectNode', ['observeNode', 'reflectNode'], { label: 'evaluates exit code' }),
          react_ref_think: makeLink('reflectNode', 'thinkNode', ['reflectNode', 'thinkNode'], { label: 'loops on failure' }),
        },
      },
    },
    {
      title: 'Layer 5: OS Sandbox & Execution Harness',
      short: 'Process Boundary & Safety Guardrails',
      body: [
        'An autonomous loop running without boundaries is hazardous. The Harness layer encases the agent inside an operating system sandbox.',
        'It intercepts dangerous system calls, isolates execution inside containers, monitors token consumption, and compacts conversation context automatically.',
      ],
      scene: {
        entities: {
          harnessZone: makeZone({ x0: -16, x1: 16, y0: -16, y1: 16 }, 'Layer 5: OS Sandbox & Safety Harness', { color: 'slab' }),
          reactZone: makeZone({ x0: -9, x1: 9, y0: -9, y1: 9 }, 'Agent Core Loop', { color: 'purple' }),
          llmCore: makeBlock(0, 0, { s: 5.4, h: 52, color: 'purple', glyph: 'server', label: ['Foundation LLM', 'Sandboxed'] }),
          guardrailGate: makeBlock(-14, -12, { s: 4.6, h: 50, color: 'orange', label: ['Security Gate', 'Seccomp & Policy'] }),
          compactorNode: makeBlock(14, -10, { s: 4.6, h: 50, color: 'purple', label: ['Context Compactor', 'Prunes History'] }),
        },
        links: {
          harness_guard: makeLink('guardrailGate', 'llmCore', ['guardrailGate', 'llmCore'], { label: 'enforces permissions' }),
          harness_compact: makeLink('compactorNode', 'llmCore', ['compactorNode', 'llmCore'], { label: 'summarizes memory' }),
        },
      },
    },
    {
      title: 'Layer 6: On-Demand Superpowers & Skills',
      short: 'Dynamic Capability Packages',
      body: [
        'Skills are modular capabilities loaded strictly on-demand: headless Playwright browser automation, AST parsing, and dynamic Python workflow pipelines.',
        'They equip the agent with specialized domain capabilities without permanently bloating the core prompt.',
      ],
      scene: {
        entities: {
          harnessZone: makeZone({ x0: -16, x1: 16, y0: -16, y1: 16 }, 'Layer 6: Skill Superpowers Orbit', { color: 'slab' }),
          llmCore: makeBlock(0, 0, { s: 5.4, h: 52, color: 'purple', glyph: 'server', label: ['Foundation LLM', 'Skill Controller'] }),
          browserSkill: makeBlock(-16, 2, { s: 4.6, h: 50, color: 'blue', label: ['Browser Skill', 'Playwright Runner'] }),
          workflowSkill: makeBlock(16, -2, { s: 4.6, h: 50, color: 'green', label: ['Workflow Skill', 'Parallel Fan-Out'] }),
        },
        links: {
          skill_browser: makeLink('llmCore', 'browserSkill', ['llmCore', 'browserSkill'], { label: 'activates UI test' }),
          skill_workflow: makeLink('llmCore', 'workflowSkill', ['llmCore', 'workflowSkill'], { label: 'dispatches sub-pipelines' }),
        },
      },
    },
    {
      title: 'Layer 7: State Machine & Guardrails (LangGraph)',
      short: 'Persistent State & Human-in-the-Loop',
      body: [
        'For enterprise software workflows, agents cannot run purely reactive. They must follow structured state machine graphs.',
        'LangGraph coordinates transitions between states, saves durable checkpoints to databases, and pauses for Human-in-the-Loop (HITL) approval gates before destructive actions.',
      ],
      scene: {
        entities: {
          graphZone: makeZone({ x0: -16, x1: 16, y0: -16, y1: 16 }, 'Layer 7: LangGraph State Machine', { color: 'green' }),
          llmCore: makeBlock(0, 0, { s: 5.4, h: 52, color: 'purple', glyph: 'server', label: ['Agent Node', 'FSM State'] }),
          humanGate: makeBlock(0, -14, { s: 4.6, h: 50, color: 'orange', label: ['Human Approval Gate', 'Review Plan / Diff'] }),
          stateStore: makeDb(0, 14, { r: 2.8, h: 40, color: 'store', label: ['Checkpoint DB', 'Postgres State'] }),
        },
        links: {
          graph_human: makeLink('humanGate', 'llmCore', ['humanGate', 'llmCore'], { label: 'human approval: proceed' }),
          graph_store: makeLink('llmCore', 'stateStore', ['llmCore', 'stateStore'], { label: 'save state checkpoint' }),
        },
      },
    },
    {
      title: 'Layer 8: Multi-Agent Swarm Orchestration',
      short: 'Autonomous Multi-Agent Collaboration',
      body: [
        'The outermost layer of modern AI engineering is Swarm Orchestration (BMAD & Multi-Agent Swarms).',
        'The central agent acts as a Coordinator that delegates specialized roles (Researcher, Coder, Reviewer) to parallel subagents, synchronizing their work via a shared message board.',
      ],
      scene: {
        entities: {
          swarmZone: makeZone({ x0: -16, x1: 16, y0: -16, y1: 16 }, 'Layer 8: Multi-Agent Swarm Orbit', { color: 'purple' }),
          llmCore: makeBlock(0, 0, { s: 5.6, h: 54, color: 'purple', glyph: 'balancer', label: ['Swarm Coordinator', 'Orchestrator'] }),
          researchWorker: makeBlock(-14, -12, { s: 4.4, h: 48, color: 'blue', label: ['Worker: Research', 'Deep Retrieval'] }),
          codeWorker: makeBlock(14, -12, { s: 4.4, h: 48, color: 'green', label: ['Worker: Coder', 'File Authoring'] }),
          qaWorker: makeBlock(14, 12, { s: 4.4, h: 48, color: 'orange', label: ['Worker: Verifier', 'Linter & Tests'] }),
        },
        links: {
          swarm_research: makeLink('llmCore', 'researchWorker', ['llmCore', 'researchWorker'], { label: 'brief: investigate issue' }),
          swarm_code: makeLink('llmCore', 'codeWorker', ['llmCore', 'codeWorker'], { label: 'brief: implement changes' }),
          swarm_qa: makeLink('codeWorker', 'qaWorker', ['codeWorker', 'qaWorker'], { label: 'dispatches test suite' }),
          swarm_report: makeLink('qaWorker', 'llmCore', ['qaWorker', 'llmCore'], { label: 'reports green build' }),
        },
      },
    },
  ],
};
