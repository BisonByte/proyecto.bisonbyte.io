declare module 'convert-units' {
  type Unit = string;
  interface Converter {
    from(fromUnit: Unit): { to(toUnit: Unit): number };
    to(toUnit: Unit): number;
  }
  function convert(value: number): Converter;
  export default convert;
}
