import { XsdSchema, XsdElement, XsdAttribute, XsdComplexType, XsdSimpleType, XsdRestriction, ValidationError, XmlNode } from './types';
import { XmlParser } from './xml-parser';

export class XsdParser {
  private xmlParser = new XmlParser();

  parseSchema(xsdString: string): { schema: XsdSchema | null; errors: ValidationError[] } {
    const { node, errors } = this.xmlParser.parse(xsdString);
    
    if (errors.length > 0 || !node) {
      return { schema: null, errors };
    }

    try {
      const schema = this.buildSchema(node);
      return { schema, errors: [] };
    } catch (error) {
      errors.push({
        line: 1,
        column: 1,
        message: error instanceof Error ? error.message : 'Schema parsing error',
        code: 'SCHEMA_ERROR'
      });
      return { schema: null, errors };
    }
  }

  private buildSchema(schemaNode: XmlNode): XsdSchema {
    if (schemaNode.name !== 'schema' && !schemaNode.name.endsWith(':schema')) {
      throw new Error('Root element must be schema');
    }

    const schema: XsdSchema = {
      targetNamespace: schemaNode.attributes.targetNamespace,
      elements: {},
      complexTypes: {},
      simpleTypes: {},
      namespaces: {}
    };

    // Parse namespace declarations
    for (const [key, value] of Object.entries(schemaNode.attributes)) {
      if (key.startsWith('xmlns:')) {
        const prefix = key.substring(6);
        schema.namespaces[prefix] = value;
      } else if (key === 'xmlns') {
        schema.namespaces[''] = value;
      }
    }

    // Parse child elements
    for (const child of schemaNode.children) {
      const localName = this.getLocalName(child.name);
      
      switch (localName) {
        case 'element':
          const element = this.parseElement(child);
          schema.elements[element.name] = element;
          break;
        case 'complexType':
          const complexType = this.parseComplexType(child);
          schema.complexTypes[complexType.name] = complexType;
          break;
        case 'simpleType':
          const simpleType = this.parseSimpleType(child);
          schema.simpleTypes[simpleType.name] = simpleType;
          break;
      }
    }

    return schema;
  }

  private parseElement(elementNode: XmlNode): XsdElement {
    const element: XsdElement = {
      name: elementNode.attributes.name || '',
      type: elementNode.attributes.type || 'string',
      minOccurs: parseInt(elementNode.attributes.minOccurs || '1'),
      maxOccurs: elementNode.attributes.maxOccurs === 'unbounded' ? 'unbounded' : parseInt(elementNode.attributes.maxOccurs || '1'),
      attributes: [],
      children: [],
      namespace: elementNode.namespace
    };

    // Parse child elements
    for (const child of elementNode.children) {
      const localName = this.getLocalName(child.name);
      
      switch (localName) {
        case 'complexType':
          const complexType = this.parseComplexType(child);
          element.type = `#inline-${element.name}`;
          // Handle inline complex type
          break;
        case 'simpleType':
          const simpleType = this.parseSimpleType(child);
          element.type = `#inline-${element.name}`;
          element.restrictions = simpleType.restrictions;
          break;
      }
    }

    return element;
  }

  private parseComplexType(complexTypeNode: XmlNode): XsdComplexType {
    const complexType: XsdComplexType = {
      name: complexTypeNode.attributes.name || '',
      elements: [],
      attributes: []
    };

    // Parse sequence, choice, all, etc.
    for (const child of complexTypeNode.children) {
      const localName = this.getLocalName(child.name);
      
      switch (localName) {
        case 'sequence':
        case 'choice':
        case 'all':
          for (const sequenceChild of child.children) {
            if (this.getLocalName(sequenceChild.name) === 'element') {
              complexType.elements.push(this.parseElement(sequenceChild));
            }
          }
          break;
        case 'attribute':
          complexType.attributes.push(this.parseAttribute(child));
          break;
      }
    }

    return complexType;
  }

  private parseSimpleType(simpleTypeNode: XmlNode): XsdSimpleType {
    const simpleType: XsdSimpleType = {
      name: simpleTypeNode.attributes.name || '',
      baseType: 'string',
      restrictions: []
    };

    // Parse restrictions
    for (const child of simpleTypeNode.children) {
      const localName = this.getLocalName(child.name);
      
      if (localName === 'restriction') {
        simpleType.baseType = child.attributes.base || 'string';
        
        for (const restrictionChild of child.children) {
          const restrictionType = this.getLocalName(restrictionChild.name);
          const value = restrictionChild.attributes.value;
          
          if (value !== undefined) {
            const restriction: XsdRestriction = {
              type: restrictionType as any,
              value: isNaN(Number(value)) ? value : Number(value)
            };
            simpleType.restrictions.push(restriction);
          }
        }
      }
    }

    return simpleType;
  }

  private parseAttribute(attributeNode: XmlNode): XsdAttribute {
    return {
      name: attributeNode.attributes.name || '',
      type: attributeNode.attributes.type || 'string',
      use: (attributeNode.attributes.use as 'required' | 'optional' | 'prohibited') || 'optional',
      defaultValue: attributeNode.attributes.default,
      fixedValue: attributeNode.attributes.fixed
    };
  }

  private getLocalName(name: string): string {
    const colonIndex = name.indexOf(':');
    return colonIndex === -1 ? name : name.substring(colonIndex + 1);
  }
}
