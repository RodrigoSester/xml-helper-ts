import XmlHelper from './index';

// Example usage of the XML Helper library
console.log('🚀 XML Helper Library - Usage Examples');
console.log('=' .repeat(50));

const xmlHelper = new XmlHelper();

// Example 1: Simple XML to JSON conversion
console.log('\n📄 Example 1: XML to JSON Conversion');
const simpleXml = `
<book id="123">
  <title>TypeScript Guide</title>
  <author>John Doe</author>
  <price currency="USD">29.99</price>
  <tags>
    <tag>programming</tag>
    <tag>typescript</tag>
    <tag>javascript</tag>
  </tags>
</book>`;

const jsonResult = xmlHelper.xmlToJson(simpleXml);
if (jsonResult.success) {
  console.log('✅ Conversion successful!');
  console.log('JSON Result:', JSON.stringify(jsonResult.data, null, 2));
} else {
  console.log('❌ Conversion failed:', jsonResult.errors);
}

// Example 2: JSON to XML conversion
console.log('\n📄 Example 2: JSON to XML Conversion');
const jsonData = {
  '@id': 'p001',
  title: 'Advanced TypeScript',
  author: {
    name: 'Jane Smith',
    '@country': 'USA'
  },
  chapters: {
    chapter: [
      { '@number': '1', title: 'Introduction' },
      { '@number': '2', title: 'Advanced Types' },
      { '@number': '3', title: 'Decorators' }
    ]
  }
};

const xmlResult = xmlHelper.jsonToXml(jsonData, 'book');
console.log('✅ JSON to XML conversion:');
console.log(xmlResult);

// Example 3: Schema-free parsing
console.log('\n📄 Example 3: Schema-free XML Parsing');
const complexXml = `
<catalog>
  <product id="p1" category="electronics">
    <name>Laptop</name>
    <specifications>
      <cpu>Intel i7</cpu>
      <ram>16GB</ram>
      <storage type="SSD">512GB</storage>
    </specifications>
  </product>
  <product id="p2" category="accessories">
    <name>Wireless Mouse</name>
    <specifications>
      <connection>Bluetooth</connection>
      <battery>AA</battery>
    </specifications>
  </product>
</catalog>`;

const parseResult = xmlHelper.parseXml(complexXml);
if (parseResult.node) {
  console.log('✅ Parsing successful!');
  console.log(`Root element: ${parseResult.node.name}`);
  console.log(`Number of products: ${parseResult.node.children.filter(c => c.name === 'product').length}`);
  
  // Convert to JSON for easier viewing
  const catalogJson = xmlHelper.xmlToJson(complexXml);
  if (catalogJson.success) {
    console.log('Catalog as JSON:', JSON.stringify(catalogJson.data, null, 2));
  }
} else {
  console.log('❌ Parsing failed:', parseResult.errors);
}

console.log('\n🎉 Examples completed!');
