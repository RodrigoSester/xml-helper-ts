import { XmlParser } from './xml-parser';
import { XsdParser } from './xsd-parser';
import { XmlValidator } from './xml-validator';
import { XmlToJsonConverter } from './xml-to-json';
import { JsonToXmlConverter } from './json-to-xml';
import { 
  ValidationError, 
  XmlParseResult, 
  XmlToJsonOptions, 
  JsonToXmlOptions,
  XsdSchema,
  XmlNode 
} from './types';

export class XmlHelper {
  private xmlParser = new XmlParser();
  private xsdParser = new XsdParser();
  private schema: XsdSchema | null = null;
  private validator: XmlValidator | null = null;

  /**
   * Load and parse an XSD schema
   * @param xsdContent The XSD schema content as string
   * @returns Array of validation errors if any
   */
  loadSchema(xsdContent: string): ValidationError[] {
    const { schema, errors } = this.xsdParser.parseSchema(xsdContent);
    
    if (schema && errors.length === 0) {
      this.schema = schema;
      this.validator = new XmlValidator(schema);
    }
    
    return errors;
  }

  /**
   * Validate XML against the loaded schema
   * @param xmlContent The XML content to validate
   * @returns Array of validation errors with line numbers
   */
  validateXml(xmlContent: string): ValidationError[] {
    if (!this.schema || !this.validator) {
      return [{
        line: 1,
        column: 1,
        message: 'No schema loaded. Call loadSchema() first.',
        code: 'NO_SCHEMA'
      }];
    }

    const { node, errors } = this.xmlParser.parse(xmlContent);
    
    if (errors.length > 0) {
      return errors;
    }

    if (!node) {
      return [{
        line: 1,
        column: 1,
        message: 'Failed to parse XML',
        code: 'PARSE_FAILED'
      }];
    }

    const validationErrors = this.validator.validate(node);
    return validationErrors;
  }

  /**
   * Parse XML to JSON object
   * @param xmlContent The XML content to parse
   * @param options Options for XML to JSON conversion
   * @returns Parsed JSON object or null if parsing failed
   */
  xmlToJson(xmlContent: string, options?: XmlToJsonOptions): XmlParseResult {
    const { node, errors } = this.xmlParser.parse(xmlContent);
    
    if (errors.length > 0 || !node) {
      return { success: false, errors };
    }

    try {
      const converter = new XmlToJsonConverter(options);
      const jsonData = converter.convert(node);
      
      return {
        success: true,
        data: jsonData,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          line: 1,
          column: 1,
          message: error instanceof Error ? error.message : 'Conversion error',
          code: 'CONVERSION_ERROR'
        }]
      };
    }
  }

  /**
   * Convert JSON object to XML string
   * @param jsonData The JSON data to convert
   * @param rootElement The root element name (optional)
   * @param options Options for JSON to XML conversion
   * @returns XML string representation
   */
  jsonToXml(jsonData: any, rootElement?: string, options?: JsonToXmlOptions): string {
    const converter = new JsonToXmlConverter(options);
    return converter.convert(jsonData, rootElement);
  }

  /**
   * Parse XML without validation (schema-free parsing)
   * @param xmlContent The XML content to parse
   * @returns Parsed XML node structure
   */
  parseXml(xmlContent: string): { node: XmlNode | null; errors: ValidationError[] } {
    return this.xmlParser.parse(xmlContent);
  }

  /**
   * Get the currently loaded schema
   * @returns The loaded XSD schema or null
   */
  getSchema(): XsdSchema | null {
    return this.schema;
  }

  /**
   * Check if a schema is currently loaded
   * @returns True if a schema is loaded
   */
  hasSchema(): boolean {
    return this.schema !== null;
  }
}

// Export all types and classes for advanced usage
export * from './types';
export { XmlParser } from './xml-parser';
export { XsdParser } from './xsd-parser';
export { XmlValidator } from './xml-validator';
export { XmlToJsonConverter } from './xml-to-json';
export { JsonToXmlConverter } from './json-to-xml';

// Export the main class as default
export default XmlHelper;
