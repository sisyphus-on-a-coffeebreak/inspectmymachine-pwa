declare module 'qrcode' {
  export interface QRCodeOptions {
    margin?: number;
    width?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toDataURL(
    data: string,
    options?: QRCodeOptions
  ): Promise<string>;

  export default {
    toDataURL: typeof toDataURL;
  };
}





