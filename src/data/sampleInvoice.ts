import { InvoiceData } from "@/types/invoice";

export const sampleInvoice: InvoiceData = {
  invoiceNo: "769",
  date: "1-Oct-25",
  eWayBillNo: "",
  supplierInvoiceNo: "TX1253324312",
  supplierInvoiceDate: "27-Sep-25",
  otherReferences: "",
  company: {
    name: "NEW GLOBAL COMPUTERS (2025-26)",
    address: [
      "#30 to 34, K.E. Plaza, Opp : Zilla Parishad,",
      "Kurnool - 518001,"
    ],
    phone: [
      "Sales : 9581444014",
      "Accounts : 9581444001",
      "CCTV : 9581444016",
      "Service : 9581444017",
      "Contact : 05818359991, 9581444009"
    ],
    gstin: "37AAHFN7970M1ZH",
    state: "Andhra Pradesh",
    stateCode: "37",
    email: "globalcomputers.new@gmail.com",
    website: "www.globalshopee.com"
  },
  supplier: {
    name: "ADITYA INFOTECH LIMITED",
    address: "S. Nos 4/1, 4/2, 4/3, 4/4a1a of, V.No : 62, Village Durainallur, Panchayat, Vadakkunallur, Union Sholavaram, Taluk Ponneri, District Tiruvallur, Chennai - 601206",
    gstin: "33AABCA1601R1ZW",
    state: "Tamil Nadu",
    stateCode: "33"
  },
  items: [
    {
      id: "1",
      slNo: 1,
      description: "CP PLUS ILLUMAX DOME CAMERA CP-URC-DC24PL3C-L",
      serialNumbers: ["4WWB", "4QXF", "ETPP", "77GV", "QFGY", "XYXR", "8JQ9", "YRSE", "DVRY", "UCU4"],
      quantity: 60,
      unit: "NOS",
      rate: 1060.00,
      discountPercent: 11,
      amount: 56604.00
    },
    {
      id: "2",
      slNo: 2,
      description: "CP PLUS ILLUMAX BULLET CAMERA CP-URC-TC24P3C-L",
      serialNumbers: ["1NVXYYUYSI3BZJ2N", "2CD2", "26TP4UQKI9Y3LCS3", "ZHJC", "FGK3"],
      quantity: 160,
      unit: "NOS",
      rate: 1120.00,
      discountPercent: 11,
      amount: 159488.00
    },
    {
      id: "3",
      slNo: 3,
      description: "CP PLUS DOME COLOUR 2.4MP CP-GPC-DA24PL2C-SE-V2",
      quantity: 60,
      unit: "NOS",
      rate: 1340.00,
      discountPercent: 13,
      amount: 69948.00
    },
    {
      id: "4",
      slNo: 4,
      description: "CP PLUS BULLET COLOUR 2.4MP CP-GPC-TA24PL2C-SE-V2",
      quantity: 60,
      unit: "NOS",
      rate: 1400.00,
      discountPercent: 13,
      amount: 73080.00
    }
  ],
  totals: {
    subtotal: 359120.00,
    discount: 12586.15,
    discountPercent: 18,
    taxRate: 18,
    taxAmount: 62376.09,
    roundOff: 0.06,
    grandTotal: 408910.00
  },
  totalQuantity: 340,
  amountInWords: "INR Four Lakh Eight Thousand Nine Hundred Ten Only"
};
