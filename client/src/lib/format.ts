const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export const formatPaise = (paise: number) => inr.format(paise / 100);

export const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export const todayIso = () => new Date().toLocaleDateString("en-CA");
