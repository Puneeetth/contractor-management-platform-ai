import { api } from "./api";
import { ContractSummary, CreateInvoicePayload, InvoiceRecord } from "../types/invoice";

export async function getActiveContractsByContractor(contractorId: number): Promise<ContractSummary[]> {
  const response = await api.get<ContractSummary[]>(`/admin/contracts/contractor/${contractorId}/active`);
  return response.data;
}

export async function getInvoicesByContractor(contractorId: number): Promise<InvoiceRecord[]> {
  const response = await api.get<InvoiceRecord[]>(`/invoices/contractor/${contractorId}`);
  return response.data;
}

export async function createInvoice(payload: CreateInvoicePayload): Promise<InvoiceRecord> {
  const body = new FormData();
  body.append("contractorId", String(payload.contractorId));
  body.append("contractId", String(payload.contractId));
  body.append("invoiceMonth", payload.invoiceMonth);
  body.append("totalHours", String(payload.totalHours));
  body.append("taxPercentage", String(payload.taxPercentage));

  const response = await api.post<InvoiceRecord>("/invoices", body);
  return response.data;
}
