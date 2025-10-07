
import type { ApiResponse, AuthResponse, PaginatedResponse, Transaction, User, Wallet, Balance, FeeEstimation, BuyProvider, BuyFeeCalculation, Order, SellProvider, BuyOrderPayload, SellOrderPayload, OrderUpdatePayload, LightningBalance, CreateInvoicePayload, LightningInvoice, PayLightningRequestPayload, LightningPayment, LightningTransaction, DecodeLightningRequestPayload, DecodedLightningRequest, LightningPaymentResponse, PasswordChangePayload, SupportRequestOutput } from '@/lib/types';
import { sendSupportRequest } from '@/ai/flows/support-flow';
import axios, { type AxiosError, type AxiosResponse, type AxiosInstance } from 'axios';

const BACKEND_URL = 'https://mph-illinois-surveys-threaded.trycloudflare.com/';

const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const publicAxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
  }
  return config;
}, (error) => {
    return Promise.reject(error);
});

const createResponseInterceptor = (instance: AxiosInstance) => {
    const onResponse = (response: AxiosResponse) => {
      // The backend uses a consistent success wrapper, so we can unwrap the data here.
      // However, some responses (like login) might have the data at the top level.
      // We check for the `success` field to decide whether to unwrap.
      if (response.data && response.data.success === true) {
        return { ...response, data: response.data.data };
      }
      if (response.data && response.data.message && !response.data.data) {
          // For simple success messages without data
          return response;
      }
      return response;
    };

    const onError = (error: AxiosError<ApiResponse<any>>) => {
        let errorMessage = "An unexpected error occurred. Please try again later.";
        
        if (error.code === 'ERR_NETWORK') {
            errorMessage = 'Could not connect to the server. The service may be starting up. Please wait a moment and try again.';
        } else if (error.response?.data) {
            const responseData = error.response.data;
            // The backend returns errors in a specific format.
            const apiError = responseData.error;
            const apiMessage = responseData.message;

            if (typeof apiError === 'string') {
              errorMessage = apiError;
            } else if (apiError?.details && typeof apiError.details === 'object' && Object.keys(apiError.details).length > 0) {
                const firstErrorKey = Object.keys(apiError.details)[0];
                const errorValue = apiError.details[firstErrorKey];
                if (Array.isArray(errorValue) && errorValue.length > 0) {
                    errorMessage = errorValue[0];
                } else if (typeof errorValue === 'string') {
                    errorMessage = errorValue;
                } else if (apiError.message) {
                    errorMessage = apiError.message;
                }
            } else if (apiError?.message) {
                errorMessage = apiError.message;
            } else if (apiMessage) {
                errorMessage = apiMessage;
            }
        }
        
        error.message = errorMessage;
        return Promise.reject(error);
    };

    instance.interceptors.response.use(onResponse, onError);
}

createResponseInterceptor(axiosInstance);
createResponseInterceptor(publicAxiosInstance);

// --- Auth ---
const login = (credentials: any): Promise<AxiosResponse<AuthResponse>> => publicAxiosInstance.post('/auth/login/', credentials);
const register = (userInfo: any): Promise<AxiosResponse<any>> => publicAxiosInstance.post('/auth/register/', userInfo);
const verifyEmail = (data: { email: string, otp: string }): Promise<AxiosResponse<AuthResponse>> => publicAxiosInstance.post('/auth/verify_email/', data);
const resendOtp = (email: string): Promise<AxiosResponse<any>> => publicAxiosInstance.post('/auth/resend_otp/', { email });
const logout = () => axiosInstance.post('/auth/logout/');
const changePassword = (payload: PasswordChangePayload) => axiosInstance.post('/auth/change_password/', payload);
const resetPassword = (email: string) => publicAxiosInstance.post('/auth/reset_password/', { email });
const confirmReset = (data: { email: string, otp: string, password: any }) => publicAxiosInstance.post('/auth/confirm_reset/', data);


// --- User ---
const getUserProfile = (): Promise<AxiosResponse<User>> => axiosInstance.get('user/profile/');
const updateUserProfile = (id: number, data: { first_name?: string, last_name?: string }): Promise<AxiosResponse<User>> => axiosInstance.patch(`user/${id}/`, data);
const getUser = (): Promise<AxiosResponse<User>> => axiosInstance.get('user/');


// --- Wallet ---
const getWallets = (): Promise<AxiosResponse<Wallet[]>> => axiosInstance.get('wallet/');
const getWalletBalance = (): Promise<AxiosResponse<Balance>> => axiosInstance.get('wallet/balance/');
const generateMnemonic = (): Promise<AxiosResponse<{ mnemonic: string }>> => axiosInstance.post('wallet/generate_mnemonic/');
const createWallet = (mnemonic: string) => axiosInstance.post('wallet/create_wallet/', { mnemonic });
const generateNewAddress = (): Promise<AxiosResponse<{ address: string }>> => axiosInstance.post('wallet/generate_address/');
const generateQrCode = (data: string): Promise<AxiosResponse<{ qr_code: string }>> => axiosInstance.post('wallet/generate_qr_code/', { data });
const restoreWallet = (data: string): Promise<AxiosResponse<any>> => axiosInstance.post('wallet/restore/', { data });
const backupWallet = (): Promise<AxiosResponse<{ wif: string }>> => axiosInstance.get('wallet/backup/');

const estimateFee = (payload: { amount: string }): Promise<AxiosResponse<FeeEstimation>> => {
    return axiosInstance.post('wallet/estimate_fee/', payload);
}

// --- Transactions ---
const getTransactions = (): Promise<AxiosResponse<PaginatedResponse<Transaction>>> => axiosInstance.get('transaction/');
const getRecentTransactions = (): Promise<AxiosResponse<Transaction[]>> => axiosInstance.get('transaction/recents/');
const sendTransaction = (values: { to_address: string; amount: string }) => {
    return axiosInstance.post('transaction/send/', values);
};

// --- Providers ---
const getBuyProviders = (payment_method?: 'on_chain' | 'lightning'): Promise<AxiosResponse<BuyProvider[]>> => {
    return axiosInstance.get('providers/buy/', { params: { payment_method } });
}
const getBuyProvider = (providerId: number): Promise<AxiosResponse<BuyProvider>> => {
    return axiosInstance.get(`providers/${providerId}/`);
}
const getSellProviders = (payment_method?: 'on_chain' | 'lightning'): Promise<AxiosResponse<SellProvider[]>> => {
    return axiosInstance.get('providers/sell/', { params: { payment_method } });
}
const calculateBuyFee = (providerId: number, amount: number, currency: string): Promise<AxiosResponse<BuyFeeCalculation>> => {
    return axiosInstance.post('providers/buy/calculate-fee/', { provider_id: providerId, amount: String(amount), currency });
}

// --- Orders ---
const createBuyOrder = (payload: BuyOrderPayload): Promise<AxiosResponse<Order>> => {
    return axiosInstance.post('orders/', payload);
}
const createSellOrder = (payload: SellOrderPayload): Promise<AxiosResponse<Order>> => {
    return axiosInstance.post('orders/', payload);
}

const getOnChainOrders = (): Promise<AxiosResponse<PaginatedResponse<Order>>> => axiosInstance.get('orders/on_chain/');
const getLightningOrders = (): Promise<AxiosResponse<PaginatedResponse<Order>>> => axiosInstance.get('orders/lightning/');
const getOrder = (orderId: number): Promise<AxiosResponse<Order>> => axiosInstance.get(`orders/${orderId}/`);
const updateOrder = (orderId: number, data: OrderUpdatePayload): Promise<AxiosResponse<Order>> => {
    return axiosInstance.patch(`orders/${orderId}/`, data);
}

// --- Lightning API ---
const getLightningBalance = (): Promise<AxiosResponse<LightningBalance>> => axiosInstance.get('lightning/balance/');
const getLightningTransactions = (): Promise<AxiosResponse<PaginatedResponse<LightningTransaction>>> => axiosInstance.get('lightning/transactions/');
const generateLightningInvoice = (payload: CreateInvoicePayload): Promise<AxiosResponse<LightningInvoice>> => axiosInstance.post('lightning/invoices/', payload);
const payLightningInvoice = (payload: PayLightningRequestPayload): Promise<AxiosResponse<LightningPaymentResponse>> => axiosInstance.post('lightning/payments/', payload);
const getLightningInvoice = (invoiceId: string): Promise<AxiosResponse<LightningInvoice>> => axiosInstance.get(`lightning/invoices/${invoiceId}/`);
const decodeLightningRequest = (payload: DecodeLightningRequestPayload): Promise<AxiosResponse<DecodedLightningRequest>> => axiosInstance.post('lightning/decode/', payload);

// --- Support ---
const sendSupportRequestApi = async (subject: string, message: string): Promise<SupportRequestOutput> => {
    try {
        const response = await sendSupportRequest({ subject, message });
        return response;
    } catch (error) {
        console.error("Error in sendSupportRequest flow:", error);
        throw new Error("Failed to process support request via AI flow.");
    }
};


const api = {
    login,
    register,
    logout,
    verifyEmail,
    resendOtp,
    changePassword,
    resetPassword,
    confirmReset,
    getUserProfile,
    updateUserProfile,
    getUser,
    getWallets,
    getWalletBalance,
    generateMnemonic,
    createWallet,
    generateNewAddress,
    generateQrCode,
    restoreWallet,
    backupWallet,
    getTransactions,
    getRecentTransactions,
    sendTransaction,
    estimateFee,
    getBuyProviders,
    getBuyProvider,
    getSellProviders,
    calculateBuyFee,
    createBuyOrder,
    createSellOrder,
    getOnChainOrders,
    getLightningOrders,
    getOrder,
    updateOrder,
    // Lightning
    getLightningBalance,
    getLightningTransactions,
    generateLightningInvoice,
    payLightningInvoice,
    getLightningInvoice,
    decodeLightningRequest,
    // Support
    sendSupportRequest: sendSupportRequestApi,
};

export default api;
