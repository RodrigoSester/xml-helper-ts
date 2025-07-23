import { JsonToXmlOptions } from './types';

export class JsonToXmlConverter {
  private options: Required<JsonToXmlOptions>;

  constructor(options: JsonToXmlOptions = {}) {
    this.options = {
      attributePrefix: options.attributePrefix ?? '@',
      textKey: options.textKey ?? '#text',
      rootElement: options.rootElement ?? 'root',
      declaration: options.declaration ?? true,
      indent: options.indent ?? '  '
    };
  }

  convert(jsonData: any, rootElement?: string): string {
    let xml = '';
    
    if (this.options.declaration) {
      xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
    }

    const root = rootElement || this.options.rootElement;
    xml += this.objectToXml(jsonData, root, 0);
    
    return xml;
  }

  private objectToXml(obj: any, elementName: string, depth: number): string {
    const indent = this.options.indent.repeat(depth);

    // Handle primitive values
    if (this.isPrimitive(obj)) {
      return `${indent}<${elementName}>${this.escapeXml(String(obj))}</${elementName}>\n`;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return this.arrayToXml(obj, elementName, depth);
    }

    // Handle objects
    return this.complexObjectToXml(obj, elementName, depth);
  }

  private arrayToXml(array: any[], elementName: string, depth: number): string {
    let xml = '';
    for (const item of array) {
      xml += this.objectToXml(item, elementName, depth);
    }
    return xml;
  }

  private complexObjectToXml(obj: any, elementName: string, depth: number): string {
    const indent = this.options.indent.repeat(depth);
    const elementInfo = this.processObjectProperties(obj, depth);
    
    let xml = `${indent}<${elementName}${elementInfo.attributes}>`;
    
    return this.addElementContent(xml, elementInfo, elementName, indent);
  }

  private processObjectProperties(obj: any, depth: number): {
    attributes: string;
    textContent: string;
    childElements: string[];
    hasAttributes: boolean;
  } {
    let attributes = '';
    let textContent = '';
    const childElements: string[] = [];
    let hasAttributes = false;

    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith(this.options.attributePrefix)) {
        const attrName = key.substring(this.options.attributePrefix.length);
        attributes += ` ${attrName}="${this.escapeXml(String(value))}"`;
        hasAttributes = true;
      } else if (key === this.options.textKey) {
        textContent = String(value);
      } else {
        this.addChildElements(value, key, depth, childElements);
      }
    }

    return { attributes, textContent, childElements, hasAttributes };
  }

  private addChildElements(value: any, key: string, depth: number, childElements: string[]): void {
    if (Array.isArray(value)) {
      for (const item of value) {
        childElements.push(this.objectToXml(item, key, depth + 1));
      }
    } else {
      childElements.push(this.objectToXml(value, key, depth + 1));
    }
  }

  private addElementContent(
    xml: string, 
    elementInfo: { attributes: string; textContent: string; childElements: string[]; hasAttributes: boolean }, 
    elementName: string, 
    indent: string
  ): string {
    const { textContent, childElements, hasAttributes } = elementInfo;
    const nextIndent = indent + this.options.indent;

    if (textContent && childElements.length === 0) {
      return xml + this.escapeXml(textContent) + `</${elementName}>\n`;
    }
    
    if (childElements.length > 0) {
      xml += '\n';
      
      if (textContent) {
        xml += `${nextIndent}${this.escapeXml(textContent)}\n`;
      }
      
      for (const childXml of childElements) {
        xml += childXml;
      }
      
      return xml + `${indent}</${elementName}>\n`;
    }
    
    // Empty element
    return hasAttributes 
      ? xml.substring(0, xml.length - 1) + '/>\n'
      : xml.replace('>', '/>\n');
  }

  private isPrimitive(value: any): boolean {
    return value === null || 
           typeof value === 'string' || 
           typeof value === 'number' || 
           typeof value === 'boolean';
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
