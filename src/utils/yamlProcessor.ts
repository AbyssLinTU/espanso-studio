import { Document, parseDocument } from 'yaml';

export class YamlProcessor {
  /**
   * Parses the YAML text into an AST Document preserving comments and structure.
   */
  static parse(text: string): Document {
    return parseDocument(text, { keepSourceTokens: true });
  }

  /**
   * Updates an existing trigger or replace value in the YAML AST.
   */
  static updateYamlValue(
    doc: Document,
    targetTrigger: string,
    newTrigger: string,
    newReplace: string,
    newVars?: any[]
  ): Document {
    const matches = doc.get('matches') as any;
    if (!matches || !matches.items) return doc;

    for (let i = 0; i < matches.items.length; i++) {
      const match = matches.items[i];
      const cmdTrigger = match.get('trigger');

      if (cmdTrigger === targetTrigger || cmdTrigger === newTrigger) {
        doc.setIn(['matches', i, 'trigger'], newTrigger);
        doc.setIn(['matches', i, 'replace'], newReplace);
        
        if (newVars && newVars.length > 0) {
          doc.setIn(['matches', i, 'vars'], newVars);
        } else {
          doc.deleteIn(['matches', i, 'vars']);
        }
        break;
      }
    }
    return doc;
  }

  /**
   * Converts the AST Document back into a YAML string.
   */
  static stringify(doc: Document): string {
    return String(doc);
  }
}
