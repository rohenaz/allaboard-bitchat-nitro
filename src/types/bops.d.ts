declare module 'bops' {
  function from(str: string, encoding: string): Buffer;
  function to(buffer: Buffer, encoding: string): string;
  export { from, to };
}
