import { parseDocument, stringify } from 'yaml';

export async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T | null> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<T>(cmd, args);
  } catch (e) {
    console.warn(`[Tauri IPC] ${cmd} failed:`, e);
    return null;
  }
}

export const EspansoService = {
  async listFiles() {
    return await safeInvoke<string[]>('list_yaml_files');
  },

  async readFile(filename: string) {
    return await safeInvoke<string>('read_file', { filename });
  },

  async saveFile(filename: string, content: string) {
    return await safeInvoke<void>('save_file', { filename, content });
  },

  async restart() {
    return await safeInvoke<void>('restart_espanso');
  },

  async checkInstalled() : Promise<boolean> {
    const res = await safeInvoke<boolean>('check_espanso_installed');
    return res === true;
  },

  async install() {
    return await safeInvoke<void>('install_espanso');
  },

  parseYaml(content: string) {
    try {
      const doc = parseDocument(content);
      const matchesNode = doc.get('matches');
      
      let matchesArray = [];
      if (matchesNode && Array.isArray((matchesNode as any).items || matchesNode)) {
          matchesArray = (matchesNode as any).items || matchesNode;
      }

      return matchesArray.map((m: any) => {
        const triggerOpts = {
          word: m.get?.('word') ?? m.word ?? false,
          case: m.get?.('case_sensitive') ?? m.case_sensitive ?? false,
          prop_case: m.get?.('propagate_case') ?? m.propagate_case ?? false
        };

        const varsObj = m.get?.('vars') ?? m.vars;
        let varsArray = [];
        if (varsObj && Array.isArray((varsObj as any).items || varsObj)) {
           const vItems = (varsObj as any).items || varsObj;
           varsArray = vItems.map((v: any) => {
             const paramsNode = v.get?.('params') ?? v.params;
             const paramsObj: any = {};
             if (paramsNode && paramsNode.items) {
               paramsNode.items.forEach((item: any) => {
                  let val = item.value?.value;
                  if (item.value && Array.isArray(item.value.items)) {
                     val = item.value.items.map((i: any) => i.value).join(', ');
                  } else if (item.value && Array.isArray(item.value)) {
                     val = item.value.join(', ');
                  }
                  paramsObj[item.key.value] = val;
               });
             } else if (paramsNode) {
               Object.assign(paramsObj, paramsNode);
             }
             return {
               id: v.get?.('name') ?? v.name,
               name: v.get?.('name') ?? v.name,
               type: v.get?.('type') ?? v.type,
               params: paramsObj
             };
           });
        }

        return {
          trigger: m.get?.('trigger') ?? m.trigger ?? '',
          replace: String(m.get?.('replace') ?? m.replace ?? ''),
          triggerOptions: triggerOpts,
          variables: varsArray
        };
      });
    } catch (e) {
      console.error('YAML Parse Error:', e);
      throw e;
    }
  },

  stringifyYaml(macros: any[]) {
    const yamlMatches = macros.map(m => {
      const match: any = {
        trigger: m.trigger,
        replace: m.replace
      };
      
      if (m.triggerOptions?.word) match.word = true;
      if (m.triggerOptions?.case) match.case_sensitive = true;
      if (m.triggerOptions?.prop_case) match.propagate_case = true;
      
      if (m.variables && m.variables.length > 0) {
        match.vars = m.variables.map((v: any) => {
          const varOutput: any = {
            name: v.name,
            type: v.type,
            params: { ...v.params }
          };

          // Transform form parameters for Espanso compatibility
          if (v.type === 'form') {
            if (!varOutput.params.layout && varOutput.params.title) {
              varOutput.params.layout = `[[${varOutput.params.title}]]`;
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
