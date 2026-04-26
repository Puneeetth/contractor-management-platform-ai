import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import axios from "axios";
import { ScreenLayout } from "../components/ScreenLayout";
import { useAuth } from "../context/AuthContext";
import { createInvoice, getActiveContractsByContractor, getInvoicesByContractor } from "../services/invoice";
import { ContractSummary, InvoiceRecord } from "../types/invoice";

type FormErrors = {
  contractId?: string;
  invoiceMonth?: string;
  totalHours?: string;
  taxPercentage?: string;
  submit?: string;
};

type InvoiceFormState = {
  contractId: string;
  invoiceMonth: string;
  totalHours: string;
  taxPercentage: string;
};

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function formatMoney(value?: number): string {
  if (!value) return "$0.00";
  return `$${value.toFixed(2)}`;
}

function getStatusStyle(status?: string) {
  const normalized = (status || "PENDING").toUpperCase();
  if (normalized === "APPROVED") {
    return { backgroundColor: "#D9FBE6", color: "#0B6B3A" };
  }
  if (normalized === "REJECTED") {
    return { backgroundColor: "#FEE2E2", color: "#B91C1C" };
  }
  return { backgroundColor: "#E0ECFF", color: "#1E4EA1" };
}

export function InvoicesScreen() {
  const { session } = useAuth();
  const contractorIdValue = session?.contractor.userId || session?.contractor.id;
  const contractorId = Number(contractorIdValue);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<InvoiceFormState>({
    contractId: "",
    invoiceMonth: getCurrentMonth(),
    totalHours: "",
    taxPercentage: "18"
  });

  const selectedContract = useMemo(
    () => contracts.find((item) => item.id === Number(form.contractId)),
    [contracts, form.contractId]
  );

  const baseAmount = (Number(form.totalHours) || 0) * (selectedContract?.payRate || 0);
  const taxAmount = baseAmount * ((Number(form.taxPercentage) || 0) / 100);
  const totalAmount = baseAmount + taxAmount;

  React.useEffect(() => {
    if (!Number.isFinite(contractorId) || contractorId <= 0) {
      setLoadError("Unable to identify contractor profile from session.");
      setLoading(false);
      return;
    }
    void loadData();
  }, [contractorId]);

  async function loadData() {
    try {
      setLoading(true);
      setLoadError("");
      const [contractData, invoiceData] = await Promise.all([
        getActiveContractsByContractor(contractorId),
        getInvoicesByContractor(contractorId)
      ]);
      setContracts(contractData);
      const sorted = [...invoiceData].sort((a, b) =>
        String(b.invoiceMonth || "").localeCompare(String(a.invoiceMonth || ""))
      );
      setInvoices(sorted);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? String(error.response?.data?.message || error.response?.data || error.message)
        : "Unable to load invoices.";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }

  function updateForm<K extends keyof InvoiceFormState>(key: K, value: InvoiceFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: undefined, submit: undefined }));
  }

  function validateForm(): boolean {
    const errors: FormErrors = {};
    if (!form.contractId) {
      errors.contractId = "Please select a contract.";
    }
    if (!/^\d{4}-\d{2}$/.test(form.invoiceMonth)) {
      errors.invoiceMonth = "Month must be in YYYY-MM format.";
    }
    if (!form.totalHours || Number(form.totalHours) <= 0) {
      errors.totalHours = "Total hours must be greater than 0.";
    }
    if (!form.taxPercentage || Number(form.taxPercentage) < 0) {
      errors.taxPercentage = "Tax percentage cannot be negative.";
    }

    const existing = invoices.find((item) => item.invoiceMonth === form.invoiceMonth);
    if (existing && String(existing.status || "").toUpperCase() !== "REJECTED") {
      errors.invoiceMonth = `Invoice for ${form.invoiceMonth} already exists.`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;
    if (!selectedContract) return;

    try {
      setSubmitting(true);
      await createInvoice({
        contractorId,
        contractId: selectedContract.id,
        invoiceMonth: form.invoiceMonth,
        totalHours: Number(form.totalHours),
        taxPercentage: Number(form.taxPercentage)
      });

      setForm({
        contractId: "",
        invoiceMonth: getCurrentMonth(),
        totalHours: "",
        taxPercentage: "18"
      });
      setFormErrors({});
      setFormOpen(false);
      await loadData();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? String(error.response?.data?.message || error.response?.data || error.message)
        : "Failed to create invoice.";
      setFormErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setSubmitting(false);
    }
  }

  const approvedCount = invoices.filter((item) => String(item.status || "").toUpperCase() === "APPROVED").length;
  const pendingCount = invoices.filter((item) => String(item.status || "").toUpperCase() === "PENDING").length;

  return (
    <ScreenLayout>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.heading}>Invoices</Text>
          <Text style={styles.subheading}>Submit monthly invoice details and track approvals.</Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={() => setFormOpen(true)}>
          <Text style={styles.primaryButtonText}>Create Invoice</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Invoices</Text>
          <Text style={styles.statValue}>{invoices.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={styles.statValue}>{pendingCount}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Approved</Text>
          <Text style={styles.statValue}>{approvedCount}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#3152A3" />
        </View>
      ) : (
        <>
          {loadError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Unable to load invoices</Text>
              <Text style={styles.errorText}>{loadError}</Text>
              <Pressable style={styles.retryButton} onPress={() => void loadData()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {invoices.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No invoices yet</Text>
              <Text style={styles.emptyText}>Create your first invoice to start the approval workflow.</Text>
            </View>
          ) : (
            invoices.map((invoice) => {
              const statusStyle = getStatusStyle(invoice.status);
              return (
                <View key={String(invoice.id)} style={styles.invoiceCard}>
                  <View style={styles.invoiceHeader}>
                    <Text style={styles.invoiceMonth}>{invoice.invoiceMonth || "-"}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                      <Text style={[styles.statusText, { color: statusStyle.color }]}>
                        {invoice.status || "PENDING"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.invoiceAmount}>{formatMoney(invoice.totalAmount || invoice.amount)}</Text>
                  <Text style={styles.invoiceMeta}>
                    Contract: {invoice.contractName || invoice.poNumber || `#${invoice.contractId || "-"}`}
                  </Text>
                  <Text style={styles.invoiceMeta}>
                    Admin: {invoice.adminApprovalStatus || "PENDING"} | Finance:{" "}
                    {invoice.financeApprovalStatus || "PENDING"}
                  </Text>
                  {invoice.adminRejectionReason ? (
                    <Text style={styles.rejectionText}>Admin reason: {invoice.adminRejectionReason}</Text>
                  ) : null}
                  {invoice.financeRejectionReason ? (
                    <Text style={styles.rejectionText}>Finance reason: {invoice.financeRejectionReason}</Text>
                  ) : null}
                </View>
              );
            })
          )}
        </>
      )}

      <Modal animationType="slide" transparent visible={formOpen} onRequestClose={() => setFormOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create Invoice</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Select Active Contract</Text>
              <View style={styles.contractList}>
                {contracts.length === 0 ? (
                  <Text style={styles.contractHint}>
                    No active contract found. Please contact admin to activate a contract.
                  </Text>
                ) : (
                  contracts.map((contract) => {
                    const isSelected = contract.id === Number(form.contractId);
                    return (
                      <Pressable
                        key={String(contract.id)}
                        style={[styles.contractOption, isSelected && styles.contractOptionActive]}
                        onPress={() => updateForm("contractId", String(contract.id))}
                      >
                        <Text style={[styles.contractName, isSelected && styles.contractNameActive]}>
                          {contract.customerName || `Contract #${contract.id}`}
                        </Text>
                        <Text style={styles.contractRate}>Rate: {formatMoney(contract.payRate)}/hr</Text>
                      </Pressable>
                    );
                  })
                )}
              </View>
              {formErrors.contractId ? <Text style={styles.fieldError}>{formErrors.contractId}</Text> : null}

              <Text style={styles.fieldLabel}>Invoice Month (YYYY-MM)</Text>
              <TextInput
                style={styles.input}
                value={form.invoiceMonth}
                onChangeText={(text) => updateForm("invoiceMonth", text)}
                placeholder="2026-04"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
              />
              {formErrors.invoiceMonth ? <Text style={styles.fieldError}>{formErrors.invoiceMonth}</Text> : null}

              <Text style={styles.fieldLabel}>Total Hours</Text>
              <TextInput
                style={styles.input}
                value={form.totalHours}
                onChangeText={(text) => updateForm("totalHours", text)}
                keyboardType="numeric"
                placeholder="160"
                placeholderTextColor="#94A3B8"
              />
              {formErrors.totalHours ? <Text style={styles.fieldError}>{formErrors.totalHours}</Text> : null}

              <Text style={styles.fieldLabel}>Tax Percentage</Text>
              <TextInput
                style={styles.input}
                value={form.taxPercentage}
                onChangeText={(text) => updateForm("taxPercentage", text)}
                keyboardType="numeric"
                placeholder="18"
                placeholderTextColor="#94A3B8"
              />
              {formErrors.taxPercentage ? <Text style={styles.fieldError}>{formErrors.taxPercentage}</Text> : null}

              <View style={styles.calcCard}>
                <Text style={styles.calcLabel}>Rate: {formatMoney(selectedContract?.payRate)}</Text>
                <Text style={styles.calcLabel}>Base: {formatMoney(baseAmount)}</Text>
                <Text style={styles.calcLabel}>Tax: {formatMoney(taxAmount)}</Text>
                <Text style={styles.calcTotal}>Total Amount: {formatMoney(totalAmount)}</Text>
              </View>

              {formErrors.submit ? <Text style={styles.fieldError}>{formErrors.submit}</Text> : null}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setFormOpen(false)} disabled={submitting}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
                onPress={() => void handleSubmit()}
                disabled={submitting}
              >
                <Text style={styles.primaryButtonText}>{submitting ? "Saving..." : "Save Invoice"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    marginTop: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#102A43"
  },
  subheading: {
    marginTop: 6,
    fontSize: 14,
    color: "#486581",
    maxWidth: 230
  },
  primaryButton: {
    backgroundColor: "#3152A3",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  primaryButtonDisabled: {
    opacity: 0.6
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700"
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12
  },
  statLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600"
  },
  statValue: {
    marginTop: 8,
    color: "#102A43",
    fontSize: 20,
    fontWeight: "700"
  },
  loaderWrap: {
    marginTop: 24
  },
  errorCard: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12
  },
  errorTitle: {
    color: "#9F1239",
    fontWeight: "700",
    fontSize: 14
  },
  errorText: {
    color: "#9F1239",
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19
  },
  retryButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#BE123C",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#102A43"
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#486581",
    lineHeight: 20
  },
  invoiceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  invoiceMonth: {
    color: "#102A43",
    fontSize: 16,
    fontWeight: "700"
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700"
  },
  invoiceAmount: {
    marginTop: 8,
    color: "#0F4C81",
    fontSize: 24,
    fontWeight: "700"
  },
  invoiceMeta: {
    marginTop: 6,
    color: "#486581",
    fontSize: 13
  },
  rejectionText: {
    marginTop: 6,
    color: "#B91C1C",
    fontSize: 12
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)"
  },
  modalCard: {
    maxHeight: "88%",
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16
  },
  modalTitle: {
    color: "#102A43",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12
  },
  fieldLabel: {
    color: "#1E293B",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6
  },
  contractList: {
    gap: 8
  },
  contractHint: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    padding: 10
  },
  contractOption: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 12
  },
  contractOptionActive: {
    borderColor: "#3152A3",
    backgroundColor: "#E8EEFF"
  },
  contractName: {
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "700"
  },
  contractNameActive: {
    color: "#1E40AF"
  },
  contractRate: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#102A43",
    fontSize: 14
  },
  fieldError: {
    marginTop: 6,
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "600"
  },
  calcCard: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DBE5F1",
    padding: 12,
    gap: 6
  },
  calcLabel: {
    color: "#486581",
    fontSize: 13
  },
  calcTotal: {
    color: "#0F4C81",
    fontSize: 16,
    fontWeight: "700"
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: "#FFFFFF"
  },
  secondaryButtonText: {
    color: "#334155",
    fontWeight: "700",
    fontSize: 13
  }
});
