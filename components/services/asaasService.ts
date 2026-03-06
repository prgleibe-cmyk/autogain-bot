
import { Invoice } from '../types';

// Em produção, isso seria uma chamada ao seu Backend, que por sua vez chama a API do Asaas.
// Como estamos no Frontend, simularemos a resposta da API do Asaas.

const ASAAS_API_KEY = process.env.API_KEY || "simulated_key"; 

export const asaasService = {
  
  /**
   * Gera uma cobrança PIX imediata
   */
  createPixCharge: async (amount: number, userEmail: string): Promise<Invoice> => {
    // Simulação de delay de rede
    await new Promise(resolve => setTimeout(resolve, 1500));

    const invoiceId = `pay_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const dueDate = now + (24 * 60 * 60 * 1000); // 24h para pagar

    // Gera um código PIX Copia e Cola "Fake" mas realista visualmente
    const fakePixCode = `00020126580014BR.GOV.BCB.PIX0136${Math.random().toString().substr(2, 10)}520400005303986540${amount.toFixed(2).replace('.', '')}5802BR5913AUTOGAIN_BOT6008SAOPAULO62070503***6304${Math.random().toString(16).substr(2, 4).toUpperCase()}`;

    // URL de QR Code genérico
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${fakePixCode}`;

    return {
      id: invoiceId,
      amount: parseFloat(amount.toFixed(2)),
      profitReference: 0, 
      growthReference: 0, 
      dueDate: dueDate,
      status: 'PENDING',
      pixCode: fakePixCode,
      pixQrImage: qrImage,
      createdAt: now
    };
  },

  /**
   * Verifica o status do pagamento (Polling)
   */
  checkPaymentStatus: async (invoiceId: string): Promise<'PENDING' | 'PAID'> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulação: Verifica se existe uma flag no localStorage
    const forcedPayment = localStorage.getItem(`debug_pay_${invoiceId}`);
    if (forcedPayment === 'true') {
        return 'PAID';
    }
    
    return 'PENDING';
  }
};
