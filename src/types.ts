// Types for XML and XSD handling

export interface XmlNode {
  name: string;
  attributes: Record<string, string>;
  children: XmlNode[];
  text?: string;
  namespace?: string;
}

export interface XmlParseResult {
  success: boolean;
  data?: any;
  errors: ValidationError[];
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  code: string;
}

export interface XsdElement {
  name: string;
  type: string;
  minOccurs: number;
  maxOccurs: number | 'unbounded';
  attributes: XsdAttribute[];
  children: XsdElement[];
  namespace?: string;
  restrictions?: XsdRestriction[];
}

export interface XsdAttribute {
  name: string;
  type: string;
  use: 'required' | 'optional' | 'prohibited';
  defaultValue?: string;
  fixedValue?: string;
}

export interface XsdRestriction {
  type: 'minLength' | 'maxLength' | 'pattern' | 'enumeration' | 'minInclusive' | 'maxInclusive';
  value: string | number;
}

export interface XsdComplexType {
  name: string;
  elements: XsdElement[];
  attributes: XsdAttribute[];
}

export interface XsdSimpleType {
  name: string;
  baseType: string;
  restrictions: XsdRestriction[];
}

export interface XsdSchema {
  targetNamespace?: string;
  elements: Record<string, XsdElement>;
  complexTypes: Record<string, XsdComplexType>;
  simpleTypes: Record<string, XsdSimpleType>;
  namespaces: Record<string, string>;
}

export interface XmlToJsonOptions {
  preserveAttributes?: boolean;
  attributePrefix?: string;
  textKey?: string;
  ignoreNamespaces?: boolean;
}

export interface JsonToXmlOptions {
  attributePrefix?: string;
  textKey?: string;
  rootElement?: string;
  declaration?: boolean;
  indent?: string;
}
