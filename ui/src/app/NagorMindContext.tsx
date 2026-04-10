/**
 * NagorMind WebSocket context — shared between chat panel and map panel.
 * Manages a single WebSocket connection per session.
 */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ToolCallMsg {
  type: 'tool_call';
  tool: string;
  args: Record<string, unknown>;
  step: number;
  total_steps: number;
}

export interface ToolResultMsg {
  type: 'tool_result';
  tool: string;
  result: Record<string, unknown>;
  duration_ms: number;
  step: number;
  total_steps: number;
}

export interface ReasoningMsg {
  type: 'reasoning';
  text: string;
  step: number;
  total_steps: number;
}

export interface ResponseMetadata {
  session_id?: string;
  model?: string;
  framework?: string;
  agent_type?: string;
  tools_used?: string[];
  total_duration_ms?: number;
  intermediate_steps?: number;
  rounds?: number;
  note?: string;
}

export interface ResponseMsg {
  type: 'response';
  text: string;
  done: boolean;
  metadata?: ResponseMetadata;
}

export interface ErrorMsg {
  type: 'error';
  message: string;
  code: string;
  recoverable: boolean;
  suggestion?: string;
}

export interface MapRenderMsg {
  type: 'map_render';
  action: string;
  layer_id: string;
  geojson: GeoJSON.FeatureCollection;
  style: Record<string, unknown>;
  label: string;
  fit_bounds: boolean;
}

export interface AccountabilityFlag {
  id: string;
  lat: number;
  lon: number;
  project_name: string;
  budget_bdt: number;
  expected_count: number;
  osm_count: number;
  gap_percent: number;
  gap_label: string;
  gap_color: string;
  gap_icon: string;
  agency: string;
  year: number;
  source_url: string;
  disclaimer: string;
}

export interface AccountabilityFlagsMsg {
  type: 'accountability_flags';
  flags: AccountabilityFlag[];
}

export type ServerMsg =
  | ToolCallMsg
  | ToolResultMsg
  | ReasoningMsg
  | ResponseMsg
  | ErrorMsg
  | MapRenderMsg
  | AccountabilityFlagsMsg;

export interface ChatEntry {
  role: 'user' | 'assistant';
  text: string;
  toolCalls?: ToolCallMsg[];
  toolResults?: ToolResultMsg[];
  reasoning?: string;
  isStreaming?: boolean;
  error?: string;
  timestamp: number;
  metadata?: ResponseMetadata;
}

// ── Context ────────────────────────────────────────────────────────────────

interface NagorMindState {
  connected: boolean;
  connecting: boolean;
  messages: ChatEntry[];
  mapLayers: MapRenderMsg[];
  accountabilityFlags: AccountabilityFlag[];
  isThinking: boolean;
  currentStep: number;
  totalSteps: number;
  sendQuery: (text: string) => void;
  clearMessages: () => void;
}

const NagorMindContext = createContext<NagorMindState | null>(null);

function getWsUrl() {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
}

const SESSION_ID = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function NagorMindProvider({ children }: { children: ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectingRef = useRef(false);
  const pendingQueryRef = useRef<string | null>(null);

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [mapLayers, setMapLayers] = useState<MapRenderMsg[]>([]);
  const [accountabilityFlags, setAccountabilityFlags] = useState<AccountabilityFlag[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

  // Track current assistant message being built
  const currentAssistantRef = useRef<ChatEntry | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (connectingRef.current) return;

    connectingRef.current = true;
    setConnecting(true);

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setConnecting(false);
      console.log('[WS] Connected');
      // Flush any query that was sent before the connection was ready
      if (pendingQueryRef.current) {
        const pending = pendingQueryRef.current;
        pendingQueryRef.current = null;
        ws.send(JSON.stringify({ type: 'query', text: pending, session_id: SESSION_ID }));
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setConnecting(false);
      connectingRef.current = false;
      wsRef.current = null;
      // Auto-reconnect after 3s
      reconnectTimerRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      connectingRef.current = false;
      ws.close();
    };

    ws.onmessage = (event) => {
      let msg: ServerMsg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === 'map_render') {
        setMapLayers((prev) => [...prev, msg as MapRenderMsg]);
        return;
      }

      if (msg.type === 'accountability_flags') {
        setAccountabilityFlags((prev) => [...prev, ...(msg as AccountabilityFlagsMsg).flags]);
        return;
      }

      if (msg.type === 'reasoning') {
        setIsThinking(true);
        setCurrentStep(msg.step);
        setTotalSteps(msg.total_steps);
        // Update or create assistant entry
        if (!currentAssistantRef.current) {
          const entry: ChatEntry = {
            role: 'assistant',
            text: '',
            reasoning: msg.text,
            isStreaming: true,
            toolCalls: [],
            toolResults: [],
            timestamp: Date.now(),
          };
          currentAssistantRef.current = entry;
          setMessages((prev) => [...prev, entry]);
        } else {
          currentAssistantRef.current = { ...currentAssistantRef.current, reasoning: msg.text };
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { ...currentAssistantRef.current! };
            return next;
          });
        }
        return;
      }

      if (msg.type === 'tool_call') {
        setCurrentStep(msg.step);
        setTotalSteps(msg.total_steps);
        if (!currentAssistantRef.current) {
          const entry: ChatEntry = {
            role: 'assistant',
            text: '',
            isStreaming: true,
            toolCalls: [msg as ToolCallMsg],
            toolResults: [],
            timestamp: Date.now(),
          };
          currentAssistantRef.current = entry;
          setMessages((prev) => [...prev, entry]);
        } else {
          const updated = {
            ...currentAssistantRef.current,
            toolCalls: [...(currentAssistantRef.current.toolCalls || []), msg as ToolCallMsg],
          };
          currentAssistantRef.current = updated;
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = updated;
            return next;
          });
        }
        return;
      }

      if (msg.type === 'tool_result') {
        if (currentAssistantRef.current) {
          const updated = {
            ...currentAssistantRef.current,
            toolResults: [...(currentAssistantRef.current.toolResults || []), msg as ToolResultMsg],
          };
          currentAssistantRef.current = updated;
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = updated;
            return next;
          });
        }
        return;
      }

      if (msg.type === 'response') {
        if (!msg.done) {
          // Final text is coming
          if (currentAssistantRef.current) {
            const updated = { ...currentAssistantRef.current, text: msg.text, isStreaming: true };
            currentAssistantRef.current = updated;
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = updated;
              return next;
            });
          } else {
            const entry: ChatEntry = {
              role: 'assistant',
              text: msg.text,
              isStreaming: true,
              toolCalls: [],
              toolResults: [],
              timestamp: Date.now(),
            };
            currentAssistantRef.current = entry;
            setMessages((prev) => [...prev, entry]);
          }
        } else {
          // Done — finalize
          setIsThinking(false);
          setCurrentStep(0);
          setTotalSteps(0);
          if (currentAssistantRef.current) {
            const final = {
              ...currentAssistantRef.current,
              isStreaming: false,
              metadata: (msg as ResponseMsg).metadata || undefined,
            };
            currentAssistantRef.current = null;
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = final;
              return next;
            });
          } else {
            currentAssistantRef.current = null;
          }
        }
        return;
      }

      if (msg.type === 'error') {
        setIsThinking(false);
        const entry: ChatEntry = {
          role: 'assistant',
          text: '',
          error: (msg as ErrorMsg).suggestion || (msg as ErrorMsg).message,
          isStreaming: false,
          timestamp: Date.now(),
        };
        currentAssistantRef.current = null;
        setMessages((prev) => [...prev, entry]);
        return;
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, []);

  const sendQuery = useCallback((text: string) => {
    // Always add user message and reset state
    const userEntry: ChatEntry = { role: 'user', text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userEntry]);
    currentAssistantRef.current = null;
    setIsThinking(true);
    setMapLayers([]);
    setAccountabilityFlags([]);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'query', text, session_id: SESSION_ID }));
    } else {
      // Queue it — will be flushed in ws.onopen
      pendingQueryRef.current = text;
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setMapLayers([]);
    setAccountabilityFlags([]);
    currentAssistantRef.current = null;
  }, []);

  return (
    <NagorMindContext.Provider
      value={{
        connected,
        connecting,
        messages,
        mapLayers,
        accountabilityFlags,
        isThinking,
        currentStep,
        totalSteps,
        sendQuery,
        clearMessages,
      }}
    >
      {children}
    </NagorMindContext.Provider>
  );
}

export function useNagorMind() {
  const ctx = useContext(NagorMindContext);
  if (!ctx) throw new Error('useNagorMind must be used within NagorMindProvider');
  return ctx;
}
