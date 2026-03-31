import QRCode from "qrcode";

export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 256,
    errorCorrectionLevel: "M",
    color: { dark: "#171717", light: "#ffffff" },
  });
}

export async function qrSvgString(text: string): Promise<string> {
  return QRCode.toString(text, { type: "svg", margin: 1, width: 256 });
}
