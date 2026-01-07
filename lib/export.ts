export const exportAsText = (content: string, filename: string = "content") => {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split("T")[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportAsPDF = async (content: string, title: string = "Generated Content") => {
  // For now, we'll use a simple approach
  // In production, you might want to use a library like jsPDF or pdfkit
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <pre>${content}</pre>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};






