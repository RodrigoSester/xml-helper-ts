import XmlHelper from './index';

// Test data
const sampleXsdSchema = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           targetNamespace="http://example.com/book"
           xmlns:tns="http://example.com/book"
           elementFormDefault="qualified">

  <xs:element name="library">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="book" type="tns:BookType" minOccurs="1" maxOccurs="unbounded"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>

  <xs:complexType name="BookType">
    <xs:sequence>
      <xs:element name="title" type="xs:string"/>
      <xs:element name="author" type="xs:string"/>
      <xs:element name="isbn" type="tns:ISBNType"/>
      <xs:element name="price" type="xs:decimal"/>
      <xs:element name="publishDate" type="xs:date"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required"/>
  </xs:complexType>

  <xs:simpleType name="ISBNType">
    <xs:restriction base="xs:string">
      <xs:pattern value="[0-9]{3}-[0-9]{10}"/>
    </xs:restriction>
  </xs:simpleType>

</xs:schema>`;

const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<library xmlns="http://example.com/book">
  <book id="b001">
    <title>The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <isbn>978-0142437171</isbn>
    <price>12.99</price>
    <publishDate>2004-09-30</publishDate>
  </book>
  <book id="b002">
    <title>To Kill a Mockingbird</title>
    <author>Harper Lee</author>
    <isbn>978-0061120084</isbn>
    <price>14.99</price>
    <publishDate>2006-05-23</publishDate>
  </book>
</library>`;

const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<library xmlns="http://example.com/book">
  <book>
    <title>Invalid Book</title>
    <author>Unknown Author</author>
    <isbn>invalid-isbn</isbn>
    <price>not-a-number</price>
    <publishDate>invalid-date</publishDate>
  </book>
</library>`;

const simpleXml = `<?xml version="1.0" encoding="UTF-8"?>
<person>
  <name first="John" last="Doe">John Doe</name>
  <age>30</age>
  <city>New York</city>
  <hobbies>
    <hobby>Reading</hobby>
    <hobby>Swimming</hobby>
    <hobby>Cooking</hobby>
  </hobbies>
</person>`;

async function runTests() {
  console.log('🧪 XML Helper Library Tests');
  console.log('=' .repeat(50));

  const xmlHelper = new XmlHelper();

  // Test 1: Schema Loading
  console.log('\n📋 Test 1: Loading XSD Schema');
  const schemaErrors = xmlHelper.loadSchema(sampleXsdSchema);
  console.log('Schema loaded successfully:', schemaErrors.length === 0);
  if (schemaErrors.length > 0) {
    console.log('Schema errors:', schemaErrors);
  }

  // Test 2: XML Validation - Valid XML
  console.log('\n✅ Test 2: Validating Valid XML');
  const validationErrors = xmlHelper.validateXml(validXml);
  console.log('Valid XML passed validation:', validationErrors.length === 0);
  if (validationErrors.length > 0) {
    console.log('Validation errors:', validationErrors);
  }

  // Test 3: XML Validation - Invalid XML
  console.log('\n❌ Test 3: Validating Invalid XML');
  const invalidErrors = xmlHelper.validateXml(invalidXml);
  console.log('Invalid XML failed validation (expected):', invalidErrors.length > 0);
  console.log('Validation errors found:', invalidErrors.length);
  invalidErrors.forEach(error => {
    console.log(`  Line ${error.line}: ${error.message}`);
  });

  // Test 4: XML to JSON Conversion
  console.log('\n🔄 Test 4: XML to JSON Conversion');
  const xmlToJsonResult = xmlHelper.xmlToJson(simpleXml, {
    preserveAttributes: true,
    attributePrefix: '@',
    textKey: '#text'
  });
  
  console.log('XML to JSON conversion successful:', xmlToJsonResult.success);
  if (xmlToJsonResult.success) {
    console.log('JSON Result:');
    console.log(JSON.stringify(xmlToJsonResult.data, null, 2));
  } else {
    console.log('Conversion errors:', xmlToJsonResult.errors);
  }

  // Test 5: JSON to XML Conversion
  console.log('\n🔄 Test 5: JSON to XML Conversion');
  const sampleJson = {
    '@id': 'person1',
    name: {
      '@first': 'Jane',
      '@last': 'Smith',
      '#text': 'Jane Smith'
    },
    age: 25,
    hobbies: {
      hobby: ['Reading', 'Dancing', 'Traveling']
    }
  };

  const xmlResult = xmlHelper.jsonToXml(sampleJson, 'person', {
    attributePrefix: '@',
    textKey: '#text',
    declaration: true,
    indent: '  '
  });
  
  console.log('JSON to XML conversion result:');
  console.log(xmlResult);

  // Test 6: Schema-free XML Parsing
  console.log('\n🆓 Test 6: Schema-free XML Parsing');
  const parseResult = xmlHelper.parseXml(simpleXml);
  console.log('XML parsing successful:', parseResult.node !== null);
  console.log('Parse errors:', parseResult.errors.length);
  
  if (parseResult.node) {
    console.log('Root element:', parseResult.node.name);
    console.log('Number of children:', parseResult.node.children.length);
  }

  // Test 7: Error Handling - Malformed XML
  console.log('\n💥 Test 7: Error Handling - Malformed XML');
  const malformedXml = '<unclosed><tag>content</unclosed>';
  const malformedResult = xmlHelper.xmlToJson(malformedXml);
  console.log('Malformed XML handled gracefully:', !malformedResult.success);
  console.log('Error count:', malformedResult.errors.length);
  malformedResult.errors.forEach(error => {
    console.log(`  Line ${error.line}: ${error.message}`);
  });

  // Test 8: Complex JSON to XML
  console.log('\n🏗️ Test 8: Complex JSON to XML');
  const complexJson = {
    catalog: {
      '@version': '1.0',
      products: {
        product: [
          {
            '@id': 'p1',
            name: 'Laptop',
            price: 999.99,
            specifications: {
              cpu: 'Intel i7',
              ram: '16GB',
              storage: '512GB SSD'
            }
          },
          {
            '@id': 'p2',
            name: 'Mouse',
            price: 29.99,
            '#text': 'Wireless optical mouse'
          }
        ]
      }
    }
  };

  const complexXml = xmlHelper.jsonToXml(complexJson, 'catalog');
  console.log('Complex JSON to XML result:');
  console.log(complexXml);

  console.log('\n🎉 All tests completed!');
}

// Run tests
runTests().catch(console.error);
