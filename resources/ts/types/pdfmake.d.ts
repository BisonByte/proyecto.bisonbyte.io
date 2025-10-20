declare module 'pdfmake/build/pdfmake' {
  const pdfMake: {
    vfs: Record<string, string>;
    createPdf: (definition: unknown) => { download: (fileName?: string) => void };
  };
  export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  const pdfFonts: { pdfMake: { vfs: Record<string, string> } };
  export default pdfFonts;
}
