import { XsdSchema, XsdElement, XmlNode, ValidationError, XsdComplexType, XsdSimpleType, XsdRestriction } from './types';

export class XmlValidator {
  private schema: XsdSchema;
  private errors: ValidationError[] = [];

  constructor(schema: XsdSchema) {
    this.schema = schema;
  }

  validate(xmlNode: XmlNode): ValidationError[] {
    this.errors = [];
    
    // Find root element in schema
    const rootElement = this.schema.elements[xmlNode.name];
    if (!rootElement) {
      this.addError(1, 1, `Root element '${xmlNode.name}' not found in schema`, 'ELEMENT_NOT_FOUND');
      return this.errors;
    }

    this.validateElement(xmlNode, rootElement, 1, 1);
    return this.errors;
  }

  private validateElement(xmlNode: XmlNode, xsdElement: XsdElement, line: number, column: number): void {
    // Validate element name
    if (xmlNode.name !== xsdElement.name) {
      this.addError(line, column, `Expected element '${xsdElement.name}' but found '${xmlNode.name}'`, 'ELEMENT_MISMATCH');
      return;
    }

    // Validate attributes
    this.validateAttributes(xmlNode, xsdElement, line, column);

    // Validate content based on type
    if (this.isBuiltInType(xsdElement.type)) {
      this.validateSimpleContent(xmlNode, xsdElement, line, column);
    } else if (this.schema.complexTypes[xsdElement.type]) {
      this.validateComplexContent(xmlNode, this.schema.complexTypes[xsdElement.type], line, column);
    } else if (this.schema.simpleTypes[xsdElement.type]) {
      this.validateSimpleTypeContent(xmlNode, this.schema.simpleTypes[xsdElement.type], line, column);
    } else if (xsdElement.type.startsWith('#inline-')) {
      // Handle inline types
      this.validateInlineContent(xmlNode, xsdElement, line, column);
    }
  }

  private validateAttributes(xmlNode: XmlNode, xsdElement: XsdElement, line: number, column: number): void {
    // Check if we have a complex type with attributes
    const complexType = this.schema.complexTypes[xsdElement.type];
    if (!complexType) return;

    // Validate required attributes
    for (const xsdAttr of complexType.attributes) {
      if (xsdAttr.use === 'required' && !xmlNode.attributes[xsdAttr.name]) {
        this.addError(line, column, `Required attribute '${xsdAttr.name}' is missing`, 'MISSING_REQUIRED_ATTRIBUTE');
      }
    }

    // Validate attribute values
    for (const [attrName, attrValue] of Object.entries(xmlNode.attributes)) {
      const xsdAttr = complexType.attributes.find(a => a.name === attrName);
      if (!xsdAttr) {
        this.addError(line, column, `Attribute '${attrName}' is not allowed`, 'UNEXPECTED_ATTRIBUTE');
        continue;
      }

      if (xsdAttr.fixedValue && attrValue !== xsdAttr.fixedValue) {
        this.addError(line, column, `Attribute '${attrName}' must have value '${xsdAttr.fixedValue}'`, 'FIXED_VALUE_VIOLATION');
      }

      // Validate attribute type
      if (!this.validateSimpleValue(attrValue, xsdAttr.type)) {
        this.addError(line, column, `Invalid value '${attrValue}' for attribute '${attrName}' of type '${xsdAttr.type}'`, 'INVALID_ATTRIBUTE_VALUE');
      }
    }
  }

  private validateSimpleContent(xmlNode: XmlNode, xsdElement: XsdElement, line: number, column: number): void {
    if (xmlNode.children.length > 0 && xmlNode.children.some(child => child.name !== '#text')) {
      this.addError(line, column, `Element '${xmlNode.name}' should contain simple content but has child elements`, 'INVALID_CONTENT');
      return;
    }

    const textContent = xmlNode.text || xmlNode.children.find(child => child.name === '#text')?.text || '';
    
    if (!this.validateSimpleValue(textContent, xsdElement.type)) {
      this.addError(line, column, `Invalid value '${textContent}' for element '${xmlNode.name}' of type '${xsdElement.type}'`, 'INVALID_ELEMENT_VALUE');
    }

    // Apply restrictions if any
    if (xsdElement.restrictions) {
      this.validateRestrictions(textContent, xsdElement.restrictions, line, column, xmlNode.name);
    }
  }

  private validateSimpleTypeContent(xmlNode: XmlNode, simpleType: XsdSimpleType, line: number, column: number): void {
    const textContent = xmlNode.text || xmlNode.children.find(child => child.name === '#text')?.text || '';
    
    if (!this.validateSimpleValue(textContent, simpleType.baseType)) {
      this.addError(line, column, `Invalid value '${textContent}' for base type '${simpleType.baseType}'`, 'INVALID_SIMPLE_TYPE_VALUE');
    }

    this.validateRestrictions(textContent, simpleType.restrictions, line, column, xmlNode.name);
  }

  private validateComplexContent(xmlNode: XmlNode, complexType: XsdComplexType, line: number, column: number): void {
    // Validate child elements
    const childElements = xmlNode.children.filter(child => child.name !== '#text');
    
    // Check required elements
    for (const xsdElement of complexType.elements) {
      const matchingChildren = childElements.filter(child => child.name === xsdElement.name);
      
      if (matchingChildren.length < xsdElement.minOccurs) {
        this.addError(line, column, 
          `Element '${xsdElement.name}' occurs ${matchingChildren.length} times but minimum is ${xsdElement.minOccurs}`, 
          'MIN_OCCURS_VIOLATION');
      }
      
      if (xsdElement.maxOccurs !== 'unbounded' && matchingChildren.length > xsdElement.maxOccurs) {
        this.addError(line, column, 
          `Element '${xsdElement.name}' occurs ${matchingChildren.length} times but maximum is ${xsdElement.maxOccurs}`, 
          'MAX_OCCURS_VIOLATION');
      }

      // Validate each occurrence
      for (const childElement of matchingChildren) {
        this.validateElement(childElement, xsdElement, line, column);
      }
    }

    // Check for unexpected elements
    for (const childElement of childElements) {
      if (!complexType.elements.some(xsdEl => xsdEl.name === childElement.name)) {
        this.addError(line, column, `Unexpected element '${childElement.name}'`, 'UNEXPECTED_ELEMENT');
      }
    }
  }

  private validateInlineContent(xmlNode: XmlNode, xsdElement: XsdElement, line: number, column: number): void {
    // Handle inline content validation
    if (xsdElement.restrictions) {
      const textContent = xmlNode.text || xmlNode.children.find(child => child.name === '#text')?.text || '';
      this.validateRestrictions(textContent, xsdElement.restrictions, line, column, xmlNode.name);
    }
  }

  private validateRestrictions(value: string, restrictions: XsdRestriction[], line: number, column: number, elementName: string): void {
    for (const restriction of restrictions) {
      switch (restriction.type) {
        case 'minLength':
          if (value.length < Number(restriction.value)) {
            this.addError(line, column, 
              `Value '${value}' in element '${elementName}' is too short. Minimum length is ${restriction.value}`, 
              'MIN_LENGTH_VIOLATION');
          }
          break;
        case 'maxLength':
          if (value.length > Number(restriction.value)) {
            this.addError(line, column, 
              `Value '${value}' in element '${elementName}' is too long. Maximum length is ${restriction.value}`, 
              'MAX_LENGTH_VIOLATION');
          }
          break;
        case 'pattern':
          const regex = new RegExp(String(restriction.value));
          if (!regex.test(value)) {
            this.addError(line, column, 
              `Value '${value}' in element '${elementName}' does not match pattern '${restriction.value}'`, 
              'PATTERN_VIOLATION');
          }
          break;
        case 'enumeration':
          // Note: This would need to collect all enumeration values
          break;
        case 'minInclusive':
          if (Number(value) < Number(restriction.value)) {
            this.addError(line, column, 
              `Value '${value}' in element '${elementName}' is below minimum ${restriction.value}`, 
              'MIN_INCLUSIVE_VIOLATION');
          }
          break;
        case 'maxInclusive':
          if (Number(value) > Number(restriction.value)) {
            this.addError(line, column, 
              `Value '${value}' in element '${elementName}' is above maximum ${restriction.value}`, 
              'MAX_INCLUSIVE_VIOLATION');
          }
          break;
      }
    }
  }

  private validateSimpleValue(value: string, type: string): boolean {
    switch (type) {
      case 'string':
        return true;
      case 'int':
      case 'integer':
        return /^-?\d+$/.test(value);
      case 'decimal':
      case 'float':
      case 'double':
        return /^-?\d*\.?\d+$/.test(value);
      case 'boolean':
        return value === 'true' || value === 'false' || value === '1' || value === '0';
      case 'date':
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
      case 'dateTime':
        return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(value);
      case 'time':
        return /^\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(value);
      default:
        return true; // Unknown types are assumed valid
    }
  }

  private isBuiltInType(type: string): boolean {
    const builtInTypes = [
      'string', 'int', 'integer', 'decimal', 'float', 'double', 'boolean',
      'date', 'dateTime', 'time', 'base64Binary', 'hexBinary'
    ];
    return builtInTypes.includes(type);
  }

  private addError(line: number, column: number, message: string, code: string): void {
    this.errors.push({ line, column, message, code });
  }
}
