import { XmlNode, ValidationError } from './types';

export class XmlParser {
  private position = 0;
  private line = 1;
  private column = 1;
  private xml = '';

  parse(xmlString: string): { node: XmlNode | null; errors: ValidationError[] } {
    this.xml = xmlString;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    const errors: ValidationError[] = [];

    try {
      this.skipWhitespace();
      
      // Skip XML declaration if present
      if (this.peek(5) === '<?xml') {
        this.skipDeclaration();
        this.skipWhitespace();
      }

      // Skip any other processing instructions or comments
      while (this.position < this.xml.length && this.current() === '<') {
        if (this.peek() === '!') {
          // Skip comments or DOCTYPE
          this.skipComment();
          this.skipWhitespace();
        } else if (this.peek() === '?') {
          // Skip processing instructions
          this.skipProcessingInstruction();
          this.skipWhitespace();
        } else {
          // This should be the root element
          break;
        }
      }

      const node = this.parseElement();
      return { node, errors };
    } catch (error) {
      errors.push({
        line: this.line,
        column: this.column,
        message: error instanceof Error ? error.message : 'Unknown parsing error',
        code: 'PARSE_ERROR'
      });
      return { node: null, errors };
    }
  }

  private parseElement(): XmlNode {
    if (this.current() !== '<') {
      throw new Error(`Expected '<' but found '${this.current()}'`);
    }

    this.advance(); // Skip '<'
    
    if (this.current() === '/') {
      throw new Error('Unexpected end tag');
    }

    const name = this.parseName();
    const attributes = this.parseAttributes();
    
    this.skipWhitespace();
    
    // Handle self-closing tag
    if (this.current() === '/' && this.peek() === '>') {
      this.advance(); // Skip '/'
      this.advance(); // Skip '>'
      return { name, attributes, children: [] };
    }
    
    if (this.current() !== '>') {
      throw new Error(`Expected '>' but found '${this.current()}'`);
    }
    
    this.advance(); // Skip '>'
    
    return this.parseElementContent(name, attributes);
  }

  private parseElementContent(name: string, attributes: Record<string, string>): XmlNode {
    const children: XmlNode[] = [];
    let text = '';
    
    while (this.position < this.xml.length) {
      this.skipWhitespace();
      
      if (this.current() === '<') {
        if (this.peek() === '/') {
          break; // End tag found
        } else {
          // Child element
          if (text.trim()) {
            children.push({
              name: '#text',
              attributes: {},
              children: [],
              text: text.trim()
            });
            text = '';
          }
          children.push(this.parseElement());
          continue;
        }
      }
      
      // Text content
      text += this.current();
      this.advance();
    }
    
    this.parseEndTag(name);
    
    return this.buildElementNode(name, attributes, children, text);
  }

  private parseEndTag(expectedName: string): void {
    if (this.current() === '<' && this.peek() === '/') {
      this.advance(); // Skip '<'
      this.advance(); // Skip '/'
      const endTagName = this.parseName();
      if (endTagName !== expectedName) {
        throw new Error(`End tag '${endTagName}' does not match start tag '${expectedName}'`);
      }
      this.skipWhitespace();
      if (this.current() !== '>') {
        throw new Error("Expected '>' in end tag");
      }
      this.advance(); // Skip '>'
    }
  }

  private buildElementNode(name: string, attributes: Record<string, string>, children: XmlNode[], text: string): XmlNode {
    const node: XmlNode = { name, attributes, children };

    if (text.trim() && children.length === 0) {
      node.text = text.trim();
    }

    return node;
  }

  private parseAttributes(): Record<string, string> {
    const attributes: Record<string, string> = {};
    
    while (this.position < this.xml.length) {
      this.skipWhitespace();
      
      if (this.current() === '>' || this.current() === '/' || this.current() === '?') {
        break;
      }
      
      const name = this.parseName();
      this.skipWhitespace();
      
      if (this.current() !== '=') {
        throw new Error(`Expected '=' after attribute name '${name}'`);
      }
      
      this.advance(); // Skip '='
      this.skipWhitespace();
      
      const value = this.parseAttributeValue();
      attributes[name] = value;
    }
    
    return attributes;
  }

  private parseAttributeValue(): string {
    const quote = this.current();
    if (quote !== '"' && quote !== "'") {
      throw new Error(`Expected quote but found '${quote}'`);
    }
    
    this.advance(); // Skip opening quote
    let value = '';
    
    while (this.position < this.xml.length && this.current() !== quote) {
      if (this.current() === '&') {
        value += this.parseEntity();
      } else {
        value += this.current();
        this.advance();
      }
    }
    
    if (this.current() !== quote) {
      throw new Error('Unterminated attribute value');
    }
    
    this.advance(); // Skip closing quote
    return value;
  }

  private parseName(): string {
    let name = '';
    
    // First character has stricter rules
    const firstChar = this.current();
    if (!this.isNameStartChar(firstChar)) {
      throw new Error(`Invalid name start character: '${firstChar}'`);
    }
    
    while (this.position < this.xml.length) {
      const char = this.current();
      if (this.isNameChar(char)) {
        name += char;
        this.advance();
      } else {
        break;
      }
    }
    
    if (!name) {
      throw new Error('Expected element name');
    }
    
    return name;
  }

  private isNameStartChar(char: string): boolean {
    if (!char) return false;
    return /[a-zA-Z_]/.test(char) ||
           (char.charCodeAt(0) >= 0xC0 && char.charCodeAt(0) <= 0xD6) ||
           (char.charCodeAt(0) >= 0xD8 && char.charCodeAt(0) <= 0xF6) ||
           (char.charCodeAt(0) >= 0xF8);
  }

  private parseEntity(): string {
    if (this.current() !== '&') {
      throw new Error('Expected entity');
    }
    
    this.advance(); // Skip '&'
    let entity = '';
    
    while (this.position < this.xml.length && this.current() !== ';') {
      entity += this.current();
      this.advance();
    }
    
    if (this.current() !== ';') {
      throw new Error('Unterminated entity');
    }
    
    this.advance(); // Skip ';'
    
    // Convert common entities
    switch (entity) {
      case 'amp': return '&';
      case 'lt': return '<';
      case 'gt': return '>';
      case 'quot': return '"';
      case 'apos': return "'";
      default:
        if (entity.startsWith('#')) {
          const code = entity.startsWith('#x') 
            ? parseInt(entity.slice(2), 16)
            : parseInt(entity.slice(1), 10);
          return String.fromCharCode(code);
        }
        return `&${entity};`;
    }
  }

  private skipDeclaration(): void {
    while (this.position < this.xml.length && !(this.current() === '?' && this.peek() === '>')) {
      this.advance();
    }
    if (this.current() === '?') {
      this.advance(); // Skip '?'
    }
    if (this.current() === '>') {
      this.advance(); // Skip '>'
    }
  }

  private skipComment(): void {
    if (this.peek(4) === '<!--') {
      this.skipXmlComment();
    } else if (this.peek(9) === '<!DOCTYPE') {
      this.skipDoctype();
    }
  }

  private skipXmlComment(): void {
    this.position += 4; // Skip '<!--'
    while (this.position < this.xml.length - 2) {
      if (this.xml.substring(this.position, this.position + 3) === '-->') {
        this.position += 3;
        break;
      }
      this.advance();
    }
  }

  private skipDoctype(): void {
    let depth = 0;
    while (this.position < this.xml.length) {
      if (this.current() === '<') {
        depth++;
      } else if (this.current() === '>') {
        depth--;
        if (depth === 0) {
          this.advance();
          break;
        }
      }
      this.advance();
    }
  }

  private skipProcessingInstruction(): void {
    // Skip processing instruction <?...?>
    while (this.position < this.xml.length - 1) {
      if (this.current() === '?' && this.peek() === '>') {
        this.advance(); // Skip '?'
        this.advance(); // Skip '>'
        break;
      }
      this.advance();
    }
  }

  private skipWhitespace(): void {
    while (this.position < this.xml.length && this.isWhitespace(this.current())) {
      this.advance();
    }
  }

  private isWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\n' || char === '\r';
  }

  private isNameChar(char: string): boolean {
    if (!char) return false;
    return /[a-zA-Z0-9_:.-]/.test(char) || 
           (char.charCodeAt(0) >= 0xC0 && char.charCodeAt(0) <= 0xD6) ||
           (char.charCodeAt(0) >= 0xD8 && char.charCodeAt(0) <= 0xF6) ||
           (char.charCodeAt(0) >= 0xF8);
  }

  private current(): string {
    return this.xml[this.position] || '';
  }

  private peek(offset = 1): string {
    return this.xml[this.position + offset] || '';
  }

  private advance(): void {
    if (this.position < this.xml.length) {
      if (this.xml[this.position] === '\n') {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.position++;
    }
  }
}
