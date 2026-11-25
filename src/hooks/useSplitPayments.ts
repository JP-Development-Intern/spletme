import { useEffect, useState } from "react";
import paymentsService, { Payment } from "@/services/payments";

export interface SplitPayment extends Payment {
  _id: string;
  idCollaborator: string;
  amount: number;
  description?: string;
  owner: string;
  createdAt: string;
}

export const useSplitPayments = () => {
  const [payments, setPayments] = useState<SplitPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await paymentsService.getPayments();
      if (response.error) {
        setError(response.message || "Error al obtener los pagos");
      } else {
        setPayments(Array.isArray(response.data) ? response.data : []);
        setError(null);
      }
    } catch (err) {
      setError("Error al obtener los pagos");
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalAmount = () => {
    return payments.reduce((sum, payment) => sum + (Number(payment?.amount) || 0), 0);
  };

  return {
    payments,
    isLoading,
    error,
    refetch: fetchPayments,
    totalAmount: getTotalAmount(),
  };
};
