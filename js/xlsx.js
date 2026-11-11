const encoder = new TextEncoder();
const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
    for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (value & 1 ? 0xEDB88320 : 0);
    return value >>> 0;
});

function crc32(bytes) {
    let result = 0xFFFFFFFF;
    for (const byte of bytes) result = (result >>> 8) ^ crcTable[(result ^ byte) & 255];
    return (result ^ 0xFFFFFFFF) >>> 0;
}

// OOXML usa un contenedor ZIP. Para una hoja pequeña basta el método 0 (sin compresión).
function zip(files) {
    const entries = [];
    const directory = [];
    let offset = 0;
    let directorySize = 0;
    for (const [name, contents] of Object.entries(files)) {
        const filename = encoder.encode(name);
        const bytes = encoder.encode(contents);
        const crc = crc32(bytes);
        const header = new DataView(new ArrayBuffer(30));
        header.setUint32(0, 0x04034b50, true);
        header.setUint16(4, 20, true);
        header.setUint16(12, 33, true);
        header.setUint32(14, crc, true);
        header.setUint32(18, bytes.length, true);
        header.setUint32(22, bytes.length, true);
        header.setUint16(26, filename.length, true);
        entries.push(header.buffer, filename, bytes);

        const record = new DataView(new ArrayBuffer(46));
        record.setUint32(0, 0x02014b50, true);
        record.setUint16(4, 20, true);
        record.setUint16(6, 20, true);
        record.setUint16(14, 33, true);
        record.setUint32(16, crc, true);
        record.setUint32(20, bytes.length, true);
        record.setUint32(24, bytes.length, true);
        record.setUint16(28, filename.length, true);
        record.setUint32(42, offset, true);
        directory.push(record.buffer, filename);
        offset += 30 + filename.length + bytes.length;
        directorySize += 46 + filename.length;
    }
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, directory.length / 2, true);
    end.setUint16(10, directory.length / 2, true);
    end.setUint32(12, directorySize, true);
    end.setUint32(16, offset, true);
    return new Blob([...entries, ...directory, end.buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
}

const escapeXml = value => String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const sheetNamespace = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const relationNamespace = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const relationshipDoc = (kind, target) =>
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${relationNamespace}/${kind}" Target="${target}"/></Relationships>`;

function cellAddress(index, row) {
    let column = '';
    for (let position = index + 1; position > 0; position = Math.floor((position - 1) / 26)) {
        column = String.fromCharCode(65 + (position - 1) % 26) + column;
    }
    return column + row;
}

export function crearLibro(columns, rows) {
    const records = [columns, ...rows].map((row, index) => {
        const cells = row.map((value, column) => {
            if (value == null) return '';
            const address = cellAddress(column, index + 1);
            if (Number.isFinite(value)) return `<c r="${address}"><v>${value}</v></c>`;
            return `<c r="${address}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
        }).join('');
        return `<row r="${index + 1}">${cells}</row>`;
    }).join('');
    return zip({
        '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
            '<Default Extension="xml" ContentType="application/xml"/>' +
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
            '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
        '_rels/.rels': relationshipDoc('officeDocument', 'xl/workbook.xml'),
        'xl/workbook.xml': `<workbook xmlns="${sheetNamespace}" xmlns:r="${relationNamespace}"><bookViews><workbookView/></bookViews><sheets><sheet name="Datos" sheetId="1" r:id="rId1"/></sheets></workbook>`,
        'xl/_rels/workbook.xml.rels': relationshipDoc('worksheet', 'worksheets/sheet1.xml'),
        'xl/worksheets/sheet1.xml': `<worksheet xmlns="${sheetNamespace}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData>${records}</sheetData></worksheet>`
    });
}
