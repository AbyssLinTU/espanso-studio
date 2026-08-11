import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EspansoService, safeInvoke } from '../EspansoService';
import type { MacroCard } from '../../store/useStore';

// Mock Tauri Core IPC invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';

describe('EspansoService - Tauri IPC & Serialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('safeInvoke', () => {
    it('should call invoke with command name and arguments', async () => {
      vi.mocked(invoke).mockResolvedValueOnce(['default.yml', 'user.yml']);
      const result = await safeInvoke<string[]>('list_yaml_files');

      expect(invoke).toHaveBeenCalledWith('list_yaml_files', undefined);
      expect(result).toEqual(['default.yml', 'user.yml']);
    });

    it('should catch error and return null when IPC fails', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Tauri IPC offline'));

      const result = await safeInvoke<string>('read_file', { filename: 'test.yml' });

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Tauri Service Wrapper Methods', () => {
    it('should invoke listFiles', async () => {
      vi.mocked(invoke).mockResolvedValueOnce(['match1.yml']);
      const files = await EspansoService.listFiles();
      expect(files).toEqual(['match1.yml']);
    });

    it('should invoke readFile with filename', async () => {
      vi.mocked(invoke).mockResolvedValueOnce('matches:\n  - trigger: :hi\n    replace: hello');
      const content = await EspansoService.readFile('match1.yml');
      expect(invoke).toHaveBeenCalledWith('read_file', { filename: 'match1.yml' });
      expect(content).toContain(':hi');
    });

    it('should invoke saveFile with filename and content', async () => {
      vi.mocked(invoke).mockResolvedValueOnce(undefined);
      await EspansoService.saveFile('match1.yml', 'content');
      expect(invoke).toHaveBeenCalledWith('save_file', { filename: 'match1.yml', content: 'content' });
    });

    it('should check if Espanso is installed', async () => {
      vi.mocked(invoke).mockResolvedValueOnce(true);
      const isInstalled = await EspansoService.checkInstalled();
      expect(isInstalled).toBe(true);
    });

    it('should return false if Espanso is not installed', async () => {
      vi.mocked(invoke).mockResolvedValueOnce(false);
      const isInstalled = await EspansoService.checkInstalled();
      expect(isInstalled).toBe(false);
    });
  });

  describe('parseYaml', () => {
    it('should parse basic trigger and replace matches', () => {
      const yaml = `
matches:
  - trigger: ":email"
    replace: "user@example.com"
  - trigger: ":date"
    replace: "2026-08-11"
`;
      const result = EspansoService.parseYaml(yaml);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        trigger: ':email',
        replace: 'user@example.com',
        folder: '',
        triggerOptions: { word: false, case: false, prop_case: false },
        variables: [],
      });
    });

    it('should parse custom folder metadata property', () => {
      const yaml = `
matches:
  - trigger: ":work"
    replace: "Confidential document"
    folder: "Work Snippets"
`;
      const result = EspansoService.parseYaml(yaml);
      expect(result[0].folder).toBe('Work Snippets');
    });

    it('should parse trigger options (word, case_sensitive, propagate_case)', () => {
      const yaml = `
matches:
  - trigger: ":greet"
    replace: "Hello World"
    word: true
    case_sensitive: true
    propagate_case: true
`;
      const result = EspansoService.parseYaml(yaml);
      expect(result[0].triggerOptions).toEqual({
        word: true,
        case: true,
        prop_case: true,
      });
    });

    it('should parse variables correctly', () => {
      const yaml = `
matches:
  - trigger: ":now"
    replace: "Today is {{mydate}}"
    vars:
      - name: "mydate"
        type: "date"
        params:
          format: "%Y-%m-%d"
`;
      const result = EspansoService.parseYaml(yaml);
      expect(result[0].variables).toHaveLength(1);
      expect(result[0].variables?.[0]).toEqual({
        id: 'mydate',
        name: 'mydate',
        type: 'date',
        params: { format: '%Y-%m-%d' },
      });
    });
  });

  describe('stringifyYaml', () => {
    it('should serialize simple macro cards into valid YAML', () => {
      const macros: MacroCard[] = [
        {
          trigger: ':shrug',
          replace: '¯\\_(ツ)_/¯',
          triggerOptions: { word: true, case: false, prop_case: false },
        },
      ];

      const yamlString = EspansoService.stringifyYaml(macros);
      expect(yamlString).toContain('trigger: :shrug');
      expect(yamlString).toContain('replace: ¯\\_(ツ)_/¯');
      expect(yamlString).toContain('word: true');
    });

    it('should include folder property when present', () => {
      const macros: MacroCard[] = [
        {
          trigger: ':sig',
          replace: 'Best regards',
          folder: 'Emails',
        },
      ];

      const yamlString = EspansoService.stringifyYaml(macros);
      expect(yamlString).toContain('folder: Emails');
    });

    it('should format random choices and form layouts for Espanso compatibility', () => {
      const macros: MacroCard[] = [
        {
          trigger: ':choice',
          replace: 'Pick {{opt}}',
          variables: [
            {
              id: 'opt',
              name: 'opt',
              type: 'random',
              params: { choices: 'Apple, Banana, Cherry' },
            },
          ],
        },
      ];

      const yamlString = EspansoService.stringifyYaml(macros);
      expect(yamlString).toContain('type: random');
      expect(yamlString).toContain('Apple');
      expect(yamlString).toContain('Banana');
    });
  });
});
