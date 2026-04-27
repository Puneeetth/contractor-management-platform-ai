export type ContractSummary = {
  id: number;
  customerName?: string;
  payRate?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
};

export type InvoiceRecord = {
  id: number;
  contractorId?: number;
  contractorName?: string;
  contractId?: number;
  contractName?: string;
  poNumber?: string;
  invoiceMonth?: string;
  amount?: number;
  billRate?: number;
  payRate?: number;
  hoursRate?: number;
  totalHoursForCalc?: number;
  totalAmount?: number;
  tax?: number;
  invoiceFileUrl?: string;
  timesheetFileUrl?: string;
  status?: string;
  adminApprovalStatus?: string;
  financeApprovalStatus?: string;
  adminRejectionReason?: string;
  financeRejectionReason?: string;
};

export type CreateInvoicePayload = {
  contractorId: number;
  contractId: number;
  invoiceMonth: string;
  totalHours: number;
  taxPercentage: number;
};
