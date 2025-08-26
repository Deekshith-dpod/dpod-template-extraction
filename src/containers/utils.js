export const documentStyles = `
/* =========================
   Base document styles
========================= */
.document-content {
  font-family: 'Segoe UI', 'Calibri', Arial, sans-serif;
  line-height: 1.4;
  color: #1d1d1f;
  background: #fafafa;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  position: relative;
  min-height: 100vh;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

/* =========================
   Word (docx) styles
========================= */
.document-content.docx p {
  margin: 0 0 10pt;
  font-size: 11pt;
  text-align: left;
  line-height: 1.4;
}

.document-content.docx h1,
.document-content.docx h2,
.document-content.docx h3 {
  color: #2F5496;
  margin: 12pt 0 6pt;
  font-weight: bold;
}

.document-content.docx h1 { font-size: 18pt; }
.document-content.docx h2 { font-size: 14pt; }
.document-content.docx h3 { font-size: 12pt; color: #1F4E79; }

/* Tables inside Word */
.document-content.docx table {
  border-collapse: collapse;
  width: 100%;
  margin: 12pt 0;
  font-size: 10.5pt;
  border: 1px solid #d9d9d9;
  background-color: #ffffff;
}

.document-content.docx th,
.document-content.docx td {
  border: 1px solid #e0e0e0;
  padding: 6pt 10pt;
  vertical-align: middle;
  text-align: left;
}

.document-content.docx th {
  background-color: #f4f4f4;
  font-weight: bold;
  text-align: center;
}

/* Lists */
.document-content.docx ul,
.document-content.docx ol {
  margin: 10pt 0;
  padding-left: 28pt;
}

.document-content.docx li {
  margin: 4pt 0;
  line-height: 1.3;
}

/* Header/Footer */
.document-content.docx .header,
.document-content.docx .footer {
  border-top: 1px solid #ddd;
  padding-top: 6pt;
  margin-top: 16pt;
  font-size: 9pt;
  color: #666;
  text-align: center;
}

/* =========================
   Excel (xlsx) styles
========================= */
.document-content.xlsx {
  display: flex;
  flex-direction: column;
  background: #f9f9f9;
}

.document-content.xlsx .excel-table-wrapper {
  position: relative;
  background: #ffffff;
  border: 1px solid #dcdcdc;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  overflow: auto;
}

.document-content.xlsx table {
  border-collapse: collapse;
  font-size: 10.5pt;
  font-family: inherit;
  background: #ffffff;
}

/* Table headers */
.document-content.xlsx th.column-header,
.document-content.xlsx th.row-header {
  background: #f2f2f2;
  font-weight: 600;
  border: 1px solid #dadada;
  text-align: center;
  padding: 4px 6px;
  position: sticky;
  z-index: 2;
}

.document-content.xlsx th.column-header { top: 0; }
.document-content.xlsx th.row-header { left: 0; }

/* Corner header */
.document-content.xlsx th.corner {
  background: #e1e1e1;
  border: 1px solid #d3d3d3;
  position: sticky;
  top: 0; left: 0;
  z-index: 3;
}

.corner, .row-header {
    width: 50px; /* Or whatever you choose for the header width */
    min-width: 50px;
    max-width: 50px;
    box-sizing: border-box;
}


/* Cells */
.document-content.xlsx td {
  border: 1px solid #e1e1e1;
  padding: 6px 8px;
  vertical-align: middle;
  text-align: left;
  height: 24px;
  background: #ffffff;
}

.document-content.xlsx td.merged {
  border: none;
  background: transparent;
}

/* Sheet Tabs */
.excel-tabs {
  display: flex;
  align-items: stretch;
  height: 38px;
  background: #f3f3f3;
  border-top: 1px solid #c7c7c7;
}

.excel-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  max-width: 140px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  color: #5a5a5a;
  cursor: pointer;
  background: #f3f3f3;
  border: 1px solid #c7c7c7;
  border-bottom: none;
  margin-right: 2px;
  border-radius: 6px 6px 0 0;
  transition: all 0.2s ease;
}

.excel-tab.active {
  background: #ffffff;
  color: #222;
  border-top: 2px solid #0078d4;
  z-index: 2;
}

.excel-tab:hover {
  background: #e7e7e7;
}

`
export const mammothStyleMap = [
  "p[style-name='Normal'] => p.normal",
  "p[style-name='Heading 1'] => h1",
  "p[style-name='Heading 2'] => h2",
  "p[style-name='Heading 3'] => h3",
  "p[style-name='Heading 4'] => h4",
  "p[style-name='Heading 5'] => h5",
  "p[style-name='Heading 6'] => h6",
  "p[style-name='Title'] => h1.title",
  "p[style-name='Subtitle'] => h2.subtitle",

  "r[style-name='Strong'] => strong",
  "r[style-name='Emphasis'] => em",
  "r[style-name='Intense Emphasis'] => strong > em",

  "table[style-name='Table Grid'] => table.table-grid",
  "table[style-name='Light Shading'] => table.light-shading",

  "p[style-name='List Paragraph'] => li",
  "p[style-name='Bullet List'] => li",
  "p[style-name='Number List'] => li"
].join("\n");

export const mammothStyles = `
        /* Same as in previous code for DOCX */
        .docx-content {
            font-family: 'Calibri', 'Times New Roman', Arial, sans-serif;
            line-height: 1.15;
            color: #000000;
            background: #ffffff;
            max-width: 100%;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }

        .docx-content p {
            margin: 0 0 8pt 0;
            font-size: 11pt;
            font-family: 'Calibri', Arial, sans-serif;
            text-align: left;
            line-height: 1.15;
            orphans: 2;
            widows: 2;
        }

        .docx-content h1 {
            font-size: 16pt;
            font-weight: bold;
            margin: 12pt 0;
            color: #2F5496;
            line-height: 1.15;
        }

        .docx-content h2 {
            font-size: 13pt;
            font-weight: bold;
            margin: 10pt 0;
            color: #2F5496;
            line-height: 1.15;
        }

        .docx-content h3, .docx-content h4, .docx-content h5, .docx-content h6 {
            font-size: 11pt;
            font-weight: bold;
            margin: 8pt 0;
            color: #1F4E79;
            line-height: 1.15;
        }

        .docx-content table {
            border-collapse: collapse;
            width: 100%;
            margin: 8pt 0;
            font-size: 11pt;
            border: 1px solid #000000;
        }

        .docx-content td, .docx-content th {
            border: 1px solid #000000;
            padding: 4pt 8pt;
            vertical-align: top;
            text-align: left;
            word-wrap: break-word;
        }

        .docx-content th {
            background-color: #D9E2F3;
            font-weight: bold;
        }

        .docx-content ul, .docx-content ol {
            margin: 8pt 0;
            padding-left: 36pt;
        }

        .docx-content li {
            margin: 4pt 0;
            line-height: 1.15;
        }

        .docx-content strong, .docx-content b {
            font-weight: bold;
        }

        .docx-content em, .docx-content i {
            font-style: italic;
        }

        .docx-content u {
            text-decoration: underline;
        }

        .docx-content img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 8pt 0;
        }

        .docx-content .page-break {
            page-break-before: always;
            break-before: page;
        }

        .docx-content .text-center {
            text-align: center;
        }

        .docx-content .text-right {
            text-align: right;
        }

        .docx-content .text-justify {
            text-align: justify;
        }

        .docx-content .no-spacing {
            margin: 0;
            padding: 0;
        }

        .docx-content .header, .docx-content .footer {
            border-top: 1px solid #ccc;
            padding-top: 8pt;
            margin-top: 16pt;
            font-size: 9pt;
            color: #666;
        }

        .docx-content * {
            user-select: text;
            -webkit-user-select: text;
            -moz-user-select: text;
            -ms-user-select: text;
        }
    `;