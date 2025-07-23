# XML Helper Library

A comprehensive TypeScript library for XML parsing, validation, and conversion built from scratch without external dependencies.

## Features

- ✅ **XSD Schema Validation**: Load and validate XML documents against XSD schemas
- 🔄 **XML ↔ JSON Conversion**: Convert between XML and JSON formats with customizable options
- 📝 **XML Parsing**: Parse XML documents into structured node trees
- 🛡️ **Error Handling**: Detailed error reporting with line numbers and error codes
- 🎯 **TypeScript Support**: Full TypeScript support with comprehensive type definitions
- 🚀 **Zero Dependencies**: Built from scratch without external libraries

## Installation

```bash
npm install
npm run build
```

## Quick Start

```typescript
import XmlHelper from './src/index';

const xmlHelper = new XmlHelper();

// Load XSD schema
const schemaErrors = xmlHelper.loadSchema(xsdContent);
if (schemaErrors.length === 0) {
  console.log('Schema loaded successfully!');
}

// Validate XML
const validationErrors = xmlHelper.validateXml(xmlContent);
if (validationErrors.length === 0) {
  console.log('XML is valid!');
}

// Convert XML to JSON
const result = xmlHelper.xmlToJson(xmlContent);
if (result.success) {
  console.log('JSON:', result.data);
}

// Convert JSON to XML
const xmlString = xmlHelper.jsonToXml(jsonData, 'root');
console.log('XML:', xmlString);
```

## API Reference

### XmlHelper Class

The main class that provides all XML processing functionality.

#### Methods

##### `loadSchema(xsdContent: string): ValidationError[]`

Loads and parses an XSD schema for validation.

- **Parameters:**
  - `xsdContent`: The XSD schema content as a string
- **Returns:** Array of validation errors (empty if successful)

##### `validateXml(xmlContent: string): ValidationError[]`

Validates XML content against the loaded schema.

- **Parameters:**
  - `xmlContent`: The XML content to validate
- **Returns:** Array of validation errors with line numbers

##### `xmlToJson(xmlContent: string, options?: XmlToJsonOptions): XmlParseResult`

Converts XML to JSON format.

- **Parameters:**
  - `xmlContent`: The XML content to convert
  - `options`: Optional conversion settings
- **Returns:** Parse result with success flag, data, and errors

##### `jsonToXml(jsonData: any, rootElement?: string, options?: JsonToXmlOptions): string`

Converts JSON data to XML format.

- **Parameters:**
  - `jsonData`: The JSON data to convert
  - `rootElement`: Optional root element name
  - `options`: Optional conversion settings
- **Returns:** XML string

##### `parseXml(xmlContent: string): { node: XmlNode | null; errors: ValidationError[] }`

Parses XML without schema validation.

- **Parameters:**
  - `xmlContent`: The XML content to parse
- **Returns:** Object with parsed node and errors

### Types

#### `ValidationError`

```typescript
interface ValidationError {
  line: number;        // Line number where error occurred
  column: number;      // Column number where error occurred
  message: string;     // Error description
  code: string;        // Error code identifier
}
```

#### `XmlToJsonOptions`

```typescript
interface XmlToJsonOptions {
  preserveAttributes?: boolean;    // Include XML attributes (default: true)
  attributePrefix?: string;        // Prefix for attributes (default: '@')
  textKey?: string;               // Key for text content (default: '#text')
  ignoreNamespaces?: boolean;     // Ignore XML namespaces (default: false)
}
```

#### `JsonToXmlOptions`

```typescript
interface JsonToXmlOptions {
  attributePrefix?: string;        // Prefix for attributes (default: '@')
  textKey?: string;               // Key for text content (default: '#text')
  rootElement?: string;           // Root element name (default: 'root')
  declaration?: boolean;          // Include XML declaration (default: true)
  indent?: string;                // Indentation string (default: '  ')
}
```

## Examples

### Schema Validation

```typescript
const xsdSchema = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="person">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="name" type="xs:string"/>
        <xs:element name="age" type="xs:int"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

const xmlHelper = new XmlHelper();
const errors = xmlHelper.loadSchema(xsdSchema);

if (errors.length === 0) {
  const validationErrors = xmlHelper.validateXml(`
    <person>
      <name>John Doe</name>
      <age>30</age>
    </person>
  `);
  
  console.log('Valid:', validationErrors.length === 0);
}
```

### XML to JSON Conversion

```typescript
const xml = `
<library>
  <book id="1" category="fiction">
    <title>The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <price>12.99</price>
  </book>
</library>`;

const result = xmlHelper.xmlToJson(xml, {
  preserveAttributes: true,
  attributePrefix: '@'
});

// Result:
// {
//   "library": {
//     "book": {
//       "@id": "1",
//       "@category": "fiction",
//       "title": "The Great Gatsby",
//       "author": "F. Scott Fitzgerald",
//       "price": 12.99
//     }
//   }
// }
```

### JSON to XML Conversion

```typescript
const json = {
  person: {
    '@id': 'p1',
    name: 'Jane Smith',
    details: {
      age: 25,
      city: 'New York'
    },
    hobbies: ['reading', 'swimming']
  }
};

const xml = xmlHelper.jsonToXml(json);

// Result:
// <?xml version="1.0" encoding="UTF-8"?>
// <person id="p1">
//   <name>Jane Smith</name>
//   <details>
//     <age>25</age>
//     <city>New York</city>
//   </details>
//   <hobbies>reading</hobbies>
//   <hobbies>swimming</hobbies>
// </person>
```

## Error Handling

The library provides detailed error information including:

- **Line and column numbers** for precise error location
- **Descriptive error messages** explaining what went wrong
- **Error codes** for programmatic error handling

Common error codes:
- `PARSE_ERROR`: XML parsing failed
- `SCHEMA_ERROR`: XSD schema is invalid
- `ELEMENT_NOT_FOUND`: Required element missing
- `INVALID_ATTRIBUTE_VALUE`: Attribute value doesn't match type
- `MIN_OCCURS_VIOLATION`: Element occurs fewer times than required
- `MAX_OCCURS_VIOLATION`: Element occurs more times than allowed

## Testing

Run the test suite to see all functionality in action:

```bash
npm run build
npm test
```

The test file (`src/test.ts`) demonstrates:
- Schema loading and validation
- XML parsing and validation
- XML to JSON conversion
- JSON to XML conversion
- Error handling scenarios

## Architecture

The library is organized into focused modules:

- **`XmlParser`**: Core XML parsing functionality
- **`XsdParser`**: XSD schema parsing and interpretation
- **`XmlValidator`**: XML validation against XSD schemas
- **`XmlToJsonConverter`**: XML to JSON transformation
- **`JsonToXmlConverter`**: JSON to XML transformation
- **`XmlHelper`**: Main facade class combining all functionality

## License

MIT License - feel free to use in your projects!

## Contributing

This is a from-scratch implementation without external dependencies. Contributions are welcome for:

- Additional XSD features
- Performance improvements
- Bug fixes
- Enhanced error messages
- More validation rules
