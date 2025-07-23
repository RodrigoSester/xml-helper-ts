import { XmlNode, XmlToJsonOptions } from './types';

export class XmlToJsonConverter {
  private options: Required<XmlToJsonOptions>;

  constructor(options: XmlToJsonOptions = {}) {
    this.options = {
      preserveAttributes: options.preserveAttributes ?? true,
      attributePrefix: options.attributePrefix ?? '@',
      textKey: options.textKey ?? '#text',
      ignoreNamespaces: options.ignoreNamespaces ?? false
    };
  }

  convert(xmlNode: XmlNode): any {
    return this.nodeToJson(xmlNode);
  }

  private nodeToJson(node: XmlNode): any {
    const result: any = {};
    const nodeName = this.options.ignoreNamespaces ? this.getLocalName(node.name) : node.name;

    // Handle text-only nodes
    if (node.text !== undefined && node.children.length === 0 && Object.keys(node.attributes).length === 0) {
      return this.convertValue(node.text);
    }

    // Add attributes
    if (this.options.preserveAttributes && Object.keys(node.attributes).length > 0) {
      for (const [key, value] of Object.entries(node.attributes)) {
        const attrKey = this.options.ignoreNamespaces ? this.getLocalName(key) : key;
        result[this.options.attributePrefix + attrKey] = this.convertValue(value);
      }
    }

    // Handle mixed content (text + elements)
    if (node.text !== undefined && node.children.length > 0) {
      result[this.options.textKey] = this.convertValue(node.text);
    }

    // Process child elements
    const elementGroups: { [key: string]: any[] } = {};
    
    for (const child of node.children) {
      if (child.name === '#text') {
        if (child.text !== undefined) {
          result[this.options.textKey] = this.convertValue(child.text);
        }
        continue;
      }

      const childName = this.options.ignoreNamespaces ? this.getLocalName(child.name) : child.name;
      const childValue = this.nodeToJson(child);
      
      if (!elementGroups[childName]) {
        elementGroups[childName] = [];
      }
      elementGroups[childName].push(childValue);
    }

    // Add grouped elements to result
    for (const [name, values] of Object.entries(elementGroups)) {
      if (values.length === 1) {
        result[name] = values[0];
      } else {
        result[name] = values;
      }
    }

    // If result only has text content and no attributes, return the text directly
    if (Object.keys(result).length === 1 && result[this.options.textKey] !== undefined) {
      return result[this.options.textKey];
    }

    // If result is empty and we have text, return the text
    if (Object.keys(result).length === 0 && node.text !== undefined) {
      return this.convertValue(node.text);
    }

    return result;
  }

  private convertValue(value: string): any {
    // Try to convert to appropriate types
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    
    // Try number conversion
    if (/^-?\d+$/.test(value)) {
      const num = parseInt(value, 10);
      if (num.toString() === value) return num;
    }
    
    if (/^-?\d*\.?\d+$/.test(value)) {
      const num = parseFloat(value);
      if (!isNaN(num) && num.toString() === value) return num;
    }
    
    return value;
  }

  private getLocalName(name: string): string {
    const colonIndex = name.indexOf(':');
    return colonIndex === -1 ? name : name.substring(colonIndex + 1);
  }
}
