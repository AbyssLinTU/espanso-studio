import { parseDocument, stringify } from 'yaml';
import type { MacroCard, Variable } from '../store/useStore';

export async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T | null> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<T>(cmd, args);
  } catch (e) {
    console.warn(`[Tauri IPC] ${cmd} failed:`, e);
    return null;
  }
}

type YamlItemNode = Record<string, unknown> & {
  items?: unknown[];
  get?: (key: string) => unknown;
  word?: boolean;
  case_sensitive?: boolean;
  propagate_case?: boolean;
  vars?: unknown;
  trigger?: string;
  replace?: unknown;
  folder?: string;
};

interface YamlParamItem {
  key?: { value?: string };
  value?: {
    value?: string;
    items?: Array<{ value?: string }>;
  };
}

export const EspansoService = {
  async listFiles(): Promise<string[] | null> {
    return await safeInvoke<string[]>('list_yaml_files');
  },

  async readFile(filename: string): Promise<string | null> {
    return await safeInvoke<string>('read_file', { filename });
  },

  async saveFile(filename: string, content: string): Promise<void | null> {
    return await safeInvoke<void>('save_file', { filename, content });
  },

  async restart(): Promise<void | null> {
    return await safeInvoke<void>('restart_espanso');
  },

  async checkInstalled(): Promise<boolean> {
    const res = await safeInvoke<boolean>('check_espanso_installed');
    return res === true;
  },

  async install() {
    return await safeInvoke<void>('install_espanso');
  },

  parseYaml(content: string): MacroCard[] {
    try {
      const doc = parseDocument(content);
      const matchesNode = doc.get('matches') as YamlItemNode | null;

      let matchesArray: YamlItemNode[] = [];
      if (matchesNode) {
        matchesArray = (Array.isArray(matchesNode.items) ? matchesNode.items : (Array.isArray(matchesNode) ? matchesNode : [])) as YamlItemNode[];
      }

      return matchesArray.map((m) => {
        const triggerOpts = {
          word: Boolean(m.get?.('word') ?? m.word ?? false),
          case: Boolean(m.get?.('case_sensitive') ?? m.case_sensitive ?? false),
          prop_case: Boolean(m.get?.('propagate_case') ?? m.propagate_case ?? false)
        };

        const varsObj = (m.get?.('vars') ?? m.vars) as YamlItemNode | null;
        let varsArray: Variable[] = [];
        if (varsObj) {
          const vItems = (Array.isArray(varsObj.items) ? varsObj.items : (Array.isArray(varsObj) ? varsObj : [])) as YamlItemNode[];
          varsArray = vItems.map((v) => {
            const paramsNode = (v.get?.('params') ?? v.params) as { items?: YamlParamItem[] } | Record<string, unknown> | null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const paramsObj: Record<string, any> = {};
            if (paramsNode && 'items' in paramsNode && Array.isArray(paramsNode.items)) {
              paramsNode.items.forEach((item) => {
                let val: unknown = item.value?.value;
                if (item.value && Array.isArray(item.value.items)) {
                  val = item.value.items.map((i: { value?: string }) => i.value).join(', ');
                } else if (item.value && Array.isArray(item.value)) {
                  val = (item.value as Array<{ value?: string }>).map(i => typeof i === 'string' ? i : i.value).join(', ');
                }
                if (item.key?.value) {
                  paramsObj[item.key.value] = val;
                }
              });
            } else if (paramsNode) {
              Object.assign(paramsObj, paramsNode);
            }
            const nameStr = String(v.get?.('name') ?? v.name ?? '');
            return {
              id: nameStr,
              name: nameStr,
              type: String(v.get?.('type') ?? v.type ?? '') as Variable['type'],
              params: paramsObj
            };
          });
        }

        return {
          trigger: String(m.get?.('trigger') ?? m.trigger ?? ''),
          replace: String(m.get?.('replace') ?? m.replace ?? ''),
          folder: String(m.get?.('folder') ?? m.folder ?? ''),
          triggerOptions: triggerOpts,
          variables: varsArray
        };
      });
    } catch (e) {
      console.error('YAML Parse Error:', e);
      throw e;
    }
  },

  stringifyYaml(macros: MacroCard[]) {
    const yamlMatches = macros.map(m => {
      const match: Record<string, unknown> = {
        trigger: m.trigger,
        replace: m.replace
      };

      if (m.folder) match.folder = m.folder;
      if (m.triggerOptions?.word) match.word = true;
      if (m.triggerOptions?.case) match.case_sensitive = true;
      if (m.triggerOptions?.prop_case) match.propagate_case = true;

      if (m.variables && m.variables.length > 0) {
        match.vars = m.variables.map((v) => {
          const varOutput: { name: string; type: string; params: Record<string, unknown> } = {
            name: v.name,
            type: v.type,
            params: { ...v.params }
          };

          // Transform form parameters for Espanso compatibility
          if (v.type === 'form') {
            if (!varOutput.params.layout && varOutput.params.title) {
              varOutput.params.layout = `[[${String(varOutput.params.title)}]]`;
              delete varOutput.params.title;
            }
          }

          // Transform random choices to array for Espanso compatibility
          if (v.type === 'random') {
            if (typeof varOutput.params.choices === 'string') {
              varOutput.params.choices = varOutput.params.choices.split(',').map((c: string) => c.trim()).filter(Boolean);
            }
          }

          return varOutput;
        });
      }

      return match;
    });

    return stringify({ matches: yamlMatches });
  }
};
