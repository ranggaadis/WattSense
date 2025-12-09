export const KWH_RATE_IDR = 1444; // Rupiah per kWh

export const formatIDR = (value = 0) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

export const kwhToRupiah = (kwh) => (kwh || 0) * KWH_RATE_IDR;
export const rupiahToKwh = (idr) => (idr || 0) / KWH_RATE_IDR;
